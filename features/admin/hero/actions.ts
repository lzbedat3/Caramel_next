"use server";

import { revalidatePath } from "next/cache";

import { storageBuckets } from "@/config/storage";
import { currentUserIsAdmin, getAuthClaims } from "@/lib/auth/session";
import {
  emptyToNull,
  heroMediaTypeFromPath,
  isHeroStoragePath,
  parseDurationSeconds,
  validateHeroMetadata,
} from "@/lib/admin/hero";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/types/database";

export type HeroActionState = {
  status: "idle" | "saved" | "error";
  message: string | null;
};

async function requireAdminClient() {
  const claims = await getAuthClaims();
  if (!claims || !(await currentUserIsAdmin())) {
    return null;
  }

  return createClient();
}

function revalidateHeroSurfaces() {
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/hero", "page");
}

function readMetadata(formData: FormData) {
  return {
    altText: String(formData.get("alt_text") ?? ""),
    duration: String(formData.get("duration_seconds") ?? ""),
    isVisible: formData.get("is_visible") === "on",
    autoplay: formData.get("autoplay") === "on",
    loop: formData.get("loop") === "on",
    muted: formData.get("muted") === "on",
  };
}

function parseId(formData: FormData): number | null {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

function parseStoragePath(value: unknown): string | null {
  if (typeof value !== "string" || !isHeroStoragePath(value)) {
    return null;
  }
  return value;
}

async function removeHeroObjects(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paths: Array<string | null | undefined>,
) {
  const clean = paths.filter((path): path is string => Boolean(path));
  if (clean.length === 0) {
    return;
  }

  await supabase.storage.from(storageBuckets.hero).remove(clean);
}

export async function createHeroMedia(
  formData: FormData,
): Promise<HeroActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה להוסיף מדיה ראשית" };
  }

  const storagePath = parseStoragePath(formData.get("storage_path"));
  if (!storagePath) {
    return { status: "error", message: "נתיב הקובץ אינו תקין" };
  }

  const type = heroMediaTypeFromPath(storagePath);
  if (!type) {
    await removeHeroObjects(supabase, [storagePath]);
    return { status: "error", message: "לא הצלחנו לזהות את סוג המדיה" };
  }

  const metadata = readMetadata(formData);
  const fieldErrors = validateHeroMetadata(metadata);
  if (Object.keys(fieldErrors).length > 0) {
    await removeHeroObjects(supabase, [storagePath]);
    return {
      status: "error",
      message: fieldErrors.duration ?? "יש לתקן את השדות המסומנים",
    };
  }

  const duration = parseDurationSeconds(metadata.duration);
  if ("error" in duration) {
    await removeHeroObjects(supabase, [storagePath]);
    return { status: "error", message: duration.error };
  }

  const { data: last } = await supabase
    .from("hero_media")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const payload: TablesInsert<"hero_media"> = {
    type,
    storage_path: storagePath,
    alt_text: emptyToNull(metadata.altText),
    duration_seconds: duration.value,
    is_visible: metadata.isVisible,
    autoplay: type === "video" ? metadata.autoplay : false,
    loop: type === "video" ? metadata.loop : false,
    muted: type === "video" ? metadata.muted : true,
    sort_order: (last?.sort_order ?? -1) + 1,
  };

  const { error } = await supabase.from("hero_media").insert(payload);
  if (error) {
    await removeHeroObjects(supabase, [storagePath]);
    return { status: "error", message: "שמירת המדיה נכשלה. נסו שוב" };
  }

  revalidateHeroSurfaces();
  return { status: "saved", message: "המדיה נוספה להירו" };
}

export async function updateHeroMedia(
  formData: FormData,
): Promise<HeroActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה לערוך מדיה ראשית" };
  }

  const id = parseId(formData);
  if (!id) {
    return { status: "error", message: "פריט המדיה לא נמצא" };
  }

  const { data: existing, error: loadError } = await supabase
    .from("hero_media")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (loadError || !existing) {
    return { status: "error", message: "לא הצלחנו לטעון את פריט המדיה" };
  }

  const replacementPath = parseStoragePath(formData.get("storage_path"));
  const nextPath = replacementPath ?? existing.storage_path;
  const nextType = heroMediaTypeFromPath(nextPath);
  if (!nextType) {
    if (replacementPath) {
      await removeHeroObjects(supabase, [replacementPath]);
    }
    return { status: "error", message: "לא הצלחנו לזהות את סוג המדיה" };
  }

  const metadata = readMetadata(formData);
  const fieldErrors = validateHeroMetadata(metadata);
  if (Object.keys(fieldErrors).length > 0) {
    if (replacementPath) {
      await removeHeroObjects(supabase, [replacementPath]);
    }
    return {
      status: "error",
      message: fieldErrors.duration ?? "יש לתקן את השדות המסומנים",
    };
  }

  const duration = parseDurationSeconds(metadata.duration);
  if ("error" in duration) {
    if (replacementPath) {
      await removeHeroObjects(supabase, [replacementPath]);
    }
    return { status: "error", message: duration.error };
  }

  const becomeImage = nextType === "image";
  const { error } = await supabase
    .from("hero_media")
    .update({
      type: nextType,
      storage_path: nextPath,
      alt_text: emptyToNull(metadata.altText),
      duration_seconds: duration.value,
      is_visible: metadata.isVisible,
      autoplay: becomeImage ? false : metadata.autoplay,
      loop: becomeImage ? false : metadata.loop,
      muted: becomeImage ? true : metadata.muted,
      poster_storage_path: becomeImage ? null : existing.poster_storage_path,
    })
    .eq("id", id);

  if (error) {
    if (replacementPath) {
      await removeHeroObjects(supabase, [replacementPath]);
    }
    return { status: "error", message: "שמירת השינויים נכשלה. נסו שוב" };
  }

  const stale = new Set<string>();
  if (replacementPath && existing.storage_path !== replacementPath) {
    stale.add(existing.storage_path);
  }
  if (becomeImage && existing.poster_storage_path) {
    stale.add(existing.poster_storage_path);
  }

  if (stale.size > 0) {
    await removeHeroObjects(supabase, [...stale]);
  }

  revalidateHeroSurfaces();
  return { status: "saved", message: "השינויים נשמרו" };
}

export async function deleteHeroMedia(
  formData: FormData,
): Promise<HeroActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה למחוק מדיה ראשית" };
  }

  const id = parseId(formData);
  if (!id) {
    return { status: "error", message: "פריט המדיה לא נמצא" };
  }

  const { data: existing, error: loadError } = await supabase
    .from("hero_media")
    .select("storage_path, poster_storage_path")
    .eq("id", id)
    .maybeSingle();

  if (loadError || !existing) {
    return { status: "error", message: "לא הצלחנו למצוא את פריט המדיה" };
  }

  const { error } = await supabase.from("hero_media").delete().eq("id", id);
  if (error) {
    return { status: "error", message: "מחיקת המדיה נכשלה. נסו שוב" };
  }

  await removeHeroObjects(supabase, [
    existing.storage_path,
    existing.poster_storage_path,
  ]);

  revalidateHeroSurfaces();
  return { status: "saved", message: "המדיה נמחקה" };
}

export async function moveHeroMedia(
  formData: FormData,
): Promise<HeroActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה לשנות את סדר המדיה" };
  }

  const id = parseId(formData);
  const direction = String(formData.get("direction") ?? "");
  if (!id || (direction !== "up" && direction !== "down")) {
    return { status: "error", message: "בקשת הסידור אינה תקינה" };
  }

  const { data: rows, error: loadError } = await supabase
    .from("hero_media")
    .select("id")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (loadError || !rows) {
    return { status: "error", message: "לא הצלחנו לטעון את סדר המדיה" };
  }

  const ids = rows.map((row) => row.id);
  const currentIndex = ids.indexOf(id);
  const swapIndex = direction === "up" ? currentIndex - 1 : currentIndex + 1;
  const swapId = ids[swapIndex];

  if (currentIndex < 0 || swapId === undefined) {
    return { status: "saved", message: null };
  }

  const currentId = ids[currentIndex];
  if (currentId === undefined) {
    return { status: "error", message: "לא ניתן לשנות את הסדר" };
  }

  ids[currentIndex] = swapId;
  ids[swapIndex] = currentId;

  const updates = await Promise.all(
    ids.map((rowId, index) =>
      supabase.from("hero_media").update({ sort_order: index }).eq("id", rowId),
    ),
  );

  if (updates.some((result) => result.error)) {
    return { status: "error", message: "שמירת הסדר נכשלה. נסו שוב" };
  }

  revalidateHeroSurfaces();
  return { status: "saved", message: "סדר המדיה עודכן" };
}
