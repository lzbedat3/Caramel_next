import { emptyTable, parseLineKey, type TableState } from "./table";

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

// Tables saved before sizes existed list bare dish ids as numbers.
function toLineKey(value: unknown): string | null {
  if (isPositiveInteger(value)) {
    return String(value);
  }
  return typeof value === "string" && parseLineKey(value) ? value : null;
}

export function parseStored(raw: string | null): TableState {
  if (!raw) {
    return emptyTable;
  }

  try {
    const data: unknown = JSON.parse(raw);
    if (typeof data !== "object" || data === null) {
      return emptyTable;
    }

    const { order, qty } = data as { order?: unknown; qty?: unknown };
    if (!Array.isArray(order) || typeof qty !== "object" || qty === null) {
      return emptyTable;
    }

    const quantities = qty as Record<string, unknown>;
    const keys: string[] = [];
    const clean: Record<string, number> = {};
    for (const entry of order) {
      const key = toLineKey(entry);
      if (!key || key in clean) {
        return emptyTable;
      }
      const quantity = quantities[key];
      if (!isPositiveInteger(quantity)) {
        return emptyTable;
      }
      keys.push(key);
      clean[key] = quantity;
    }

    return { order: keys, qty: clean };
  } catch {
    return emptyTable;
  }
}

export function loadTable(key: string): TableState {
  try {
    return parseStored(window.localStorage.getItem(key));
  } catch {
    // Storage may be unavailable in private mode; the table then lives in memory only.
    return emptyTable;
  }
}

export function saveTable(key: string, state: TableState): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(state));
  } catch {
    /* Nothing to do: the table keeps working for this visit. */
  }
}
