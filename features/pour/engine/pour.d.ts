import type {
  PourCallbacks,
  PourElements,
  PourHandle,
  PourTheme,
} from "./types";

export function createPour(
  els: PourElements,
  theme: PourTheme,
  cb: PourCallbacks,
  opts: { reducedMotion: boolean },
): PourHandle;

/** A pool of caramel: `cx, cy` centre, `rx, ry` radii, with its own wobble seed. */
export type PourBlob = {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  topY: number;
  botY: number;
  ax: number;
  ay: number;
  rmin: number;
};

export type PourStrandBuilder = {
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  bez(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
  ): void;
  arc(
    cx: number,
    cy: number,
    a: number,
    b: number,
    a0: number,
    a1: number,
  ): void;
  mark(): number;
  done(seed: number): PourStrand;
};

export type PourStrand = {
  n: number;
  len: number;
  S: number[];
  X: number[];
  Y: number[];
};

export type PourHead = { k: number; neck: number; glint: number };

export type PourPainter = {
  HW0: number;
  STEP: number;
  FIL: number;
  mkStrand(): PourStrandBuilder;
  geom(
    strand: PourStrand,
    from: number,
    to: number,
    head: PourHead | null,
  ): unknown;
  mkBlob(
    cx: number,
    cy: number,
    rx: number,
    ry: number,
    seed: number,
    n: number,
    wob: number,
    pw: number,
  ): PourBlob;
  shiftBlob(blob: PourBlob, dy: number): void;
  /** Paints strands and blobs in layered passes; `e` is a blob's emergence from 0 to 1. */
  drawScene(
    ctx: CanvasRenderingContext2D,
    strands: unknown[],
    blobs: { b: PourBlob; e: number }[],
  ): void;
};

export function createPainter(theme: PourTheme, dpr: number): PourPainter;
