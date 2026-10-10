/**
 * JakeResume Builder - Remote compilation and export utilities
 */

/**
 * Direct .tex download
 * Creates a client-side Blob and triggers an instant download.
 *
 * @param {string} texString - Raw LaTeX source code
 * @param {string} filename - Target filename (without extension)
 */
export function downloadTexFile(texString, filename = 'resume') {
  const cleanName = (filename || 'resume').replace(/[^a-zA-Z0-9_-]/g, '_');
  const blob = new Blob([texString], { type: 'text/x-tex;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cleanName}.tex`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/**
 * Open directly in Overleaf
 * Submits an HTML form with hidden 'snip' input targeting _blank.
 *
 * @param {string} texString - Raw LaTeX source code
 */
export function openInOverleaf(texString) {
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = 'https://www.overleaf.com/docs';
  form.target = '_blank';

  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'snip';
  input.value = texString;

  form.appendChild(input);
  document.body.appendChild(form);
  form.submit();
  form.remove();
}

export function downloadPdfFile(pdfUrl, filename = 'resume') {
  const cleanName = (filename || 'resume').replace(/[^a-zA-Z0-9_-]/g, '_');
  const a = document.createElement('a');
  a.href = pdfUrl;
  a.download = `${cleanName}.pdf`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Tier 1 (Primary Flow): Server-side proxy compilation bypassing browser CORS
 *
 * @param {string} texString - Raw LaTeX source code
 * @param {string} filename - Profile / download filename
 * @param {number} timeoutMs - Timeout threshold in milliseconds
 * @returns {Promise<{ success: boolean, blob?: Blob, url?: string }>}
 */
import { REMOTE_COMPILE_TIMEOUT_MS, REMOTE_COMPILE_TIMEOUT_SECONDS } from './compilerConfig.js';
import { getCachedPdf, hashTex, setCachedPdf } from './compileCache.js';

export { REMOTE_COMPILE_TIMEOUT_MS } from './compilerConfig.js';

export async function compileLatexPdf(texString, filename = 'resume', timeoutMs = REMOTE_COMPILE_TIMEOUT_MS) {
  const cleanName = (filename || 'resume').replace(/[^a-zA-Z0-9_-]/g, '_');
  const texHash = await hashTex(texString);
  const cachedPdf = getCachedPdf(texHash);
  if (cachedPdf) {
    return { ...cachedPdf, success: true, fromCache: true };
  }

  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    const res = await fetch('/api/compile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ tex: texString }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      let errorLog = 'Compilation failed.';
      try {
        const errorJson = await res.json();
        errorLog = errorJson.error || errorLog;
      } catch {
        errorLog = await res.text().catch(() => 'Compilation failed.');
      }
      const error = new Error(`Compilation failed with status ${res.status}`);
      error.status = res.status;
      error.log = errorLog;
      throw error;
    }

    const pdfBlob = await res.blob();
    const pdfUrl = URL.createObjectURL(pdfBlob);
    setCachedPdf(texHash, { blob: pdfBlob, url: pdfUrl });

    // Trigger download
    const a = document.createElement('a');
    a.href = pdfUrl;
    a.download = `${cleanName}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    return {
      success: true,
      blob: pdfBlob,
      url: pdfUrl,
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (timedOut || err.name === 'AbortError') {
      const timeoutError = new Error(`Compilation timed out (>${REMOTE_COMPILE_TIMEOUT_SECONDS} seconds). The cloud compiler took too long to finish.`);
      timeoutError.isTimeout = true;
      timeoutError.log =
        `Compilation exceeded the ${REMOTE_COMPILE_TIMEOUT_SECONDS}-second remote compiler limit.\n\n` +
        'Network latency or queue congestion on the public compiler can cause delays.';
      throw timeoutError;
    }
    throw err;
  }
}
