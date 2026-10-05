export const REVIEW_NAME_MIN = 2;
export const REVIEW_NAME_MAX = 60;
export const REVIEW_CITY_MAX = 60;
export const REVIEW_MESSAGE_MAX = 600;

// A review as the public menu shows it.
export type PublicReview = {
  id: number;
  name: string;
  rating: number;
  message: string | null;
  city: string | null;
  createdAt: string;
};

export type PublicReviews = {
  /** Average of every visible review, to one decimal; null when there are none. */
  average: number | null;
  count: number;
  latest: PublicReview[];
};

export const emptyReviews: PublicReviews = {
  average: null,
  count: 0,
  latest: [],
};

export type ReviewInput = {
  name: string;
  rating: number;
  message: string | null;
  city: string | null;
};

// What a guest typed, cleaned up; null when it cannot be accepted.
export function parseReviewInput(formData: FormData): ReviewInput | null {
  const text = (key: string) =>
    String(formData.get(key) ?? "")
      .replace(/\s+/g, " ")
      .trim();
  const name = text("name");
  const rating = Number(formData.get("rating"));
  const message = String(formData.get("message") ?? "").trim();
  const city = text("city");

  if (
    name.length < REVIEW_NAME_MIN ||
    name.length > REVIEW_NAME_MAX ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5 ||
    message.length > REVIEW_MESSAGE_MAX ||
    city.length > REVIEW_CITY_MAX
  ) {
    return null;
  }

  return { name, rating, message: message || null, city: city || null };
}
