export const storageBuckets = {
  menuItems: "menu-items",
  categories: "categories",
  hero: "hero",
  branding: "branding",
} as const;

export type StorageBucket = (typeof storageBuckets)[keyof typeof storageBuckets];
