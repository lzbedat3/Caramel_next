import { describe, expect, it } from "vitest";

import { parseStored } from "./storage";
import {
  emptyTable,
  lineKey,
  parseLineKey,
  reconcile,
  tableReducer,
  totals,
} from "./table";

describe("tableReducer", () => {
  it("adds a dish once and then increments it", () => {
    let state = tableReducer(emptyTable, { type: "add", key: "7" });
    state = tableReducer(state, { type: "add", key: "7" });
    expect(state).toEqual({ order: ["7"], qty: { 7: 2 } });
  });

  it("keeps insertion order", () => {
    let state = tableReducer(emptyTable, { type: "add", key: "7" });
    state = tableReducer(state, { type: "add", key: "3" });
    expect(state.order).toEqual(["7", "3"]);
  });

  it("keeps each size of a dish on its own line", () => {
    let state = tableReducer(emptyTable, { type: "add", key: "7:S" });
    state = tableReducer(state, { type: "add", key: "7:L" });
    state = tableReducer(state, { type: "add", key: "7:L" });
    expect(state).toEqual({
      order: ["7:S", "7:L"],
      qty: { "7:S": 1, "7:L": 2 },
    });
  });

  it("removes a dish when stepped to zero", () => {
    let state = tableReducer(emptyTable, { type: "add", key: "7" });
    state = tableReducer(state, { type: "step", key: "7", by: -1 });
    expect(state).toEqual(emptyTable);
  });

  it("ignores a step on a dish that is not on the table", () => {
    expect(
      tableReducer(emptyTable, { type: "step", key: "9", by: 1 }),
    ).toEqual(emptyTable);
  });

  it("replaces the whole table", () => {
    const next = { order: ["2"], qty: { 2: 5 } };
    expect(tableReducer(emptyTable, { type: "replace", state: next })).toEqual(
      next,
    );
  });
});

describe("line keys", () => {
  it("round-trips a dish with and without a size", () => {
    expect(lineKey(12)).toBe("12");
    expect(lineKey(12, "M")).toBe("12:M");
    expect(parseLineKey("12")).toEqual({ id: 12, size: null });
    expect(parseLineKey("12:M")).toEqual({ id: 12, size: "M" });
  });

  it("rejects anything else", () => {
    for (const key of ["", "0", "12:X", "12:", "a", "1.5", "12:M:L"]) {
      expect(parseLineKey(key)).toBeNull();
    }
  });
});

describe("reconcile", () => {
  const menu = [
    { id: 1, isAvailable: true, sized: false },
    { id: 2, isAvailable: false, sized: false },
    { id: 4, isAvailable: true, sized: true },
  ];

  it("drops dishes that are gone or unavailable", () => {
    expect(
      reconcile({ order: ["1", "2", "3"], qty: { 1: 2, 2: 1, 3: 4 } }, menu),
    ).toEqual({ order: ["1"], qty: { 1: 2 } });
  });

  it("drops a size line once the dish has one price, and a plain line once it has sizes", () => {
    const sizedNow = [{ id: 1, isAvailable: true, sized: true }];
    expect(reconcile({ order: ["1"], qty: { 1: 1 } }, sizedNow)).toEqual(
      emptyTable,
    );
    expect(
      reconcile(
        { order: ["4:L", "4", "1:S"], qty: { "4:L": 2, 4: 1, "1:S": 1 } },
        menu,
      ),
    ).toEqual({ order: ["4:L"], qty: { "4:L": 2 } });
  });
});

describe("totals", () => {
  it("uses current prices", () => {
    expect(
      totals({ order: ["1", "2:L"], qty: { 1: 2, "2:L": 1 } }, (key) =>
        key === "1" ? 50 : 8,
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
      '{"order":[1,"1"],"qty":{"1":2}}',
      '{"order":["1:X"],"qty":{"1:X":2}}',
    ]) {
      expect(parseStored(raw)).toEqual(emptyTable);
    }
  });

  it("keeps a valid table", () => {
    expect(
      parseStored('{"order":["4","5:L"],"qty":{"4":3,"5:L":1}}'),
    ).toEqual({
      order: ["4", "5:L"],
      qty: { 4: 3, "5:L": 1 },
    });
  });

  it("reads a table saved before sizes, with numeric ids", () => {
    expect(parseStored('{"order":[4],"qty":{"4":3}}')).toEqual({
      order: ["4"],
      qty: { 4: 3 },
    });
  });
});

describe("reconcile with an empty menu", () => {
  it("keeps the stored table when the menu failed to load", () => {
    const stored = { order: ["1", "2"], qty: { 1: 2, 2: 1 } };
    expect(reconcile(stored, [])).toBe(stored);
  });
});
