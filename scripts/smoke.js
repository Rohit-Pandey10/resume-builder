#!/usr/bin/env node

/**
 * Production Smoke Test Script
 * Node 18+ (0 external dependencies, uses native global fetch).
 *
 * Usage:
 *   node scripts/smoke.js <BASE_URL>
 *   Example: node scripts/smoke.js http://localhost:5173
 *
 * NOTE: Never sends credentials or connects to remote databases.
 * Exit code 0 if all checks pass; exit code 1 on any failure.
 */

const baseUrlArg = process.argv[2] || process.env.BASE_URL;

if (!baseUrlArg) {
  console.error('Usage: node scripts/smoke.js <BASE_URL>');
  console.error('Example: node scripts/smoke.js http://localhost:5173');
  process.exit(1);
}

const BASE_URL = baseUrlArg.replace(/\/+$/, '');

const checks = [];
let failureCount = 0;

function recordResult(name, passed, details = '') {
  checks.push({ name, passed, details });
  if (passed) {
    console.log(`  ✅ PASS: ${name}${details ? ` (${details})` : ''}`);
  } else {
    failureCount += 1;
    console.error(`  ❌ FAIL: ${name}${details ? ` (${details})` : ''}`);
  }
}

async function runSmokeTests() {
  console.log(`\n========================================`);
  console.log(`🚀 RUNNING PRODUCTION SMOKE TESTS`);
  console.log(`Target: ${BASE_URL}`);
  console.log(`========================================\n`);

  // 1. GET / is 200 HTML
  try {
    const res = await fetch(`${BASE_URL}/`, { method: 'GET' });
    const contentType = res.headers.get('content-type') || '';
    const isHtml = contentType.includes('text/html');
    recordResult('GET / is 200 HTML', res.status === 200 && isHtml, `status=${res.status}, type=${contentType}`);
  } catch (err) {
    recordResult('GET / is 200 HTML', false, err.message);
  }

  // 2. Security headers present on root response
  try {
    const res = await fetch(`${BASE_URL}/`, { method: 'GET' });
    const nosniff = res.headers.get('x-content-type-options');
    const referrer = res.headers.get('referrer-policy');
    const permissions = res.headers.get('permissions-policy');
    const xfo = res.headers.get('x-frame-options');
    const csp = res.headers.get('content-security-policy') || res.headers.get('content-security-policy-report-only');

    const hasNosniff = nosniff === 'nosniff';
    const hasReferrer = Boolean(referrer);
    const hasPermissions = Boolean(permissions);
    const hasFrameProtection = Boolean(xfo || (csp && csp.includes('frame-ancestors')));

    const allPresent = hasNosniff && hasReferrer && hasPermissions && hasFrameProtection;
    recordResult(
      'Security headers present on /',
      allPresent,
      `nosniff=${hasNosniff}, referrer=${hasReferrer}, permissions=${hasPermissions}, frameProtection=${hasFrameProtection}`
    );
  } catch (err) {
    recordResult('Security headers present on /', false, err.message);
  }

  // 3. GET /api/health is 200 with ok: true
  try {
    const res = await fetch(`${BASE_URL}/api/health`, { method: 'GET' });
    const data = await res.json().catch(() => ({}));
    recordResult(
      'GET /api/health is 200 with ok: true',
      res.status === 200 && data.ok === true,
      `status=${res.status}, ok=${data.ok}, db=${data.db}`
    );
  } catch (err) {
    recordResult('GET /api/health is 200 with ok: true', false, err.message);
  }

  // 4. POST /api/auth/register is 404
  try {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
    });
    recordResult('POST /api/auth/register is 404', res.status === 404, `status=${res.status}`);
  } catch (err) {
    recordResult('POST /api/auth/register is 404', false, err.message);
  }

  // 5. Unauthenticated GET /api/resumes is 401
  try {
    const res = await fetch(`${BASE_URL}/api/resumes`, { method: 'GET' });
    recordResult('Unauthenticated GET /api/resumes is 401', res.status === 401, `status=${res.status}`);
  } catch (err) {
    recordResult('Unauthenticated GET /api/resumes is 401', false, err.message);
  }

  // 6. POST /api/compile with empty body is 400
  try {
    const res = await fetch(`${BASE_URL}/api/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    recordResult('POST /api/compile with empty body is 400', res.status === 400, `status=${res.status}`);
  } catch (err) {
    recordResult('POST /api/compile with empty body is 400', false, err.message);
  }

  // 7. POST /api/compile with oversized body is 413
  try {
    const oversizedTex = 'A'.repeat(250 * 1024); // 250 KB > 200 KB cap
    const res = await fetch(`${BASE_URL}/api/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tex: oversizedTex })
    });
    recordResult('POST /api/compile with oversized body is 413', res.status === 413, `status=${res.status}`);
  } catch (err) {
    recordResult('POST /api/compile with oversized body is 413', false, err.message);
  }

  // 8. Unknown /api route is JSON 404
  try {
    const res = await fetch(`${BASE_URL}/api/nonexistent-route-${Date.now()}`, { method: 'GET' });
    const data = await res.json().catch(() => ({}));
    const isJson404 = res.status === 404 && Boolean(data.error);
    recordResult('Unknown /api route is JSON 404', isJson404, `status=${res.status}, error=${data.error}`);
  } catch (err) {
    recordResult('Unknown /api route is JSON 404', false, err.message);
  }

  console.log(`\n========================================`);
  if (failureCount === 0) {
    console.log(`🎉 ALL ${checks.length} SMOKE CHECKS PASSED!`);
    console.log(`========================================\n`);
    process.exit(0);
  } else {
    console.error(`❌ ${failureCount} of ${checks.length} SMOKE CHECKS FAILED!`);
    console.log(`========================================\n`);
    process.exit(1);
  }
}

runSmokeTests().catch((err) => {
  console.error('Fatal smoke test runner error:', err);
  process.exit(1);
});
