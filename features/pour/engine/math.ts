export function clamp(v: number, a: number, b: number): number {
  return v < a ? a : v > b ? b : v;
}

export function smooth(x: number, a: number, b: number): number {
  const t = clamp((x - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
}

export type PourMotion = { sh: number; sa1: number; sa2: number; slow: number };

// One frame of the viscous follow: two fast followers give the stream its lag,
// a slow one makes the last few pixels ooze in. `sh` is the poured length.
export function stepPour(
  state: PourMotion,
  target: number,
  dt: number,
  max: number,
): PourMotion {
  const sa1 = state.sa1 + (target - state.sa1) * (1 - Math.exp(-dt / 0.1));
  const sa2 = state.sa2 + (sa1 - state.sa2) * (1 - Math.exp(-dt / 0.16));
  const slow = state.slow + (target - state.slow) * (1 - Math.exp(-dt / 0.85));
  const sh = clamp(sa2 + clamp((slow - sa2) * 0.6, -26, 26), 0, max);
  return { sh, sa1, sa2, slow };
}
