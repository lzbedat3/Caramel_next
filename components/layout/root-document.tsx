import { localeMeta, type Locale } from "@/config/locales";
import { fontHtmlClassName } from "@/lib/fonts";

import "@/styles/globals.css";

type RootDocumentProps = {
  locale: Locale;
  children: React.ReactNode;
};

// The <html> shell shared by every root layout; only the language differs.
export function RootDocument({ locale, children }: RootDocumentProps) {
  return (
    <html
      lang={locale}
      dir={localeMeta[locale].dir}
      className={`${fontHtmlClassName} min-h-dvh antialiased`}
    >
      <body className="flex min-h-dvh flex-col font-sans">{children}</body>
    </html>
  );
}
