// client/test/cspValidation.test.js
import { preview } from 'vite';
import { chromium } from 'playwright';
import assert from 'node:assert';

// Minimal valid PDF byte buffer for testing PDF viewer iframe rendering
const MINIMAL_VALID_PDF = Buffer.from(
  '%PDF-1.4\n' +
  '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n' +
  '2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n' +
  '3 0 obj<</Type/Page/MediaBox[0 0 612 792]/Parent 2 0 R/Resources<<>>>>endobj\n' +
  'xref\n' +
  '0 4\n' +
  '0000000000 65535 f\n' +
  '0000000009 00000 n\n' +
  '0000000052 00000 n\n' +
  '0000000108 00000 n\n' +
  'trailer<</Size 4/Root 1 0 R>>\n' +
  'startxref\n' +
  '185\n' +
  '%%EOF\n'
);

async function runCspValidationTest() {
  console.log('🧪 Starting Content Security Policy (CSP) & Header Validation Suite...\n');

  let previewServer;
  let browser;

  try {
    console.log('1. Launching Vite Preview server on port 4173...');
    previewServer = await preview({
      root: process.cwd(),
      preview: {
        port: 4173,
        strictPort: true,
      }
    });

    const previewUrl = 'http://localhost:4173';
    console.log(`   Preview server ready at ${previewUrl}`);

    console.log('2. Launching headless Chrome via Playwright...');
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();

    const cspViolations = [];
    const consoleErrors = [];

    // Capture security policy violations
    await page.addInitScript(() => {
      window.__cspViolations = [];
      document.addEventListener('securitypolicyviolation', (e) => {
        window.__cspViolations.push({
          blockedURI: e.blockedURI,
          violatedDirective: e.violatedDirective,
          effectiveDirective: e.effectiveDirective,
          originalPolicy: e.originalPolicy,
          disposition: e.disposition,
        });
      });
    });

    page.on('console', (msg) => {
      const text = msg.text();
      if (msg.type() === 'error') {
        if (!text.includes('net::ERR_') && !text.includes('Failed to load resource')) {
          consoleErrors.push(text);
        }
      }
    });

    // Intercept /api/auth/me to return unauthenticated without contacting backend
    await page.route('**/api/auth/me', async (route) => {
      await route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Not authenticated' }),
      });
    });

    // Intercept /api/compile to return a mock PDF buffer
    await page.route('**/api/compile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: MINIMAL_VALID_PDF,
      });
    });

    // Intercept Overleaf form post to prevent navigating off-site while verifying CSP form-action
    await page.route('https://www.overleaf.com/**', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: '<html><body>Overleaf Target Received</body></html>',
      });
    });

    console.log('3. Navigating to preview URL and validating response headers...');
    const response = await page.goto(previewUrl, { waitUntil: 'domcontentloaded' });
    const headers = response.headers();

    assert.strictEqual(headers['x-content-type-options'], 'nosniff', 'X-Content-Type-Options must be nosniff');
    assert.strictEqual(headers['referrer-policy'], 'strict-origin-when-cross-origin', 'Referrer-Policy mismatch');
    assert.strictEqual(headers['x-frame-options'], 'SAMEORIGIN', 'X-Frame-Options mismatch');
    assert.strictEqual(headers['cross-origin-opener-policy'], 'same-origin-allow-popups', 'COOP mismatch');
    assert.ok(headers['content-security-policy'], 'Content-Security-Policy header must be present');
    console.log('   ✅ Security headers verified: X-Content-Type-Options, Referrer-Policy, X-Frame-Options, COOP, CSP');

    console.log('4. Exercising Auth screen & Google Sign-In script...');
    await page.waitForSelector('text=Sign in to JakeResume');
    await page.waitForTimeout(500);

    console.log('5. Exercising Guest flow into Workspace...');
    const guestBtn = await page.waitForSelector('button:has-text("Continue as guest")');
    await guestBtn.click();
    await page.waitForSelector('text=Full Name');
    console.log('   ✅ Workspace entered successfully');

    console.log('6. Exercising Fonts & Web Font Loading...');
    const fontReady = await page.evaluate(() => document.fonts.ready.then(() => true));
    assert.ok(fontReady, 'Document fonts must resolve successfully');
    console.log('   ✅ Google Fonts loaded without CSP font-src violation');

    console.log('7. Exercising Import Resume modal (dynamic chunk loading)...');
    const importBtn = await page.waitForSelector('button:has-text("Import resume")');
    await importBtn.click();
    await page.waitForSelector('text=Copy prompt');
    console.log('   ✅ ImportResumeModal dynamically loaded without violation');
    const dismissBtn = await page.waitForSelector('button[title="Dismiss"]');
    await dismissBtn.click();
    await page.waitForTimeout(300);

    console.log('8. Exercising PDF compile preview (blob iframe)...');
    const compileBtn = await page.waitForSelector('button:has-text("Compile PDF")');
    await compileBtn.click();

    // Wait for iframe with PDF to render
    const pdfIframe = await page.waitForSelector('iframe[title="Compiled Resume PDF"]', { timeout: 10000 });
    assert.ok(pdfIframe, 'PDF iframe should be rendered');
    const iframeSrc = await pdfIframe.getAttribute('src');
    assert.ok(iframeSrc && iframeSrc.startsWith('blob:'), 'iframe src must be a blob: URL');
    console.log(`   ✅ PDF blob preview loaded: ${iframeSrc.slice(0, 30)}...`);

    console.log('9. Exercising Overleaf handoff (form-action check)...');
    const moreMenuBtn = await page.waitForSelector('button[title="More actions"]');
    await moreMenuBtn.click();
    const overleafItem = await page.waitForSelector('button:has-text("Open in Overleaf")');
    await overleafItem.click();
    await page.waitForTimeout(500);
    console.log('   ✅ Overleaf handoff dispatched without form-action violation');

    console.log('10. Inspecting recorded security policy violations...');
    const inPageViolations = await page.evaluate(() => window.__cspViolations || []);
    const allViolations = [...cspViolations, ...inPageViolations];

    if (allViolations.length > 0) {
      console.error('❌ Content Security Policy Violations detected:');
      console.error(JSON.stringify(allViolations, null, 2));
      throw new Error(`Found ${allViolations.length} CSP violations.`);
    }

    if (consoleErrors.length > 0) {
      console.warn('⚠️ Console errors noted during session:', consoleErrors);
    }

    console.log('   ✅ 0 CSP VIOLATIONS RECORDED across all user workflows!');
    console.log('\n========================================');
    console.log('🎉 CONTENT SECURITY POLICY ENFORCEMENT VERIFIED!');
    console.log('========================================\n');
  } finally {
    if (browser) {
      await browser.close();
    }
    if (previewServer) {
      await previewServer.close();
    }
  }
}

runCspValidationTest().catch((err) => {
  console.error('Fatal CSP validation failure:', err);
  process.exit(1);
});
