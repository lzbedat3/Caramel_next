"use client";

import { useReducedMotion } from "motion/react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { CategoryNav } from "@/features/public/categories/category-nav";
import { Menu } from "@/features/public/menu/menu";
import {
  categoryHref,
  type CategorySelection,
} from "@/lib/category-nav";
import {
  cancelAnimatedScroll,
  getActiveCategoryFromScroll,
  isProgrammaticPageScroll,
  scrollChipInRail,
  scrollToCategorySection,
} from "@/lib/category-scroll";
import { buildMenuSections, visibleMenuSections } from "@/lib/menu";
import type { PublicCategory, PublicMenuItem } from "@/lib/public-content";

type PublicBrowseProps = {
  categories: PublicCategory[];
  menuItems: PublicMenuItem[];
  selectedCategory: CategorySelection;
};

export function PublicBrowse({
  categories,
  menuItems,
  selectedCategory,
}: PublicBrowseProps) {
  const reduceMotion = useReducedMotion();
  const [selected, setSelected] = useState<CategorySelection>(selectedCategory);
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const sections = useMemo(
    () => buildMenuSections(categories, menuItems),
    [categories, menuItems],
  );
  const visibleIds = useMemo(
    () =>
      visibleMenuSections(sections).map((section) => String(section.category.id)),
    [sections],
  );
  const validIds = new Set(categories.map((category) => String(category.id)));
  const active =
    selected && validIds.has(selected) ? selected : null;

  const applySelection = useCallback(
    (id: NonNullable<CategorySelection>) => {
      selectedRef.current = id;
      setSelected(id);
      window.history.replaceState(window.history.state, "", categoryHref(id));
      scrollChipInRail(id, Boolean(reduceMotion));
    },
    [reduceMotion],
  );

  function select(id: NonNullable<CategorySelection>) {
    applySelection(id);
    requestAnimationFrame(() => {
      scrollToCategorySection(id, Boolean(reduceMotion));
    });
  }

  useEffect(() => {
    function syncFromScroll() {
      if (isProgrammaticPageScroll()) {
        return;
      }

      const next = getActiveCategoryFromScroll(visibleIds);
      if (!next || selectedRef.current === next) {
        return;
      }

      applySelection(next as NonNullable<CategorySelection>);
    }

    let frame = 0;
    let settleTimer = 0;

    function onScroll() {
      if (isProgrammaticPageScroll()) {
        return;
      }

      if (frame) {
        return;
      }

      frame = requestAnimationFrame(() => {
        frame = 0;
        if (isProgrammaticPageScroll()) {
          return;
        }

        syncFromScroll();
        window.clearTimeout(settleTimer);
        settleTimer = window.setTimeout(syncFromScroll, 120);
      });
    }

    function onScrollEnd() {
      window.clearTimeout(settleTimer);
      syncFromScroll();
    }

    function onUserScrollIntent() {
      if (isProgrammaticPageScroll()) {
        cancelAnimatedScroll();
        syncFromScroll();
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("scrollend", onScrollEnd);
    window.addEventListener("wheel", onUserScrollIntent, { passive: true });
    window.addEventListener("touchmove", onUserScrollIntent, { passive: true });
    syncFromScroll();

    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(settleTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("scrollend", onScrollEnd);
      window.removeEventListener("wheel", onUserScrollIntent);
      window.removeEventListener("touchmove", onUserScrollIntent);
    };
  }, [applySelection, visibleIds]);

  return (
    <div data-menu-browse>
      <CategoryNav
        categories={categories}
        selectedCategory={active}
        onSelect={select}
      />
      <Menu
        sections={sections}
        hasCategories={categories.length > 0}
      />
    </div>
  );
}
