import { Cairo, Heebo, Ubuntu } from "next/font/google";

export const fontHebrew = Heebo({
  subsets: ["hebrew", "latin"],
  variable: "--font-heebo",
  display: "swap",
  preload: true,
});

export const fontLatin = Ubuntu({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  preload: true,
  variable: "--font-ubuntu",
  display: "swap",
  // No synthetic fallback family: it would carry Hebrew glyphs and catch
  // Hebrew text before it reaches Heebo in "Ubuntu, Heebo" stacks.
  adjustFontFallback: false,
});

export const fontArabic = Cairo({
  subsets: ["arabic"],
  preload: false,
  variable: "--font-cairo",
  display: "swap",
});

export const fontHtmlClassName = `${fontHebrew.className} ${fontHebrew.variable} ${fontLatin.variable} ${fontArabic.variable}`;
