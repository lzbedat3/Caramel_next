// A dish that comes in sizes has a price for each of S, M and L; it stays one
// card on the menu and the guest picks the size.
export const SIZES = ["S", "M", "L"] as const;

export type Size = (typeof SIZES)[number];

export type SizePrices = Record<Size, number>;

type SizeColumns = {
  price_s?: number | string | null;
  price_m?: number | string | null;
  price_l?: number | string | null;
};

export function isSize(value: unknown): value is Size {
  return SIZES.includes(value as Size);
}

/** The three size prices of a row, or null for a dish with one price. */
export function sizePricesFromRow(row: SizeColumns): SizePrices | null {
  const values = [row.price_s, row.price_m, row.price_l].map((value) =>
    value === null || value === undefined ? Number.NaN : Number(value),
  );
  if (!values.every(Number.isFinite)) {
    return null;
  }
  const [S = 0, M = 0, L = 0] = values;
  return { S, M, L };
}
