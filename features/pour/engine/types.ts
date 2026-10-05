import type { PourTheme } from "@/config/pour-theme";

export type { PourTheme };

export type PourDish = {
  el: HTMLElement;
  ph: HTMLElement;
  tx: HTMLElement;
  side: "R" | "L";
  category: number;
};

export type PourElements = {
  stage: HTMLElement;
  rib: HTMLElement;
  dyn: HTMLCanvasElement;
  track: SVGSVGElement;
  trackPath: SVGPathElement;
  dot: HTMLElement;
  tag: HTMLElement;
  pools: HTMLElement[];
  dishes: PourDish[];
  foot: HTMLElement;
  bye: HTMLElement;
  sig: HTMLElement;
};

export type PourCallbacks = {
  onActiveCategory(index: number): void;
  onPastOpening(past: boolean): void;
  /** The engine gave up (for example no canvas memory); the page shows its plain list. */
  onError?(error: unknown): void;
};

export type PourHandle = {
  destroy(): void;
  relayout(): void;
  categoryTop(index: number, barBottom?: number): number;
};
