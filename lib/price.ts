const ILS_FORMAT_WHOLE = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const ILS_FORMAT_FRACTION = new Intl.NumberFormat("he-IL", {
  style: "currency",
  currency: "ILS",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatPriceIls(value: number | string): string {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) {
    return "";
  }

  const formatter =
    Number.isInteger(amount) ? ILS_FORMAT_WHOLE : ILS_FORMAT_FRACTION;

  return formatter.format(amount);
}

/** Symbol and amount separately, for layouts that set the currency sign smaller. */
export function formatPriceParts(
  value: number,
): { symbol: string; amount: string } | null {
  if (!Number.isFinite(value)) {
    return null;
  }

  const formatter = Number.isInteger(value)
    ? ILS_FORMAT_WHOLE
    : ILS_FORMAT_FRACTION;
  let symbol = "";
  let amount = "";
  for (const part of formatter.formatToParts(value)) {
    if (part.type === "currency") {
      symbol = part.value;
    } else if (part.type !== "literal") {
      amount += part.value;
    }
  }

  return { symbol, amount };
}
