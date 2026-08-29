export function isSafeInternalPath(path: string): boolean {
  if (!path.startsWith("/") || path.startsWith("//") || path.startsWith("/\\")) {
    return false;
  }

  if (path.includes("\\") || path.includes("@") || /[\u0000-\u001f]/.test(path)) {
    return false;
  }

  try {
    const parsed = new URL(path, "https://caramel.invalid");
    if (parsed.origin !== "https://caramel.invalid") {
      return false;
    }
    if (parsed.username || parsed.password) {
      return false;
    }
    return parsed.pathname.startsWith("/");
  } catch {
    return false;
  }
}

export function getSafeRedirectPath(
  path: string | null | undefined,
  fallback: string,
): string {
  if (path && isSafeInternalPath(path)) {
    return path;
  }

  return fallback;
}
