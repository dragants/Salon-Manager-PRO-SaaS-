/** Za <a href="tel:…"> — mobilni poziv jednim dodirom. */
export function telHref(raw: string | null | undefined): string | null {
  if (raw == null || !String(raw).trim()) {
    return null;
  }
  const cleaned = String(raw).trim().replace(/[\s\-().]/g, "");
  if (!cleaned) {
    return null;
  }
  return `tel:${cleaned}`;
}

/** Google Maps pretraga adrese (radi u browseru i u aplikaciji mape na telefonu). */
export function mapsSearchUrl(
  address: string | null | undefined
): string | null {
  if (address == null || !String(address).trim()) {
    return null;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(address).trim())}`;
}
