"use client";

import { storageBuckets } from "@/config/storage";
import {
  buildMenuItemImagePath,
  resolveMenuItemImageMime,
  validateMenuItemImageFile,
} from "@/lib/admin/menu-item";
import { prepareWebImage } from "@/lib/media/prepare-web-image";
import {
  MENU_IMAGE_MAX_EDGE,
  WEB_IMAGE_CACHE_CONTROL,
} from "@/lib/media/web-image";
import { createClient } from "@/lib/supabase/client";

export async function uploadMenuItemImage(
  file: File,
): Promise<{ path: string } | { error: string }> {
  const fileError = validateMenuItemImageFile(file);
  if (fileError) {
    return { error: fileError };
  }

  const prepared = await prepareWebImage(file, MENU_IMAGE_MAX_EDGE);
  const mime = resolveMenuItemImageMime(prepared);
  const path = mime ? buildMenuItemImagePath(mime) : null;
  if (!mime || !path) {
    return { error: "סוג הקובץ אינו נתמך" };
  }

  const supabase = createClient();
  const { error } = await supabase.storage
    .from(storageBuckets.menuItems)
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

export async function removeUploadedMenuItemImage(path: string) {
  const supabase = createClient();
  await supabase.storage.from(storageBuckets.menuItems).remove([path]);
}
