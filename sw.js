const CACHE = "roadmap-dashboard-v2";
const CORE_FILES = [
  "index.html", "map.html", "advancements.html", "timeline.html",
  "style.css", "nav.js", "manifest.json",
  "icons/icon-192.png", "icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(CORE_FILES)));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first for everything, falling back to cache only when offline — this is
// an actively-edited site, correctness/freshness matters more than shaving a round
// trip. (Cache-first previously meant an edit to any file wouldn't show up for a
// returning visitor until the cache name changed AND every open tab was closed.)
self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((cache) => cache.put(event.request, copy));
        return res;
      })
      .catch(() => caches.match(event.request))
  );
});
