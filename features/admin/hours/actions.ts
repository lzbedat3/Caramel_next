"use server";

import { revalidatePath } from "next/cache";

import {
  emptyToNull,
  firstHourError,
  isWeekday,
  parseTimeInput,
  validateHourNote,
  validateOpenInterval,
} from "@/lib/admin/hours";
import { currentUserIsAdmin, getAuthClaims } from "@/lib/auth/session";
import type { Weekday } from "@/lib/opening-hours";
import { createClient } from "@/lib/supabase/server";
import type { TablesInsert } from "@/types/database";

export type HoursActionState = {
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

function revalidateHoursSurfaces() {
  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
  revalidatePath("/admin/hours", "page");
}

function parseId(formData: FormData): number | null {
  const id = Number(formData.get("id"));
  if (!Number.isInteger(id) || id <= 0) {
    return null;
  }
  return id;
}

function parseDay(formData: FormData): Weekday | null {
  const value = String(formData.get("day_of_week") ?? "");
  return isWeekday(value) ? value : null;
}

function readInterval(formData: FormData) {
  return {
    opensAt: String(formData.get("opens_at") ?? ""),
    closesAt: String(formData.get("closes_at") ?? ""),
    note: String(formData.get("note") ?? ""),
  };
}

async function persistDayOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  orderedIds: number[],
): Promise<boolean> {
  const updates = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("opening_hours").update({ sort_order: index }).eq("id", id),
    ),
  );

  return !updates.some((result) => result.error);
}

async function rewriteDayOrder(
  supabase: Awaited<ReturnType<typeof createClient>>,
  day: Weekday,
): Promise<boolean> {
  const { data, error } = await supabase
    .from("opening_hours")
    .select("id")
    .eq("day_of_week", day)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (error || !data) {
    return false;
  }

  return persistDayOrder(
    supabase,
    data.map((row) => row.id),
  );
}

async function loadDayRows(
  supabase: Awaited<ReturnType<typeof createClient>>,
  day: Weekday,
) {
  return supabase
    .from("opening_hours")
    .select("*")
    .eq("day_of_week", day)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });
}

export async function createHourInterval(
  formData: FormData,
): Promise<HoursActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה להוסיף משמרת" };
  }

  const day = parseDay(formData);
  if (!day) {
    return { status: "error", message: "יום השבוע אינו תקין" };
  }

  const { data: existing, error: loadError } = await loadDayRows(supabase, day);
  if (loadError || !existing) {
    return { status: "error", message: "לא הצלחנו לטעון את השעות ליום זה" };
  }

  const input = readInterval(formData);
  const fieldErrors = validateOpenInterval(
    input,
    existing.filter((row) => !row.is_closed),
  );
  const message = firstHourError(fieldErrors);
  if (message) {
    return { status: "error", message };
  }

  const opens = parseTimeInput(input.opensAt);
  const closes = parseTimeInput(input.closesAt);
  if (!opens.ok || !closes.ok) {
    return { status: "error", message: "שעה לא תקינה" };
  }

  const closedIds = existing.filter((row) => row.is_closed).map((row) => row.id);
  if (closedIds.length > 0) {
    const { error: deleteClosedError } = await supabase
      .from("opening_hours")
      .delete()
      .in("id", closedIds);

    if (deleteClosedError) {
      return { status: "error", message: "לא הצלחנו להסיר את סימון הסגירה" };
    }
  }

  const openCount = existing.filter((row) => !row.is_closed).length;
  const payload: TablesInsert<"opening_hours"> = {
    day_of_week: day,
    is_closed: false,
    opens_at: opens.value,
    closes_at: closes.value,
    note: emptyToNull(input.note),
    sort_order: openCount,
  };

  const { error } = await supabase.from("opening_hours").insert(payload);
  if (error) {
    return { status: "error", message: "שמירת המשמרת נכשלה. נסו שוב" };
  }

  await rewriteDayOrder(supabase, day);
  revalidateHoursSurfaces();
  return { status: "saved", message: "המשמרת נוספה" };
}

export async function updateHourInterval(
  formData: FormData,
): Promise<HoursActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה לערוך שעות" };
  }

  const id = parseId(formData);
  if (!id) {
    return { status: "error", message: "המשמרת לא נמצאה" };
  }

  const { data: existing, error: loadError } = await supabase
    .from("opening_hours")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (loadError || !existing) {
    return { status: "error", message: "לא הצלחנו לטעון את המשמרת" };
  }

  const note = String(formData.get("note") ?? "");
  const noteError = validateHourNote(note);
  if (noteError) {
    return { status: "error", message: noteError };
  }

  if (existing.is_closed || formData.get("is_closed") === "on") {
    const { error } = await supabase
      .from("opening_hours")
      .update({
        is_closed: true,
        opens_at: null,
        closes_at: null,
        note: emptyToNull(note),
      })
      .eq("id", id);

    if (error) {
      return { status: "error", message: "שמירת ההערה נכשלה. נסו שוב" };
    }

    revalidateHoursSurfaces();
    return { status: "saved", message: "ההערה עודכנה" };
  }

  const { data: siblings, error: siblingsError } = await loadDayRows(
    supabase,
    existing.day_of_week,
  );
  if (siblingsError || !siblings) {
    return { status: "error", message: "לא הצלחנו לבדוק משמרות אחרות ביום זה" };
  }

  const input = readInterval(formData);
  const fieldErrors = validateOpenInterval(
    input,
    siblings.filter((row) => !row.is_closed && row.id !== id),
  );
  const message = firstHourError(fieldErrors);
  if (message) {
    return { status: "error", message };
  }

  const opens = parseTimeInput(input.opensAt);
  const closes = parseTimeInput(input.closesAt);
  if (!opens.ok || !closes.ok) {
    return { status: "error", message: "שעה לא תקינה" };
  }

  const { error } = await supabase
    .from("opening_hours")
    .update({
      is_closed: false,
      opens_at: opens.value,
      closes_at: closes.value,
      note: emptyToNull(input.note),
    })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "שמירת השינויים נכשלה. נסו שוב" };
  }

  revalidateHoursSurfaces();
  return { status: "saved", message: "המשמרת עודכנה" };
}

export async function deleteHourInterval(
  formData: FormData,
): Promise<HoursActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה למחוק משמרת" };
  }

  const id = parseId(formData);
  if (!id) {
    return { status: "error", message: "המשמרת לא נמצאה" };
  }

  const { data: existing, error: loadError } = await supabase
    .from("opening_hours")
    .select("id, day_of_week, is_closed")
    .eq("id", id)
    .maybeSingle();

  if (loadError || !existing) {
    return { status: "error", message: "לא הצלחנו למצוא את הרשומה" };
  }

  const { error } = await supabase.from("opening_hours").delete().eq("id", id);
  if (error) {
    return { status: "error", message: "המחיקה נכשלה. נסו שוב" };
  }

  await rewriteDayOrder(supabase, existing.day_of_week);
  revalidateHoursSurfaces();
  return {
    status: "saved",
    message: existing.is_closed ? "סימון הסגירה בוטל" : "המשמרת נמחקה",
  };
}

export async function markDayClosed(
  formData: FormData,
): Promise<HoursActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה לסמן יום כסגור" };
  }

  const day = parseDay(formData);
  if (!day) {
    return { status: "error", message: "יום השבוע אינו תקין" };
  }

  const note = String(formData.get("note") ?? "");
  const noteError = validateHourNote(note);
  if (noteError) {
    return { status: "error", message: noteError };
  }

  const payload: TablesInsert<"opening_hours"> = {
    day_of_week: day,
    is_closed: true,
    opens_at: null,
    closes_at: null,
    note: emptyToNull(note),
    sort_order: 0,
  };

  const { data: inserted, error: insertError } = await supabase
    .from("opening_hours")
    .insert(payload)
    .select("id")
    .single();

  if (insertError || !inserted) {
    return { status: "error", message: "סימון היום כסגור נכשל. נסו שוב" };
  }

  const { error: deleteError } = await supabase
    .from("opening_hours")
    .delete()
    .eq("day_of_week", day)
    .neq("id", inserted.id);

  if (deleteError) {
    return { status: "error", message: "סימון הסגירה נשמר, אך לא כל המשמרות הוסרו" };
  }

  revalidateHoursSurfaces();
  return { status: "saved", message: "היום סומן כסגור" };
}

export async function moveHourInterval(
  formData: FormData,
): Promise<HoursActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return { status: "error", message: "אין הרשאה לשנות את סדר המשמרות" };
  }

  const id = parseId(formData);
  const direction = String(formData.get("direction") ?? "");
  if (!id || (direction !== "up" && direction !== "down")) {
    return { status: "error", message: "בקשת הסידור אינה תקינה" };
  }

  const { data: existing, error: loadError } = await supabase
    .from("opening_hours")
    .select("id, day_of_week, is_closed")
    .eq("id", id)
    .maybeSingle();

  if (loadError || !existing || existing.is_closed) {
    return { status: "error", message: "לא ניתן לשנות את סדר המשמרת" };
  }

  const { data: rows, error: dayError } = await supabase
    .from("opening_hours")
    .select("id, is_closed")
    .eq("day_of_week", existing.day_of_week)
    .eq("is_closed", false)
    .order("sort_order", { ascending: true })
    .order("id", { ascending: true });

  if (dayError || !rows) {
    return { status: "error", message: "לא הצלחנו לטעון את סדר המשמרות" };
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

  const ok = await persistDayOrder(supabase, ids);
  if (!ok) {
    return { status: "error", message: "שמירת הסדר נכשלה. נסו שוב" };
  }

  revalidateHoursSurfaces();
  return { status: "saved", message: "סדר המשמרות עודכן" };
}
