import type { SizePrices } from "@/lib/sizes";

export type PublicCategory = {
  id: number;
  name: string;
  subtitle: string | null;
  imageSrc: string | null;
};

export type PublicMenuItem = {
  id: number;
  categoryId: number;
  name: string;
  shortDescription: string | null;
  price: number;
  /** S, M and L prices when the dish comes in sizes; `price` is then the small one. */
  sizes: SizePrices | null;
  imageSrc: string | null;
  isAvailable: boolean;
};
