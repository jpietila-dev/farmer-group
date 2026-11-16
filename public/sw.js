// Farmer Group — minimal service worker.
// Only intercepts page navigations (network-first, with a cached shell as an
// offline fallback). Everything else — the hashed JS/CSS bundles and all
// Supabase API calls — goes straight to the network untouched, so there is no
// risk of serving a stale app build after a deploy.
const SHELL = "fg-shell-v1";

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (e) => e.waitUntil((async () => {
  const keys = await caches.keys();
  await Promise.all(keys.filter(k => k !== SHELL).map(k => caches.delete(k)));
  await self.clients.claim();
})()));

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.mode !== "navigate") return; // let the browser handle assets + API normally
  e.respondWith((async () => {
    try {
      const net = await fetch(req);
      try { const c = await caches.open(SHELL); c.put("/", net.clone()); } catch (_) {}
      return net;
    } catch (_) {
      const cache = await caches.open(SHELL);
      const cached = await cache.match("/");
      return cached || Response.error();
    }
  })());
});
