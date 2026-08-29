import { SOCIAL_PLATFORMS, type SocialPlatform } from "@/lib/social";

const URL_MAX_LENGTH = 2048;

export function isSocialPlatform(value: string): value is SocialPlatform {
  return (SOCIAL_PLATFORMS as readonly string[]).includes(value);
}

export function normalizeSocialUrl(raw: string): string {
  return raw.trim();
}

export function validateSocialUrl(raw: string): string | null {
  const trimmed = normalizeSocialUrl(raw);

  if (!trimmed) {
    return "יש להזין קישור";
  }

  if (trimmed.length > URL_MAX_LENGTH) {
    return "הקישור ארוך מדי";
  }

  if (/\s/.test(trimmed)) {
    return "הקישור אינו תקין";
  }

  if (!/^https?:\/\//i.test(trimmed)) {
    return "הקישור חייב להתחיל ב-http:// או https://";
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return "הקישור חייב להתחיל ב-http:// או https://";
    }

    if (!parsed.hostname) {
      return "הקישור אינו תקין";
    }
  } catch {
    return "הקישור אינו תקין";
  }

  return null;
}

export type SocialFieldErrors = Partial<Record<"platform" | "url", string>>;

export function validateSocialLink(input: {
  platform: string;
  url: string;
}): SocialFieldErrors {
  const errors: SocialFieldErrors = {};

  if (!isSocialPlatform(input.platform)) {
    errors.platform = "יש לבחור פלטפורמה";
  }

  const urlError = validateSocialUrl(input.url);
  if (urlError) {
    errors.url = urlError;
  }

  return errors;
}

export function firstSocialError(errors: SocialFieldErrors): string | null {
  return errors.platform ?? errors.url ?? null;
}
