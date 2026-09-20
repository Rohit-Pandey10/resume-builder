import assert from 'node:assert';
import app from '../src/server.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

const TEST_PORT = 5099;
const BASE_URL = `http://localhost:${TEST_PORT}`;

// Helper to extract cookies from response headers
function getSetCookieHeader(res) {
  const cookieHeader = res.headers.get('set-cookie');
  if (!cookieHeader) return '';
  return cookieHeader.split(';')[0];
}

async function runTests() {
  console.log('🚀 Starting Milestone 1 Automated Endpoint Verification...\n');
  
  await connectDB();
  const server = app.listen(TEST_PORT);

  try {
    // 1. Health check
    console.log('1. Testing GET /api/health...');
    const healthRes = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthRes.json();
    assert.strictEqual(healthRes.status, 200);
    assert.strictEqual(healthData.status, 'ok');
    console.log('   ✅ Health check passed.');

    // 2. Register new user
    console.log('2. Testing POST /api/auth/register...');
    const testEmail = `jake_${Date.now()}@example.com`;
    const testPassword = 'Password123!';

    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    const regData = await regRes.json();
    assert.strictEqual(regRes.status, 201);
    assert.strictEqual(regData.success, true);
    assert.strictEqual(regData.user.email, testEmail.toLowerCase());
    assert.ok(regData.token, 'Token should be returned in response');
    
    const authCookie = getSetCookieHeader(regRes);
    assert.ok(authCookie.includes('token='), 'httpOnly token cookie should be set');
    console.log('   ✅ Registration successful and cookie received.');

    // 3. Prevent duplicate email registration
    console.log('3. Testing duplicate email registration prevention...');
    const dupRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    assert.strictEqual(dupRes.status, 400);
    console.log('   ✅ Duplicate registration rejected.');

    // 4. Test login with wrong password
    console.log('4. Testing POST /api/auth/login (invalid credentials)...');
    const badLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: 'WrongPassword!' })
    });
    assert.strictEqual(badLoginRes.status, 401);
    console.log('   ✅ Wrong password rejected with 401.');

    // 5. Test login with correct credentials
    console.log('5. Testing POST /api/auth/login (valid credentials)...');
    const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, password: testPassword })
    });
    const loginData = await loginRes.json();
    assert.strictEqual(loginRes.status, 200);
    assert.strictEqual(loginData.success, true);
    assert.strictEqual(loginData.user.email, testEmail.toLowerCase());
    const loginCookie = getSetCookieHeader(loginRes);
    console.log('   ✅ Login successful and cookie received.');

    // 6. Test GET /api/auth/me using Cookie
    console.log('6. Testing GET /api/auth/me (via Cookie)...');
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Cookie: loginCookie }
    });
    const meData = await meRes.json();
    assert.strictEqual(meRes.status, 200);
    assert.strictEqual(meData.success, true);
    assert.strictEqual(meData.user.email, testEmail.toLowerCase());
    console.log('   ✅ GET /api/auth/me succeeded with Cookie.');

    // 7. Test GET /api/auth/me using Authorization Bearer Header
    console.log('7. Testing GET /api/auth/me (via Bearer Header)...');
    const bearerMeRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${loginData.token}` }
    });
    const bearerMeData = await bearerMeRes.json();
    assert.strictEqual(bearerMeRes.status, 200);
    assert.strictEqual(bearerMeData.user.email, testEmail.toLowerCase());
    console.log('   ✅ GET /api/auth/me succeeded with Bearer Header.');

    // 8. Test GET /api/resumes (List user's profiles)
    console.log('8. Testing GET /api/resumes...');
    const listRes = await fetch(`${BASE_URL}/api/resumes`, {
      headers: { Cookie: loginCookie }
    });
    const listData = await listRes.json();
    assert.strictEqual(listRes.status, 200);
    assert.strictEqual(listData.success, true);
    assert.ok(Array.isArray(listData.data));
    assert.ok(listData.data.length >= 1, 'Should include starter resume profile');
    const starterProfile = listData.data[0];
    console.log(`   ✅ Resumes listed (count: ${listData.data.length}, name: "${starterProfile.profileName}").`);

    // 9. Test POST /api/resumes (Create new resume profile)
    console.log('9. Testing POST /api/resumes (Create new profile)...');
    const newProfilePayload = {
      profileName: 'Full Stack Engineer - 2026',
      basics: {
        fullName: 'Jane Developer',
        email: testEmail,
        phone: '+1 (555) 019-2834',
        location: 'New York, NY',
        linkedinUrl: 'https://linkedin.com/in/janedev',
        githubUrl: 'https://github.com/janedev',
        portfolioUrl: 'https://janedev.com'
      },
      education: [
        {
          institution: 'MIT',
          degree: 'B.S. in Computer Science',
          location: 'Cambridge, MA',
          startDate: '2019',
          endDate: '2023',
          gpa: '3.9 / 4.0',
          enabled: true
        }
      ],
      experience: [
        {
          company: 'Acme AI',
          role: 'Full Stack Engineer',
          location: 'Remote',
          startDate: '2023',
          endDate: 'Present',
          bullets: [
            'Built high-performance full stack web apps with React and Node.js.',
            'Optimized MongoDB aggregations reducing query latency by 40%.'
          ],
          enabled: true
        }
      ],
      projects: [
        {
          title: 'Distributed Task Queue',
          techStack: ['Node.js', 'Redis', 'Docker'],
          link: 'https://github.com/janedev/task-queue',
          bullets: ['Processed 10,000+ jobs/second with sub-50ms latency.'],
          enabled: true
        }
      ],
      skills: {
        languages: ['JavaScript', 'TypeScript', 'Go', 'Python'],
        frameworks: ['Express', 'React', 'Next.js'],
        developerTools: ['Git', 'Docker', 'Kubernetes'],
        libraries: ['Mongoose', 'Tailwind']
      },
      customSections: [
        {
          sectionTitle: 'Honors & Awards',
          items: [
            {
              title: 'First Place Hackathon Winner',
              date: 'Oct 2023',
              description: 'Awarded best full stack system architecture out of 120 teams.',
              enabled: true
            }
          ]
        }
      ]
    };

    const createRes = await fetch(`${BASE_URL}/api/resumes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: loginCookie
      },
      body: JSON.stringify(newProfilePayload)
    });
    const createData = await createRes.json();
    assert.strictEqual(createRes.status, 201);
    assert.strictEqual(createData.success, true);
    assert.strictEqual(createData.data.profileName, 'Full Stack Engineer - 2026');
    assert.strictEqual(createData.data.basics.fullName, 'Jane Developer');
    const createdProfileId = createData.data._id;
    console.log(`   ✅ Resume profile created with ID: ${createdProfileId}.`);

    // 10. Test GET /api/resumes/:id
    console.log('10. Testing GET /api/resumes/:id...');
    const getSingleRes = await fetch(`${BASE_URL}/api/resumes/${createdProfileId}`, {
      headers: { Cookie: loginCookie }
    });
    const getSingleData = await getSingleRes.json();
    assert.strictEqual(getSingleRes.status, 200);
    assert.strictEqual(getSingleData.data._id, createdProfileId);
    assert.strictEqual(getSingleData.data.profileName, 'Full Stack Engineer - 2026');
    console.log('   ✅ GET /api/resumes/:id retrieved correct document.');

    // 11. Test PUT /api/resumes/:id (Update resume profile)
    console.log('11. Testing PUT /api/resumes/:id...');
    const updateRes = await fetch(`${BASE_URL}/api/resumes/${createdProfileId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Cookie: loginCookie
      },
      body: JSON.stringify({
        profileName: 'Senior Full Stack Engineer - Updated',
        basics: {
          fullName: 'Jane Developer, Lead',
          email: testEmail,
          phone: '+1 (555) 999-0000',
          location: 'San Francisco, CA',
          linkedinUrl: 'https://linkedin.com/in/janedev',
          githubUrl: 'https://github.com/janedev',
          portfolioUrl: 'https://janedev.com'
        }
      })
    });
    const updateData = await updateRes.json();
    assert.strictEqual(updateRes.status, 200);
    assert.strictEqual(updateData.data.profileName, 'Senior Full Stack Engineer - Updated');
    assert.strictEqual(updateData.data.basics.fullName, 'Jane Developer, Lead');
    assert.strictEqual(updateData.data.basics.phone, '+1 (555) 999-0000');
    console.log('   ✅ PUT /api/resumes/:id updated profile correctly.');

    // 12. Test DELETE /api/resumes/:id
    console.log('12. Testing DELETE /api/resumes/:id...');
    const deleteRes = await fetch(`${BASE_URL}/api/resumes/${createdProfileId}`, {
      method: 'DELETE',
      headers: { Cookie: loginCookie }
    });
    const deleteData = await deleteRes.json();
    assert.strictEqual(deleteRes.status, 200);
    assert.strictEqual(deleteData.success, true);
    assert.strictEqual(deleteData.id, createdProfileId);

    // Verify it's gone
    const verifyDelRes = await fetch(`${BASE_URL}/api/resumes/${createdProfileId}`, {
      headers: { Cookie: loginCookie }
    });
    assert.strictEqual(verifyDelRes.status, 404);
    console.log('   ✅ DELETE /api/resumes/:id deleted profile and confirmed 404 on subsequent get.');

    // 12a. Test Per-User Profile Cap (Max 5 Resumes)
    console.log('12a. Testing Per-User Profile Cap (Max 5 Resumes)...');
    const tempProfileIds = [];
    // Currently user has 1 starter profile. Create 4 more to reach the cap of 5.
    for (let i = 2; i <= 5; i++) {
      const pRes = await fetch(`${BASE_URL}/api/resumes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Cookie: loginCookie },
        body: JSON.stringify({ profileName: `Test Cap Profile ${i}` })
      });
      const pData = await pRes.json();
      assert.strictEqual(pRes.status, 201);
      tempProfileIds.push(pData.data._id);
    }

    // Attempting to create the 6th profile must be rejected with 400
    const overCapRes = await fetch(`${BASE_URL}/api/resumes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: loginCookie },
      body: JSON.stringify({ profileName: 'Excess 6th Profile' })
    });
    const overCapData = await overCapRes.json();
    assert.strictEqual(overCapRes.status, 400);
    assert.ok(
      (overCapData.error && overCapData.error.includes('Profile limit reached')) ||
      (overCapData.message && overCapData.message.includes('Profile limit reached')),
      'Should return profile limit error message'
    );
    console.log('   ✅ 6th profile creation blocked by per-user cap of 5.');

    // Clean up temporary profiles
    for (const id of tempProfileIds) {
      await fetch(`${BASE_URL}/api/resumes/${id}`, {
        method: 'DELETE',
        headers: { Cookie: loginCookie }
      });
    }

    // 12b. Test Request Body Limit Protection (> 100kb)
    console.log('12b. Testing 100kb Request Body Limit Protection...');
    const oversizedPayload = {
      profileName: 'Bloated Profile',
      basics: {
        fullName: 'Spam Bot',
        summary: 'x'.repeat(120 * 1024) // 120 KB string
      }
    };
    const bloatedRes = await fetch(`${BASE_URL}/api/resumes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: loginCookie },
      body: JSON.stringify(oversizedPayload)
    });
    assert.strictEqual(bloatedRes.status, 413, 'Oversized payload (>100kb) must return HTTP 413 Payload Too Large');
    console.log('   ✅ 120kb oversized payload rejected with HTTP 413 (Payload Too Large).');

    // 13. Test POST /api/auth/logout
    console.log('13. Testing POST /api/auth/logout...');
    const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
      method: 'POST'
    });
    assert.strictEqual(logoutRes.status, 200);
    const setCookieHeader = logoutRes.headers.get('set-cookie');
    assert.ok(
      setCookieHeader && (setCookieHeader.includes('token=;') || setCookieHeader.includes('token=') || setCookieHeader.includes('Expires=Thu, 01 Jan 1970') || setCookieHeader.includes('1970')),
      'Logout should clear token cookie'
    );
    console.log('   ✅ Logout cleared cookie.');

    // 14. Test Unauthorized access without token
    console.log('14. Testing access to protected endpoint without credentials...');
    const unauthRes = await fetch(`${BASE_URL}/api/resumes`);
    assert.strictEqual(unauthRes.status, 401);
    console.log('   ✅ Unauthorized request properly rejected with 401.');

    console.log('\n========================================');
    console.log('🎉 ALL MILESTONE 1 TESTS PASSED SUCCESSFULLY!');
    console.log('========================================\n');
  } finally {
    server.close();
    await disconnectDB();
  }
}

runTests().catch((err) => {
  console.error('❌ Verification failed:', err);
  process.exit(1);
});
