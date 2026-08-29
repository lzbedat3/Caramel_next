import {
  buildRestaurantJsonLd,
  serializeJsonLd,
} from "@/lib/seo";
import type { PublicSeoContent } from "@/services/public-seo";

export function RestaurantJsonLd(props: PublicSeoContent) {
  const data = buildRestaurantJsonLd(props);
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
