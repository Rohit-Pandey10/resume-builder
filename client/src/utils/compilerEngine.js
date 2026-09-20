/**
 * JakeResume Builder - 3-Tier Compilation Engine & Fallback Utility
 */

/**
 * Tier 2 (Fallback 1): Direct .tex Download
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
 * Tier 3 (Fallback 2): Open directly in Overleaf
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

/**
 * Tier 1 (Primary Flow): Server-side proxy compilation bypassing browser CORS
 *
 * @param {string} texString - Raw LaTeX source code
 * @param {string} filename - Profile / download filename
 * @param {number} timeoutMs - Timeout threshold in milliseconds (default: 10000ms)
 * @returns {Promise<{ success: boolean, blob?: Blob, url?: string }>}
 */
export async function compileLatexPdf(texString, filename = 'resume', timeoutMs = 10000) {
  const cleanName = (filename || 'resume').replace(/[^a-zA-Z0-9_-]/g, '_');
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
      const timeoutError = new Error('Compilation timed out (>10 seconds). The cloud compiler took too long to finish.');
      timeoutError.isTimeout = true;
      timeoutError.log =
        'Compilation exceeded the timeout threshold on the compiler.\n\n' +
        'Network latency or queue congestion on the public compiler can cause delays.\n' +
        'Please use Fallback 1 to download the raw .tex file or Fallback 2 to compile instantly in Overleaf.';
      throw timeoutError;
    }
    throw err;
  }
}
