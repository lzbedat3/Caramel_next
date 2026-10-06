/* Offline support for the public menu.
   - The menu page: network first, falling back to the last copy seen.
   - Build assets, fonts and brand files: served from cache, refreshed in the background.
   - Optimised dish photos: kept as the guest sees them, cache first, capped.
     They are never fetched ahead of the page.
   - Admin, sign-in, auth and anything that is not a GET are never touched. */
const VERSION = "caramel-v4";
const PAGES = `${VERSION}-pages`;
const ASSETS = `${VERSION}-assets`;
const IMAGES = `${VERSION}-images`;
const OFFLINE = "/offline.html";
const IMAGE_LIMIT = 120;
// A menu page: "/", "/ar", "/akko" or "/ar/akko". Branches come and go in the
// admin, so this matches the shape of the address rather than a fixed list.
const MENU_PATH = /^\/(?:[a-z0-9-]+(?:\/[a-z0-9-]+)?\/?)?$/;
function isMenuPath(pathname) {
  return (
    MENU_PATH.test(pathname) &&
    !PRIVATE_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  );
}
const PRIVATE_PREFIXES = ["/admin", "/portal", "/auth", "/api"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((cache) =>
        cache.addAll([OFFLINE, "/Caramel_Assets/caramel-logo-splash.webp?v=2"]),
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
                (key) => key.startsWith("caramel-") && !key.startsWith(VERSION),
              )
              .map((key) => caches.delete(key)),
          ),
        ),
      self.clients.claim(),
    ]),
  );
});

function isAsset(pathname) {
  return (
    pathname.startsWith("/_next/static/") ||
    pathname.startsWith("/Caramel_Assets/")
  );
}

function isImage(pathname) {
  return pathname.startsWith("/_next/image");
}

async function trim(cacheName, limit) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  // Keys come back oldest first.
  await Promise.all(
    keys
      .slice(0, Math.max(0, keys.length - limit))
      .map((key) => cache.delete(key)),
  );
}

async function menuPage(request) {
  const cache = await caches.open(PAGES);
  try {
    const response = await fetch(request);
    // A page rendered during a backend hiccup has no menu; it must not replace the last good copy.
    if (response.ok) {
      const copy = response.clone();
      const html = await copy.clone().text();
      if (html.includes('data-menu="complete"')) {
        await cache.put(new URL(request.url).pathname, copy);
      }
    }
    return response;
  } catch {
    return (
      (await cache.match(new URL(request.url).pathname)) ||
      (await cache.match("/")) ||
      (await cache.match(OFFLINE)) ||
      Response.error()
    );
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(ASSETS);
  const cached = await cache.match(request);
  const refresh = fetch(request)
    .then((response) => {
      if (response.ok) {
        void cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => cached || Response.error());
  return cached || refresh;
}

async function cacheFirstImage(request) {
  const cache = await caches.open(IMAGES);
  const cached = await cache.match(request);
  if (cached) {
    return cached;
  }
  const response = await fetch(request);
  if (response.ok) {
    await cache.put(request, response.clone());
    void trim(IMAGES, IMAGE_LIMIT);
  }
  return response;
}

self.addEventListener("message", (event) => {
  if (event.data?.type === "ACTIVATE_UPDATE") {
    void self.skipWaiting();
  }
  // The first visit loads before this worker controls the page, so the page
  // hands over the page and build files it already fetched and the menu works
  // offline straight away. Photos are not warmed: that would download every
  // one of them twice, and with a different Accept header than the page's own
  // request, which the image optimiser can count as a separate image.
  if (event.data?.type === "WARM" && Array.isArray(event.data.urls)) {
    event.waitUntil(
      Promise.all(
        event.data.urls.map(async (href) => {
          const url = new URL(href, self.location.origin);
          if (url.origin !== self.location.origin) return;
          try {
            if (isMenuPath(url.pathname)) {
              await menuPage(new Request(url.pathname));
            } else if (isAsset(url.pathname)) {
              const cache = await caches.open(ASSETS);
              if (!(await cache.match(url.href))) await cache.add(url.href);
            }
          } catch {
            /* A missed entry only means it is fetched again later. */
          }
        }),
      ),
    );
  }
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (PRIVATE_PREFIXES.some((prefix) => url.pathname.startsWith(prefix)))
    return;

  if (request.mode === "navigate" && isMenuPath(url.pathname)) {
    event.respondWith(menuPage(request));
  } else if (isImage(url.pathname)) {
    event.respondWith(cacheFirstImage(request));
  } else if (isAsset(url.pathname)) {
    event.respondWith(staleWhileRevalidate(request));
  }
});
