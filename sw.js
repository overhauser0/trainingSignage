const VERSION = '0.1.5'; // 毎回更新
const STATIC_CACHE_KEY = 'static-' + VERSION;

const STATIC_FILES = [
  '/',
  '/index.html',
  '/statics/style.css',
  '/statics/script.js',
  '/manifest.json',
  '/favicon.ico',
  '/statics/signage-192.png',
  '/statics/signage-512.png',
  '/statics/netzyou_transparent.png',
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
  const requestUrl = new URL(event.request.url);
  if (
    requestUrl.origin !== self.location.origin ||
    requestUrl.pathname === '/api/settings'
  ) {
    return;
  }

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
