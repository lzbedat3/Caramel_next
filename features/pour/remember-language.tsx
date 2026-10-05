"use client";

import { useEffect } from "react";

import {
  defaultLocale,
  isLocale,
  LOCALE_STORAGE_KEY,
  locales,
} from "@/config/locales";

const others = locales.filter((locale) => locale !== defaultLocale);
// Runs while the HTML is parsed, so a guest never sees the wrong language flash.
const beforePaint = `try{var l=localStorage.getItem(${JSON.stringify(LOCALE_STORAGE_KEY)});if(${JSON.stringify(others)}.indexOf(l)>-1){var p=location.pathname.replace(/\\/+$/,"");location.replace("/"+l+p+location.search+location.hash)}}catch(e){}`;

// Rendered only on default-language pages ("/" and "/<branch>"). A guest who
// chose another language is sent to the same page in it, for example when
// opening the installed app or scanning a branch's QR code.
export function RememberLanguage() {
  // Arriving by an in-app link renders no script, so the same check runs here.
  useEffect(() => {
    try {
      const saved = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (isLocale(saved) && saved !== defaultLocale) {
        const path = window.location.pathname.replace(/\/+$/, "");
        window.location.replace(`/${saved}${path}`);
      }
    } catch {
      /* no storage: stay on the default language */
    }
  }, []);

  return (
    <script
      // Browsers only run it from the server's HTML; React would warn about a
      // live script rendered on the client.
      type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: beforePaint }}
    />
  );
}
