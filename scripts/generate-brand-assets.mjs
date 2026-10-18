import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'client', 'public');
const markSvgPath = path.join(rootDir, 'client', 'src', 'brand', 'mark.svg');

// Dynamically resolve playwright from client/node_modules or root
let chromium;
try {
  const pw = await import('../client/node_modules/playwright/index.js');
  chromium = pw.chromium || pw.default?.chromium;
} catch {
  const pw = await import('playwright');
  chromium = pw.chromium || pw.default?.chromium;
}

function createIco(pngBuffers) {
  const count = pngBuffers.length;
  const headerSize = 6 + count * 16;
  let totalSize = headerSize;
  for (const { buffer } of pngBuffers) {
    totalSize += buffer.length;
  }
  const out = Buffer.alloc(totalSize);

  // ICONDIR
  out.writeUInt16LE(0, 0); // reserved
  out.writeUInt16LE(1, 2); // type: 1 = icon
  out.writeUInt16LE(count, 4); // count

  let offset = headerSize;
  let entryOffset = 6;

  for (const { width, height, buffer } of pngBuffers) {
    out.writeUInt8(width === 256 ? 0 : width, entryOffset);
    out.writeUInt8(height === 256 ? 0 : height, entryOffset + 1);
    out.writeUInt8(0, entryOffset + 2); // color count
    out.writeUInt8(0, entryOffset + 3); // reserved
    out.writeUInt16LE(1, entryOffset + 4); // planes
    out.writeUInt16LE(32, entryOffset + 6); // bpp
    out.writeUInt32LE(buffer.length, entryOffset + 8); // size
    out.writeUInt32LE(offset, entryOffset + 12); // offset

    buffer.copy(out, offset);
    offset += buffer.length;
    entryOffset += 16;
  }

  return out;
}

async function generate() {
  console.log('🎨 Generating brand assets...');

  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true });
  }

  const markSvg = fs.readFileSync(markSvgPath, 'utf8');

  // 1. favicon.svg (exact artwork)
  fs.writeFileSync(path.join(publicDir, 'favicon.svg'), markSvg, 'utf8');
  console.log('  ✅ Saved favicon.svg');

  // 2. site.webmanifest
  const webmanifest = {
    name: 'JakeResume',
    short_name: 'JakeResume',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
    theme_color: '#FBF7F3',
    background_color: '#FBF7F3',
    display: 'standalone',
    start_url: '/',
  };
  fs.writeFileSync(
    path.join(publicDir, 'site.webmanifest'),
    JSON.stringify(webmanifest, null, 2) + '\n',
    'utf8'
  );
  console.log('  ✅ Saved site.webmanifest');

  // Launch Playwright Chrome
  const browser = await chromium.launch({ channel: 'chrome', headless: true });
  const page = await browser.newPage();

  // Helper to render SVG at size
  async function renderSvgToPng(svgContent, width, height, options = {}) {
    await page.setViewportSize({ width, height });
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body {
      width: ${width}px;
      height: ${height}px;
      overflow: hidden;
      background: ${options.bg || 'transparent'};
      display: flex;
      align-items: center;
      justify-content: center;
    }
    svg {
      width: 100%;
      height: 100%;
      display: block;
    }
  </style>
</head>
<body>
  ${svgContent}
</body>
</html>`;
    await page.setContent(html, { waitUntil: 'load' });
    return await page.screenshot({ omitBackground: !options.bg });
  }

  // 3. icon-192.png & icon-512.png
  const png192 = await renderSvgToPng(markSvg, 192, 192);
  fs.writeFileSync(path.join(publicDir, 'icon-192.png'), png192);
  console.log('  ✅ Saved icon-192.png');

  const png512 = await renderSvgToPng(markSvg, 512, 512);
  fs.writeFileSync(path.join(publicDir, 'icon-512.png'), png512);
  console.log('  ✅ Saved icon-512.png');

  // 4. apple-touch-icon.png 180x180 (tile fills the canvas, no transparency)
  const appleSvg = markSvg.replace('rx="14.08"', 'rx="0"');
  const applePng = await renderSvgToPng(appleSvg, 180, 180, { bg: '#CC4727' });
  fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), applePng);
  console.log('  ✅ Saved apple-touch-icon.png (180x180 solid tile)');

  // 5. favicon.ico (16, 32, 48 PNG frames)
  const png16 = await renderSvgToPng(markSvg, 16, 16);
  const png32 = await renderSvgToPng(markSvg, 32, 32);
  const png48 = await renderSvgToPng(markSvg, 48, 48);

  const icoBuffer = createIco([
    { width: 16, height: 16, buffer: png16 },
    { width: 32, height: 32, buffer: png32 },
    { width: 48, height: 48, buffer: png48 },
  ]);
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), icoBuffer);
  console.log('  ✅ Saved favicon.ico (16/32/48 multi-frame PNG-in-ICO container)');

  await browser.close();
  console.log('🎉 Brand icon assets generated successfully!');
}

generate().catch((err) => {
  console.error('Fatal brand asset generation failure:', err);
  process.exit(1);
});
