"use server";

import { revalidatePath } from "next/cache";

import { currentUserIsAdmin, getAuthClaims } from "@/lib/auth/session";
import { REVIEW_REPLY_MAX } from "@/lib/reviews";
import { createClient } from "@/lib/supabase/server";

export type ReviewActionState = {
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

function revalidateReviewSurfaces() {
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
}

function parseId(formData: FormData): number | null {
  const id = Number(formData.get("id"));
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function setReviewVisibility(
  formData: FormData,
): Promise<ReviewActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה לנהל ביקורות" };
  }

  const id = parseId(formData);
  if (!id) {
    return { status: "error", message: "הביקורת לא נמצאה" };
  }

  const visible = formData.get("is_visible") === "on";
  const { error } = await supabase
    .from("reviews")
    .update({ is_visible: visible })
    .eq("id", id);
  if (error) {
    return { status: "error", message: "עדכון הביקורת נכשל. נסו שוב" };
  }

  revalidateReviewSurfaces();
  return {
    status: "saved",
    message: visible ? "הביקורת מוצגת באתר" : "הביקורת הוסתרה מהאתר",
  };
}

export async function deleteReview(
  formData: FormData,
): Promise<ReviewActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה לנהל ביקורות" };
  }

  const id = parseId(formData);
  if (!id) {
    return { status: "error", message: "הביקורת לא נמצאה" };
  }

  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) {
    return { status: "error", message: "מחיקת הביקורת נכשלה. נסו שוב" };
  }

  revalidateReviewSurfaces();
  return { status: "saved", message: "הביקורת נמחקה" };
}

// Saves the owner's public reply; an empty reply removes it.
export async function saveReviewReply(
  formData: FormData,
): Promise<ReviewActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה לנהל ביקורות" };
  }

  const id = parseId(formData);
  if (!id) {
    return { status: "error", message: "הביקורת לא נמצאה" };
  }

  const reply = String(formData.get("reply") ?? "").trim();
  if (reply.length > REVIEW_REPLY_MAX) {
    return {
      status: "error",
      message: `התגובה ארוכה מדי (עד ${REVIEW_REPLY_MAX} תווים)`,
    };
  }

  const { error } = await supabase
    .from("reviews")
    .update({
      reply: reply || null,
      replied_at: reply ? new Date().toISOString() : null,
    })
    .eq("id", id);
  if (error) {
    return { status: "error", message: "שמירת התגובה נכשלה. נסו שוב" };
  }

  revalidateReviewSurfaces();
  return {
    status: "saved",
    message: reply ? "התגובה פורסמה" : "התגובה הוסרה",
  };
}
