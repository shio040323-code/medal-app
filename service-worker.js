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
self.addEventListener("fetch", event => {

  // imagesフォルダは取得したら保存
  if (event.request.url.includes("/images/")) {

    event.respondWith(
      caches.open(CACHE_NAME).then(cache =>
        cache.match(event.request).then(response => {

          return response || fetch(event.request)
            .then(networkResponse => {

              cache.put(
                event.request,
                networkResponse.clone()
              );

              return networkResponse;
            });
        })
      )
    );

    return;
  }

  // HTML・JSON
  event.respondWith(
    caches.match(event.request)
      .then(response => {

        return response || fetch(event.request);

      })
  );

});