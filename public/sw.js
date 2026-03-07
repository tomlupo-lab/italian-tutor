const CACHE_NAME = "marco-v8";
const TTS_CACHE = "marco-tts-v1";
const BASE_PATH = "/tutor";

// App shell files to precache
const PRECACHE_URLS = [
  `${BASE_PATH}/`,
  `${BASE_PATH}/practice`,
  `${BASE_PATH}/exercises`,
  `${BASE_PATH}/calendar`,
  `${BASE_PATH}/progress`,
  `${BASE_PATH}/offline`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== TTS_CACHE)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and cross-origin requests
  if (request.method !== "GET" || url.origin !== self.location.origin) return;

  // TTS audio — cache-first (audio doesn't change for same text)
  if (url.pathname === `${BASE_PATH}/api/tts`) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(TTS_CACHE).then((cache) => {
              cache.put(request, clone);
              // Limit TTS cache to ~200 entries
              cache.keys().then((keys) => {
                if (keys.length > 200) {
                  cache.delete(keys[0]);
                }
              });
            });
          }
          return response;
        }).catch(() => new Response(null, { status: 503 }));
      })
    );
    return;
  }

  // Skip other API routes and Convex — always go to network
  if (url.pathname.startsWith(`${BASE_PATH}/api/`) || url.hostname.includes("convex")) {
    return;
  }

  // Network-first for HTML pages (always fresh when online)
  if (request.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          return response;
        })
        .catch(() =>
          caches.match(request).then((r) => r || caches.match(`${BASE_PATH}/offline`))
        )
    );
    return;
  }

  // Cache-first for static assets (JS, CSS, images, fonts)
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (
          response.ok &&
          (url.pathname.startsWith("/_next/") || url.pathname.startsWith(`${BASE_PATH}/icons/`))
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return response;
      });
    })
  );
});
