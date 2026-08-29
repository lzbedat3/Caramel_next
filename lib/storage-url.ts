import { storageBuckets, type StorageBucket } from "@/config/storage";

export function getPublicStorageUrl(
  bucket: StorageBucket,
  path: string | null | undefined,
): string | null {
  if (!path) {
    return null;
  }

  const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!base) {
    return null;
  }

  const cleanPath = path.replace(/^\/+/, "");
  return `${base.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${cleanPath}`;
}

export function withCacheBust(
  url: string | null,
  version?: string | null,
): string | null {
  if (!url) {
    return null;
  }

  if (!version) {
    return url;
  }

  return `${url}${url.includes("?") ? "&" : "?"}v=${encodeURIComponent(version)}`;
}

export function isRemoteSvg(src: string): boolean {
  try {
    return new URL(src).pathname.toLowerCase().endsWith(".svg");
  } catch {
    return src.toLowerCase().endsWith(".svg");
  }
}

export { storageBuckets };
