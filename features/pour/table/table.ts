import { isSize, type Size } from "@/lib/sizes";

// One line per dish, or per dish and size: "12" or "12:L".
export type LineKey = string;

export type TableState = { order: LineKey[]; qty: Record<LineKey, number> };

export type TableAction =
  | { type: "add"; key: LineKey }
  | { type: "step"; key: LineKey; by: 1 | -1 }
  | { type: "replace"; state: TableState };

export const emptyTable: TableState = { order: [], qty: {} };

const LINE_KEY_RE = /^[1-9]\d*(:[SML])?$/;

export function lineKey(id: number, size: Size | null = null): LineKey {
  return size ? `${id}:${size}` : String(id);
}

export function parseLineKey(
  key: string,
): { id: number; size: Size | null } | null {
  if (!LINE_KEY_RE.test(key)) {
    return null;
  }
  const [id = "", size] = key.split(":");
  return { id: Number(id), size: isSize(size) ? size : null };
}

function withQuantity(
  state: TableState,
  key: LineKey,
  quantity: number,
): TableState {
  if (quantity < 1) {
    const qty = { ...state.qty };
    delete qty[key];
    return { order: state.order.filter((entry) => entry !== key), qty };
  }

  return {
    order: state.order.includes(key) ? state.order : [...state.order, key],
    qty: { ...state.qty, [key]: quantity },
  };
}

export function tableReducer(
  state: TableState,
  action: TableAction,
): TableState {
  switch (action.type) {
    case "add":
      return withQuantity(state, action.key, (state.qty[action.key] ?? 0) + 1);
    case "step":
      if (!(action.key in state.qty)) {
        return state;
      }
      return withQuantity(
        state,
        action.key,
        (state.qty[action.key] ?? 0) + action.by,
      );
    case "replace":
      return action.state;
  }
}

// A stored table may name dishes that were since deleted, hidden or marked
// unavailable, or a size the dish no longer comes in.
export function reconcile(
  state: TableState,
  menu: { id: number; isAvailable: boolean; sized: boolean }[],
): TableState {
  // An empty menu means the backend did not answer; the table is kept for the next visit.
  if (menu.length === 0) {
    return state;
  }

  const orderable = new Set<LineKey>();
  for (const dish of menu) {
    if (!dish.isAvailable) {
      continue;
    }
    if (dish.sized) {
      orderable.add(lineKey(dish.id, "S"));
      orderable.add(lineKey(dish.id, "M"));
      orderable.add(lineKey(dish.id, "L"));
    } else {
      orderable.add(lineKey(dish.id));
    }
  }
  const order = state.order.filter((key) => orderable.has(key));
  const qty: Record<LineKey, number> = {};
  for (const key of order) {
    qty[key] = state.qty[key] ?? 1;
  }
  return { order, qty };
}

export function totals(
  state: TableState,
  price: (key: LineKey) => number,
): { count: number; total: number } {
  let count = 0;
  let total = 0;
  for (const key of state.order) {
    const quantity = state.qty[key] ?? 0;
    count += quantity;
    total += quantity * price(key);
  }
  return { count, total };
}
