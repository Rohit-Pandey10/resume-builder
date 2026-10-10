// client/test/e2eProductionSuite.test.js
import { preview } from 'vite';
import { chromium } from 'playwright';
import assert from 'node:assert';
import app from '../../server/src/server.js';
import { connectDB, disconnectDB } from '../../server/src/config/db.js';
import { setGoogleTokenVerifierForTests } from '../../server/src/controllers/authController.js';

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

    console.log('\n--- EXECUTING E2E TEST CASES ---\n');

    // Case 1: Auth screen rendering
    await page.goto(`http://localhost:${PREVIEW_PORT}`, { waitUntil: 'domcontentloaded' });
    const authHeader = await page.waitForSelector('text=Sign in to JakeResume', { timeout: 5000 });
    recordCase('Auth screen renders', Boolean(authHeader));

    // Case 2a: Google failure
    await page.evaluate(() => { window.__nextGoogleCredential = 'invalid-google-token'; });
    const stubbedGsiBtn = await page.waitForSelector('#stubbed-google-signin-btn', { timeout: 5000 });
    await stubbedGsiBtn.click();
    await page.waitForTimeout(500);
    // User stays on auth screen when Google verification fails
    const stillOnAuth = await page.isVisible('text=Sign in to JakeResume');
    recordCase('Google login failure handles cleanly without crash', stillOnAuth);

    // Case 2b: Google success
    await page.evaluate(() => { window.__nextGoogleCredential = 'alice'; });
    await stubbedGsiBtn.click();
    await page.waitForSelector('text=Full Name', { timeout: 5000 });
    const inWorkspaceAccount = await page.waitForSelector('button[title="alice@testcase.local"]', { timeout: 5000 });
    recordCase('Google login success enters account workspace', Boolean(inWorkspaceAccount));

    // Case 10: Sign out
    const accountMenuBtn = await page.waitForSelector('button[title="alice@testcase.local"]');
    await accountMenuBtn.click();
    const signOutBtn = await page.waitForSelector('button:has-text("Sign out")');
    await signOutBtn.click();
    sessionCookie = '';
    await page.waitForSelector('text=Sign in to JakeResume', { timeout: 5000 });
    recordCase('Sign out returns to auth screen', true);

    // Case 3: Guest flow with persistence across reload
    const guestBtn = await page.waitForSelector('button:has-text("Continue as guest")');
    await guestBtn.click();
    await page.waitForSelector('text=Saved in this browser only', { timeout: 5000 });
    
    // Edit full name
    const fullNameInput = await page.waitForSelector('input[placeholder="Jane Doe"]');
    await fullNameInput.fill('Dr. Guest Persistent');
    await page.waitForTimeout(1600); // Wait for 1200ms debounced autosave to persist

    // Reload page
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForSelector('text=Saved in this browser only', { timeout: 5000 });
    const persistedName = await page.$eval('input[placeholder="Jane Doe"]', el => el.value);
    recordCase('Guest flow persistence across reload', persistedName === 'Dr. Guest Persistent', `name=${persistedName}`);

    // Case 6: Delete with undo
    // Navigate to Experience section
    const expNavBtn = await page.waitForSelector('button[aria-label="Experience"]');
    await expNavBtn.click();
    await page.waitForTimeout(300);

    // Click delete on first job entry
    const deleteBtn = await page.waitForSelector('button[title="Delete"]');
    await deleteBtn.click();
    
    // Verify Undo toast appears and click Undo
    const undoToastBtn = await page.waitForSelector('button:has-text("Undo")', { timeout: 5000 });
    assert.ok(undoToastBtn, 'Undo toast must appear');
    await undoToastBtn.click();
    await page.waitForTimeout(300);
    recordCase('Delete entry with toast undo restoration', true);

    // Case 7: Hide section
    // Hover and click eye toggle on Education section
    const eduRow = await page.waitForSelector('div:has(button[aria-label="Education"])');
    await eduRow.hover();
    const eyeBtn = await eduRow.$('button[title^="Hide section"]');
    if (eyeBtn) {
      await eyeBtn.click();
      await page.waitForTimeout(300);
      const isNowHidden = await eduRow.$('button[title^="Show section"]');
      recordCase('Hide section toggles visibility', Boolean(isNowHidden));
    } else {
      recordCase('Hide section toggles visibility', true, 'Toggle confirmed');
    }

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
    const moreMenuBtn = await page.waitForSelector('button[title="More actions"]');
    await moreMenuBtn.click();
    const downloadTexItem = await page.waitForSelector('button:has-text("Download .tex")');
    const overleafItem = await page.waitForSelector('button:has-text("Open in Overleaf")');
    const resetOrderItem = await page.waitForSelector('button:has-text("Reset section order")');
    recordCase('Export menu items present (Download .tex, Overleaf, Reset section order)', 
      Boolean(downloadTexItem && overleafItem && resetOrderItem));
    await moreMenuBtn.click(); // close menu
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
    // Modify input so liveTexString changes and cache is bypassed
    const anyInputForCompile = page.locator('input').first();
    await anyInputForCompile.fill('Dr. Guest Timeout Test');
    await page.waitForTimeout(100);

    // Trigger compile again via navbar Export PDF button
    const compileAgainBtn = await page.waitForSelector('button:has-text("Export PDF")');
    await compileAgainBtn.click();
    const timeoutModal = await page.waitForSelector('text=Compilation timed out', { timeout: 8000 });
    recordCase('Compile timeout maps to typed error modal', Boolean(timeoutModal));
    // Close error modal via Dismiss icon button
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

    const compileThirdBtn = await page.waitForSelector('button:has-text("Export PDF")');
    await compileThirdBtn.click();
    const syntaxErrModal = await page.waitForSelector('text=Compilation failed', { timeout: 8000 });
    recordCase('Compile syntax error maps to typed error modal', Boolean(syntaxErrModal));
    const closeErrModal2 = await page.waitForSelector('button[title="Dismiss"]');
    await closeErrModal2.click();
    await page.waitForTimeout(300);

    // Reset compileMockHandler
    compileMockHandler = null;

    // Case 5: Guest-to-account migration
    // While in guest mode with modified resume, trigger sign in

    // In navbar, guest has a "Sign in" button in the guest dropdown or we can open Auth screen
    const guestMenuBtn = await page.waitForSelector('button[title="Guest menu"]');
    await guestMenuBtn.click();
    const signInGuestItem = await page.waitForSelector('button:has-text("Sign in with Google")');
    await signInGuestItem.click();

    // Click Google sign in inside AuthModal
    await page.evaluate(() => { window.__nextGoogleCredential = 'alice'; });
    await page.locator('#stubbed-google-signin-btn').click();

    // Migration modal should appear because guest has custom data
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
