import { getSiteUrl } from "@/config/site";

export function getTrustedOrigin(request: Request): string {
  if (process.env.NODE_ENV === "development") {
    return new URL(request.url).origin;
  }

  return getSiteUrl();
}
