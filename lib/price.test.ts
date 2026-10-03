import { describe, expect, it } from "vitest";

import { formatPriceParts } from "./price";

describe("formatPriceParts", () => {
  it("splits a whole price into symbol and amount", () => {
    expect(formatPriceParts(35)).toEqual({ symbol: "₪", amount: "35" });
  });

  it("keeps two decimals for a fractional price", () => {
    expect(formatPriceParts(12.5)).toEqual({ symbol: "₪", amount: "12.50" });
  });

  it("returns null for a value that is not a number", () => {
    expect(formatPriceParts(Number.NaN)).toBeNull();
  });
});
