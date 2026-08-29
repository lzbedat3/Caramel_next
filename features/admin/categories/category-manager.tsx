"use client";

import { useState } from "react";

import type { AdminCategory } from "@/services/admin-categories";

import {
  createCategory,
  deleteCategory,
  moveCategory,
  setCategoryVisibility,
  updateCategory,
  type CategoryActionState,
} from "./actions";
import { CategoryCreateForm } from "./category-create-form";
import { CategoryItemCard } from "./category-item-card";

const idleState: CategoryActionState = { status: "idle", message: null };

type CategoryManagerProps = {
  categories: AdminCategory[];
};

export function CategoryManager({ categories }: CategoryManagerProps) {
  const [feedback, setFeedback] = useState<CategoryActionState>(idleState);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const busy = busyKey !== null;

  async function run(
    key: string,
    action: () => Promise<CategoryActionState>,
  ): Promise<CategoryActionState> {
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

      <CategoryCreateForm
        disabled={busy}
        onCreate={(formData) => run("create", () => createCategory(formData))}
      />

      {categories.length === 0 ? (
        <p className="rounded-card border border-border bg-surface px-5 py-6 text-sm leading-6 text-muted">
          אין קטגוריות עדיין. הוסיפו קטגוריה כדי שתופיע ברכבת התפריט באתר.
        </p>
      ) : (
        <ul className="flex flex-col gap-4" aria-label="רשימת קטגוריות">
          {categories.map((category, index) => (
            <li key={category.id}>
              <CategoryItemCard
                key={`${category.id}-${category.updated_at}`}
                category={category}
                isFirst={index === 0}
                isLast={index === categories.length - 1}
                disabled={busy}
                onUpdate={(formData) =>
                  run(`save-${category.id}`, () => updateCategory(formData))
                }
                onDelete={(formData) =>
                  run(`delete-${category.id}`, () => deleteCategory(formData))
                }
                onMove={(direction) => {
                  const formData = new FormData();
                  formData.set("id", String(category.id));
                  formData.set("direction", direction);
                  return run(`move-${category.id}`, () =>
                    moveCategory(formData),
                  );
                }}
                onToggleVisibility={(visible) => {
                  const formData = new FormData();
                  formData.set("id", String(category.id));
                  if (visible) {
                    formData.set("is_visible", "on");
                  }
                  return run(`visible-${category.id}`, () =>
                    setCategoryVisibility(formData),
                  );
                }}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
