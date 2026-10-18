import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

function siteUrlPlugin() {
  return {
    name: 'site-url-transform',
    transformIndexHtml(html) {
      const siteUrl = (process.env.VITE_SITE_URL || '').trim().replace(/\/+$/, '');
      if (!siteUrl) {
        return html;
      }
      const extraTags = [
        `<link rel="canonical" href="${siteUrl}/" />`,
        `<meta property="og:url" content="${siteUrl}/" />`,
      ].join('\n    ');

      let modified = html.replace('</head>', `    ${extraTags}\n  </head>`);
      modified = modified.replace(/content="\/og-image\.jpg"/g, `content="${siteUrl}/og-image.jpg"`);
      return modified;
    },
  };
}

export default defineConfig({
  plugins: [react(), siteUrlPlugin()],
  esbuild: {
    // Strip console.log, console.debug, and console.info in production output while preserving console.error and console.warn
    pure: ['console.log', 'console.debug', 'console.info'],
  },
  build: {
    sourcemap: false,
  },
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  preview: {
    port: 4173,
    headers: {
      'X-Content-Type-Options': 'nosniff',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
      'X-Frame-Options': 'SAMEORIGIN',
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' https://accounts.google.com/gsi/client; style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com data:; img-src 'self' data: blob:; frame-src 'self' https://accounts.google.com/gsi/ blob:; connect-src 'self' https://accounts.google.com/gsi/; object-src blob:; base-uri 'self'; form-action 'self' https://www.overleaf.com; frame-ancestors 'self';",
    }
  }
});
