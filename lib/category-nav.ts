export type CategorySelection = `${number}` | null;

export function parseCategoryParam(
  value: string | string[] | undefined,
): CategorySelection {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw || raw === "all") {
    return null;
  }

  if (/^\d+$/.test(raw)) {
    return raw as `${number}`;
  }

  return null;
}

export function categoryHref(id: CategorySelection): string {
  if (!id) {
    return "/";
  }

  return `/?category=${id}`;
}

export function categorySectionId(id: number | string): string {
  return `category-${id}`;
}
