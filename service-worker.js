const CACHE_NAME = "medal-app-v7";

const urlsToCache = [
  "./",
  "./index.html",
  "./data.json",
  "./noimage.png"
];


// ==============================
// インストール
// ==============================
self.addEventListener("install", event => {

  event.waitUntil(

    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
      .then(() => self.skipWaiting())

  );

});


// ==============================
// 有効化
// ==============================
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

    ).then(() => self.clients.claim())

  );

});


// ==============================
// 通信
// ==============================
self.addEventListener("fetch", event => {

  // GET以外は処理しない
  if (event.request.method !== "GET") {
    return;
  }


  // ==========================
  // 画像
  // ==========================
  if (
    event.request.destination === "image" &&
    event.request.url.includes("/images/")
  ) {

    event.respondWith(

      caches.open(CACHE_NAME).then(async cache => {

        const cached =
          await cache.match(event.request);


        // --------------------------------
        // キャッシュがある場合
        // --------------------------------

if (cached) {

  try {

    const response =
      await fetch(event.request, {
        cache: "no-store"
      });

    // GitHubに画像が存在する
    if (response.ok) {

      await cache.put(
        event.request,
        response.clone()
      );

      return response;
    }

    // 画像が削除されている
    await cache.delete(event.request);

    return caches.match("./noimage.png");

  } catch (error) {

    // オフラインなら古いキャッシュを使用
    return cached;

  }

}


        // --------------------------------
        // キャッシュがない場合
        // --------------------------------
        try {

          const response =
            await fetch(event.request);

          if (response.ok) {

            cache.put(
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


  // ==========================
  // HTML・JSONなど
  // ==========================
  event.respondWith(

    caches.match(event.request)
      .then(async cached => {

        if (cached) {

          // キャッシュを即表示
          // 裏で最新版を取得
          fetch(event.request)
            .then(response => {

              if (response.ok) {

                caches.open(CACHE_NAME)
                  .then(cache => {

                    cache.put(
                      event.request,
                      response.clone()
                    );

                  });

              }

            })
            .catch(() => {});


          return cached;
        }


        // キャッシュがない場合
        try {

          const response =
            await fetch(event.request);

          if (response.ok) {

            const cache =
              await caches.open(CACHE_NAME);

            cache.put(
              event.request,
              response.clone()
            );

          }

          return response;

        } catch (error) {

          throw error;

        }

      })

  );

});