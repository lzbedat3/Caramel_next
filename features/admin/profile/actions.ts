"use server";

import { revalidatePath } from "next/cache";

import { storageBuckets } from "@/config/storage";
import { currentUserIsAdmin, getAuthClaims } from "@/lib/auth/session";
import {
  emptyToNull,
  logoStoragePathForMime,
  resolveLogoMime,
  validateLogoFile,
  validateProfileInput,
  type ProfileFieldErrors,
  type ProfileInput,
} from "@/lib/admin/profile";
import { encodeWebImage } from "@/lib/media/encode-web-image";
import {
  LOGO_IMAGE_MAX_EDGE,
  WEB_IMAGE_CACHE_CONTROL,
  shouldPrepareImage,
} from "@/lib/media/web-image";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/types/database";

export type SaveProfileState = {
  status: "idle" | "saved" | "error";
  message: string | null;
  fieldErrors: ProfileFieldErrors;
};

function readInput(formData: FormData): ProfileInput {
  return {
    name: String(formData.get("name") ?? ""),
    subtitle: String(formData.get("subtitle") ?? ""),
    about: String(formData.get("about") ?? ""),
    address: String(formData.get("address") ?? ""),
    wazeUrl: String(formData.get("waze_url") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    isActive: formData.get("is_active") === "on",
  };
}

function revalidateProfileSurfaces() {
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/profile", "page");
  revalidatePath("/opengraph-image");
  revalidatePath("/icon");
  revalidatePath("/sitemap.xml");
  revalidatePath("/robots.txt");
}

function saveErrorState(message: string): SaveProfileState {
  if (message.includes("restaurant_profile_email_format")) {
    return {
      status: "error",
      message: "יש לתקן את השדות המסומנים",
      fieldErrors: { email: "כתובת האימייל אינה תקינה" },
    };
  }

  if (message.includes("restaurant_profile_waze_url_format")) {
    return {
      status: "error",
      message: "יש לתקן את השדות המסומנים",
      fieldErrors: {
        wazeUrl: "קישור Waze חייב להתחיל ב-https:// או waze://",
      },
    };
  }

  return {
    status: "error",
    message: "שמירת הפרופיל נכשלה. בדקו את השדות ונסו שוב",
    fieldErrors: {},
  };
}

export async function saveRestaurantProfile(
  _prev: SaveProfileState,
  formData: FormData,
): Promise<SaveProfileState> {
  const claims = await getAuthClaims();
  if (!claims || !(await currentUserIsAdmin())) {
    return {
      status: "error",
      message: "אין הרשאה לשמור את הפרופיל",
      fieldErrors: {},
    };
  }

  const input = readInput(formData);
  const fieldErrors = validateProfileInput(input);
  const logoAction = String(formData.get("logo_action") ?? "keep");
  const logoFile = formData.get("logo");
  const hasNewLogo = logoFile instanceof File && logoFile.size > 0;

  if (hasNewLogo) {
    const logoError = validateLogoFile(logoFile);
    if (logoError) {
      fieldErrors.logo = logoError;
    }
  }

  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "יש לתקן את השדות המסומנים",
      fieldErrors,
    };
  }

  const supabase = await createClient();
  const { data: existing, error: loadError } = await supabase
    .from("restaurant_profile")
    .select("logo_storage_path")
    .eq("id", 1)
    .maybeSingle();

  if (loadError) {
    return {
      status: "error",
      message: "לא הצלחנו לטעון את הפרופיל הקיים",
      fieldErrors: {},
    };
  }

  const previousPath = existing?.logo_storage_path ?? null;
  let nextPath = previousPath;

  if (logoAction === "remove" && !hasNewLogo) {
    nextPath = null;
  }

  if (hasNewLogo && logoFile instanceof File) {
    const mime = resolveLogoMime(logoFile);
    if (!mime) {
      return {
        status: "error",
        message: "יש לתקן את השדות המסומנים",
        fieldErrors: { logo: "סוג הקובץ אינו נתמך" },
      };
    }

    const originalBytes = Buffer.from(await logoFile.arrayBuffer());
    let uploadBytes: Buffer = originalBytes;
    let uploadMime = mime;

    if (shouldPrepareImage(mime)) {
      const encoded = await encodeWebImage(originalBytes, LOGO_IMAGE_MAX_EDGE);
      if (encoded && encoded !== "skip") {
        uploadBytes = encoded.bytes;
        uploadMime = encoded.mime;
      }
    }

    const storagePath = logoStoragePathForMime(uploadMime);
    if (!storagePath) {
      return {
        status: "error",
        message: "יש לתקן את השדות המסומנים",
        fieldErrors: { logo: "סוג הקובץ אינו נתמך" },
      };
    }

    const { error: uploadError } = await supabase.storage
      .from(storageBuckets.branding)
      .upload(storagePath, uploadBytes, {
        upsert: true,
        contentType: uploadMime,
        cacheControl: WEB_IMAGE_CACHE_CONTROL,
      });

    if (uploadError) {
      return {
        status: "error",
        message: "העלאת הלוגו נכשלה. נסו קובץ אחר",
        fieldErrors: { logo: "לא הצלחנו לשמור את קובץ הלוגו" },
      };
    }

    nextPath = storagePath;
  }

  const payload: TablesInsert<"restaurant_profile"> = {
    id: 1,
    name: input.name.trim(),
    subtitle: emptyToNull(input.subtitle),
    about: emptyToNull(input.about),
    address: emptyToNull(input.address),
    waze_url: emptyToNull(input.wazeUrl),
    phone: emptyToNull(input.phone),
    email: emptyToNull(input.email),
    is_active: input.isActive,
    logo_storage_path: nextPath,
  };

  const { error: saveError } = await supabase
    .from("restaurant_profile")
    .upsert(payload, { onConflict: "id" });

  if (saveError) {
    if (hasNewLogo && nextPath && nextPath !== previousPath) {
      await supabase.storage.from(storageBuckets.branding).remove([nextPath]);
    }

    return saveErrorState(saveError.message);
  }

  if (previousPath && previousPath !== nextPath) {
    await supabase.storage.from(storageBuckets.branding).remove([previousPath]);
  }

  revalidateProfileSurfaces();

  return {
    status: "saved",
    message: "הפרופיל נשמר בהצלחה",
    fieldErrors: {},
  };
}
