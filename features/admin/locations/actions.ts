"use server";

import { revalidatePath } from "next/cache";

import {
  normalizeLocationSlug,
  normalizeWazeUrl,
  validateLocationSlug,
  type LocationFieldErrors,
} from "@/lib/admin/location";
import { currentUserIsAdmin, getAuthClaims } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { readTranslations } from "@/lib/translations";

export type LocationActionState = {
  status: "idle" | "saved" | "error";
  message: string | null;
  fieldErrors?: LocationFieldErrors;
};

const TRANSLATED_FIELDS = ["name", "address"] as const;

async function requireAdminClient() {
  const claims = await getAuthClaims();
  if (!claims || !(await currentUserIsAdmin())) {
    return null;
  }

  return createClient();
}

function revalidateLocationSurfaces() {
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/sitemap.xml");
}

function parseId(formData: FormData): number | null {
  const id = Number(formData.get("id"));
  return Number.isInteger(id) && id > 0 ? id : null;
}

const text = (formData: FormData, key: string) =>
  String(formData.get(key) ?? "").trim();

// The fields a branch shares between creating and editing.
function readDetails(formData: FormData) {
  const fieldErrors: LocationFieldErrors = {};
  const name = text(formData, "name");
  if (!name) {
    fieldErrors.name = "שם הסניף הוא שדה חובה";
  }

  const wazeUrl = normalizeWazeUrl(text(formData, "waze_url"));
  if (wazeUrl === "invalid") {
    fieldErrors.wazeUrl = "קישור הניווט אינו תקין";
  }

  return {
    fieldErrors,
    values: {
      name,
      address: text(formData, "address") || null,
      phone: text(formData, "phone") || null,
      waze_url: wazeUrl === "invalid" ? null : wazeUrl,
      ...readTranslations(formData, TRANSLATED_FIELDS),
    },
  };
}

export async function createLocation(
  formData: FormData,
): Promise<LocationActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה להוסיף סניף" };
  }

  const { fieldErrors, values } = readDetails(formData);
  const slug = normalizeLocationSlug(text(formData, "slug"));
  const slugError = validateLocationSlug(slug);
  if (slugError) {
    fieldErrors.slug = slugError;
  }
  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "יש לתקן את השדות המסומנים",
      fieldErrors,
    };
  }

  const { data: last } = await supabase
    .from("locations")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("locations").insert({
    ...values,
    slug,
    is_active: formData.get("is_active") === "on",
    sort_order: (last?.sort_order ?? -1) + 1,
  });

  if (error) {
    // 23505: the slug is already another branch's address.
    return error.code === "23505"
      ? {
          status: "error",
          message: "יש לתקן את השדות המסומנים",
          fieldErrors: { slug: "כבר קיים סניף עם הכתובת הזו" },
        }
      : { status: "error", message: "הוספת הסניף נכשלה. נסו שוב" };
  }

  revalidateLocationSurfaces();
  return { status: "saved", message: "הסניף נוסף" };
}

// The slug is not editable: printed QR codes depend on it.
export async function updateLocation(
  formData: FormData,
): Promise<LocationActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה לעדכן סניף" };
  }

  const id = parseId(formData);
  if (!id) {
    return { status: "error", message: "הסניף לא נמצא" };
  }

  const { fieldErrors, values } = readDetails(formData);
  if (Object.keys(fieldErrors).length > 0) {
    return {
      status: "error",
      message: "יש לתקן את השדות המסומנים",
      fieldErrors,
    };
  }

  const { error } = await supabase
    .from("locations")
    .update(values)
    .eq("id", id);
  if (error) {
    return { status: "error", message: "שמירת הסניף נכשלה. נסו שוב" };
  }

  revalidateLocationSurfaces();
  return { status: "saved", message: "הסניף נשמר" };
}

export async function setLocationActive(
  formData: FormData,
): Promise<LocationActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה לעדכן סניף" };
  }

  const id = parseId(formData);
  if (!id) {
    return { status: "error", message: "הסניף לא נמצא" };
  }

  const active = formData.get("is_active") === "on";
  const { error } = await supabase
    .from("locations")
    .update({ is_active: active })
    .eq("id", id);
  if (error) {
    return { status: "error", message: "עדכון הסניף נכשל. נסו שוב" };
  }

  revalidateLocationSurfaces();
  return {
    status: "saved",
    message: active ? "הסניף מוצג באתר" : "הסניף הוסתר מהאתר",
  };
}

// Removes the branch and its opening hours. The last branch cannot be removed.
export async function deleteLocation(
  formData: FormData,
): Promise<LocationActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה למחוק סניף" };
  }

  const id = parseId(formData);
  if (!id) {
    return { status: "error", message: "הסניף לא נמצא" };
  }

  const { count } = await supabase
    .from("locations")
    .select("id", { count: "exact", head: true });
  if ((count ?? 0) <= 1) {
    return { status: "error", message: "אי אפשר למחוק את הסניף היחיד" };
  }

  const { error } = await supabase.from("locations").delete().eq("id", id);
  if (error) {
    return { status: "error", message: "מחיקת הסניף נכשלה. נסו שוב" };
  }

  revalidateLocationSurfaces();
  return { status: "saved", message: "הסניף נמחק" };
}
