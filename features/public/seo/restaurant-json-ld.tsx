import {
  buildSiteJsonLd,
  serializeJsonLd,
  type SiteJsonLdInput,
} from "@/lib/seo";

export function SiteJsonLd(props: SiteJsonLdInput) {
  const data = buildSiteJsonLd(props);
  if (!data) {
    return null;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(data) }}
    />
  );
}
