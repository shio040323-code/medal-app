const CACHE_NAME = "medal-app-v4";

const urlsToCache = [
  "./",
  "./index.html",
  "./data.json",
  "./noimage.png"
];

// インストール
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );

  self.skipWaiting();
});

// 有効化
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );

  self.clients.claim();
});

// 通信
// imagesはキャッシュ優先
if (event.request.url.includes("/images/")) {

  event.respondWith(

    caches.open(CACHE_NAME).then(async cache => {

      const cached = await cache.match(event.request);

      if (cached) return cached;

      const response = await fetch(event.request);

      if (response.ok) {
        cache.put(event.request, response.clone());
      }

      return response;

    })

  );

  return;
}
self.addEventListener("fetch", event => {

  event.respondWith(

    caches.match(event.request).then(async cached => {

      // キャッシュがあれば即返す
      if (cached) {
        return cached;
      }

      try {

        const response = await fetch(event.request);

        // 成功したものだけ保存
        if (
          event.request.method === "GET" &&
          response.ok
        ) {

          const cache =
            await caches.open(CACHE_NAME);

          cache.put(
            event.request,
            response.clone()
          );

        }

        return response;

      } catch (e) {

        // 画像だけ noimage を返す
        if (
          event.request.destination === "image"
        ) {
          return caches.match("./noimage.png");
        }

        throw e;
      }

    })

  );

});

  