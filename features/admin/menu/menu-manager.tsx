"use client";

import { useMemo, useState } from "react";

import { ButtonLink } from "@/components/ui/button";
import { cn } from "@/lib/cn";
import { routes } from "@/config/routes";
import { CompactImagesButton } from "@/features/admin/media/compact-images-button";
import type {
  AdminMenuCategoryOption,
  AdminMenuItem,
} from "@/services/admin-menu";

import {
  createMenuItem,
  deleteMenuItem,
  moveMenuItem,
  setMenuItemAvailability,
  setMenuItemVisibility,
  updateMenuItem,
  type MenuItemActionState,
} from "./actions";
import { MenuCreateForm } from "./menu-create-form";
import { MenuItemCard } from "./menu-item-card";
import { MenuItemRow } from "./menu-item-row";
import { menuInputClassName } from "./menu-item-fields";

const idleState: MenuItemActionState = { status: "idle", message: null };

type MenuManagerProps = {
  categories: AdminMenuCategoryOption[];
  items: AdminMenuItem[];
};

export function MenuManager({ categories, items }: MenuManagerProps) {
  const [feedback, setFeedback] = useState<MenuItemActionState>(idleState);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  // The dishes whose editor is open; kept here so a save does not fold them.
  const [openIds, setOpenIds] = useState<ReadonlySet<number>>(new Set());
  const busy = busyKey !== null;
  const selectedCategoryId =
    categoryFilter === "all" ? undefined : Number(categoryFilter);
  const defaultCategoryId =
    selectedCategoryId ??
    categories.find((category) => category.isVisible)?.id ??
    categories[0]?.id;

  const filteredGroups = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const matchingItems = items.filter((item) => {
      const matchesCategory =
        categoryFilter === "all" || String(item.category_id) === categoryFilter;
      const matchesQuery =
        needle.length === 0 ||
        [item.name, item.name_ar, item.name_en].some((name) =>
          name?.toLowerCase().includes(needle),
        );
      return matchesCategory && matchesQuery;
    });

    return categories
      .filter(
        (category) =>
          categoryFilter === "all" || String(category.id) === categoryFilter,
      )
      .map((category) => ({
        category,
        items: matchingItems.filter((item) => item.category_id === category.id),
      }))
      .filter(
        (group) =>
          group.items.length > 0 ||
          (categoryFilter !== "all" && needle.length === 0),
      );
  }, [categories, categoryFilter, items, query]);

  async function run(
    key: string,
    action: () => Promise<MenuItemActionState>,
  ): Promise<MenuItemActionState> {
    setBusyKey(key);
    setFeedback(idleState);
    try {
      const result = await action();
      setFeedback(result);
      return result;
    } finally {
      setBusyKey(null);
    }
  }

  if (categories.length === 0) {
    return (
      <div className="rounded-card border-border bg-surface border px-5 py-6">
        <p className="text-muted text-sm leading-6">
          אי אפשר להוסיף מנות לפני שיש לפחות קטגוריה אחת. צרו קטגוריה ואז חזרו
          למסך הזה.
        </p>
        <ButtonLink href={routes.adminCategories} className="mt-4">
          ניהול קטגוריות
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div aria-live="polite" className="min-h-6 text-sm">
        {busy ? (
          <p className="text-muted">מעדכן…</p>
        ) : feedback.status === "saved" && feedback.message ? (
          <p className="text-open">{feedback.message}</p>
        ) : feedback.status === "error" && feedback.message ? (
          <p role="alert" className="text-caramel-deep">
            {feedback.message}
          </p>
        ) : null}
      </div>

      <div className="rounded-card border-border bg-background/90 sticky top-[61px] z-10 -mx-1 flex flex-col gap-3 border px-3 py-3 backdrop-blur-md">
        <div className="flex gap-2">
          <input
            id="menu-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="חיפוש מנה בכל שפה"
            aria-label="חיפוש מנה"
            className={menuInputClassName}
          />
          <button
            type="button"
            aria-expanded={creating}
            onClick={() => setCreating((value) => !value)}
            className="rounded-control text-espresso focus-visible:ring-ring shrink-0 bg-[image:var(--gloss-caramel)] px-4 text-sm font-semibold whitespace-nowrap shadow-[var(--shadow-gloss)] transition hover:brightness-105 focus-visible:ring-2 focus-visible:outline-none"
          >
            {creating ? "סגירה" : "מנה חדשה"}
          </button>
        </div>
        <div
          role="group"
          aria-label="סינון לפי קטגוריה"
          className="-mx-1 flex [scrollbar-width:none] gap-1.5 overflow-x-auto px-1 pb-0.5"
        >
          {[
            { id: "all", name: "הכול", count: items.length, hidden: false },
            ...categories.map((category) => ({
              id: String(category.id),
              name: category.name,
              count: items.filter((item) => item.category_id === category.id)
                .length,
              hidden: !category.isVisible,
            })),
          ].map((chip) => (
            <button
              key={chip.id}
              type="button"
              aria-pressed={categoryFilter === chip.id}
              onClick={() => setCategoryFilter(chip.id)}
              className={cn(
                "rounded-pill focus-visible:ring-ring flex shrink-0 items-center gap-1.5 border px-3 py-1.5 text-sm transition focus-visible:ring-2 focus-visible:outline-none",
                categoryFilter === chip.id
                  ? "border-caramel-soft bg-caramel-soft/30 text-caramel-deep"
                  : "border-border text-muted hover:text-foreground",
                chip.hidden && "opacity-60",
              )}
            >
              {chip.name}
              <span className="text-xs tabular-nums opacity-70">
                {chip.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {creating ? (
        <MenuCreateForm
          categories={categories}
          defaultCategoryId={defaultCategoryId}
          disabled={busy}
          onCreate={async (formData) => {
            const result = await run("create", () => createMenuItem(formData));
            if (result.status === "saved") {
              setCreating(false);
            }
            return result;
          }}
        />
      ) : null}

      {items.length === 0 ? (
        <p className="rounded-card border-border bg-surface text-muted border px-5 py-6 text-sm leading-6">
          אין מנות עדיין. הוסיפו מנה כדי שתופיע בתפריט הציבורי.
        </p>
      ) : filteredGroups.length === 0 ? (
        <p className="rounded-card border-border bg-surface text-muted border px-5 py-6 text-sm leading-6">
          לא נמצאו מנות לפי הסינון הנוכחי.
        </p>
      ) : (
        <div className="flex flex-col gap-8">
          {filteredGroups.map((group) => {
            const categoryItems = items.filter(
              (item) => item.category_id === group.category.id,
            );

            return (
              <section key={group.category.id} className="flex flex-col gap-3">
                <h2 className="text-caramel-deep text-sm font-medium">
                  {group.category.name}
                  {!group.category.isVisible ? " · מוסתרת" : ""}
                </h2>
                {group.items.length === 0 ? (
                  <p className="rounded-card border-border bg-surface text-muted border px-5 py-5 text-sm">
                    אין מנות בקטגוריה הזו.
                  </p>
                ) : (
                  <ul
                    className="flex flex-col gap-2"
                    aria-label={`מנות ב${group.category.name}`}
                  >
                    {group.items.map((item) => {
                      const indexInCategory = categoryItems.findIndex(
                        (candidate) => candidate.id === item.id,
                      );

                      return (
                        <li key={item.id}>
                          <MenuItemRow
                            item={item}
                            open={openIds.has(item.id)}
                            disabled={busy}
                            onToggle={() =>
                              setOpenIds((current) => {
                                const next = new Set(current);
                                if (!next.delete(item.id)) {
                                  next.add(item.id);
                                }
                                return next;
                              })
                            }
                            onToggleAvailability={(available) => {
                              const formData = new FormData();
                              formData.set("id", String(item.id));
                              if (available) {
                                formData.set("is_available", "on");
                              }
                              void run(`available-${item.id}`, () =>
                                setMenuItemAvailability(formData),
                              );
                            }}
                          >
                            <MenuItemCard
                              key={`${item.id}-${item.updated_at}`}
                              item={item}
                              categories={categories}
                              isFirst={indexInCategory <= 0}
                              isLast={
                                indexInCategory === categoryItems.length - 1
                              }
                              disabled={busy}
                              onUpdate={(formData) =>
                                run(`save-${item.id}`, () =>
                                  updateMenuItem(formData),
                                )
                              }
                              onDelete={(formData) =>
                                run(`delete-${item.id}`, () =>
                                  deleteMenuItem(formData),
                                )
                              }
                              onMove={(direction) => {
                                const formData = new FormData();
                                formData.set("id", String(item.id));
                                formData.set("direction", direction);
                                return run(`move-${item.id}`, () =>
                                  moveMenuItem(formData),
                                );
                              }}
                              onToggleVisibility={(visible) => {
                                const formData = new FormData();
                                formData.set("id", String(item.id));
                                if (visible) {
                                  formData.set("is_visible", "on");
                                }
                                return run(`visible-${item.id}`, () =>
                                  setMenuItemVisibility(formData),
                                );
                              }}
                              onToggleAvailability={(available) => {
                                const formData = new FormData();
                                formData.set("id", String(item.id));
                                if (available) {
                                  formData.set("is_available", "on");
                                }
                                return run(`available-${item.id}`, () =>
                                  setMenuItemAvailability(formData),
                                );
                              }}
                            />
                          </MenuItemRow>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
      )}

      <details className="rounded-card border-border bg-surface border">
        <summary className="text-muted focus-visible:ring-ring cursor-pointer list-none px-5 py-3 text-sm focus-visible:ring-2 focus-visible:outline-none [&::-webkit-details-marker]:hidden">
          כלים
        </summary>
        <div className="px-2 pb-2">
          <CompactImagesButton />
        </div>
      </details>
    </div>
  );
}
