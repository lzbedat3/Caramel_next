"use client";

import { storageBuckets } from "@/config/storage";
import {
  buildHeroStoragePath,
  heroMediaTypeFromMime,
  resolveHeroMime,
  validateHeroFile,
} from "@/lib/admin/hero";
import { prepareWebImage } from "@/lib/media/prepare-web-image";
import {
  HERO_IMAGE_MAX_EDGE,
  WEB_IMAGE_CACHE_CONTROL,
} from "@/lib/media/web-image";
import { createClient } from "@/lib/supabase/client";

export async function uploadHeroFile(file: File): Promise<
  | { path: string; type: "image" | "video" }
  | { error: string }
> {
  const fileError = validateHeroFile(file);
  if (fileError) {
    return { error: fileError };
  }

  const originalMime = resolveHeroMime(file);
  const originalType = originalMime ? heroMediaTypeFromMime(originalMime) : null;
  if (!originalMime || !originalType) {
    return { error: "סוג הקובץ אינו נתמך" };
  }

  const prepared =
    originalType === "image"
      ? await prepareWebImage(file, HERO_IMAGE_MAX_EDGE)
      : file;
  const mime = resolveHeroMime(prepared);
  const type = mime ? heroMediaTypeFromMime(mime) : null;
  const path = mime ? buildHeroStoragePath(mime) : null;
  if (!mime || !type || !path) {
    return { error: "סוג הקובץ אינו נתמך" };
  }

  const supabase = createClient();
  const { error } = await supabase.storage
    .from(storageBuckets.hero)
    .upload(path, prepared, {
      upsert: false,
      contentType: mime,
      cacheControl: WEB_IMAGE_CACHE_CONTROL,
    });

  if (error) {
    return { error: "העלאת הקובץ נכשלה. נסו קובץ אחר" };
  }

  return { path, type };
}

export async function removeUploadedHeroFile(path: string) {
  const supabase = createClient();
  await supabase.storage.from(storageBuckets.hero).remove([path]);
}
