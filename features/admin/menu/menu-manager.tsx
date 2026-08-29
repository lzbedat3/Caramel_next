"use client";

import { useMemo, useState } from "react";

import { ButtonLink } from "@/components/ui/button";
import { routes } from "@/config/routes";
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
        needle.length === 0 || item.name.toLowerCase().includes(needle);
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
      <div className="rounded-card border border-border bg-surface px-5 py-6">
        <p className="text-sm leading-6 text-muted">
          אי אפשר להוסיף מנות לפני שיש לפחות קטגוריה אחת. צרו קטגוריה ואז
          חזרו למסך הזה.
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

      <MenuCreateForm
        categories={categories}
        defaultCategoryId={defaultCategoryId}
        disabled={busy}
        onCreate={(formData) => run("create", () => createMenuItem(formData))}
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="menu-category-filter" className="text-sm font-medium">
            סינון לפי קטגוריה
          </label>
          <select
            id="menu-category-filter"
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className={menuInputClassName}
          >
            <option value="all">כל הקטגוריות</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.isVisible ? category.name : `${category.name} (מוסתרת)`}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="menu-search" className="text-sm font-medium">
            חיפוש לפי שם
          </label>
          <input
            id="menu-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="לדוגמה: פסטה"
            className={menuInputClassName}
          />
        </div>
      </div>

      {items.length === 0 ? (
        <p className="rounded-card border border-border bg-surface px-5 py-6 text-sm leading-6 text-muted">
          אין מנות עדיין. הוסיפו מנה כדי שתופיע בתפריט הציבורי.
        </p>
      ) : filteredGroups.length === 0 ? (
        <p className="rounded-card border border-border bg-surface px-5 py-6 text-sm leading-6 text-muted">
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
                <h2 className="text-sm font-medium text-caramel-deep">
                  {group.category.name}
                  {!group.category.isVisible ? " · מוסתרת" : ""}
                </h2>
                {group.items.length === 0 ? (
                  <p className="rounded-card border border-border bg-surface px-5 py-5 text-sm text-muted">
                    אין מנות בקטגוריה הזו.
                  </p>
                ) : (
                  <ul
                    className="flex flex-col gap-4"
                    aria-label={`מנות ב${group.category.name}`}
                  >
                    {group.items.map((item) => {
                      const indexInCategory = categoryItems.findIndex(
                        (candidate) => candidate.id === item.id,
                      );

                      return (
                        <li key={item.id}>
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
    </div>
  );
}
