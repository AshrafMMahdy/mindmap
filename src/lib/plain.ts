/** Deep-clone to a plain, non-reactive object. Vue reactive Proxies cannot be
 *  structured-cloned (IndexedDB) and confuse simple-mind-map's data handling,
 *  so we strip reactivity at the storage/engine boundary. All our data is
 *  JSON-serialisable (text, numbers, booleans, nested arrays/objects, data
 *  URLs), so a JSON round-trip is the simplest robust de-proxy. */
export function plain<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T
}
