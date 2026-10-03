"use client";

import { useEffect, useState } from "react";

import { getDictionary } from "@/lib/i18n";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaExperience() {
  const strings = getDictionary();
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [help, setHelp] = useState(false);
  const [offline, setOffline] = useState(false);
  const [update, setUpdate] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const initialize = window.setTimeout(() => {
      setOffline(!navigator.onLine);
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (navigator as Navigator & { standalone?: boolean }).standalone;
      setIos(!standalone && /iPad|iPhone|iPod/.test(navigator.userAgent));
      try {
        setDismissed(
          sessionStorage.getItem("caramel-install-dismissed") === "yes",
        );
      } catch {}
    }, 0);
    const capture = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallEvent);
    };
    const installed = () => {
      setInstall(null);
      setIos(false);
      setHelp(false);
    };
    const online = () => setOffline(false);
    const disconnected = () => setOffline(true);
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("appinstalled", installed);
    window.addEventListener("online", online);
    window.addEventListener("offline", disconnected);
    let disposed = false;
    let registration: ServiceWorkerRegistration | undefined;
    const onUpdate = () => {
      const worker = registration?.installing;
      worker?.addEventListener("statechange", () => {
        if (
          !disposed &&
          worker.state === "installed" &&
          navigator.serviceWorker.controller
        )
          setUpdate(registration?.waiting ?? null);
      });
    };
    // Development never registers a worker, avoiding stale hot-reload assets.
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      void navigator.serviceWorker
        .register("/sw.js", { scope: "/", updateViaCache: "none" })
        .then((reg) => {
          if (disposed) return;
          registration = reg;
          if (reg.waiting) setUpdate(reg.waiting);
          reg.addEventListener("updatefound", onUpdate);
          // Hand the worker what this first visit already loaded, so the menu
          // opens offline without needing a second visit.
          void navigator.serviceWorker.ready.then((ready) => {
            const urls = performance
              .getEntriesByType("resource")
              .map((entry) => entry.name)
              .filter((name) => name.startsWith(window.location.origin));
            ready.active?.postMessage({
              type: "WARM",
              urls: [window.location.origin + "/", ...urls],
            });
          });
        })
        .catch(() => {
          /* The menu remains fully usable if registration fails. */
        });
    }
    return () => {
      disposed = true;
      window.clearTimeout(initialize);
      window.removeEventListener("beforeinstallprompt", capture);
      window.removeEventListener("appinstalled", installed);
      window.removeEventListener("online", online);
      window.removeEventListener("offline", disconnected);
      registration?.removeEventListener("updatefound", onUpdate);
    };
  }, []);

  async function installApp() {
    if (!install) {
      setHelp((value) => !value);
      return;
    }
    try {
      await install.prompt();
      await install.userChoice;
    } finally {
      setInstall(null);
    }
  }

  function applyUpdate() {
    if (!update) return;
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => window.location.reload(),
      { once: true },
    );
    update.postMessage({ type: "ACTIVATE_UPDATE" });
  }

  return (
    <>
      {offline ? (
        <div className="pwa-offline" role="status">
          {strings.offline}
        </div>
      ) : null}
      {!dismissed && (install || ios) ? (
        <aside className="pwa-card" aria-label={strings.installAction}>
          <div>
            <strong>{strings.installTitle}</strong>
            <p>{strings.installBody}</p>
          </div>
          <button
            type="button"
            className="pwa-action"
            onClick={() => void installApp()}
          >
            {strings.installAction}
          </button>
          <button
            type="button"
            className="pwa-dismiss"
            aria-label={strings.installDismiss}
            onClick={() => {
              setDismissed(true);
              try {
                sessionStorage.setItem("caramel-install-dismissed", "yes");
              } catch {}
            }}
          />
          {help ? (
            <p className="pwa-help" role="status">
              {strings.installIos}
            </p>
          ) : null}
        </aside>
      ) : null}
      {update ? (
        <div className="pwa-card" role="status">
          <div>
            <strong>{strings.updateReady}</strong>
          </div>
          <button type="button" className="pwa-action" onClick={applyUpdate}>
            {strings.refresh}
          </button>
        </div>
      ) : null}
    </>
  );
}
