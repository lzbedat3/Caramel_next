"use server";

import { revalidatePath } from "next/cache";

import { storageBuckets } from "@/config/storage";
import {
  emptyToNull,
  isMenuItemImagePath,
  parseCategoryId,
  parsePrice,
  validateMenuItemMetadata,
} from "@/lib/admin/menu-item";
import { currentUserIsAdmin, getAuthClaims } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/types/database";

export type MenuItemActionState = {
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

function revalidateMenuSurfaces() {
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/menu", "page");
  revalidatePath("/admin/categories", "page");
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
  if (!isMenuItemImagePath(value)) {
    return null;
  }
  return value;
}

function readMetadata(formData: FormData) {
  return {
    name: String(formData.get("name") ?? ""),
    shortDescription: String(formData.get("short_description") ?? ""),
    price: String(formData.get("price") ?? ""),
    categoryId: String(formData.get("category_id") ?? ""),
  };
}

async function removeMenuItemObjects(
  supabase: Awaited<ReturnType<typeof createClient>>,
  paths: Array<string | null | undefined>,
) {
  const clean = paths.filter((path): path is string => Boolean(path));
  if (clean.length === 0) {
    return;
  }

  await supabase.storage.from(storageBuckets.menuItems).remove(clean);
}

async function nextSortOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  categoryId: number,
): Promise<number> {
  const { data } = await supabase
    .from("menu_items")
    .select("sort_order")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.sort_order ?? -1) + 1;
}

async function rewriteCategoryItemOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  categoryId: number,
): Promise<string | null> {
  const { data, error } = await supabase
    .from("menu_items")
    .select("id")
    .eq("category_id", categoryId)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error || !data) {
    return error?.message ?? "לא הצלחנו לעדכן את סדר המנות";
  }

  const updates = await Promise.all(
    data.map((row, index) =>
      supabase.from("menu_items").update({ sort_order: index }).eq("id", row.id),
    ),
  );

  return updates.some((result) => result.error)
    ? "שמירת סדר המנות נכשלה"
    : null;
}

async function categoryExists(
  supabase: Awaited<ReturnType<typeof createClient>>,
  categoryId: number,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .maybeSingle();

  return !error && data !== null;
}

export async function createMenuItem(
  formData: FormData,
): Promise<MenuItemActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה להוסיף מנה" };
  }

  const metadata = readMetadata(formData);
  const fieldErrors = validateMenuItemMetadata(metadata);
  const replacementPath = parseStoragePath(formData.get("storage_path"));
  const rawPath = formData.get("storage_path");

  if (typeof rawPath === "string" && rawPath.length > 0 && !replacementPath) {
    await removeMenuItemObjects(supabase, [rawPath]);
    return { status: "error", message: "נתיב התמונה אינו תקין" };
  }

  const firstError =
    fieldErrors.name ?? fieldErrors.categoryId ?? fieldErrors.price;
  if (firstError) {
    if (replacementPath) {
      await removeMenuItemObjects(supabase, [replacementPath]);
    }
    return { status: "error", message: firstError };
  }

  const categoryId = parseCategoryId(metadata.categoryId);
  const price = parsePrice(metadata.price);
  if (!categoryId || "error" in price) {
    if (replacementPath) {
      await removeMenuItemObjects(supabase, [replacementPath]);
    }
    return { status: "error", message: "יש לתקן את השדות המסומנים" };
  }

  if (!(await categoryExists(supabase, categoryId))) {
    if (replacementPath) {
      await removeMenuItemObjects(supabase, [replacementPath]);
    }
    return { status: "error", message: "יש לבחור קטגוריה קיימת" };
  }

  const payload: TablesInsert<"menu_items"> = {
    name: metadata.name.trim(),
    short_description: emptyToNull(metadata.shortDescription),
    price: price.value,
    category_id: categoryId,
    storage_path: replacementPath,
    is_visible: formData.get("is_visible") === "on",
    is_available: formData.get("is_available") === "on",
    sort_order: await nextSortOrder(supabase, categoryId),
  };

  const { error } = await supabase.from("menu_items").insert(payload);
  if (error) {
    if (replacementPath) {
      await removeMenuItemObjects(supabase, [replacementPath]);
    }
    return { status: "error", message: "שמירת המנה נכשלה. נסו שוב" };
  }

  revalidateMenuSurfaces();
  return { status: "saved", message: "המנה נוספה לתפריט" };
}

export async function updateMenuItem(
  formData: FormData,
): Promise<MenuItemActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה לערוך מנה" };
  }

  const id = parseId(formData);
  if (!id) {
    return { status: "error", message: "המנה לא נמצאה" };
  }

  const { data: existing, error: loadError } = await supabase
    .from("menu_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (loadError || !existing) {
    return { status: "error", message: "לא הצלחנו לטעון את המנה" };
  }

  const metadata = readMetadata(formData);
  const fieldErrors = validateMenuItemMetadata(metadata);
  const replacementPath = parseStoragePath(formData.get("storage_path"));
  const rawPath = formData.get("storage_path");
  const imageAction = String(formData.get("image_action") ?? "keep");

  if (typeof rawPath === "string" && rawPath.length > 0 && !replacementPath) {
    await removeMenuItemObjects(supabase, [rawPath]);
    return { status: "error", message: "נתיב התמונה אינו תקין" };
  }

  const firstError =
    fieldErrors.name ?? fieldErrors.categoryId ?? fieldErrors.price;
  if (firstError) {
    if (replacementPath) {
      await removeMenuItemObjects(supabase, [replacementPath]);
    }
    return { status: "error", message: firstError };
  }

  const categoryId = parseCategoryId(metadata.categoryId);
  const price = parsePrice(metadata.price);
  if (!categoryId || "error" in price) {
    if (replacementPath) {
      await removeMenuItemObjects(supabase, [replacementPath]);
    }
    return { status: "error", message: "יש לתקן את השדות המסומנים" };
  }

  if (!(await categoryExists(supabase, categoryId))) {
    if (replacementPath) {
      await removeMenuItemObjects(supabase, [replacementPath]);
    }
    return { status: "error", message: "יש לבחור קטגוריה קיימת" };
  }

  let nextPath = existing.storage_path;
  if (imageAction === "remove" && !replacementPath) {
    nextPath = null;
  }
  if (replacementPath) {
    nextPath = replacementPath;
  }

  const categoryChanged = existing.category_id !== categoryId;
  const nextSort = categoryChanged
    ? await nextSortOrder(supabase, categoryId)
    : existing.sort_order;

  const { error } = await supabase
    .from("menu_items")
    .update({
      name: metadata.name.trim(),
      short_description: emptyToNull(metadata.shortDescription),
      price: price.value,
      category_id: categoryId,
      storage_path: nextPath,
      sort_order: nextSort,
    })
    .eq("id", id);

  if (error) {
    if (replacementPath) {
      await removeMenuItemObjects(supabase, [replacementPath]);
    }
    return { status: "error", message: "שמירת השינויים נכשלה. נסו שוב" };
  }

  if (existing.storage_path && existing.storage_path !== nextPath) {
    await removeMenuItemObjects(supabase, [existing.storage_path]);
  }

  if (categoryChanged) {
    const oldOrderError = await rewriteCategoryItemOrder(
      supabase,
      existing.category_id,
    );
    const newOrderError = await rewriteCategoryItemOrder(supabase, categoryId);
    if (oldOrderError || newOrderError) {
      revalidateMenuSurfaces();
      return {
        status: "error",
        message: "המנה הועברה, אבל עדכון הסדר לא הושלם במלואו",
      };
    }
  }

  revalidateMenuSurfaces();
  return { status: "saved", message: "המנה עודכנה" };
}

export async function setMenuItemVisibility(
  formData: FormData,
): Promise<MenuItemActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה לשנות נראות" };
  }

  const id = parseId(formData);
  if (!id) {
    return { status: "error", message: "המנה לא נמצאה" };
  }

  const isVisible = formData.get("is_visible") === "on";
  const { error } = await supabase
    .from("menu_items")
    .update({ is_visible: isVisible })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "עדכון הנראות נכשל. נסו שוב" };
  }

  revalidateMenuSurfaces();
  return {
    status: "saved",
    message: isVisible ? "המנה גלויה באתר" : "המנה הוסתרה מהאתר",
  };
}

export async function setMenuItemAvailability(
  formData: FormData,
): Promise<MenuItemActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה לשנות זמינות" };
  }

  const id = parseId(formData);
  if (!id) {
    return { status: "error", message: "המנה לא נמצאה" };
  }

  const isAvailable = formData.get("is_available") === "on";
  const { error } = await supabase
    .from("menu_items")
    .update({ is_available: isAvailable })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "עדכון הזמינות נכשל. נסו שוב" };
  }

  revalidateMenuSurfaces();
  return {
    status: "saved",
    message: isAvailable ? "המנה זמינה" : "המנה סומנה כלא זמינה",
  };
}

export async function deleteMenuItem(
  formData: FormData,
): Promise<MenuItemActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה למחוק מנה" };
  }

  const id = parseId(formData);
  if (!id) {
    return { status: "error", message: "המנה לא נמצאה" };
  }

  const { data: existing, error: loadError } = await supabase
    .from("menu_items")
    .select("storage_path, category_id")
    .eq("id", id)
    .maybeSingle();

  if (loadError || !existing) {
    return { status: "error", message: "לא הצלחנו למצוא את המנה" };
  }

  const { error } = await supabase.from("menu_items").delete().eq("id", id);
  if (error) {
    return { status: "error", message: "מחיקת המנה נכשלה. נסו שוב" };
  }

  await removeMenuItemObjects(supabase, [existing.storage_path]);
  await rewriteCategoryItemOrder(supabase, existing.category_id);
  revalidateMenuSurfaces();
  return { status: "saved", message: "המנה נמחקה" };
}

export async function moveMenuItem(
  formData: FormData,
): Promise<MenuItemActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה לשנות את סדר המנות" };
  }

  const id = parseId(formData);
  const direction = String(formData.get("direction") ?? "");
  if (!id || (direction !== "up" && direction !== "down")) {
    return { status: "error", message: "בקשת הסידור אינה תקינה" };
  }

  const { data: existing, error: loadError } = await supabase
    .from("menu_items")
    .select("category_id")
    .eq("id", id)
    .maybeSingle();

  if (loadError || !existing) {
    return { status: "error", message: "לא הצלחנו לטעון את המנה" };
  }

  const { data: rows, error: listError } = await supabase
    .from("menu_items")
    .select("id")
    .eq("category_id", existing.category_id)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (listError || !rows) {
    return { status: "error", message: "לא הצלחנו לטעון את סדר המנות" };
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
      supabase.from("menu_items").update({ sort_order: index }).eq("id", rowId),
    ),
  );

  if (updates.some((result) => result.error)) {
    return { status: "error", message: "שמירת הסדר נכשלה. נסו שוב" };
  }

  revalidateMenuSurfaces();
  return { status: "saved", message: "סדר המנות עודכן" };
}
