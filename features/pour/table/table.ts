export type TableState = { order: number[]; qty: Record<number, number> };

export type TableAction =
  | { type: "add"; id: number }
  | { type: "step"; id: number; by: 1 | -1 }
  | { type: "replace"; state: TableState };

export const emptyTable: TableState = { order: [], qty: {} };

function withQuantity(
  state: TableState,
  id: number,
  quantity: number,
): TableState {
  if (quantity < 1) {
    const qty = { ...state.qty };
    delete qty[id];
    return { order: state.order.filter((entry) => entry !== id), qty };
  }

  return {
    order: state.order.includes(id) ? state.order : [...state.order, id],
    qty: { ...state.qty, [id]: quantity },
  };
}

export function tableReducer(
  state: TableState,
  action: TableAction,
): TableState {
  switch (action.type) {
    case "add":
      return withQuantity(state, action.id, (state.qty[action.id] ?? 0) + 1);
    case "step":
      if (!(action.id in state.qty)) {
        return state;
      }
      return withQuantity(
        state,
        action.id,
        (state.qty[action.id] ?? 0) + action.by,
      );
    case "replace":
      return action.state;
  }
}

// A stored table may name dishes that were since deleted, hidden or marked unavailable.
export function reconcile(
  state: TableState,
  menu: { id: number; isAvailable: boolean }[],
): TableState {
  const orderable = new Set(
    menu.filter((dish) => dish.isAvailable).map((dish) => dish.id),
  );
  const order = state.order.filter((id) => orderable.has(id));
  const qty: Record<number, number> = {};
  for (const id of order) {
    qty[id] = state.qty[id] ?? 1;
  }
  return { order, qty };
}

export function totals(
  state: TableState,
  price: (id: number) => number,
): { count: number; total: number } {
  let count = 0;
  let total = 0;
  for (const id of state.order) {
    const quantity = state.qty[id] ?? 0;
    count += quantity;
    total += quantity * price(id);
  }
  return { count, total };
}
