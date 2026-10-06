import Script from "next/script";

// Vercel Web Analytics, loaded the way Vercel documents for a plain page: the
// script is served by the deployment itself, so nothing is added to the
// bundle. It only exists on Vercel, hence the guard for local runs.
export function WebAnalytics() {
  if (process.env.VERCEL !== "1") {
    return null;
  }

  return (
    <>
      <Script id="va-queue" strategy="afterInteractive">
        {
          "window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};"
        }
      </Script>
      <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />
    </>
  );
}
