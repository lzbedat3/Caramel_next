import { emptyTable, type TableState } from "./table";

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
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
    const clean: Record<number, number> = {};
    for (const id of order) {
      if (!isPositiveInteger(id) || id in clean) {
        return emptyTable;
      }
      const quantity = quantities[String(id)];
      if (!isPositiveInteger(quantity)) {
        return emptyTable;
      }
      clean[id] = quantity;
    }

    return { order: [...order] as number[], qty: clean };
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
