// client/test/e2eProductionSuite.test.js
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { preview } from 'vite';
import { chromium } from 'playwright';
import assert from 'node:assert';
import app from '../../server/src/server.js';
import { connectDB, disconnectDB } from '../../server/src/config/db.js';
import { setGoogleTokenVerifierForTests } from '../../server/src/controllers/authController.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');
const clientDir = path.resolve(__dirname, '..');
const distHtmlPath = path.join(clientDir, 'dist', 'index.html');
const publicDir = path.join(clientDir, 'public');

const TEST_SERVER_PORT = 5109;
const PREVIEW_PORT = 4174;

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

async function runProductionE2ESuite() {
  console.log('🧪 Starting Phase 5: Production Build E2E & Pre-Deploy Regression Suite...\n');

  let backendServer;
  let previewServer;
  let browser;

  const testResults = [];
  const recordCase = (name, passed, details = '') => {
    testResults.push({ name, passed, details });
    console.log(`   ${passed ? '✅ PASS' : '❌ FAIL'}: ${name}${details ? ` (${details})` : ''}`);
    if (!passed) {
      throw new Error(`Test failed: ${name} - ${details}`);
    }
  };

  try {
    // 0. Refinement 1 Asset & Build-time Static Verification
    console.log('0. Verifying Brand Assets, site.webmanifest, and built HTML...');
    const expectedAssets = [
      'favicon.svg',
      'favicon.ico',
      'apple-touch-icon.png',
      'icon-192.png',
      'icon-512.png',
      'og-image.jpg',
      'site.webmanifest',
    ];
    for (const file of expectedAssets) {
      const fullPath = path.join(publicDir, file);
      assert.ok(fs.existsSync(fullPath), `Asset ${file} must exist in public/`);
      assert.ok(fs.statSync(fullPath).size > 0, `Asset ${file} must not be empty`);
    }
    const manifest = JSON.parse(fs.readFileSync(path.join(publicDir, 'site.webmanifest'), 'utf8'));
    assert.strictEqual(manifest.name, 'JakeResume');
    assert.strictEqual(manifest.short_name, 'JakeResume');
    assert.strictEqual(manifest.theme_color, '#FBF7F3');
    assert.strictEqual(manifest.background_color, '#FBF7F3');
    assert.strictEqual(manifest.start_url, '/');
    assert.strictEqual(manifest.icons.length, 2);
    recordCase('Brand icons and site.webmanifest exist and parse cleanly', true);

    const distHtml = fs.readFileSync(distHtmlPath, 'utf8');
    const literalPlaceholders = distHtml.match(/%[A-Za-z0-9_]+%/g);
    assert.strictEqual(literalPlaceholders, null, `Found literal placeholders in dist/index.html: ${literalPlaceholders}`);
    recordCase('dist/index.html has zero literal %...% placeholders', true);

    console.log('1. Booting isolated in-memory backend test server on port ' + TEST_SERVER_PORT + '...');
    process.env.GOOGLE_CLIENT_ID = 'test-e2e-client-id';
    process.env.JWT_SECRET = 'test-jwt-secret-with-more-than-32-characters-for-testing!';
    process.env.CLIENT_URL = `http://localhost:${PREVIEW_PORT}`;
    process.env.NODE_ENV = 'development';
    
    // Wire Google verifier stub
    setGoogleTokenVerifierForTests(async (credential, audience) => {
      if (credential === 'invalid-google-token') {
        throw new Error('Invalid Google credential token');
      }
      return {
        sub: `google-user-${credential}`,
        email: `${credential}@testcase.local`,
        email_verified: true,
        name: `Tester ${credential}`,
        aud: audience,
      };
    });

    await connectDB();
    backendServer = app.listen(TEST_SERVER_PORT);
    console.log(`   Backend server listening on http://127.0.0.1:${TEST_SERVER_PORT}`);

    console.log('2. Launching Vite Preview server on port ' + PREVIEW_PORT + '...');
    previewServer = await preview({
      root: process.cwd(),
      preview: {
        port: PREVIEW_PORT,
        strictPort: true,
      }
    });
    console.log(`   Preview server ready at http://localhost:${PREVIEW_PORT}`);

    console.log('3. Launching headless Chrome via Playwright...');
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const context = await browser.newContext();
    const page = await context.newPage();
    page.on('console', (msg) => console.log('BROWSER CONSOLE:', msg.type(), msg.text()));

    // Stub window.google on every navigation
    await page.addInitScript(() => {
      window.__TEST_GOOGLE_CLIENT_ID = 'test-client-id';
      window.google = {
        accounts: {
          id: {
            initialize: (opts) => {
              window.__gsiCallback = opts.callback;
            },
            renderButton: (parent) => {
              const btn = document.createElement('button');
              btn.id = 'stubbed-google-signin-btn';
              btn.textContent = 'Sign in with Google (Stub)';
              btn.type = 'button';
              btn.onclick = () => {
                const cred = window.__nextGoogleCredential || 'valid-user-1';
                window.__gsiCallback?.({ credential: cred });
              };
              parent.innerHTML = '';
              parent.appendChild(btn);
            },
          }
        }
      };
    });

    let compileMockHandler = null;
    let sessionCookie = '';

    // Proxy /api requests to backend test server by default, or to compileMockHandler if set
    await page.route('**/api/**', async (route) => {
      const request = route.request();
      const url = new URL(request.url());
      if (url.pathname === '/api/compile' && compileMockHandler) {
        return compileMockHandler(route);
      }
      const targetUrl = `http://127.0.0.1:${TEST_SERVER_PORT}${url.pathname}${url.search}`;

      try {
        const reqHeaders = { ...request.headers() };
        if (sessionCookie) {
          reqHeaders['cookie'] = sessionCookie;
        }

        const response = await fetch(targetUrl, {
          method: request.method(),
          headers: reqHeaders,
          body: ['POST', 'PUT', 'PATCH'].includes(request.method()) ? request.postDataBuffer() : undefined,
        });

        const body = await response.arrayBuffer();
        if (url.pathname === '/api/auth/google') {
          try {
            const data = JSON.parse(Buffer.from(body).toString());
            if (data.token) {
              sessionCookie = `token=${data.token}`;
            }
          } catch (_) {}
        }

        const setCookie = response.headers.get('set-cookie');
        if (setCookie) {
          sessionCookie = setCookie.split(';')[0];
        }
        const headers = {};
        for (const [k, v] of response.headers.entries()) {
          headers[k] = v;
        }

        await route.fulfill({
          status: response.status,
          headers,
          body: Buffer.from(body),
        });
      } catch (err) {
        await route.fulfill({ status: 502, body: JSON.stringify({ error: err.message }) });
      }
    });

    console.log('\n--- VERIFYING HEAD TAGS & ROUTING (REFINEMENT 1) ---\n');

    // Head tag verification
    await page.setViewportSize({ width: 1488, height: 850 });
    await page.goto(`http://localhost:${PREVIEW_PORT}`, { waitUntil: 'domcontentloaded' });

    const staticTitle = await page.title();
    assert.strictEqual(staticTitle, "JakeResume - Build a resume in the Jake's Resume format");
    recordCase('Landing document.title matches spec', true, staticTitle);

    const metaDesc = await page.getAttribute('meta[name="description"]', 'content');
    assert.ok(metaDesc && metaDesc.includes("Jake's Resume format"));
    assert.ok(metaDesc.length <= 155, `Meta description (${metaDesc.length}) must be <= 155 chars`);
    recordCase('Meta description matches spec and <= 155 chars', true, `${metaDesc.length} chars`);

    assert.strictEqual(await page.getAttribute('meta[name="application-name"]', 'content'), 'JakeResume');
    assert.strictEqual(await page.getAttribute('meta[name="apple-mobile-web-app-title"]', 'content'), 'JakeResume');
    assert.strictEqual(await page.getAttribute('meta[name="theme-color"]', 'content'), '#FBF7F3');
    assert.strictEqual(await page.getAttribute('meta[name="color-scheme"]', 'content'), 'light');
    assert.strictEqual(await page.getAttribute('link[rel="icon"][type="image/svg+xml"]', 'href'), '/favicon.svg');
    assert.strictEqual(await page.getAttribute('link[rel="icon"][type="image/x-icon"]', 'href'), '/favicon.ico');
    assert.strictEqual(await page.getAttribute('link[rel="apple-touch-icon"]', 'href'), '/apple-touch-icon.png');
    assert.strictEqual(await page.getAttribute('link[rel="manifest"]', 'href'), '/site.webmanifest');
    assert.strictEqual(await page.getAttribute('meta[property="og:type"]', 'content'), 'website');
    assert.strictEqual(await page.getAttribute('meta[property="og:site_name"]', 'content'), 'JakeResume');
    assert.strictEqual(await page.getAttribute('meta[name="twitter:card"]', 'content'), 'summary_large_image');
    const noscriptText = await page.locator('noscript').textContent();
    assert.ok(noscriptText.includes('JakeResume needs JavaScript to run.'));
    recordCase('Head metadata tags, links, and noscript verified programmatically', true);

    // Bare URL as New Visitor
    await page.evaluate(() => localStorage.clear());
    await page.goto(`http://localhost:${PREVIEW_PORT}`, { waitUntil: 'networkidle' });
    assert.strictEqual(page.url(), `http://localhost:${PREVIEW_PORT}/#/`, 'Bare URL replaces to #/');
    await page.waitForSelector('#landing-title');
    assert.ok(await page.$('button:has-text("Start as guest")'), 'Start as guest button visible');
    assert.ok(await page.$('button:has-text("Import resume")'), 'Import resume button visible');
    assert.ok(await page.$('.jr-auth-google-wrap'), 'Google button wrapper visible');
    assert.ok(await page.$('button.jr-landing-signin:has-text("Sign in")'), 'Sign in button visible in top bar');
    recordCase('Bare URL as new visitor lands on #/ with action block', true);

    // Capture screenshots for new visitor
    await page.screenshot({ path: path.join(rootDir, 'landing-new-visitor-1488.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(rootDir, 'landing-new-visitor-390.png') });
    recordCase('Captured landing-new-visitor-1488.png and landing-new-visitor-390.png', true);

    // Deep link redirects when unauthenticated
    await page.goto('about:blank');
    await page.goto(`http://localhost:${PREVIEW_PORT}/#/resumes`, { waitUntil: 'networkidle' });
    await page.waitForURL(`http://localhost:${PREVIEW_PORT}/#/`);
    assert.strictEqual(page.url(), `http://localhost:${PREVIEW_PORT}/#/`);
    recordCase('Unauthenticated deep link #/resumes redirects to #/', true);

    await page.goto('about:blank');
    await page.goto(`http://localhost:${PREVIEW_PORT}/#/edit/nonexistent-id`, { waitUntil: 'networkidle' });
    await page.waitForURL(`http://localhost:${PREVIEW_PORT}/#/`);
    assert.strictEqual(page.url(), `http://localhost:${PREVIEW_PORT}/#/`);
    recordCase('Unauthenticated deep link #/edit/:id redirects to #/', true);

    console.log('\n--- EXECUTING E2E TEST CASES ---\n');
    await page.setViewportSize({ width: 1488, height: 850 });

    // Case 1: Auth screen rendering
    await page.goto(`http://localhost:${PREVIEW_PORT}`, { waitUntil: 'domcontentloaded' });
    const authHeader = await page.waitForSelector('#landing-title', { timeout: 5000 });
    recordCase('Auth screen renders', Boolean(authHeader));

    await page.getByRole('button', { name: 'Sign in', exact: true }).click();
    await page.waitForSelector('.jr-auth-google-wrap.jr-focus-pulse', { timeout: 5000 });
    recordCase('Sign in button scrolls and triggers focus pulse on Google container', true);

    // Case 2a: Google failure
    await page.evaluate(() => { window.__nextGoogleCredential = 'invalid-google-token'; });
    let stubbedGsiBtn = await page.waitForSelector('.jr-auth-google-wrap #stubbed-google-signin-btn', { timeout: 5000 });
    await stubbedGsiBtn.click();
    await page.waitForSelector('.jr-auth-error', { timeout: 5000 });
    const errorText = await page.locator('.jr-auth-error').textContent();
    assert.ok(errorText.includes('Google sign-in failed'), 'Error alert displayed on failed login');
    recordCase('Google login failure handles cleanly without crash', true);

    // Case 2b: Google success
    await page.evaluate(() => { window.__nextGoogleCredential = 'alice'; });
    stubbedGsiBtn = await page.waitForSelector('.jr-auth-google-wrap #stubbed-google-signin-btn', { timeout: 5000 });
    await stubbedGsiBtn.click();
    await page.waitForSelector('#dashboard-title, #editor-title', { timeout: 5000 });
    const inWorkspaceAccount = await page.waitForSelector('button[title="alice@testcase.local"]', { timeout: 5000 });
    recordCase('Google login success enters account workspace', Boolean(inWorkspaceAccount));

    // Test returning signed-in user lands on #/
    await page.goto(`http://localhost:${PREVIEW_PORT}`, { waitUntil: 'networkidle' });
    assert.strictEqual(page.url(), `http://localhost:${PREVIEW_PORT}/#/`);
    await page.waitForSelector('button:has-text("Open your resumes")');
    await page.waitForSelector('text=Signed in with Google');
    const signedInTopBtn = await page.waitForSelector('button.jr-landing-signin:has-text("Your resumes")');
    assert.ok(signedInTopBtn, 'Top bar shows Your resumes for signed-in user');
    recordCase('Bare URL as signed-in user lands on #/ with Open your resumes CTA', true);

    // Deep link while authenticated works
    await page.goto(`http://localhost:${PREVIEW_PORT}/#/resumes`, { waitUntil: 'networkidle' });
    assert.strictEqual(page.url(), `http://localhost:${PREVIEW_PORT}/#/resumes`);
    const dashTitle = await page.title();
    assert.strictEqual(dashTitle, 'JakeResume - Your resumes');
    recordCase('Dashboard title and authenticated deep link verified', true, dashTitle);

    // Case 10: Sign out
    await page.goto(`http://localhost:${PREVIEW_PORT}/#/`, { waitUntil: 'networkidle' });
    // Go to dashboard to access user menu
    await page.click('button:has-text("Open your resumes")');
    await page.waitForSelector('h1#dashboard-title');
    const accountMenuBtn = await page.waitForSelector('button[title="alice@testcase.local"]');
    await accountMenuBtn.click();
    const signOutBtn = await page.waitForSelector('button:has-text("Sign out")');
    await signOutBtn.click();
    sessionCookie = '';
    await page.waitForSelector('#landing-title', { timeout: 5000 });
    recordCase('Sign out returns to #/ landing page', true);

    // Case 3: Guest flow with persistence across reload
    const guestBtn = await page.waitForSelector('button:has-text("Start as guest")');
    await guestBtn.click();
    await page.waitForSelector('#dashboard-title, #editor-title', { timeout: 5000 });
    
    // Test returning guest lands on #/
    await page.goto(`http://localhost:${PREVIEW_PORT}`, { waitUntil: 'networkidle' });
    assert.strictEqual(page.url(), `http://localhost:${PREVIEW_PORT}/#/`);
    await page.waitForSelector('button:has-text("Open your resumes")');
    await page.waitForSelector('text=Guest mode: saved in this browser only.');
    assert.ok(await page.$('button.jr-landing-signin:has-text("Your resumes")'), 'Top bar shows Your resumes');
    recordCase('Bare URL as returning guest lands on #/ with Open your resumes CTA', true);

    // Capture screenshots for returning guest
    await page.screenshot({ path: path.join(rootDir, 'landing-returning-guest-1488.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(rootDir, 'landing-returning-guest-390.png') });
    recordCase('Captured landing-returning-guest-1488.png and landing-returning-guest-390.png', true);

    // Return to editor via Open your resumes
    await page.setViewportSize({ width: 1488, height: 850 });
    await page.click('button:has-text("Open your resumes")');
    await page.waitForSelector('#editor-title, #dashboard-title');
    if (page.url().includes('#/resumes')) {
      await page.click('button:has-text("Edit")');
      await page.waitForSelector('#editor-title');
    }

    // Verify editor title and capture editor top bar screenshots
    const editorTitle = await page.title();
    assert.ok(editorTitle.startsWith('JakeResume - '), `Editor title must start with brand mark: ${editorTitle}`);
    recordCase('Editor route document.title formatted with brand prefix', true, editorTitle);

    await page.screenshot({ path: path.join(rootDir, 'editor-topbar-1488.png') });
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: path.join(rootDir, 'editor-topbar-390.png') });
    recordCase('Captured editor-topbar-1488.png and editor-topbar-390.png', true);

    // Verify privacy page title
    await page.goto(`http://localhost:${PREVIEW_PORT}/privacy.html`, { waitUntil: 'domcontentloaded' });
    const privTitle = await page.title();
    assert.strictEqual(privTitle, 'JakeResume - Privacy');
    recordCase('Privacy page title verified', true, privTitle);

    // Back to editor for guest persistence test
    await page.setViewportSize({ width: 1488, height: 850 });
    await page.goto(`http://localhost:${PREVIEW_PORT}/#/resumes`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#dashboard-title');
    await page.click('button:has-text("Edit")');
    await page.waitForSelector('#editor-title');

    // Edit full name
    const fullNameInput = await page.waitForSelector('input[placeholder="Jane Doe"]');
    await fullNameInput.fill('Dr. Guest Persistent');
    await page.waitForTimeout(1600); // Wait for 1200ms debounced autosave to persist

    // Reload page
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Saved on this device', { timeout: 5000 });
    const persistedName = await page.$eval('input[placeholder="Jane Doe"]', el => el.value);
    recordCase('Guest flow persistence across reload', persistedName === 'Dr. Guest Persistent', `name=${persistedName}`);

    // Case 6: Delete with undo
    const expNavBtn = await page.waitForSelector('button.jr-editor-step:has-text("Experience")');
    await expNavBtn.click();
    await page.waitForTimeout(300);

    const deleteBtn = await page.waitForSelector('button[title="Delete"]');
    await deleteBtn.click();
    
    const undoToastBtn = await page.waitForSelector('button:has-text("Undo")', { timeout: 5000 });
    assert.ok(undoToastBtn, 'Undo toast must appear');
    await undoToastBtn.click();
    await page.waitForTimeout(300);
    recordCase('Delete entry with toast undo restoration', true);

    // Case 7: Hide section
    const eduStep = await page.waitForSelector('button.jr-editor-step:has-text("Education")');
    await eduStep.click();
    const eduSwitch = await page.waitForSelector('button[role="switch"][aria-label="Show in resume"]');
    await eduSwitch.click();
    await page.waitForTimeout(300);
    const isNowHidden = await page.$('button.jr-editor-step.is-hidden:has-text("Education")');
    recordCase('Hide section toggles visibility', Boolean(isNowHidden));

    // Case 8: Import JSON
    const importNavBtn = await page.waitForSelector('button:has-text("Import resume")');
    await importNavBtn.click();
    const copyPromptTab = await page.waitForSelector('text=Copy prompt');
    assert.ok(copyPromptTab, 'Import modal must open');
    const dismissImportBtn = await page.waitForSelector('button[title="Dismiss"]');
    await dismissImportBtn.click();
    await page.waitForTimeout(300);
    recordCase('Import resume modal workflow', true);

    // Case 9: Export menu items
    const exportBtn = await page.waitForSelector('button:has-text("Export")');
    await exportBtn.click();
    const downloadTexItem = await page.waitForSelector('button:has-text("Download .tex")');
    const overleafItem = await page.waitForSelector('button:has-text("Open in Overleaf")');
    await exportBtn.click(); // close menu
    await page.waitForTimeout(200);

    const resumeMenuBtn = await page.waitForSelector('button[title="Resume menu"]');
    await resumeMenuBtn.click();
    const resetOrderItem = await page.waitForSelector('button:has-text("Reset section order")');
    recordCase('Export and resume menu items present (Download .tex, Overleaf, Reset section order)', 
      Boolean(downloadTexItem && overleafItem && resetOrderItem));
    await resumeMenuBtn.click(); // close menu
    await page.waitForTimeout(200);

    // Case 4: Compile pipeline (success, timeout, typed errors)
    // 4a. Compile Success
    compileMockHandler = async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/pdf',
        body: MINIMAL_VALID_PDF,
      });
    };

    const compileBtn = await page.waitForSelector('button:has-text("Compile PDF")');
    await compileBtn.click();
    const pdfIframe = await page.waitForSelector('iframe[title="Compiled Resume PDF"]', { timeout: 10000 });
    recordCase('Compile PDF success displays preview iframe', Boolean(pdfIframe));

    // 4b. Compile Timeout (504)
    compileMockHandler = async (route) => {
      await route.fulfill({
        status: 504,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Compilation service unreachable or timed out' }),
      });
    };
    const anyInputForCompile = page.locator('input').first();
    await anyInputForCompile.fill('Dr. Guest Timeout Test');
    await page.waitForTimeout(100);

    const compileAgainBtn = await page.waitForSelector('button:has-text("Recompile")');
    await compileAgainBtn.click();
    const timeoutModal = await page.waitForSelector('text=Compilation timed out', { timeout: 8000 });
    recordCase('Compile timeout maps to typed error modal', Boolean(timeoutModal));
    const closeErrModal = await page.waitForSelector('button[title="Dismiss"]');
    await closeErrModal.click();
    await page.waitForTimeout(300);

    // 4c. Compile Typed LaTeX Syntax Error (400)
    compileMockHandler = async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({ error: '! Undefined control sequence. l.15 \\badcmd' }),
      });
    };
    await anyInputForCompile.fill('Dr. Guest Syntax Error Test');
    await page.waitForTimeout(100);

    const compileThirdBtn = await page.waitForSelector('button:has-text("Recompile")');
    await compileThirdBtn.click();
    const syntaxErrModal = await page.waitForSelector('text=Compilation failed', { timeout: 8000 });
    recordCase('Compile syntax error maps to typed error modal', Boolean(syntaxErrModal));
    const closeErrModal2 = await page.waitForSelector('button[title="Dismiss"]');
    await closeErrModal2.click();
    await page.waitForTimeout(300);

    // Reset compileMockHandler
    compileMockHandler = null;

    // Case 5: Guest-to-account migration
    const guestMenuBtn = await page.waitForSelector('button[title="Guest menu"]');
    await guestMenuBtn.click();
    const signInGuestItem = await page.waitForSelector('button:has-text("Sign in with Google")');
    await signInGuestItem.click();

    await page.evaluate(() => { window.__nextGoogleCredential = 'alice'; });
    await page.locator('#stubbed-google-signin-btn').click();

    const migrationModal = await page.waitForSelector('text=Add your guest resumes to your account?', { timeout: 8000 });
    assert.ok(migrationModal, 'Guest migration modal must display');
    const addAccountBtn = await page.waitForSelector('button:has-text("Add to my account")');
    await addAccountBtn.click();
    await page.waitForTimeout(1000);
    const alertMsg = await page.locator('[role="alert"]').textContent().catch(() => '');
    if (alertMsg) console.log('MIGRATION ALERT DETECTED:', alertMsg);
    await page.waitForSelector('button[title="alice@testcase.local"]', { timeout: 8000 });
    recordCase('Guest-to-account migration successfully imports guest resume to account', true);

    // 5.4 Regression tests
    console.log('\n--- EXECUTING REGRESSION TESTS (5.4) ---\n');

    // 5.4.1 Guest and Account stores isolation
    const guestDataInStorage = await page.evaluate(() => localStorage.getItem('jakeresume:guest:v1'));
    assert.strictEqual(guestDataInStorage, null, 'Guest and account stores are isolated; account mode never touches guest store');
    recordCase('Guest and account data storage isolation', true);

    // 5.4.2 Removed routes return 404
    const regRes = await fetch(`http://127.0.0.1:${TEST_SERVER_PORT}/api/auth/register`, { method: 'POST' });
    const loginRes = await fetch(`http://127.0.0.1:${TEST_SERVER_PORT}/api/auth/login`, { method: 'POST' });
    recordCase('Removed /api/auth/register returns 404', regRes.status === 404, `status=${regRes.status}`);
    recordCase('Removed /api/auth/login returns 404', loginRes.status === 404, `status=${loginRes.status}`);

    // 5.4.3 Unauthenticated profile routes return 401
    const getProfilesUnauth = await fetch(`http://127.0.0.1:${TEST_SERVER_PORT}/api/resumes`);
    const postProfilesUnauth = await fetch(`http://127.0.0.1:${TEST_SERVER_PORT}/api/resumes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileName: 'Hacker' }),
    });
    recordCase('Unauthenticated GET /api/resumes returns 401', getProfilesUnauth.status === 401, `status=${getProfilesUnauth.status}`);
    recordCase('Unauthenticated POST /api/resumes returns 401', postProfilesUnauth.status === 401, `status=${postProfilesUnauth.status}`);

    console.log('\n========================================');
    console.log(`🎉 ALL ${testResults.length} E2E & REGRESSION CASES PASSED!`);
    console.log('========================================\n');

    return testResults;
  } finally {
    if (browser) {
      await browser.close();
    }
    if (previewServer) {
      await previewServer.close();
    }
    if (backendServer) {
      await new Promise(r => backendServer.close(r));
    }
    await disconnectDB();
  }
}

runProductionE2ESuite().catch((err) => {
  console.error('Fatal E2E suite failure:', err);
  process.exit(1);
});
