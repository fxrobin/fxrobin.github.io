// Service worker: the whole game is kept on the device, so it starts and plays offline once
// installed (Android: "Install app" / "Add to Home screen"). Network first, so an online
// visit always gets the latest version (and refreshes the copy); the copy answers offline.
const CACHE = '944-turbo-v1';
const FILES = [
  './', 'index.html', 'main.js', 'audio.js', 'touch.js', 'engine-worklet.js', 'game.wasm',
  'manifest.webmanifest', 'icons/icon-192.png', 'icons/icon-512.png',
  'icons/maskable-192.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png',
  'music/neon-sign-circuit.ogg', 'music/neon-sign-circuit.mp3',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok && res.type === 'basic' && !req.headers.has('range')) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true })
        .then((hit) => hit || caches.match('index.html'))),
  );
});
