// Lazy data loading with caching
// Large JSON files (>500KB) are loaded on demand instead of statically imported.
// Each loader caches the Promise itself so the data is fetched only once,
// even if multiple callers invoke the loader concurrently.
// On failure the cache entry is evicted so a retry can succeed.

const cache = new Map()

function cachedImport(key, loader) {
  if (!cache.has(key)) {
    const promise = loader().then(m => m.default).catch(err => {
      cache.delete(key) // evict on failure so next call retries
      throw err
    })
    cache.set(key, promise)
  }
  return cache.get(key)
}

export function loadMorphologyDB() {
  return cachedImport('morphDB', () => import('../data/quran-morphology-db.json'))
}

export function loadQuranRasm() {
  return cachedImport('quranRasm', () => import('../data/quran-rasm.json'))
}

export function loadQuranUthmani() {
  return cachedImport('quranUthmani', () => import('../data/quran-uthmani.json'))
}

export function loadQuranVocalized() {
  return cachedImport('quranVocalized', () => import('../data/quran-vocalized.json'))
}

export function loadRootFrequencyComplete() {
  return cachedImport('rootFreqComplete', () => import('../data/root-frequency-complete.json'))
}
