"use server";

import { revalidatePath } from "next/cache";

import { storageBuckets, type StorageBucket } from "@/config/storage";
import { buildCategoryImagePath } from "@/lib/admin/category";
import { buildHeroStoragePath, heroMediaTypeFromPath } from "@/lib/admin/hero";
import { buildMenuItemImagePath } from "@/lib/admin/menu-item";
import { currentUserIsAdmin, getAuthClaims } from "@/lib/auth/session";
import { encodeWebImage } from "@/lib/media/encode-web-image";
import {
  CATEGORY_IMAGE_MAX_EDGE,
  HERO_IMAGE_MAX_EDGE,
  MENU_IMAGE_MAX_EDGE,
  WEB_IMAGE_CACHE_CONTROL,
} from "@/lib/media/web-image";
import { createClient } from "@/lib/supabase/server";

export type CompactImagesState = {
  status: "idle" | "saved" | "error";
  message: string | null;
};

type CatalogClient = Awaited<ReturnType<typeof createClient>>;

async function requireAdminClient(): Promise<CatalogClient | null> {
  const claims = await getAuthClaims();
  if (!claims || !(await currentUserIsAdmin())) {
    return null;
  }

  return createClient();
}

async function compactStorageObject(
  supabase: CatalogClient,
  bucket: StorageBucket,
  path: string,
  maxEdge: number,
  nextPath: string,
): Promise<"compacted" | "skipped" | "failed"> {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) {
    return "failed";
  }

  const input = Buffer.from(await data.arrayBuffer());
  const encoded = await encodeWebImage(input, maxEdge);
  if (encoded === "skip") {
    return "skipped";
  }
  if (!encoded) {
    return "failed";
  }

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(nextPath, encoded.bytes, {
      upsert: false,
      contentType: encoded.mime,
      cacheControl: WEB_IMAGE_CACHE_CONTROL,
    });

  if (uploadError) {
    return "failed";
  }

  return "compacted";
}

type ImageTable = "menu_items" | "categories" | "hero_media";
type Outcome = "compacted" | "skipped" | "failed";

// How many images are downloaded, encoded and stored at the same time. One by
// one, a menu of seventy photos took minutes; a small pool keeps it to seconds
// without flooding the storage service.
const CONCURRENCY = 6;

async function inPool<Item>(
  items: Item[],
  worker: (item: Item) => Promise<Outcome>,
): Promise<Outcome[]> {
  const results: Outcome[] = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
      while (next < items.length) {
        const index = next++;
        const item = items[index];
        if (item === undefined) {
          continue;
        }
        try {
          results[index] = await worker(item);
        } catch {
          results[index] = "failed";
        }
      }
    }),
  );
  return results;
}

// Replaces one row's image with a compact copy, then removes the original.
async function compactRow(
  supabase: CatalogClient,
  table: ImageTable,
  bucket: StorageBucket,
  maxEdge: number,
  row: { id: number; storage_path: string },
  nextPath: string | null,
): Promise<Outcome> {
  if (!nextPath) {
    return "failed";
  }

  const result = await compactStorageObject(
    supabase,
    bucket,
    row.storage_path,
    maxEdge,
    nextPath,
  );
  if (result === "skipped") {
    return "skipped";
  }
  if (result !== "compacted") {
    await supabase.storage.from(bucket).remove([nextPath]);
    return "failed";
  }

  const { error } = await supabase
    .from(table)
    .update({ storage_path: nextPath })
    .eq("id", row.id);
  if (error) {
    await supabase.storage.from(bucket).remove([nextPath]);
    return "failed";
  }

  if (row.storage_path !== nextPath) {
    await supabase.storage.from(bucket).remove([row.storage_path]);
  }
  return "compacted";
}

export async function compactCatalogImages(): Promise<CompactImagesState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה לדחוס תמונות" };
  }

  const [menuResult, categoryResult, heroResult] = await Promise.all([
    supabase
      .from("menu_items")
      .select("id, storage_path")
      .not("storage_path", "is", null),
    supabase
      .from("categories")
      .select("id, storage_path")
      .not("storage_path", "is", null),
    supabase.from("hero_media").select("id, storage_path").eq("type", "image"),
  ]);

  if (menuResult.error) {
    return { status: "error", message: "לא הצלחנו לטעון את תמונות המנות" };
  }
  if (categoryResult.error) {
    return { status: "error", message: "לא הצלחנו לטעון את תמונות הקטגוריות" };
  }

  type Job = () => Promise<Outcome>;
  const withPath = (rows: { id: number; storage_path: string | null }[]) =>
    rows.filter((row): row is { id: number; storage_path: string } =>
      Boolean(row.storage_path),
    );

  const jobs: Job[] = [
    ...withPath(menuResult.data ?? []).map(
      (row): Job =>
        () =>
          compactRow(
            supabase,
            "menu_items",
            storageBuckets.menuItems,
            MENU_IMAGE_MAX_EDGE,
            row,
            buildMenuItemImagePath("image/webp"),
          ),
    ),
    ...withPath(categoryResult.data ?? []).map(
      (row): Job =>
        () =>
          compactRow(
            supabase,
            "categories",
            storageBuckets.categories,
            CATEGORY_IMAGE_MAX_EDGE,
            row,
            buildCategoryImagePath("image/webp"),
          ),
    ),
    ...withPath(heroResult.error ? [] : (heroResult.data ?? []))
      .filter((row) => heroMediaTypeFromPath(row.storage_path) === "image")
      .map(
        (row): Job =>
          () =>
            compactRow(
              supabase,
              "hero_media",
              storageBuckets.hero,
              HERO_IMAGE_MAX_EDGE,
              row,
              buildHeroStoragePath("image/webp"),
            ),
      ),
  ];

  const outcomes = await inPool(jobs, (job) => job());
  const count = (outcome: Outcome) =>
    outcomes.filter((entry) => entry === outcome).length;
  const compacted = count("compacted");
  const skipped = count("skipped");
  const failed = count("failed");

  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/menu", "page");
  revalidatePath("/admin/categories", "page");
  revalidatePath("/admin/hero", "page");

  if (compacted === 0 && failed === 0) {
    return {
      status: "saved",
      message:
        skipped > 0
          ? "התמונות כבר בגודל מתאים לאינטרנט"
          : "לא נמצאו תמונות לדחיסה",
    };
  }

  if (compacted === 0) {
    return {
      status: "error",
      message: "דחיסת התמונות נכשלה. נסו שוב",
    };
  }

  const parts = [`צומצמו ${compacted} תמונות`];
  if (skipped > 0) {
    parts.push(`${skipped} כבר היו קלות`);
  }
  if (failed > 0) {
    parts.push(`${failed} לא עברו`);
  }

  return {
    status: "saved",
    message: parts.join(" · "),
  };
}
