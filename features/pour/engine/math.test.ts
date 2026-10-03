import { describe, expect, it } from "vitest";

import { clamp, smooth, stepPour } from "./math";

describe("math", () => {
  it("clamps", () => {
    expect(clamp(5, 0, 3)).toBe(3);
    expect(clamp(-1, 0, 3)).toBe(0);
    expect(clamp(2, 0, 3)).toBe(2);
  });

  it("smoothsteps between the edges", () => {
    expect(smooth(0, 0, 1)).toBe(0);
    expect(smooth(1, 0, 1)).toBe(1);
    expect(smooth(0.5, 0, 1)).toBe(0.5);
    expect(smooth(-3, 0, 1)).toBe(0);
  });
});

describe("stepPour", () => {
  const rest = { sh: 0, sa1: 0, sa2: 0, slow: 0 };

  it("lags behind the target after one frame", () => {
    const next = stepPour(rest, 1000, 0.016, 5000);
    expect(next.sh).toBeGreaterThan(0);
    expect(next.sh).toBeLessThan(1000);
  });

  it("converges on the target", () => {
    let state = rest;
    for (let i = 0; i < 600; i++) state = stepPour(state, 1000, 0.016, 5000);
    expect(Math.abs(state.sh - 1000)).toBeLessThan(0.5);
  });

  it("never exceeds the path length or goes negative", () => {
    let state = rest;
    for (let i = 0; i < 600; i++) state = stepPour(state, 9000, 0.016, 5000);
    expect(state.sh).toBeLessThanOrEqual(5000);
    expect(stepPour(rest, -50, 0.016, 5000).sh).toBeGreaterThanOrEqual(0);
  });

  it("un-pours when the target moves back", () => {
    let state = { sh: 1000, sa1: 1000, sa2: 1000, slow: 1000 };
    for (let i = 0; i < 600; i++) state = stepPour(state, 200, 0.016, 5000);
    expect(Math.abs(state.sh - 200)).toBeLessThan(0.5);
  });
});
