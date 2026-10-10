import assert from 'node:assert/strict';
import app from '../src/server.js';

const TEST_PORT = 5099;
const BASE_URL = `http://localhost:${TEST_PORT}`;

async function runTests() {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url.startsWith('https://latexonline.cc/compile')) {
      return new Response(Buffer.from('%PDF-1.4 guest test'), {
        status: 200,
        headers: { 'Content-Type': 'application/pdf' },
      });
    }
    return originalFetch(input, init);
  };

  const server = app.listen(TEST_PORT);
  try {
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    assert.equal(healthRes.status, 200);

    const registerRes = await fetch(`${BASE_URL}/api/auth/register`, { method: 'POST' });
    assert.equal(registerRes.status, 404, 'register route must be removed');

    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, { method: 'POST' });
    assert.equal(loginRes.status, 404, 'login route must be removed');

    const meRes = await fetch(`${BASE_URL}/api/auth/me`);
    assert.equal(meRes.status, 401, 'account profile access remains protected');

    const compileRes = await fetch(`${BASE_URL}/api/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tex: '% guest compile' }),
    });
    assert.equal(compileRes.status, 200, 'guest compile must not require auth');
    assert.equal(compileRes.headers.get('content-type'), 'application/pdf');

    const wrongTypeRes = await fetch(`${BASE_URL}/api/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: '% guest compile',
    });
    assert.equal(wrongTypeRes.status, 415, 'compile must require JSON');

    const malformedRes = await fetch(`${BASE_URL}/api/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tex: 42 }),
    });
    assert.equal(malformedRes.status, 400, 'compile must require a string tex field');

    const oversizedRes = await fetch(`${BASE_URL}/api/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tex: 'x'.repeat(205 * 1024) }),
    });
    assert.equal(oversizedRes.status, 413, 'compile must reject bodies over 200kb');

    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, { method: 'POST' });
    assert.equal(logoutRes.status, 200);

    console.log('✅ Removed email/password routes, protected account access, guest compile validation, and logout checks passed.');
  } finally {
    globalThis.fetch = originalFetch;
    await new Promise((resolve) => server.close(resolve));
  }
}

runTests().catch((error) => {
  console.error('❌ Verification failed:', error);
  process.exit(1);
});
