"use client";

import { useEffect, useState } from "react";

import type { StageSize } from "@/features/pour/pour-stage";
import { formatPriceParts } from "@/lib/price";
import type { Size } from "@/lib/sizes";

const ROLL_MS = 380;

type SizePickerProps = {
  sizes: StageSize[];
  value: Size;
  label: string;
  onChange: (size: Size) => void;
};

// Three wells on a line; a drop of caramel pours from one to the next, and
// grows with the size it lands on.
export function SizePicker({ sizes, value, label, onChange }: SizePickerProps) {
  const index = Math.max(
    0,
    sizes.findIndex((entry) => entry.size === value),
  );

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    const step =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    const next = sizes[index + step];
    if (!step || !next) {
      return;
    }
    event.preventDefault();
    onChange(next.size);
    event.currentTarget
      .querySelector<HTMLElement>(`[data-size="${next.size}"]`)
      ?.focus();
  }

  return (
    <div
      className="szp"
      role="radiogroup"
      aria-label={label}
      dir="ltr"
      style={{ "--i": index } as React.CSSProperties}
      onClick={(event) => event.stopPropagation()}
      onKeyDown={onKeyDown}
    >
      <span className="szp-goo" aria-hidden="true">
        <span className="szp-trail" />
        <span className="szp-blob" />
      </span>
      {sizes.map((entry) => {
        const checked = entry.size === value;
        return (
          <button
            key={entry.size}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={checked ? 0 : -1}
            className="szp-o"
            data-size={entry.size}
            onClick={() => {
              onChange(entry.size);
              navigator.vibrate?.(8);
            }}
          >
            <u>{entry.size}</u>
            <b>{entry.price?.amount}</b>
          </button>
        );
      })}
    </div>
  );
}

function amountOf(value: number): string {
  return formatPriceParts(value)?.amount ?? "";
}

type Roll = { from: number; to: number };

/**
 * The amount to print while a price changes: it counts from the old price to
 * the new one. Null when there is no price to follow.
 */
export function useRollingAmount(target: number | null): string | null {
  const [previous, setPrevious] = useState(target);
  const [roll, setRoll] = useState<Roll | null>(null);
  const [frame, setFrame] = useState<{ roll: Roll; text: string } | null>(
    null,
  );

  // A new price starts a roll from the old one; a dish opening or closing does not.
  if (previous !== target) {
    setPrevious(target);
    setRoll(
      previous !== null && target !== null
        ? { from: previous, to: target }
        : null,
    );
  }

  useEffect(() => {
    if (!roll) {
      return;
    }
    const reduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const whole = Number.isInteger(roll.from) && Number.isInteger(roll.to);
    const began = performance.now();
    let id = 0;
    const tick = (now: number) => {
      const progress = reduced ? 1 : Math.min(1, (now - began) / ROLL_MS);
      if (progress >= 1) {
        setRoll(null);
        return;
      }
      const eased = 1 - (1 - progress) ** 3;
      const value = roll.from + (roll.to - roll.from) * eased;
      setFrame({
        roll,
        text: whole ? String(Math.round(value)) : amountOf(value),
      });
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [roll]);

  if (target === null) {
    return null;
  }
  if (!roll) {
    return amountOf(target);
  }
  // Until the first frame of a roll, the old price is still showing.
  return frame?.roll === roll ? frame.text : amountOf(roll.from);
}
