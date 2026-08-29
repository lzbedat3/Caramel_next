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
  imageSrc: string | null;
  isAvailable: boolean;
};
