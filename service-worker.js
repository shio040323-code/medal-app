const CACHE_NAME = "medal-app-v6";

const APP_FILES = [
  "./",
  "./index.html",
  "./data.json",
  "./noimage.png"
];

// インストール
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
  );

  self.skipWaiting();
});

// 古いキャッシュを削除
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames
            .filter(name => name !== CACHE_NAME)
            .map(name => caches.delete(name))
        );
      })
      .then(() => self.clients.claim())
  );
});

// 通信処理
self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") {
    return;
  }

  const url = new URL(event.request.url);

  /*
   * data.json
   * オンライン：最新データ取得
   * オフライン：保存済みデータ表示
   */
  if (url.pathname.endsWith("/data.json")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        try {
          const response = await fetch(event.request, {
            cache: "no-store"
          });

          if (response.ok) {
            await cache.put(
              "./data.json",
              response.clone()
            );
          }

          return response;
        } catch (error) {
          const cached =
            await cache.match("./data.json");

          if (cached) {
            return cached;
          }

          return new Response("[]", {
            headers: {
              "Content-Type": "application/json"
            }
          });
        }
      })
    );

    return;
  }

  /*
   * 画像
   * 保存済み画像を優先
   */
  if (url.pathname.includes("/images/")) {
    event.respondWith(
      caches.open(CACHE_NAME).then(async cache => {
        const cached =
          await cache.match(event.request);

        if (cached) {
          return cached;
        }

        try {
          const response =
            await fetch(event.request);

          if (response.ok) {
            await cache.put(
              event.request,
              response.clone()
            );
          }

          return response;
        } catch (error) {
          return caches.match("./noimage.png");
        }
      })
    );

    return;
  }

  /*
   * HTMLなど
   * ネット接続を優先し、失敗時はキャッシュ
   */
  event.respondWith(
    fetch(event.request)
      .then(async response => {
        if (response.ok) {
          const cache =
            await caches.open(CACHE_NAME);

          await cache.put(
            event.request,
            response.clone()
          );
        }

        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});