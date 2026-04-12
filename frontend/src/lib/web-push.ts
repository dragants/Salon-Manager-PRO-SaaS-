/** Pretvara Base64 URL VAPID ključ u `ArrayBuffer` za PushManager.subscribe */
export function applicationServerKeyFromVapidBase64(base64String: string): ArrayBuffer {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const out = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) {
    out[i] = rawData.charCodeAt(i);
  }
  return out.buffer.slice(out.byteOffset, out.byteOffset + out.byteLength);
}
