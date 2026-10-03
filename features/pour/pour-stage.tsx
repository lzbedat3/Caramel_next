"use client";

import { useCallback, useEffect, useReducer, useRef, useState } from "react";

import { pourTheme } from "@/config/pour-theme";
import { CategoryNav } from "@/features/pour/category-nav";
import { DishDialog } from "@/features/pour/dish-dialog";
import { createPour } from "@/features/pour/engine/pour";
import type {
  PourDish,
  PourElements,
  PourHandle,
} from "@/features/pour/engine/types";
import { MyTable } from "@/features/pour/my-table";
import { shouldPlaySplash, Splash } from "@/features/pour/splash";
import { loadTable, saveTable } from "@/features/pour/table/storage";
import {
  emptyTable,
  reconcile,
  tableReducer,
  totals,
} from "@/features/pour/table/table";
import { cn } from "@/lib/cn";
import type { Dictionary } from "@/lib/i18n";

export type StageImage = { src: string; srcSet?: string; sizes?: string };

export type StageDish = {
  id: number;
  categoryName: string;
  name: string;
  description: string | null;
  value: number;
  price: { symbol: string; amount: string } | null;
  isAvailable: boolean;
  detail: StageImage | null;
  thumb: StageImage | null;
};

type PourStageProps = {
  dishes: StageDish[];
  categories: { id: number; name: string }[];
  strings: Dictionary;
  storageKey: string;
  brand: string[];
  children: React.ReactNode;
};

function collectElements(root: HTMLElement): PourElements | null {
  const one = <T extends Element>(selector: string) =>
    root.querySelector<T>(selector);
  const stage = one<HTMLElement>("#stage");
  const rib = one<HTMLElement>("#rib");
  const dyn = one<HTMLCanvasElement>("#dyn");
  const track = one<SVGSVGElement>("#track");
  const trackPath = one<SVGPathElement>("#trk");
  const dot = one<HTMLElement>("#dot");
  const tag = one<HTMLElement>("#tag");
  const foot = one<HTMLElement>("#foot");
  const bye = one<HTMLElement>("#foot .bye");
  const sig = one<HTMLElement>("#sig");
  if (
    !stage ||
    !rib ||
    !dyn ||
    !track ||
    !trackPath ||
    !dot ||
    !tag ||
    !foot ||
    !bye ||
    !sig
  ) {
    return null;
  }

  const dishes: PourDish[] = [];
  for (const el of root.querySelectorAll<HTMLElement>(".dish")) {
    const ph = el.querySelector<HTMLElement>(".ph");
    const tx = el.querySelector<HTMLElement>(".tx");
    if (!ph || !tx) {
      return null;
    }
    dishes.push({
      el,
      ph,
      tx,
      side: el.dataset.side === "L" ? "L" : "R",
      category: Number(el.dataset.category),
    });
  }

  return {
    stage,
    rib,
    dyn,
    track,
    trackPath,
    dot,
    tag,
    pools: [...root.querySelectorAll<HTMLElement>(".pool")],
    dishes,
    foot,
    bye,
    sig,
  };
}

export function PourStage({
  dishes,
  categories,
  strings,
  storageKey,
  brand,
  children,
}: PourStageProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<PourHandle | null>(null);
  const [activeCategory, setActiveCategory] = useState(0);
  const [pastOpening, setPastOpening] = useState(false);
  const [open, setOpen] = useState<{
    dish: StageDish;
    lowSrc: string | null;
  } | null>(null);
  // The ring the open dish grew out of; the dialog hides it and shrinks back into it.
  const originRef = useRef<HTMLElement | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  // "pending" until the browser says whether the splash plays; the engine waits for it.
  const [splash, setSplash] = useState<
    "pending" | "playing" | "draining" | "done"
  >("pending");
  const engineReady = splash === "draining" || splash === "done";
  const [table, dispatch] = useReducer(tableReducer, emptyTable);
  const hydrated = useRef(false);

  useEffect(() => {
    // Decided on the client so the server never guesses about storage.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSplash(shouldPlaySplash() ? "playing" : "done");
  }, []);

  // The engine positions and lights the server-rendered list, once the splash is out of the way.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || !engineReady) {
      return;
    }

    const stage = root.querySelector<HTMLElement>("#stage");
    try {
      const els = collectElements(root);
      if (!els) {
        throw new Error("pour: stage markup is incomplete");
      }
      const handle = createPour(
        els,
        pourTheme,
        {
          onActiveCategory: setActiveCategory,
          onPastOpening: setPastOpening,
          onError: (error) => {
            console.error(error);
            stage?.setAttribute("data-fallback", "");
          },
        },
        {
          reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
            .matches,
        },
      );
      handleRef.current = handle;
      return () => {
        handle.destroy();
        handleRef.current = null;
      };
    } catch (error) {
      // The list stays readable without the caramel.
      console.error(error);
      stage?.setAttribute("data-fallback", "");
    }
  }, [engineReady]);

  // Photos fade in once loaded; a broken photo becomes a lettered ring.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }

    const markLoaded = (img: HTMLImageElement) => {
      if (img.naturalWidth > 0) {
        img.setAttribute("data-ok", "");
      }
    };
    const onLoad = (event: Event) => {
      if (event.target instanceof HTMLImageElement) {
        markLoaded(event.target);
      }
    };
    const onError = (event: Event) => {
      if (event.target instanceof HTMLImageElement) {
        event.target.closest(".dish")?.setAttribute("data-noimg", "");
      }
    };
    for (const img of root.querySelectorAll<HTMLImageElement>(".ph img")) {
      if (img.complete && img.naturalWidth > 0) {
        markLoaded(img);
      } else if (img.complete) {
        // Failed before hydration: show the lettered ring instead of an empty one.
        img.closest(".dish")?.setAttribute("data-noimg", "");
      }
    }
    const onToggle = () => handleRef.current?.relayout();

    root.addEventListener("load", onLoad, true);
    root.addEventListener("error", onError, true);
    root.addEventListener("toggle", onToggle, true);
    window.addEventListener("pour:relayout", onToggle);
    return () => {
      root.removeEventListener("load", onLoad, true);
      root.removeEventListener("error", onError, true);
      root.removeEventListener("toggle", onToggle, true);
      window.removeEventListener("pour:relayout", onToggle);
    };
  }, []);

  // The table survives a reload, checked against today's menu. Saving is declared
  // first so the empty first render never overwrites what is stored; the initial
  // `emptyTable` object itself is never saved (a table emptied by the guest is a
  // fresh object), which also keeps StrictMode's effect replay from wiping storage.
  useEffect(() => {
    if (hydrated.current && table !== emptyTable) {
      saveTable(storageKey, table);
    }
  }, [storageKey, table]);

  useEffect(() => {
    // With no dishes the backend did not answer; leave storage alone for the next visit.
    if (dishes.length === 0) {
      return;
    }
    dispatch({
      type: "replace",
      state: reconcile(loadTable(storageKey), dishes),
    });
    hydrated.current = true;
  }, [storageKey, dishes]);

  const dishById = useCallback(
    (id: number) => dishes.find((dish) => dish.id === id),
    [dishes],
  );

  // Large photos are fetched ahead: on touch, and one at a time for dishes the
  // caramel has reached, so the dialog opens with its photo already cached.
  const prefetched = useRef(new Set<number>());
  const queue = useRef<StageDish[]>([]);
  const busy = useRef(false);
  const prefetch = useCallback((dish: StageDish | undefined, now = false) => {
    if (!dish?.detail || prefetched.current.has(dish.id)) {
      return;
    }
    const start = (entry: StageDish) => {
      prefetched.current.add(entry.id);
      const img = new Image();
      if (entry.detail?.sizes) img.sizes = entry.detail.sizes;
      if (entry.detail?.srcSet) img.srcset = entry.detail.srcSet;
      img.src = entry.detail?.src ?? "";
      return img;
    };
    if (now) {
      start(dish);
      return;
    }
    queue.current.push(dish);
    const next = () => {
      const entry = queue.current.shift();
      if (!entry || prefetched.current.has(entry.id)) {
        busy.current = false;
        if (entry) next();
        return;
      }
      busy.current = true;
      const img = start(entry);
      img.onload = img.onerror = () => {
        busy.current = false;
        next();
      };
    };
    if (!busy.current) {
      next();
    }
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) {
      return;
    }
    const observer = new MutationObserver((records) => {
      for (const record of records) {
        const el = record.target as HTMLElement;
        if (el.hasAttribute("data-lit")) {
          prefetch(dishById(Number(el.dataset.id)));
        }
      }
    });
    for (const dish of root.querySelectorAll<HTMLElement>(".dish")) {
      observer.observe(dish, {
        attributes: true,
        attributeFilter: ["data-lit"],
      });
    }
    const onPointerDown = (event: PointerEvent) => {
      const ph = (event.target as Element).closest<HTMLElement>(".ph");
      if (ph) {
        prefetch(
          dishById(Number(ph.closest<HTMLElement>(".dish")?.dataset.id)),
          true,
        );
      }
    };
    root.addEventListener("pointerdown", onPointerDown, { passive: true });
    return () => {
      observer.disconnect();
      root.removeEventListener("pointerdown", onPointerDown);
    };
  }, [dishById, prefetch]);
  const { count, total } = totals(table, (id) => dishById(id)?.value ?? 0);

  function onRootClick(event: React.MouseEvent<HTMLDivElement>) {
    const target = event.target as Element;
    const ph = target.closest<HTMLElement>(".ph");
    if (!ph) {
      return;
    }
    const dish = dishById(Number(ph.closest<HTMLElement>(".dish")?.dataset.id));
    if (dish) {
      originRef.current = ph;
      // The ring's photo is already on screen; the dialog shows it at once and
      // swaps in the large one when it arrives.
      setOpen({
        dish,
        lowSrc: ph.querySelector("img")?.currentSrc || null,
      });
    }
  }

  function jumpTo(index: number) {
    const top = handleRef.current?.categoryTop(index);
    if (top === undefined) {
      return;
    }
    window.scrollTo({
      top,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }

  return (
    <div
      ref={rootRef}
      className={cn(
        "pour",
        count > 0 && "ct-has",
        sheetOpen && count > 0 && "ct-open",
      )}
      onClick={onRootClick}
    >
      <svg
        width="0"
        height="0"
        style={{ position: "absolute" }}
        aria-hidden="true"
      >
        <defs>
          <filter
            id="goo"
            x="-15%"
            y="-60%"
            width="130%"
            height="220%"
            colorInterpolationFilters="sRGB"
          >
            <feGaussianBlur in="SourceGraphic" stdDeviation="4" result="b" />
            <feColorMatrix
              in="b"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8"
              result="g"
            />
            <feGaussianBlur in="g" stdDeviation="2.4" result="gb" />
            <feSpecularLighting
              in="gb"
              surfaceScale="5"
              specularConstant="1.05"
              specularExponent="24"
              lightingColor="#fff0cc"
              result="sp"
            >
              <feDistantLight azimuth="232" elevation="52" />
            </feSpecularLighting>
            <feComposite in="sp" in2="g" operator="in" result="sp2" />
            <feComposite
              in="g"
              in2="sp2"
              operator="arithmetic"
              k1="0"
              k2="1"
              k3=".85"
              k4="0"
            />
          </filter>
        </defs>
      </svg>
      <div id="amb" />
      {splash === "playing" || splash === "draining" ? (
        <Splash
          brand={brand}
          onDrain={() => setSplash("draining")}
          onDone={() => setSplash("done")}
        />
      ) : null}
      <CategoryNav
        categories={categories}
        active={activeCategory}
        show={pastOpening}
        label={strings.categories}
        onJump={jumpTo}
      />
      {children}
      <DishDialog
        dish={open?.dish ?? null}
        lowSrc={open?.lowSrc ?? null}
        originRef={originRef}
        strings={strings}
        onAdd={(id) => dispatch({ type: "add", id })}
        onClosed={() => setOpen(null)}
      />
      <MyTable
        table={table}
        total={total}
        count={count}
        dishById={dishById}
        strings={strings}
        sheetOpen={sheetOpen && count > 0}
        onOpen={() => setSheetOpen(true)}
        onClose={() => setSheetOpen(false)}
        onStep={(id, by) => {
          // Removing the last dish closes the sheet instead of leaving it armed to reopen.
          if (by === -1 && count === 1) {
            setSheetOpen(false);
          }
          dispatch({ type: "step", id, by });
        }}
      />
    </div>
  );
}
