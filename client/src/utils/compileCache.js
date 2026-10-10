const MAX_CACHE_ENTRIES = 5;
const pdfCache = new Map();

export async function hashTex(texString) {
  const bytes = new TextEncoder().encode(texString);
  const digest = await globalThis.crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function getCachedPdf(texHash) {
  const cached = pdfCache.get(texHash);
  if (!cached) return null;
  pdfCache.delete(texHash);
  pdfCache.set(texHash, cached);
  return cached;
}

export function setCachedPdf(texHash, value) {
  const previous = pdfCache.get(texHash);
  if (previous && previous.url !== value.url && typeof URL !== 'undefined') {
    URL.revokeObjectURL(previous.url);
  }

  pdfCache.delete(texHash);
  pdfCache.set(texHash, value);
  while (pdfCache.size > MAX_CACHE_ENTRIES) {
    const oldestHash = pdfCache.keys().next().value;
    const oldest = pdfCache.get(oldestHash);
    if (oldest && typeof URL !== 'undefined') URL.revokeObjectURL(oldest.url);
    pdfCache.delete(oldestHash);
  }
}

export function clearCompileCache() {
  if (typeof URL !== 'undefined') {
    for (const entry of pdfCache.values()) URL.revokeObjectURL(entry.url);
  }
  pdfCache.clear();
}

export function getCompileCacheSize() {
  return pdfCache.size;
}
