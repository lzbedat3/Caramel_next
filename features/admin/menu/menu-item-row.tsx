"use client";

import { StorageThumb } from "@/components/admin/storage-thumb";
import { cn } from "@/lib/cn";
import { formatPriceIls } from "@/lib/price";
import type { AdminMenuItem } from "@/services/admin-menu";

type MenuItemRowProps = {
  item: AdminMenuItem;
  open: boolean;
  disabled: boolean;
  onToggle: () => void;
  onToggleAvailability: (available: boolean) => void;
  children: React.ReactNode;
};

function Flag({
  tone,
  children,
}: {
  tone: "warn" | "quiet";
  children: string;
}) {
  return (
    <span
      className={cn(
        "rounded-pill px-2 py-0.5 text-[11px] leading-5 whitespace-nowrap",
        tone === "warn"
          ? "bg-closed-soft text-closed"
          : "bg-surface-warm text-muted",
      )}
    >
      {children}
    </span>
  );
}

// One dish as a single scannable line. The full editor opens underneath only
// for the dish being worked on, so a long menu stays a short page.
export function MenuItemRow({
  item,
  open,
  disabled,
  onToggle,
  onToggleAvailability,
  children,
}: MenuItemRowProps) {
  const untranslated = !item.name_ar?.trim() || !item.name_en?.trim();

  return (
    <div
      className={cn(
        "rounded-card bg-surface border transition-colors",
        open ? "border-caramel-soft" : "border-border",
      )}
    >
      <div className="flex items-center gap-2 ps-2 pe-3">
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className="rounded-control focus-visible:ring-ring flex min-w-0 flex-1 items-center gap-3 py-2 text-start focus-visible:ring-2 focus-visible:outline-none"
        >
          <span
            className={cn(
              "bg-surface-warm relative size-12 shrink-0 overflow-hidden rounded-[0.9rem]",
              !item.is_visible && "opacity-50",
            )}
          >
            {item.imageSrc ? (
              <StorageThumb
                src={item.imageSrc}
                alt=""
                className="object-cover"
              />
            ) : (
              <span className="text-caramel-deep flex size-full items-center justify-center text-lg">
                {item.name.trim().charAt(0) || "•"}
              </span>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span
              className={cn(
                "block truncate text-sm font-medium",
                item.is_visible ? "text-foreground" : "text-muted",
              )}
            >
              {item.name}
            </span>
            <span className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <span className="text-muted text-xs tabular-nums">
                {formatPriceIls(item.price)}
              </span>
              {item.is_visible ? null : <Flag tone="quiet">מוסתרת</Flag>}
              {item.is_available ? null : <Flag tone="warn">לא זמינה</Flag>}
              {item.imageSrc ? null : <Flag tone="quiet">בלי תמונה</Flag>}
              {untranslated ? <Flag tone="quiet">חסר תרגום</Flag> : null}
            </span>
          </span>
        </button>
        <button
          type="button"
          role="switch"
          aria-checked={item.is_available}
          aria-label={`${item.name}: זמינה להזמנה`}
          title={item.is_available ? "זמינה" : "לא זמינה"}
          disabled={disabled}
          onClick={() => onToggleAvailability(!item.is_available)}
          className={cn(
            "rounded-pill focus-visible:ring-ring relative h-6 w-10 shrink-0 transition-colors focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50",
            item.is_available ? "bg-open/70" : "bg-surface-warm",
          )}
        >
          <span
            className={cn(
              "bg-foreground absolute top-0.5 size-5 rounded-full shadow transition-[inset-inline-start]",
              item.is_available ? "start-[18px]" : "start-0.5",
            )}
          />
        </button>
        <span
          aria-hidden="true"
          className={cn(
            "text-muted shrink-0 transition-transform",
            open ? "rotate-90" : "rtl:-scale-x-100",
          )}
        >
          ›
        </span>
      </div>
      {open ? (
        <div className="border-border border-t p-2">{children}</div>
      ) : null}
    </div>
  );
}
