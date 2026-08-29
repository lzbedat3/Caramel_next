"use client";

import { storageBuckets } from "@/config/storage";
import {
  buildCategoryImagePath,
  resolveCategoryImageMime,
  validateCategoryImageFile,
} from "@/lib/admin/category";
import { prepareWebImage } from "@/lib/media/prepare-web-image";
import {
  CATEGORY_IMAGE_MAX_EDGE,
  WEB_IMAGE_CACHE_CONTROL,
} from "@/lib/media/web-image";
import { createClient } from "@/lib/supabase/client";

export async function uploadCategoryImage(
  file: File,
): Promise<{ path: string } | { error: string }> {
  const fileError = validateCategoryImageFile(file);
  if (fileError) {
    return { error: fileError };
  }

  const prepared = await prepareWebImage(file, CATEGORY_IMAGE_MAX_EDGE);
  const mime = resolveCategoryImageMime(prepared);
  const path = mime ? buildCategoryImagePath(mime) : null;
  if (!mime || !path) {
    return { error: "סוג הקובץ אינו נתמך" };
  }

  const supabase = createClient();
  const { error } = await supabase.storage
    .from(storageBuckets.categories)
    .upload(path, prepared, {
      upsert: false,
      contentType: mime,
      cacheControl: WEB_IMAGE_CACHE_CONTROL,
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
