"use client";

import { storageBuckets } from "@/config/storage";
import {
  buildCategoryImagePath,
  resolveCategoryImageMime,
  validateCategoryImageFile,
} from "@/lib/admin/category";
import { createClient } from "@/lib/supabase/client";

export async function uploadCategoryImage(
  file: File,
): Promise<{ path: string } | { error: string }> {
  const fileError = validateCategoryImageFile(file);
  if (fileError) {
    return { error: fileError };
  }

  const mime = resolveCategoryImageMime(file);
  const path = mime ? buildCategoryImagePath(mime) : null;
  if (!mime || !path) {
    return { error: "סוג הקובץ אינו נתמך" };
  }

  const supabase = createClient();
  const { error } = await supabase.storage
    .from(storageBuckets.categories)
    .upload(path, file, {
      upsert: false,
      contentType: mime,
      cacheControl: "3600",
    });

  if (error) {
    return { error: "העלאת התמונה נכשלה. נסו קובץ אחר" };
  }

  return { path };
}

export async function removeUploadedCategoryImage(path: string) {
  const supabase = createClient();
  await supabase.storage.from(storageBuckets.categories).remove([path]);
}
