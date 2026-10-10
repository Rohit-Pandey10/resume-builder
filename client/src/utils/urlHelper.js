/**
 * URL Sanitization & Display Label Formatter Utility
 * Strips markdown link syntax, tracking query parameters, and generates ATS-compliant display labels.
 */

/**
 * Strips markdown link syntax [label](url), removes tracking params and trailing slashes,
 * and ensures a protocol (https://) is present for valid \href targets.
 *
 * @param {string} input - Raw URL or markdown link string
 * @returns {string} - Clean, canonical URL target
 */
export function sanitizeUrl(input) {
  if (!input || typeof input !== 'string') return '';
  let url = input.trim();
  if (!url) return '';

  const lowerRaw = url.toLowerCase();
  if (lowerRaw.startsWith('javascript:') || lowerRaw.startsWith('data:') || lowerRaw.startsWith('vbscript:') || lowerRaw.startsWith('file:')) {
    return '';
  }

  // Allow mailto: directly
  if (lowerRaw.startsWith('mailto:')) {
    return url;
  }

  // 1. If formatted as markdown [text](https://...), extract the inner URL
  const mdMatch = url.match(/\[.*?\]\((https?:\/\/[^\s)]+)\)/i);
  if (mdMatch) {
    url = mdMatch[1];
  } else {
    // Handle markdown with non-http link or [text](url)
    const mdGeneric = url.match(/\[.*?\]\(([^\s)]+)\)/);
    if (mdGeneric) {
      url = mdGeneric[1];
    } else {
      // Handle bare brackets like [https://example.com]
      const bracketMatch = url.match(/^\[(.*?)\]$/);
      if (bracketMatch) {
        url = bracketMatch[1];
      }
    }
  }

  // 2. Remove common AI / UTM query trackers (like ?utm_source=gemini, &utm_medium=..., etc.)
  try {
    const hasProtocol = /^https?:\/\//i.test(url);
    const parsed = new URL(hasProtocol ? url : `https://${url}`);

    // Strip tracking parameters
    const trackingParams = [
      'utm_source',
      'utm_medium',
      'utm_campaign',
      'utm_term',
      'utm_content',
      'fbclid',
      'gclid',
      'ref',
      'source',
    ];

    trackingParams.forEach((param) => parsed.searchParams.delete(param));

    // Also remove any parameter that starts with utm_
    const allKeys = Array.from(parsed.searchParams.keys());
    allKeys.forEach((key) => {
      if (key.toLowerCase().startsWith('utm_')) {
        parsed.searchParams.delete(key);
      }
    });

    // Reconstruct clean URL without trailing slash
    const search = parsed.searchParams.toString();
    const cleanPath = parsed.pathname.replace(/\/+$/, '');
    url = `${parsed.origin}${cleanPath}${search ? `?${search}` : ''}`;
  } catch (_e) {
    // Fallback if not a strict full URL
    url = url.split('?')[0].replace(/\/+$/, '');
  }

  // Ensure https:// prefix if protocol is completely missing
  if (url && !/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }

  return url;
}

/**
 * Extracts a compact, ATS-standard display label from a URL
 * e.g., "https://linkedin.com/in/rohit-pandey" -> "linkedin/rohit-pandey"
 * e.g., "https://github.com/rohit-pandey" -> "github/rohit-pandey"
 * e.g., "https://rohit-pandey10.vercel.app/" -> "portfolio"
 *
 * @param {string} url - URL or markdown link string
 * @param {'link'|'linkedin'|'github'|'portfolio'|''} [type=''] - Context type
 * @returns {string} - Clean compact display label
 */
export function getDisplayUrl(url, type = '') {
  if (!url) return '';
  const clean = sanitizeUrl(url);
  if (!clean) return '';

  try {
    const parsed = new URL(clean.startsWith('http') ? clean : `https://${clean}`);
    const pathname = parsed.pathname.replace(/\/+$/, '');

    // LinkedIn: Extract username -> "linkedin/username"
    if (type === 'linkedin' || clean.includes('linkedin.com')) {
      const match = pathname.match(/\/in\/([^/]+)/);
      if (match && match[1]) {
        return `linkedin/${match[1]}`;
      }
      return 'LinkedIn';
    }

    // GitHub: Extract handle -> "github/username"
    if (type === 'github' || clean.includes('github.com')) {
      const handle = pathname.split('/').filter(Boolean)[0];
      if (handle) {
        return `github/${handle}`;
      }
      return 'GitHub';
    }

    // Portfolio / Personal Site: Short label to prevent header line wrap
    if (type === 'portfolio') {
      return 'portfolio';
    }

    // Default fallback: Domain name
    return parsed.hostname.replace(/^www\./, '');
  } catch (_e) {
    return clean.replace(/^https?:\/\/(www\.)?/, '').replace(/\/+$/, '');
  }
}
