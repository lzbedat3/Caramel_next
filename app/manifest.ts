import type { MetadataRoute } from "next";

import { brandAssets } from "@/config/brand-assets";
import { he } from "@/lib/i18n/he";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Caramel - קרמל",
    short_name: "Caramel",
    description: he.eyebrow,
    lang: "he",
    dir: "rtl",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#0d0806",
    theme_color: "#0d0806",
    categories: ["food", "shopping"],
    icons: [
      {
        src: brandAssets.icon192,
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: brandAssets.icon512,
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: brandAssets.maskable192,
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: brandAssets.maskable512,
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
