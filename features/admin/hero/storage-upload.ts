"use client";

import { storageBuckets } from "@/config/storage";
import {
  buildHeroStoragePath,
  heroMediaTypeFromMime,
  resolveHeroMime,
  validateHeroFile,
} from "@/lib/admin/hero";
import { createClient } from "@/lib/supabase/client";

export async function uploadHeroFile(file: File): Promise<
  | { path: string; type: "image" | "video" }
  | { error: string }
> {
  const fileError = validateHeroFile(file);
  if (fileError) {
    return { error: fileError };
  }

  const mime = resolveHeroMime(file);
  const type = mime ? heroMediaTypeFromMime(mime) : null;
  const path = mime ? buildHeroStoragePath(mime) : null;
  if (!mime || !type || !path) {
    return { error: "סוג הקובץ אינו נתמך" };
  }

  const supabase = createClient();
  const { error } = await supabase.storage
    .from(storageBuckets.hero)
    .upload(path, file, {
      upsert: false,
      contentType: mime,
      cacheControl: "3600",
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
