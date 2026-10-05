"use server";

import { revalidatePath } from "next/cache";

import { isSupabaseConfigured } from "@/config/env";
import { isLocale } from "@/config/locales";
import { parseReviewInput, type PublicReview } from "@/lib/reviews";
import { createPublicClient } from "@/lib/supabase/public";

export type ReviewFormState = {
  status: "idle" | "saved" | "invalid" | "error";
  /** The review as stored, so the page can show it straight away. */
  review?: PublicReview;
};

// Reviews need no sign-in, so these keep the obvious abuse out: a field only
// bots fill, a form sent faster than a person can type, and a cap on how many
// reviews the whole site accepts in a short window.
const MIN_FILL_MS = 2500;
const FLOOD_WINDOW_MS = 10 * 60 * 1000;
const FLOOD_LIMIT = 8;

export async function submitReview(
  _previous: ReviewFormState,
  formData: FormData,
): Promise<ReviewFormState> {
  if (!isSupabaseConfigured()) {
    return { status: "error" };
  }

  const input = parseReviewInput(formData);
  if (!input) {
    return { status: "invalid" };
  }

  // A bot gets the same "thank you" as a guest and nothing is stored.
  const started = Number(formData.get("started"));
  const tooFast =
    !Number.isFinite(started) || Date.now() - started < MIN_FILL_MS;
  if (String(formData.get("website") ?? "") !== "" || tooFast) {
    return { status: "saved" };
  }

  try {
    const supabase = createPublicClient();
    const since = new Date(Date.now() - FLOOD_WINDOW_MS).toISOString();
    const { count } = await supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .gte("created_at", since);
    if ((count ?? 0) >= FLOOD_LIMIT) {
      return { status: "error" };
    }

    const locale = String(formData.get("locale") ?? "");
    const locationId = Number(formData.get("location_id"));
    const createdAt = new Date().toISOString();
    const { error } = await supabase.from("reviews").insert({
      ...input,
      locale: isLocale(locale) ? locale : null,
      location_id:
        Number.isInteger(locationId) && locationId > 0 ? locationId : null,
      created_at: createdAt,
    });
    if (error) {
      return { status: "error" };
    }

    revalidatePath("/", "layout");
    return {
      status: "saved",
      // The guest's own copy; the stored row gets its real id on the next load.
      review: { id: -Date.now(), ...input, createdAt },
    };
  } catch {
    return { status: "error" };
  }
}
