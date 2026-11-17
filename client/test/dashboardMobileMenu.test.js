import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.join(__dirname, '..', 'dist');

function startStaticServer(port = 4192) {
  const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.svg': 'image/svg+xml',
    '.json': 'application/json',
    '.png': 'image/png',
    '.ico': 'image/x-icon',
  };

  const server = http.createServer((req, res) => {
    let filePath = path.join(distDir, req.url.split('?')[0]);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
    if (!fs.existsSync(filePath)) {
      filePath = path.join(distDir, 'index.html');
    }
    const ext = path.extname(filePath);
    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    fs.createReadStream(filePath).pipe(res);
  });

  return new Promise((resolve) => {
    server.listen(port, () => resolve(server));
  });
}

async function run() {
  console.log('🧪 Starting Mobile Dashboard Menu & Delete E2E Verification...\n');
  const server = await startStaticServer(4192);
  const baseUrl = 'http://localhost:4192';

  const browser = await chromium.launch({
    channel: 'chrome',
    headless: true,
  });

  try {
    const context = await browser.newContext({
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const page = await context.newPage();

    // Seed localStorage with 2 guest resumes
    const mockProfiles = [
      {
        _id: 'resume-1',
        profileName: 'Imported Resume - Sep',
        basics: { name: 'Alice Smith', email: 'alice@example.com' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        _id: 'resume-2',
        profileName: 'SWE Intern - General',
        basics: { name: 'Bob Jones', email: 'bob@example.com' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    await page.goto(baseUrl);
    await page.evaluate((profiles) => {
      localStorage.setItem('jakeresume:guest:v1', JSON.stringify({
        version: 1,
        profiles,
        activeProfileId: 'resume-1',
        dirty: false,
      }));
      localStorage.setItem('jakeresume:mode', 'guest');
    }, mockProfiles);

    await page.goto(`${baseUrl}/#/resumes`);
    await page.reload();
    await page.waitForSelector('.jr-resume-card');

    const cards = await page.$$('.jr-resume-card');
    assert.strictEqual(cards.length, 2, 'Should render 2 resume cards');
    console.log('  ✅ Rendered 2 resume cards on mobile viewport');

    // 1. Open menu on Card 1
    const card1ActionsBtn = await cards[0].$('button[title="More actions"]');
    await card1ActionsBtn.click();
    await page.waitForTimeout(100);

    let openMenus = await page.$$('.jr-resume-card-menu');
    assert.strictEqual(openMenus.length, 1, 'Only Card 1 menu should be open');
    let hasOpenClass = await cards[0].evaluate((el) => el.classList.contains('is-menu-open'));
    assert.ok(hasOpenClass, 'Card 1 should have is-menu-open class');
    console.log('  ✅ Card 1 menu opened and has is-menu-open class');

    // 2. Open menu on Card 2 -> Card 1 menu should close
    const card2ActionsBtn = await cards[1].$('button[title="More actions"]');
    await card2ActionsBtn.click();
    await page.waitForTimeout(100);

    openMenus = await page.$$('.jr-resume-card-menu');
    assert.strictEqual(openMenus.length, 1, 'Only 1 menu should be open at any time');
    const card2HasOpenClass = await cards[1].evaluate((el) => el.classList.contains('is-menu-open'));
    assert.ok(card2HasOpenClass, 'Card 2 should have is-menu-open class');
    const card1HasOpenClass = await cards[0].evaluate((el) => el.classList.contains('is-menu-open'));
    assert.ok(!card1HasOpenClass, 'Card 1 should not have is-menu-open class');
    console.log('  ✅ Card 2 menu opened, Card 1 menu automatically closed');

    // 3. Test tapping outside to close menu
    await page.click('h1#dashboard-title');
    await page.waitForTimeout(100);
    openMenus = await page.$$('.jr-resume-card-menu');
    assert.strictEqual(openMenus.length, 0, 'Menu should close when tapping outside');
    console.log('  ✅ Menu dismissed on outside tap');

    // 4. Open Card 2 menu again, tap Delete
    await card2ActionsBtn.click();
    await page.waitForTimeout(100);
    const deleteOption = await page.waitForSelector('.jr-resume-card-menu button:has-text("Delete")');
    assert.ok(deleteOption, 'Delete option should be visible in menu');

    // Tap Delete in the menu
    await deleteOption.click();
    await page.waitForTimeout(100);

    // Verify modal is open and URL is still #/resumes (not navigated into edit!)
    const currentUrl = page.url();
    assert.ok(currentUrl.endsWith('#/resumes'), `URL should remain #/resumes, got ${currentUrl}`);
    const modalTitle = await page.waitForSelector('#delete-confirm-title');
    assert.ok(modalTitle, 'Delete confirmation modal must appear');
    console.log('  ✅ Delete button opened in-app confirmation modal without triggering card navigation');

    // 5. Confirm deletion in the modal
    const confirmDeleteBtn = await page.waitForSelector('.jr-modal button:has-text("Delete")');
    await confirmDeleteBtn.click();
    await page.waitForTimeout(300);

    // Verify Card 2 was removed, leaving only 1 card
    const remainingCards = await page.$$('.jr-resume-card');
    assert.strictEqual(remainingCards.length, 1, 'Should have 1 resume card left');

    // Verify undo toast appears
    const undoToast = await page.waitForSelector('text=Deleted resume "SWE Intern - General"');
    assert.ok(undoToast, 'Undo toast should appear after deletion');
    console.log('  ✅ Resume deleted successfully and undo toast appeared');

    console.log('\n========================================');
    console.log('🎉 ALL MOBILE DASHBOARD MENU TESTS PASSED!');
    console.log('========================================\n');
  } finally {
    await browser.close();
    server.close();
  }
}

run().catch((err) => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
