import assert from 'node:assert/strict';
import {
  clearCompileCache,
  getCachedPdf,
  getCompileCacheSize,
  hashTex,
  setCachedPdf,
} from './compileCache.js';
import { compileLatexPdf } from './compilerEngine.js';

clearCompileCache();

const originalFetch = globalThis.fetch;
const originalDocument = globalThis.document;
let fetchCalls = 0;
globalThis.fetch = async () => {
  fetchCalls += 1;
  return { ok: true, blob: async () => new Blob(['compiled-pdf']) };
};
globalThis.document = {
  body: { appendChild() {}, removeChild() {} },
  createElement: () => ({ click() {} }),
};

const firstCompile = await compileLatexPdf('network source', 'resume');
const secondCompile = await compileLatexPdf('network source', 'resume');
assert.equal(fetchCalls, 1, 'An unchanged .tex source should skip the second network call');
assert.equal(firstCompile.url, secondCompile.url, 'A cache hit should reuse the displayed PDF URL');
assert.equal(secondCompile.fromCache, true, 'The second compile should report a cache hit');
clearCompileCache();
globalThis.fetch = originalFetch;
globalThis.document = originalDocument;

const sourceA = await hashTex('exact source A');
const sourceB = await hashTex('exact source B');
const pdfA = { blob: new Blob(['pdf-a']), url: 'blob:pdf-a' };

assert.equal(getCachedPdf(sourceA), null, 'A cache miss should return null');
setCachedPdf(sourceA, pdfA);
assert.deepEqual(getCachedPdf(sourceA), pdfA, 'A cache hit should return the stored PDF');
assert.equal(getCachedPdf(sourceB), null, 'A different .tex hash should miss the cache');

for (let i = 0; i < 6; i += 1) {
  setCachedPdf(await hashTex(`source-${i}`), { blob: new Blob([`pdf-${i}`]), url: `blob:pdf-${i}` });
}
assert.equal(getCompileCacheSize(), 5, 'The session cache should retain only the last five entries');

clearCompileCache();
assert.equal(getCompileCacheSize(), 0, 'Signing out should clear the in-memory cache');
console.log('✅ Compile cache hit, miss, five-entry limit, and clear behavior passed.');
