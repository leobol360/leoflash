/* Minimal service worker.

   Its only job is to make LeoFlash installable as a home-screen app
   (Chromium needs a registered worker with a fetch handler before it
   will offer "Add to Home Screen" / fire `beforeinstallprompt`).

   It deliberately does NOT cache anything: every request goes straight
   to the network, so you always get the latest deploy — no stale app. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  /* pass-through: let the browser handle the request normally */
});
