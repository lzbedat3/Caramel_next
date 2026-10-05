"use client";

import { useEffect, useRef, useState } from "react";

import { GlobeIcon } from "@/components/icons";
import {
  LOCALE_STORAGE_KEY,
  localeMeta,
  menuPath,
  locales,
  type Locale,
} from "@/config/locales";

type LanguageSwitcherProps = {
  locale: Locale;
  label: string;
  /** The branch being viewed, kept when the language changes. */
  locationSlug?: string | null;
};

// A small glass bead in the corner of the opening screen. It opens into the
// three languages; each is a real link, so every language has its own address.
export function LanguageSwitcher({
  locale,
  label,
  locationSlug,
}: LanguageSwitcherProps) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div id="lang" ref={root} data-open={open ? "" : undefined}>
      <button
        type="button"
        aria-label={label}
        aria-expanded={open}
        aria-controls="lang-list"
        onClick={() => setOpen((value) => !value)}
      >
        <GlobeIcon />
        <span lang={locale}>{localeMeta[locale].short}</span>
      </button>
      <ul id="lang-list">
        {locales.map((entry) => (
          <li key={entry}>
            <a
              href={menuPath(entry, locationSlug)}
              hrefLang={entry}
              lang={entry}
              dir={localeMeta[entry].dir}
              aria-current={entry === locale ? "true" : undefined}
              tabIndex={open ? undefined : -1}
              onClick={() => {
                try {
                  localStorage.setItem(LOCALE_STORAGE_KEY, entry);
                } catch {
                  /* no storage: the address alone carries the language */
                }
              }}
            >
              {localeMeta[entry].label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
