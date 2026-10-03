import { siteConfig } from "@/config/site";
import { getDictionary } from "@/lib/i18n";

export default function PublicLoading() {
  const strings = getDictionary();

  return (
    <div className="pour" role="status" aria-label={strings.loadingMenu}>
      <div id="amb" />
      <p className="loading-brand" aria-hidden="true">
        {siteConfig.name}
      </p>
    </div>
  );
}
