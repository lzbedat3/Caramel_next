import { describe, expect, it } from "vitest";

import { ar } from "./ar";
import { en } from "./en";
import { he } from "./he";
import { format, getDictionary } from "./index";

describe("dictionaries", () => {
  it("have identical keys in every locale", () => {
    expect(Object.keys(ar).sort()).toEqual(Object.keys(he).sort());
    expect(Object.keys(en).sort()).toEqual(Object.keys(he).sort());
  });

  it("have no empty strings", () => {
    for (const dictionary of [he, ar, en]) {
      for (const value of Object.values(dictionary)) {
        expect(value.trim()).not.toBe("");
      }
    }
  });

  it("fall back to Hebrew for an unknown locale", () => {
    expect(getDictionary("xx")).toBe(he);
  });

  it("fills placeholders", () => {
    expect(format("© {year} {name}", { year: 2026, name: "X" })).toBe(
      "© 2026 X",
    );
  });
});
