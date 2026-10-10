import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import app from '../src/server.js';
import User from '../src/models/User.js';
import ResumeProfile from '../src/models/ResumeProfile.js';

const TEST_SECRET = 'test-secret-at-least-32-chars-long-security-check!';
process.env.JWT_SECRET = TEST_SECRET;

const TEST_PORT = 5098;
const BASE_URL = `http://localhost:${TEST_PORT}`;

function createToken(userId, secret = TEST_SECRET, options = {}) {
  return jwt.sign({ id: userId }, secret, { algorithm: 'HS256', expiresIn: '1h', ...options });
}

async function runTests() {
  console.log('🧪 Starting Backend Hardening Test Suite...');

  // Mock database connection state as connected (readyState = 1)
  Object.defineProperty(mongoose.connection, 'readyState', { value: 1, configurable: true, writable: true });

  // Mock upstream fetch for /api/compile
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input, init) => {
    const url = typeof input === 'string' ? input : input.url;
    if (url.startsWith('https://latexonline.cc/compile')) {
      if (url.includes('trigger_html_error')) {
        return new Response('<html><head><title>502 Bad Gateway</title></head><body>Server error</body></html>', {
          status: 502,
          headers: { 'Content-Type': 'text/html' }
        });
      }
      return new Response(Buffer.from('%PDF-1.4 test output'), {
        status: 200,
        headers: { 'Content-Type': 'application/pdf' },
      });
    }
    return originalFetch(input, init);
  };

  // Mock User.findById
  const mockUsers = {
    'user-A': { _id: 'user-A', email: 'userA@example.com' },
    'user-B': { _id: 'user-B', email: 'userB@example.com' },
  };

  const originalUserFindById = User.findById;
  User.findById = (id) => ({
    select: () => Promise.resolve(mockUsers[id] || null)
  });

  // In-memory profiles mock store
  let mockProfiles = [
    {
      _id: 'prof-b1',
      userId: 'user-B',
      profileName: 'User B Resume',
      basics: { fullName: 'User B' },
      education: [],
      experience: [],
      projects: [],
      skills: {},
      customSections: [],
      createdAt: new Date('2026-01-01'),
      save: async function () { return this; }
    }
  ];

  const originalFind = ResumeProfile.find;
  const originalFindOne = ResumeProfile.findOne;
  const originalFindOneAndDelete = ResumeProfile.findOneAndDelete;
  const originalCountDocuments = ResumeProfile.countDocuments;
  const originalCreate = ResumeProfile.create;

  ResumeProfile.find = (query) => ({
    sort: () => Promise.resolve(mockProfiles.filter((p) => p.userId === query.userId))
  });

  ResumeProfile.findOne = (query) => {
    const found = mockProfiles.find((p) => {
      let matches = true;
      if (query._id && p._id !== query._id) matches = false;
      if (query.userId && p.userId !== query.userId) matches = false;
      return matches;
    });
    return Promise.resolve(found || null);
  };

  ResumeProfile.findOneAndDelete = (query) => {
    const idx = mockProfiles.findIndex((p) => p._id === query._id && p.userId === query.userId);
    if (idx === -1) return Promise.resolve(null);
    const deleted = mockProfiles.splice(idx, 1)[0];
    return Promise.resolve(deleted);
  };

  ResumeProfile.countDocuments = (query) => {
    return Promise.resolve(mockProfiles.filter((p) => p.userId === query.userId).length);
  };

  ResumeProfile.create = (doc) => {
    const created = {
      ...doc,
      _id: `prof-${Date.now()}`,
      createdAt: new Date(),
      save: async function () { return this; }
    };
    mockProfiles.push(created);
    return Promise.resolve(created);
  };

  const server = app.listen(TEST_PORT);

  try {
    const tokenA = createToken('user-A');
    const tokenB = createToken('user-B');

    // 1. Health check returns { ok, time, db, google } without auth or sensitive data
    console.log('1. Testing GET /api/health schema...');
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    assert.equal(healthRes.status, 200);
    const healthJson = await healthRes.json();
    assert.equal(typeof healthJson.ok, 'boolean');
    assert.equal(typeof healthJson.time, 'string');
    assert.ok(['up', 'down'].includes(healthJson.db));
    assert.equal(typeof healthJson.google, 'boolean');
    assert.equal(healthJson.version, undefined, 'version should not be exposed');
    assert.equal(healthJson.secrets, undefined);
    console.log('   ✅ Health endpoint validated');

    // 2. Unknown /api route returns 404 JSON
    console.log('2. Testing unknown /api routes 404 JSON...');
    const unknownRes = await fetch(`${BASE_URL}/api/some/random/endpoint`);
    assert.equal(unknownRes.status, 404);
    assert.equal(unknownRes.headers.get('content-type')?.includes('application/json'), true);
    const unknownJson = await unknownRes.json();
    assert.equal(unknownJson.error, 'Endpoint not found');
    console.log('   ✅ Unknown routes return 404 JSON');

    // 3. Authorization & Tenant Isolation: User A cannot read User B's profile
    console.log("3. Testing Tenant Isolation: User A cannot read User B's profile...");
    const readBRes = await fetch(`${BASE_URL}/api/resumes/prof-b1`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(readBRes.status, 404, 'Must return 404 with no data leaked');
    const readBJson = await readBRes.json();
    assert.equal(readBJson.error, 'Resume profile not found');
    console.log("   ✅ User A blocked from reading User B's profile");

    // 4. User A cannot update or rename User B's profile
    console.log("4. Testing Tenant Isolation: User A cannot update User B's profile...");
    const updateBRes = await fetch(`${BASE_URL}/api/resumes/prof-b1`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenA}`
      },
      body: JSON.stringify({ profileName: 'Hacked by User A' })
    });
    assert.equal(updateBRes.status, 404, 'Must return 404 on update attempt');
    assert.equal(mockProfiles[0].profileName, 'User B Resume', 'User B profile remains untouched');
    console.log("   ✅ User A blocked from updating User B's profile");

    // 5. User A cannot delete User B's profile
    console.log("5. Testing Tenant Isolation: User A cannot delete User B's profile...");
    const deleteBRes = await fetch(`${BASE_URL}/api/resumes/prof-b1`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` }
    });
    assert.equal(deleteBRes.status, 404, 'Must return 404 on delete attempt');
    assert.equal(mockProfiles.length, 1, 'Profile was not deleted');
    console.log("   ✅ User A blocked from deleting User B's profile");

    // 6. Mass Assignment Prevention: userId, _id, createdAt cannot be overwritten
    console.log('6. Testing Mass Assignment Protection on update...');
    const updateWhitelistingRes = await fetch(`${BASE_URL}/api/resumes/prof-b1`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        profileName: 'Legitimate Update',
        userId: 'attacker-id',
        _id: 'fake-id',
        createdAt: '1970-01-01'
      })
    });
    assert.equal(updateWhitelistingRes.status, 200);
    assert.equal(mockProfiles[0].userId, 'user-B', 'userId must not be mutable via mass assignment');
    assert.equal(mockProfiles[0]._id, 'prof-b1', '_id must not be mutable via mass assignment');
    console.log('   ✅ Mass assignment fields strictly protected');

    // 7. Input Safety: Keys starting with $ or containing . rejected with 400
    console.log('7. Testing NoSQL operator injection key rejection ($ and .)...');
    const nosqlRes1 = await fetch(`${BASE_URL}/api/resumes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        profileName: 'Test',
        '$where': 'sleep(1000)'
      })
    });
    assert.equal(nosqlRes1.status, 400);
    const nosqlJson1 = await nosqlRes1.json();
    assert.ok(nosqlJson1.error.includes('Prohibited characters'));

    const nosqlRes2 = await fetch(`${BASE_URL}/api/resumes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        profileName: 'Test',
        'basics.something': 'bad'
      })
    });
    assert.equal(nosqlRes2.status, 400);
    console.log('   ✅ Malicious NoSQL keys rejected with 400');

    // 8. Input Safety: Malformed JSON syntax error returns 400 JSON
    console.log('8. Testing Malformed JSON syntax error handling...');
    const malformedJsonRes = await fetch(`${BASE_URL}/api/resumes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: '{ "invalid": json without closing '
    });
    assert.equal(malformedJsonRes.status, 400);
    const malformedJsonResult = await malformedJsonRes.json();
    assert.equal(malformedJsonResult.error, 'Invalid JSON payload');
    console.log('   ✅ Malformed JSON returns 400 { error: "Invalid JSON payload" }');

    // 9. Input Safety: Field and array bounds caps
    console.log('9. Testing array and string bounds caps...');
    const oversizedArrayRes = await fetch(`${BASE_URL}/api/resumes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${tokenB}`
      },
      body: JSON.stringify({
        profileName: 'Test',
        education: Array.from({ length: 150 }, () => ({ institution: 'School' }))
      })
    });
    assert.equal(oversizedArrayRes.status, 400);
    const oversizedJson = await oversizedArrayRes.json();
    assert.ok(oversizedJson.error.includes('limits'));
    console.log('   ✅ Excessive array size capped and rejected with 400');

    // 10. JWT Algorithm Pinning: Tokens with none or wrong algorithm rejected
    console.log('10. Testing JWT algorithm pinning (rejection of "none" alg)...');
    const noneAlgToken = jwt.sign({ id: 'user-B' }, '', { algorithm: 'none' });
    const noneAlgRes = await fetch(`${BASE_URL}/api/resumes`, {
      headers: { Authorization: `Bearer ${noneAlgToken}` }
    });
    assert.equal(noneAlgRes.status, 401);
    console.log('   ✅ Unsigned / none algorithm token rejected');

    // 11. Upstream HTML error stripping on compile endpoint
    console.log('11. Testing compile error HTML stripping...');
    const compileHtmlErrRes = await fetch(`${BASE_URL}/api/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tex: 'trigger_html_error' })
    });
    assert.equal(compileHtmlErrRes.status, 502);
    const compileHtmlJson = await compileHtmlErrRes.json();
    assert.ok(!compileHtmlJson.error.includes('<html>'), 'Upstream HTML must never be echoed');
    assert.ok(!compileHtmlJson.error.includes('<body>'), 'Upstream HTML must never be echoed');
    // 12. Unreachable DB returns 503 JSON without hanging; compile still works
    console.log('12. Testing DB down: returns 503 JSON without hanging; compile stays alive...');
    mongoose.connection.readyState = 0; // Simulate DB disconnection
    const dbDownRes = await fetch(`${BASE_URL}/api/resumes`, {
      headers: { Authorization: `Bearer ${tokenB}` }
    });
    assert.equal(dbDownRes.status, 503);
    const dbDownJson = await dbDownRes.json();
    assert.ok(dbDownJson.error.includes('unavailable'));

    // Compile endpoint should still succeed even when DB is down
    const compileWhileDbDown = await fetch(`${BASE_URL}/api/compile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tex: '% valid test' })
    });
    assert.equal(compileWhileDbDown.status, 200);
    mongoose.connection.readyState = 1; // Restore
    console.log('   ✅ Unreachable DB returns 503 JSON, guest compile remains functional');

    console.log('\n========================================');
    console.log('🎉 ALL BACKEND HARDENING TESTS PASSED!');
    console.log('========================================');
  } finally {
    server.close();
    globalThis.fetch = originalFetch;
    User.findById = originalUserFindById;
    ResumeProfile.find = originalFind;
    ResumeProfile.findOne = originalFindOne;
    ResumeProfile.findOneAndDelete = originalFindOneAndDelete;
    ResumeProfile.countDocuments = originalCountDocuments;
    ResumeProfile.create = originalCreate;
  }
}

runTests().catch((err) => {
  console.error('❌ Backend hardening test suite failed:', err);
  process.exit(1);
});
