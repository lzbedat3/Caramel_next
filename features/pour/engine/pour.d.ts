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
