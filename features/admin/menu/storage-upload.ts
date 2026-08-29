"use client";

import { storageBuckets } from "@/config/storage";
import {
  buildMenuItemImagePath,
  resolveMenuItemImageMime,
  validateMenuItemImageFile,
} from "@/lib/admin/menu-item";
import { createClient } from "@/lib/supabase/client";

export async function uploadMenuItemImage(
  file: File,
): Promise<{ path: string } | { error: string }> {
  const fileError = validateMenuItemImageFile(file);
  if (fileError) {
    return { error: fileError };
  }

  const mime = resolveMenuItemImageMime(file);
  const path = mime ? buildMenuItemImagePath(mime) : null;
  if (!mime || !path) {
    return { error: "סוג הקובץ אינו נתמך" };
  }

  const supabase = createClient();
  const { error } = await supabase.storage
    .from(storageBuckets.menuItems)
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

export async function removeUploadedMenuItemImage(path: string) {
  const supabase = createClient();
  await supabase.storage.from(storageBuckets.menuItems).remove([path]);
}
