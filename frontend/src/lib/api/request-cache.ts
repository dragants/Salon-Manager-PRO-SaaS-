/**
 * Kratak in-memory keš za idempotentne GET pozive (smanjuje mrežni šum i dupla učitavanja).
 * Nakon mutacija pozovi `invalidateApiCache` da UI odmah vidi sveže podatke.
 */

type Entry = { expires: number; promise: Promise<unknown> };

const store = new Map<string, Entry>();
const MAX_KEYS = 120;

function trimCache(): void {
  if (store.size <= MAX_KEYS) {
    return;
  }
  const now = Date.now();
  for (const [k, v] of store) {
    if (v.expires < now) {
      store.delete(k);
    }
  }
  if (store.size <= MAX_KEYS) {
    return;
  }
  const sorted = [...store.entries()].sort((a, b) => a[1].expires - b[1].expires);
  const drop = store.size - Math.floor(MAX_KEYS * 0.85);
  for (let i = 0; i < drop && i < sorted.length; i++) {
    store.delete(sorted[i][0]);
  }
}

export function cachedGet<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const hit = store.get(key);
  if (hit && hit.expires > now) {
    return hit.promise as Promise<T>;
  }
  const p = fetcher().catch((e) => {
    store.delete(key);
    throw e;
  });
  store.set(key, { expires: now + ttlMs, promise: p });
  trimCache();
  return p as Promise<T>;
}

function stableParamsKey(obj: Record<string, unknown>): string {
  const keys = Object.keys(obj).sort();
  return JSON.stringify(
    keys.reduce<Record<string, unknown>>((acc, k) => {
      acc[k] = obj[k];
      return acc;
    }, {})
  );
}

export function appointmentsCacheKey(
  params: Record<string, string | undefined>
): string {
  return `appointments:${stableParamsKey(params as Record<string, unknown>)}`;
}

/** Briše sve ključeve za koje predicate vrati true. */
export function invalidateApiCache(match: (key: string) => boolean): void {
  for (const k of [...store.keys()]) {
    if (match(k)) {
      store.delete(k);
    }
  }
}

/** Uobičajene grupe nakon mutacija. */
export function invalidateByScope(
  scope: "stats" | "calendar" | "clients" | "services" | "all"
): void {
  if (scope === "all") {
    store.clear();
    return;
  }
  if (scope === "stats") {
    invalidateApiCache(
      (k) =>
        k === "analytics" ||
        k === "dashboard" ||
        k === "org-settings" ||
        k.startsWith("appointments:")
    );
    return;
  }
  if (scope === "calendar") {
    invalidateApiCache((k) => k.startsWith("appointments:"));
    return;
  }
  if (scope === "clients") {
    invalidateApiCache((k) => k === "clients");
    invalidateByScope("stats");
    return;
  }
  if (scope === "services") {
    invalidateApiCache((k) => k === "services");
    invalidateByScope("stats");
  }
}
