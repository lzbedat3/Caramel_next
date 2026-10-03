import { describe, expect, it } from "vitest";

import { parseStored } from "./storage";
import { emptyTable, reconcile, tableReducer, totals } from "./table";

describe("tableReducer", () => {
  it("adds a dish once and then increments it", () => {
    let state = tableReducer(emptyTable, { type: "add", id: 7 });
    state = tableReducer(state, { type: "add", id: 7 });
    expect(state).toEqual({ order: [7], qty: { 7: 2 } });
  });

  it("keeps insertion order", () => {
    let state = tableReducer(emptyTable, { type: "add", id: 7 });
    state = tableReducer(state, { type: "add", id: 3 });
    expect(state.order).toEqual([7, 3]);
  });

  it("removes a dish when stepped to zero", () => {
    let state = tableReducer(emptyTable, { type: "add", id: 7 });
    state = tableReducer(state, { type: "step", id: 7, by: -1 });
    expect(state).toEqual(emptyTable);
  });

  it("ignores a step on a dish that is not on the table", () => {
    expect(tableReducer(emptyTable, { type: "step", id: 9, by: 1 })).toEqual(
      emptyTable,
    );
  });

  it("replaces the whole table", () => {
    const next = { order: [2], qty: { 2: 5 } };
    expect(tableReducer(emptyTable, { type: "replace", state: next })).toEqual(
      next,
    );
  });
});

describe("reconcile", () => {
  const menu = [
    { id: 1, isAvailable: true },
    { id: 2, isAvailable: false },
  ];

  it("drops dishes that are gone or unavailable", () => {
    expect(
      reconcile({ order: [1, 2, 3], qty: { 1: 2, 2: 1, 3: 4 } }, menu),
    ).toEqual({ order: [1], qty: { 1: 2 } });
  });
});

describe("totals", () => {
  it("uses current prices", () => {
    expect(
      totals({ order: [1, 2], qty: { 1: 2, 2: 1 } }, (id) =>
        id === 1 ? 50 : 8,
      ),
    ).toEqual({ count: 3, total: 108 });
  });
});

describe("parseStored", () => {
  it("returns an empty table for null, junk and wrong shapes", () => {
    for (const raw of [
      null,
      "",
      "{",
      "42",
      '{"order":"x"}',
      '{"order":[1],"qty":{"1":-2}}',
      '{"order":[1.5],"qty":{"1.5":1}}',
      '{"order":[1,1],"qty":{"1":2}}',
    ]) {
      expect(parseStored(raw)).toEqual(emptyTable);
    }
  });

  it("keeps a valid table", () => {
    expect(parseStored('{"order":[4],"qty":{"4":3}}')).toEqual({
      order: [4],
      qty: { 4: 3 },
    });
  });
});

describe("reconcile with an empty menu", () => {
  it("keeps the stored table when the menu failed to load", () => {
    const stored = { order: [1, 2], qty: { 1: 2, 2: 1 } };
    expect(reconcile(stored, [])).toBe(stored);
  });
});
