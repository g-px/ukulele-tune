/** Register the service worker only where it can work: the normal build over http(s). */
export function registerServiceWorker(): void {
  if (!__PWA__ || !import.meta.env.PROD) return;
  if (!("serviceWorker" in navigator) || !location.protocol.startsWith("http")) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js", { scope: "./" }).catch((e: unknown) => {
      console.warn("[ukulele-tune] service worker registration failed", e);
    });
  });
}
