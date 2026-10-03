// The material of the pour. Another restaurant swaps these values (olive oil,
// chocolate, tomato) without touching the engine.
export const pourTheme = {
  halfWidth: 9.5, // ribbon half-width in CSS px
  step: 2.5, // path sampling step in CSS px
  light: { x: -0.55, y: -0.835 }, // unit vector toward the light (upper left)
  layerInsets: [0, 1.1, 2.5, 4.2, 5.9, 7.5],
  layerColors: [
    "#1f0800",
    "#4c1b03",
    "#7e3b07",
    "#ab5d0e",
    "#cf841e",
    "#eba83c",
  ],
  layerOffsets: [0, 0.15, 0.6, 1.2, 1.85, 2.5], // drift away from the light
  poolBodyFrom: [235, 168, 60],
  poolBodyTo: [172, 98, 16],
  poolBodySteps: 16,
  fillet: 14, // radius where the stream meets a pool
  pourLine: 0.72, // pour front as a fraction of viewport height
  introSeconds: 2.3,
} as const;

export type PourTheme = typeof pourTheme;
