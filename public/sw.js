/* Cache only the branded fallback. Live menus and private routes stay network-only. */
const CACHE = "caramel-offline-v1";
const OFFLINE = "/offline.html";
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll([OFFLINE, "/Caramel_Assets/caramel-logo-splash.webp"]),
      ),
  );
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches
        .keys()
        .then((keys) =>
          Promise.all(
            keys
              .filter(
                (key) => key.startsWith("caramel-offline-") && key !== CACHE,
              )
              .map((key) => caches.delete(key)),
          ),
        ),
      self.clients.claim(),
    ]),
  );
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "ACTIVATE_UPDATE") self.skipWaiting();
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin)
    return;
  if (url.pathname === "/Caramel_Assets/caramel-logo-splash.webp") {
    event.respondWith(
      caches
        .match(event.request)
        .then((cached) => cached || fetch(event.request)),
    );
  } else if (event.request.mode === "navigate" && url.pathname === "/") {
    event.respondWith(
      fetch(event.request).catch(
        async () => (await caches.match(OFFLINE)) || Response.error(),
      ),
    );
  }
});
