const CACHE_NAME = "medal-app-v10";

const urlsToCache = [
  "./",
  "./index.html",
  "./data.json",
  "./noimage.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => key !== CACHE_NAME ? caches.delete(key) : undefined)
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  // chrome-extension:// など外部originのリクエストはService Workerで処理しない
  if (new URL(request.url).origin !== self.location.origin) return;

  if (
    request.destination === "image" &&
    request.url.includes("/images/")
  ) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached = await cache.match(request);

        if (cached) {
          try {
            const response = await fetch(request, { cache: "no-store" });

            if (response.ok) {
              await cache.put(request, response.clone());
              return response;
            }

            await cache.delete(request);
            return caches.match("./noimage.png");
          } catch (error) {
            return cached;
          }
        }

        try {
          const response = await fetch(request);

          if (response.ok) {
            await cache.put(request, response.clone());
          }

          return response;
        } catch (error) {
          return caches.match("./noimage.png");
        }
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(async cached => {
      if (cached) {
        fetch(request)
          .then(response => {
            if (!response.ok) return;
            return caches.open(CACHE_NAME).then(cache =>
              cache.put(request, response.clone())
            );
          })
          .catch(() => {});

        return cached;
      }

      const response = await fetch(request);

      if (response.ok) {
        const cache = await caches.open(CACHE_NAME);
        await cache.put(request, response.clone());
      }

      return response;
    })
  );
});
