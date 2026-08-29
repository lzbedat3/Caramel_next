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
  variable: "--font-ubuntu",
  display: "swap",
});

export const fontArabic = Cairo({
  subsets: ["arabic"],
  variable: "--font-cairo",
  display: "swap",
});

export const fontHtmlClassName = `${fontHebrew.className} ${fontHebrew.variable} ${fontLatin.variable} ${fontArabic.variable}`;
