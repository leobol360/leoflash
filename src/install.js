/* Home-screen install helper.

   Captures the browser's `beforeinstallprompt` event so a button in
   Settings can trigger the native "Add to Home Screen" flow, and knows
   when that isn't possible (already installed, or iOS — where Apple
   gives no API and the user must use the Share sheet). */

let deferredPrompt =
  (typeof window !== "undefined" && window.__bip) || null;

const listeners = new Set();
const notify = () => listeners.forEach((fn) => fn());

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (event) => {
    event.preventDefault();
    deferredPrompt = event;
    notify();
  });
  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    notify();
  });
}

export const InstallPrompt = {
  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },

  // the native prompt is ready to show
  canPrompt() {
    return !!deferredPrompt;
  },

  // already running as an installed app
  isStandalone() {
    if (typeof window === "undefined") return false;
    return (
      window.matchMedia?.("(display-mode: standalone)").matches === true ||
      window.navigator.standalone === true
    );
  },

  // iOS / iPadOS — no install API, only the Share-sheet route
  isIOS() {
    if (typeof window === "undefined") return false;
    const ua = window.navigator.userAgent;
    return (
      /iphone|ipod|ipad/i.test(ua) ||
      (window.navigator.platform === "MacIntel" &&
        window.navigator.maxTouchPoints > 1)
    );
  },

  // returns "accepted" | "dismissed" | "unavailable"
  async promptInstall() {
    if (!deferredPrompt) return "unavailable";
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") deferredPrompt = null;
      notify();
      return outcome;
    } catch {
      deferredPrompt = null;
      notify();
      return "unavailable";
    }
  },
};
