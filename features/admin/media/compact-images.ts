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

export async function compactCatalogImages(): Promise<CompactImagesState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה לדחוס תמונות" };
  }

  let compacted = 0;
  let skipped = 0;
  let failed = 0;

  const { data: menuRows, error: menuError } = await supabase
    .from("menu_items")
    .select("id, storage_path")
    .not("storage_path", "is", null);

  if (menuError) {
    return { status: "error", message: "לא הצלחנו לטעון את תמונות המנות" };
  }

  for (const row of menuRows ?? []) {
    const path = row.storage_path;
    if (!path) {
      continue;
    }

    const nextPath = buildMenuItemImagePath("image/webp");
    if (!nextPath) {
      failed += 1;
      continue;
    }

    const result = await compactStorageObject(
      supabase,
      storageBuckets.menuItems,
      path,
      MENU_IMAGE_MAX_EDGE,
      nextPath,
    );

    if (result === "skipped") {
      skipped += 1;
      continue;
    }

    if (result !== "compacted") {
      failed += 1;
      await supabase.storage.from(storageBuckets.menuItems).remove([nextPath]);
      continue;
    }

    const { error: updateError } = await supabase
      .from("menu_items")
      .update({ storage_path: nextPath })
      .eq("id", row.id);

    if (updateError) {
      failed += 1;
      await supabase.storage.from(storageBuckets.menuItems).remove([nextPath]);
      continue;
    }

    if (path !== nextPath) {
      await supabase.storage.from(storageBuckets.menuItems).remove([path]);
    }
    compacted += 1;
  }

  const { data: categoryRows, error: categoryError } = await supabase
    .from("categories")
    .select("id, storage_path")
    .not("storage_path", "is", null);

  if (categoryError) {
    return { status: "error", message: "לא הצלחנו לטעון את תמונות הקטגוריות" };
  }

  for (const row of categoryRows ?? []) {
    const path = row.storage_path;
    if (!path) {
      continue;
    }

    const nextPath = buildCategoryImagePath("image/webp");
    if (!nextPath) {
      failed += 1;
      continue;
    }

    const result = await compactStorageObject(
      supabase,
      storageBuckets.categories,
      path,
      CATEGORY_IMAGE_MAX_EDGE,
      nextPath,
    );

    if (result === "skipped") {
      skipped += 1;
      continue;
    }

    if (result !== "compacted") {
      failed += 1;
      await supabase.storage.from(storageBuckets.categories).remove([nextPath]);
      continue;
    }

    const { error: updateError } = await supabase
      .from("categories")
      .update({ storage_path: nextPath })
      .eq("id", row.id);

    if (updateError) {
      failed += 1;
      await supabase.storage.from(storageBuckets.categories).remove([nextPath]);
      continue;
    }

    if (path !== nextPath) {
      await supabase.storage.from(storageBuckets.categories).remove([path]);
    }
    compacted += 1;
  }

  const { data: heroRows, error: heroError } = await supabase
    .from("hero_media")
    .select("id, storage_path")
    .eq("type", "image");

  if (!heroError) {
    for (const row of heroRows ?? []) {
      const path = row.storage_path;
      if (!path || heroMediaTypeFromPath(path) !== "image") {
        continue;
      }

      const nextPath = buildHeroStoragePath("image/webp");
      if (!nextPath) {
        failed += 1;
        continue;
      }

      const result = await compactStorageObject(
        supabase,
        storageBuckets.hero,
        path,
        HERO_IMAGE_MAX_EDGE,
        nextPath,
      );

      if (result === "skipped") {
        skipped += 1;
        continue;
      }

      if (result !== "compacted") {
        failed += 1;
        await supabase.storage.from(storageBuckets.hero).remove([nextPath]);
        continue;
      }

      const { error: updateError } = await supabase
        .from("hero_media")
        .update({ storage_path: nextPath })
        .eq("id", row.id);

      if (updateError) {
        failed += 1;
        await supabase.storage.from(storageBuckets.hero).remove([nextPath]);
        continue;
      }

      if (path !== nextPath) {
        await supabase.storage.from(storageBuckets.hero).remove([path]);
      }
      compacted += 1;
    }
  }

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
