"use client";

import { useEffect, useRef, useState } from "react";

import type { StageDish } from "@/features/pour/pour-stage";
import type { TableState } from "@/features/pour/table/table";
import type { Dictionary } from "@/lib/i18n";
import { formatPriceParts } from "@/lib/price";

type MyTableProps = {
  table: TableState;
  total: number;
  count: number;
  dishById: (id: number) => StageDish | undefined;
  strings: Dictionary;
  sheetOpen: boolean;
  onOpen: () => void;
  onClose: () => void;
  onStep: (id: number, by: 1 | -1) => void;
};

function priceLabel(value: number): string {
  const parts = formatPriceParts(value);
  return parts ? `${parts.symbol}${parts.amount}` : "";
}

function Thumb({ dish }: { dish: StageDish | undefined }) {
  if (!dish?.thumb) {
    return null;
  }
  // eslint-disable-next-line @next/next/no-img-element
  return <img alt="" src={dish.thumb.src} srcSet={dish.thumb.srcSet} />;
}

// The pill at the bottom, the table sheet, and its large-print summary.
export function MyTable({
  table,
  total,
  count,
  dishById,
  strings,
  sheetOpen,
  onOpen,
  onClose,
  onStep,
}: MyTableProps) {
  const [summary, setSummary] = useState(false);
  const dock = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);

  // The pill jumps a little each time a dish lands in it.
  useEffect(() => {
    const el = dock.current;
    if (el && count > lastCount.current) {
      el.classList.remove("bump");
      void el.offsetWidth;
      el.classList.add("bump");
    }
    lastCount.current = count;
  }, [count]);

  function close() {
    setSummary(false);
    onClose();
  }

  return (
    <>
      <div id="ct-dock" ref={dock}>
        <button
          id="ct-open"
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
        >
          <span className="st">
            {table.order.slice(-4).map((id) => (
              <span key={id}>
                <Thumb dish={dishById(id)} />
              </span>
            ))}
          </span>
          <span>{strings.myTable}</span>
          <span className="n">{priceLabel(total)}</span>
        </button>
      </div>
      <section
        id="ct-sheet"
        className={summary ? "w" : undefined}
        aria-label={strings.myTable}
        aria-hidden={!sheetOpen}
        inert={!sheetOpen}
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <h3>{summary ? strings.summary : strings.myTable}</h3>
          <button
            id="ct-x"
            type="button"
            aria-label={strings.close}
            onClick={close}
          />
        </header>
        <div id="ct-rows">
          {table.order.map((id) => {
            const dish = dishById(id);
            const quantity = table.qty[id] ?? 0;
            if (!dish) {
              return null;
            }
            return (
              <div className="ct-row" key={id}>
                <span className="ct-th">
                  <Thumb dish={dish} />
                </span>
                <b>{dish.name}</b>
                <span className="ct-q">
                  <button
                    type="button"
                    aria-label={strings.decrease}
                    onClick={() => onStep(id, -1)}
                  >
                    −
                  </button>
                  <span>{quantity}</span>
                  <button
                    type="button"
                    aria-label={strings.increase}
                    onClick={() => onStep(id, 1)}
                  >
                    +
                  </button>
                </span>
                <span className="ct-p" dir="ltr">
                  {priceLabel(dish.value * quantity)}
                </span>
              </div>
            );
          })}
        </div>
        <div className="ct-sum">
          <span>{strings.total}</span>
          <span>{priceLabel(total)}</span>
        </div>
        <button
          id="ct-w"
          type="button"
          onClick={() => setSummary((value) => !value)}
        >
          {summary ? strings.backToTable : strings.summary}
        </button>
      </section>
    </>
  );
}
