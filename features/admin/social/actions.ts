"use server";

import { revalidatePath } from "next/cache";

import {
  firstSocialError,
  isSocialPlatform,
  normalizeSocialUrl,
  validateSocialLink,
} from "@/lib/admin/social";
import { currentUserIsAdmin, getAuthClaims } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/types/database";

export type SocialActionState = {
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

function revalidateSocialSurfaces() {
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/social", "page");
}

function parseId(formData: FormData): number | null {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

function readSocialFields(formData: FormData) {
  return {
    platform: String(formData.get("platform") ?? ""),
    url: String(formData.get("url") ?? ""),
  };
}

export async function createSocialLink(
  formData: FormData,
): Promise<SocialActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה להוסיף קישור" };
  }

  const fields = readSocialFields(formData);
  const fieldErrors = validateSocialLink(fields);
  const message = firstSocialError(fieldErrors);
  if (message) {
    return { status: "error", message };
  }

  if (!isSocialPlatform(fields.platform)) {
    return { status: "error", message: "יש לבחור פלטפורמה" };
  }

  const { data: last } = await supabase
    .from("social_links")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const payload: TablesInsert<"social_links"> = {
    platform: fields.platform,
    url: normalizeSocialUrl(fields.url),
    is_visible: formData.get("is_visible") === "on",
    sort_order: (last?.sort_order ?? -1) + 1,
  };

  const { error } = await supabase.from("social_links").insert(payload);
  if (error) {
    return { status: "error", message: "שמירת הקישור נכשלה. נסו שוב" };
  }

  revalidateSocialSurfaces();
  return { status: "saved", message: "הקישור נוסף" };
}

export async function updateSocialLink(
  formData: FormData,
): Promise<SocialActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה לערוך קישור" };
  }

  const id = parseId(formData);
  if (!id) {
    return { status: "error", message: "הקישור לא נמצא" };
  }

  const fields = readSocialFields(formData);
  const fieldErrors = validateSocialLink(fields);
  const message = firstSocialError(fieldErrors);
  if (message) {
    return { status: "error", message };
  }

  if (!isSocialPlatform(fields.platform)) {
    return { status: "error", message: "יש לבחור פלטפורמה" };
  }

  const { error } = await supabase
    .from("social_links")
    .update({
      platform: fields.platform,
      url: normalizeSocialUrl(fields.url),
    })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "שמירת השינויים נכשלה. נסו שוב" };
  }

  revalidateSocialSurfaces();
  return { status: "saved", message: "הקישור עודכן" };
}

export async function setSocialVisibility(
  formData: FormData,
): Promise<SocialActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה לשנות נראות" };
  }

  const id = parseId(formData);
  if (!id) {
    return { status: "error", message: "הקישור לא נמצא" };
  }

  const { error } = await supabase
    .from("social_links")
    .update({ is_visible: formData.get("is_visible") === "on" })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "עדכון הנראות נכשל. נסו שוב" };
  }

  revalidateSocialSurfaces();
  return {
    status: "saved",
    message:
      formData.get("is_visible") === "on"
        ? "הקישור גלוי באתר"
        : "הקישור הוסתר מהאתר",
  };
}

export async function deleteSocialLink(
  formData: FormData,
): Promise<SocialActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה למחוק קישור" };
  }

  const id = parseId(formData);
  if (!id) {
    return { status: "error", message: "הקישור לא נמצא" };
  }

  const { error } = await supabase.from("social_links").delete().eq("id", id);
  if (error) {
    return { status: "error", message: "מחיקת הקישור נכשלה. נסו שוב" };
  }

  const { data: rows, error: loadError } = await supabase
    .from("social_links")
    .select("id")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (!loadError && rows) {
    await Promise.all(
      rows.map((row, index) =>
        supabase.from("social_links").update({ sort_order: index }).eq("id", row.id),
      ),
    );
  }

  revalidateSocialSurfaces();
  return { status: "saved", message: "הקישור נמחק" };
}

export async function moveSocialLink(
  formData: FormData,
): Promise<SocialActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה לשנות את סדר הקישורים" };
  }

  const id = parseId(formData);
  const direction = String(formData.get("direction") ?? "");
  if (!id || (direction !== "up" && direction !== "down")) {
    return { status: "error", message: "בקשת הסידור אינה תקינה" };
  }

  const { data: rows, error: loadError } = await supabase
    .from("social_links")
    .select("id")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (loadError || !rows) {
    return { status: "error", message: "לא הצלחנו לטעון את סדר הקישורים" };
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
      supabase.from("social_links").update({ sort_order: index }).eq("id", rowId),
    ),
  );

  if (updates.some((result) => result.error)) {
    return { status: "error", message: "שמירת הסדר נכשלה. נסו שוב" };
  }

  revalidateSocialSurfaces();
  return { status: "saved", message: "סדר הקישורים עודכן" };
}
