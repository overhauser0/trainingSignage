const VERSION = '0.0.13'; // 毎回更新
const STATIC_CACHE_KEY = 'static-' + VERSION;

// キャッシュするファイルのリスト
// Vercel上のルートからの絶対パスで記述します
const STATIC_FILES = [
  '/',
  '/index.html',
  '/style.css',
  '/manifest.json',
  '/statics/signage-192.png',
  '/statics/signage-512.png',
  '/statics/netzyou_transparent.png',
  // 外部フォント（これらは crossorigin なので addAll で取得可能）
  'https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@400;500;700&family=Noto+Sans+JP:wght@400;500;700&family=Fira+Sans:ital,wght@1,500&display=swap',
];

// インストール：ファイルを一括でキャッシュ
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE_KEY).then((cache) => {
      console.log('Caching shell assets');
      return cache.addAll(STATIC_FILES);
    }),
  );
  self.skipWaiting();
});

// アクティベート：古いキャッシュを削除
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== STATIC_CACHE_KEY)
          .map((name) => caches.delete(name)),
      );
    }),
  );
  self.clients.claim();
});

// フェッチ：キャッシュがあれば返し、なければネットワークから取得してキャッシュに追加
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).then((networkResponse) => {
        // 有効なレスポンスでない場合はキャッシュしない
        if (
          !networkResponse ||
          networkResponse.status !== 200 ||
          networkResponse.type !== 'basic'
        ) {
          return networkResponse;
        }

        // 新しく見つけたリソースをキャッシュに保存（動的キャッシュ）
        const responseToCache = networkResponse.clone();
        caches.open(STATIC_CACHE_KEY).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      });
    }),
  );
});
