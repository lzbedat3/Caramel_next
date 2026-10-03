import { siteConfig } from "@/config/site";

import { ar } from "./ar";
import { en } from "./en";
import { he } from "./he";

export type Dictionary = { [K in keyof typeof he]: string };

const dictionaries: Record<string, Dictionary> = { he, ar, en };

export function getDictionary(locale: string = siteConfig.locale): Dictionary {
  return dictionaries[locale] ?? he;
}

export function format(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(values[key] ?? ""),
  );
}
