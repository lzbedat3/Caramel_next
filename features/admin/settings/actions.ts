"use server";

import { revalidatePath } from "next/cache";

import {
  normalizedSiteSettings,
  validateSiteSettingsInput,
  type SiteSettingsFieldErrors,
  type SiteSettingsInput,
} from "@/lib/admin/site-settings";
import { currentUserIsAdmin, getAuthClaims } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type SaveSettingsState = {
  status: "idle" | "saved" | "error";
  message: string | null;
  fieldErrors: SiteSettingsFieldErrors;
};

function readInput(formData: FormData): SiteSettingsInput {
  return {
    seoTitle: String(formData.get("seo_title") ?? ""),
    seoDescription: String(formData.get("seo_description") ?? ""),
  };
}

function revalidateSettingsSurfaces() {
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/settings", "page");
  revalidatePath("/opengraph-image");
  revalidatePath("/icon");
  revalidatePath("/sitemap.xml");
  revalidatePath("/robots.txt");
}

export async function saveSiteSettings(
  _prev: SaveSettingsState,
  formData: FormData,
): Promise<SaveSettingsState> {
  const claims = await getAuthClaims();
  if (!claims || !(await currentUserIsAdmin())) {
    return {
      status: "error",
      message: "אין הרשאה לשמור הגדרות",
      fieldErrors: {},
    };
  }

  const input = readInput(formData);
  const fieldErrors = validateSiteSettingsInput(input);
  if (fieldErrors.seoTitle || fieldErrors.seoDescription) {
    return {
      status: "error",
      message: "יש לתקן את השדות המסומנים",
      fieldErrors,
    };
  }

  const supabase = await createClient();
  const payload = {
    id: 1 as const,
    ...normalizedSiteSettings(input),
  };

  const { error } = await supabase.from("site_settings").upsert(payload, {
    onConflict: "id",
  });

  if (error) {
    return {
      status: "error",
      message: "שמירת ההגדרות נכשלה. נסו שוב",
      fieldErrors: {},
    };
  }

  revalidateSettingsSurfaces();
  return {
    status: "saved",
    message: "ההגדרות נשמרו",
    fieldErrors: {},
  };
}
