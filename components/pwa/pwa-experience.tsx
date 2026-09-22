"use client";

import { useEffect, useRef, useState } from "react";

type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export function PwaExperience() {
  const splash = useRef<HTMLDivElement>(null);
  const [install, setInstall] = useState<InstallEvent | null>(null);
  const [ios, setIos] = useState(false);
  const [help, setHelp] = useState(false);
  const [offline, setOffline] = useState(false);
  const [update, setUpdate] = useState<ServiceWorker | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const node = splash.current;
    let seen = false;
    try {
      seen = sessionStorage.getItem("caramel-welcome") === "yes";
      sessionStorage.setItem("caramel-welcome", "yes");
    } catch {
      /* Storage may be unavailable in private mode. */
    }
    if (!seen && !window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      node?.classList.add("is-playing");
    const finish = window.setTimeout(
      () => node?.classList.remove("is-playing"),
      850,
    );
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
        })
        .catch(() => {
          /* The menu remains fully usable if registration fails. */
        });
    }
    return () => {
      disposed = true;
      window.clearTimeout(finish);
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
      <div
        ref={splash}
        className="caramel-splash"
        aria-hidden="true"
        onClick={() => splash.current?.classList.remove("is-playing")}
      >
        <div className="splash-halo" />
        <div className="splash-stage">
          <span className="splash-spark spark-one" />
          <span className="splash-spark spark-two" />
          <span className="splash-spark spark-three" />
          {/* A local, pre-sized derivative of the supplied master logo. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="splash-logo"
            src="/Caramel_Assets/caramel-logo-splash.webp"
            width="192"
            height="192"
            alt=""
          />
          <span className="splash-shadow" />
        </div>
        <div className="splash-caption">
          <span>גן עדן לציליאקים</span>
          <i />
          <small>נגיעה במסך ומתחילים</small>
        </div>
      </div>
      {offline ? (
        <div className="pwa-connectivity" role="status">
          אין חיבור לאינטרנט · המידע המוצג עשוי להיות לא מעודכן
        </div>
      ) : null}
      {!dismissed && (install || ios) ? (
        <aside className="pwa-install" aria-label="התקנת קרמל">
          <div>
            <strong>קרמל, במרחק נגיעה</strong>
            <p>התפריט שלכם, ישר ממסך הבית</p>
          </div>
          <button type="button" onClick={() => void installApp()}>
            הוספה למסך הבית <span aria-hidden="true">＋</span>
          </button>
          <button
            type="button"
            className="pwa-dismiss"
            aria-label="סגירת הצעת התקנה"
            onClick={() => {
              setDismissed(true);
              try {
                sessionStorage.setItem("caramel-install-dismissed", "yes");
              } catch {}
            }}
          >
            ×
          </button>
          {help ? (
            <p className="pwa-help" role="status">
              ב-Safari: לחצו על שיתוף ואז על ״הוסף למסך הבית״.
            </p>
          ) : null}
        </aside>
      ) : null}
      {update ? (
        <div className="pwa-update" role="status">
          <span>גרסה חדשה של קרמל מוכנה</span>
          <button type="button" onClick={applyUpdate}>
            רענון
          </button>
        </div>
      ) : null}
    </>
  );
}
