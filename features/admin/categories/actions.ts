"use server";

import { revalidatePath } from "next/cache";

import { storageBuckets } from "@/config/storage";
import {
  emptyToNull,
  isCategoryImagePath,
  validateCategoryMetadata,
} from "@/lib/admin/category";
import { currentUserIsAdmin, getAuthClaims } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/types/database";

export type CategoryActionState = {
  status: "idle" | "saved" | "error";
  message: string | null;
};

const DELETE_BLOCKED_MESSAGE =
  "לא ניתן למחוק קטגוריה שעדיין מכילה מנות. יש להעביר או למחוק את המנות קודם.";

async function requireAdminClient() {
  const claims = await getAuthClaims();
  if (!claims || !(await currentUserIsAdmin())) {
    return null;
  }

  return createClient();
}

function revalidateCategorySurfaces() {
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/categories", "page");
  revalidatePath("/admin/menu", "page");
}

function parseId(formData: FormData): number | null {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

function parseStoragePath(value: unknown): string | null {
  if (typeof value !== "string" || value.length === 0) {
    return null;
  }
  if (!isCategoryImagePath(value)) {
    return null;
  }
  return value;
}

function readMetadata(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    subtitle: String(formData.get("subtitle") ?? ""),
  };
}

async function removeCategoryObjects(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paths: Array<string | null | undefined>,
) {
  const clean = paths.filter((path): path is string => Boolean(path));
  if (clean.length === 0) {
    return;
  }

  await supabase.storage.from(storageBuckets.categories).remove(clean);
}

export async function createCategory(
  formData: FormData,
): Promise<CategoryActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה להוסיף קטגוריה" };
  }

  const metadata = readMetadata(formData);
  const fieldErrors = validateCategoryMetadata(metadata);
  const replacementPath = parseStoragePath(formData.get("storage_path"));
  const rawPath = formData.get("storage_path");
  if (typeof rawPath === "string" && rawPath.length > 0 && !replacementPath) {
    await removeCategoryObjects(supabase, [rawPath]);
    return { status: "error", message: "נתיב התמונה אינו תקין" };
  }

  if (fieldErrors.name) {
    if (replacementPath) {
      await removeCategoryObjects(supabase, [replacementPath]);
    }
    return { status: "error", message: fieldErrors.name };
  }

  const { data: last } = await supabase
    .from("categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  const payload: TablesInsert<"categories"> = {
    name: metadata.name.trim(),
    subtitle: emptyToNull(metadata.subtitle),
    is_visible: formData.get("is_visible") === "on",
    storage_path: replacementPath,
    sort_order: (last?.sort_order ?? -1) + 1,
  };

  const { error } = await supabase.from("categories").insert(payload);
  if (error) {
    if (replacementPath) {
      await removeCategoryObjects(supabase, [replacementPath]);
    }
    return { status: "error", message: "שמירת הקטגוריה נכשלה. נסו שוב" };
  }

  revalidateCategorySurfaces();
  return { status: "saved", message: "הקטגוריה נוספה" };
}

export async function updateCategory(
  formData: FormData,
): Promise<CategoryActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה לערוך קטגוריה" };
  }

  const id = parseId(formData);
  if (!id) {
    return { status: "error", message: "הקטגוריה לא נמצאה" };
  }

  const { data: existing, error: loadError } = await supabase
    .from("categories")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (loadError || !existing) {
    return { status: "error", message: "לא הצלחנו לטעון את הקטגוריה" };
  }

  const metadata = readMetadata(formData);
  const fieldErrors = validateCategoryMetadata(metadata);
  const replacementPath = parseStoragePath(formData.get("storage_path"));
  const rawPath = formData.get("storage_path");
  const imageAction = String(formData.get("image_action") ?? "keep");

  if (typeof rawPath === "string" && rawPath.length > 0 && !replacementPath) {
    await removeCategoryObjects(supabase, [rawPath]);
    return { status: "error", message: "נתיב התמונה אינו תקין" };
  }

  if (fieldErrors.name) {
    if (replacementPath) {
      await removeCategoryObjects(supabase, [replacementPath]);
    }
    return { status: "error", message: fieldErrors.name };
  }

  let nextPath = existing.storage_path;
  if (imageAction === "remove" && !replacementPath) {
    nextPath = null;
  }
  if (replacementPath) {
    nextPath = replacementPath;
  }

  const { error } = await supabase
    .from("categories")
    .update({
      name: metadata.name.trim(),
      subtitle: emptyToNull(metadata.subtitle),
      storage_path: nextPath,
    })
    .eq("id", id);

  if (error) {
    if (replacementPath) {
      await removeCategoryObjects(supabase, [replacementPath]);
    }
    return { status: "error", message: "שמירת השינויים נכשלה. נסו שוב" };
  }

  if (existing.storage_path && existing.storage_path !== nextPath) {
    await removeCategoryObjects(supabase, [existing.storage_path]);
  }

  revalidateCategorySurfaces();
  return { status: "saved", message: "הקטגוריה עודכנה" };
}

export async function setCategoryVisibility(
  formData: FormData,
): Promise<CategoryActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה לשנות נראות" };
  }

  const id = parseId(formData);
  if (!id) {
    return { status: "error", message: "הקטגוריה לא נמצאה" };
  }

  const { error } = await supabase
    .from("categories")
    .update({ is_visible: formData.get("is_visible") === "on" })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "עדכון הנראות נכשל. נסו שוב" };
  }

  revalidateCategorySurfaces();
  return {
    status: "saved",
    message:
      formData.get("is_visible") === "on"
        ? "הקטגוריה גלויה באתר"
        : "הקטגוריה הוסתרה מהאתר",
  };
}

export async function deleteCategory(
  formData: FormData,
): Promise<CategoryActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה למחוק קטגוריה" };
  }

  const id = parseId(formData);
  if (!id) {
    return { status: "error", message: "הקטגוריה לא נמצאה" };
  }

  const [{ data: existing, error: loadError }, { count, error: countError }] =
    await Promise.all([
      supabase
        .from("categories")
        .select("storage_path")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("menu_items")
        .select("*", { count: "exact", head: true })
        .eq("category_id", id),
    ]);

  if (loadError || !existing) {
    return { status: "error", message: "לא הצלחנו למצוא את הקטגוריה" };
  }

  if (countError) {
    return { status: "error", message: "לא הצלחנו לבדוק אם יש מנות בקטגוריה" };
  }

  if ((count ?? 0) > 0) {
    return { status: "error", message: DELETE_BLOCKED_MESSAGE };
  }

  const { error } = await supabase.from("categories").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      return { status: "error", message: DELETE_BLOCKED_MESSAGE };
    }
    return { status: "error", message: "מחיקת הקטגוריה נכשלה. נסו שוב" };
  }

  await removeCategoryObjects(supabase, [existing.storage_path]);
  revalidateCategorySurfaces();
  return { status: "saved", message: "הקטגוריה נמחקה" };
}

export async function moveCategory(
  formData: FormData,
): Promise<CategoryActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה לשנות את סדר הקטגוריות" };
  }

  const id = parseId(formData);
  const direction = String(formData.get("direction") ?? "");
  if (!id || (direction !== "up" && direction !== "down")) {
    return { status: "error", message: "בקשת הסידור אינה תקינה" };
  }

  const { data: rows, error: loadError } = await supabase
    .from("categories")
    .select("id")
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (loadError || !rows) {
    return { status: "error", message: "לא הצלחנו לטעון את סדר הקטגוריות" };
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
      supabase.from("categories").update({ sort_order: index }).eq("id", rowId),
    ),
  );

  if (updates.some((result) => result.error)) {
    return { status: "error", message: "שמירת הסדר נכשלה. נסו שוב" };
  }

  revalidateCategorySurfaces();
  return { status: "saved", message: "סדר הקטגוריות עודכן" };
}
