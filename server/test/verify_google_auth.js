import assert from 'node:assert/strict';
import User from '../src/models/User.js';
import ResumeProfile from '../src/models/ResumeProfile.js';
import {
  googleLogin,
  setGoogleTokenVerifierForTests,
} from '../src/controllers/authController.js';

const originalClientId = process.env.GOOGLE_CLIENT_ID;
const originalFindOne = User.findOne;
const originalCreate = User.create;
const originalResumeCreate = ResumeProfile.create;

function responseDouble() {
  return {
    statusCode: 200,
    body: null,
    cookie() {},
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

function userDouble(overrides = {}) {
  return {
    _id: 'user-1',
    email: 'person@example.com',
    createdAt: new Date('2026-01-01'),
    password: undefined,
    googleId: 'google-1',
    saveCalled: false,
    async save() {
      this.saveCalled = true;
      return this;
    },
    ...overrides,
  };
}

async function invokeGoogle(credential = 'credential') {
  const res = responseDouble();
  await googleLogin({ body: { credential } }, res);
  return res;
}

async function run() {
  process.env.GOOGLE_CLIENT_ID = 'test-client-id';

  setGoogleTokenVerifierForTests(async () => {
    throw new Error('invalid signature');
  });
  assert.equal((await invokeGoogle()).statusCode, 401, 'invalid token should return 401');
  assert.equal((await invokeGoogle('wrong-audience')).body.message, 'Invalid Google credential');

  setGoogleTokenVerifierForTests(async () => ({
    sub: 'google-unverified',
    email: 'person@example.com',
    email_verified: false,
  }));
  assert.equal((await invokeGoogle()).statusCode, 403, 'unverified email should return 403');

  setGoogleTokenVerifierForTests(async () => ({
    email: 'person@example.com',
    email_verified: true,
  }));
  assert.equal((await invokeGoogle()).statusCode, 401, 'missing Google subject should return 401');

  assert.equal((await invokeGoogle('')).statusCode, 400, 'missing credential should return 400');
  assert.equal((await invokeGoogle('x'.repeat(10_001))).statusCode, 400, 'oversized credential should return 400');

  const newUser = userDouble({ _id: 'new-user', email: 'new@example.com', googleId: 'google-new' });
  let starterProfileCreated = false;
  User.findOne = async () => null;
  User.create = async () => newUser;
  ResumeProfile.create = async (profile) => {
    starterProfileCreated = profile.userId === newUser._id && profile.profileName === 'SWE Intern - General';
    return { _id: 'starter-1', ...profile };
  };
  let receivedAudience;
  setGoogleTokenVerifierForTests(async (_credential, audience) => {
    receivedAudience = audience;
    return { sub: 'google-new', email: 'New@Example.com', email_verified: true };
  });
  const newUserResponse = await invokeGoogle();
  assert.equal(newUserResponse.statusCode, 200, 'new Google user should receive a session');
  assert.equal(starterProfileCreated, true, 'new Google users should get the shared starter profile');
  assert.equal(receivedAudience, 'test-client-id', 'verifier should receive the configured audience');
  assert.equal(newUserResponse.body.defaultProfileId, 'starter-1');

  const linkedGoogleUser = userDouble({ _id: 'google-user', googleId: 'google-existing' });
  User.findOne = async (query) => (query.googleId ? linkedGoogleUser : null);
  const returningResponse = await invokeGoogle();
  assert.equal(returningResponse.statusCode, 200, 'returning Google user should receive a session');
  assert.equal(starterProfileCreated, true, 'returning Google users should not create another profile');

  const passwordUser = userDouble({ _id: 'password-user', googleId: undefined, password: 'hashed-password' });
  User.findOne = async (query) => (query.googleId ? null : passwordUser);
  setGoogleTokenVerifierForTests(async () => ({
    sub: 'google-link',
    email: passwordUser.email,
    email_verified: true,
  }));
  const linkedResponse = await invokeGoogle();
  assert.equal(linkedResponse.statusCode, 200, 'existing password user should be linked');
  assert.equal(passwordUser.googleId, 'google-link');
  assert.equal(passwordUser.saveCalled, true);

  // Test: Reject linking if existing user has a DIFFERENT googleId (403)
  const differentGoogleUser = userDouble({ _id: 'diff-user', email: 'diff@example.com', googleId: 'google-original' });
  User.findOne = async (query) => (query.googleId === 'google-original' || query.email === 'diff@example.com' ? differentGoogleUser : null);
  setGoogleTokenVerifierForTests(async () => ({
    sub: 'google-attacker',
    email: 'diff@example.com',
    email_verified: true,
  }));
  const hijackAttempt = await invokeGoogle();
  assert.equal(hijackAttempt.statusCode, 403, 'attempt to link email with different googleId must return 403');

  // Test: Concurrent duplicate user race condition (E11000)
  const raceUser = userDouble({ _id: 'race-user', email: 'race@example.com', googleId: 'google-race' });
  let findOneCallCount = 0;
  User.findOne = async () => {
    findOneCallCount++;
    return findOneCallCount === 1 ? null : raceUser;
  };
  User.create = async () => {
    const duplicateErr = new Error('E11000 duplicate key error');
    duplicateErr.code = 11000;
    throw duplicateErr;
  };
  setGoogleTokenVerifierForTests(async () => ({
    sub: 'google-race',
    email: 'race@example.com',
    email_verified: true,
  }));
  const raceResponse = await invokeGoogle();
  assert.equal(raceResponse.statusCode, 200, 'concurrent signup race (E11000) should recover and succeed');

  // Test: Starter profile creation retry
  const retryUser = userDouble({ _id: 'retry-user', email: 'retry@example.com', googleId: 'google-retry' });
  User.findOne = async () => null;
  User.create = async () => retryUser;
  let profileAttempts = 0;
  ResumeProfile.create = async (profile) => {
    profileAttempts++;
    if (profileAttempts === 1) {
      throw new Error('Transient DB timeout on starter profile creation');
    }
    return { _id: 'starter-retry-id', ...profile };
  };
  setGoogleTokenVerifierForTests(async () => ({
    sub: 'google-retry',
    email: 'retry@example.com',
    email_verified: true,
  }));
  const retryResponse = await invokeGoogle();
  assert.equal(retryResponse.statusCode, 200, 'starter profile transient error should retry and succeed');
  assert.equal(profileAttempts, 2, 'starter profile creation was retried once');
  assert.equal(retryResponse.body.defaultProfileId, 'starter-retry-id');

  assert.equal(User.schema.path('password').options.select, false, 'legacy password hashes must never be selected');
  const serializedLegacyUser = User.hydrate({
    _id: '507f1f77bcf86cd799439011',
    email: 'legacy@example.com',
    password: 'legacy-hash',
    googleId: 'legacy-google',
  }).toJSON();
  assert.equal(serializedLegacyUser.password, undefined, 'legacy password hashes must not serialize');

  delete process.env.GOOGLE_CLIENT_ID;
  assert.equal((await invokeGoogle()).statusCode, 503, 'unset client ID should return 503');

  console.log('✅ Google auth validation, linking, starter profile, session, and legacy credential privacy tests passed.');
}

try {
  await run();
} finally {
  setGoogleTokenVerifierForTests();
  User.findOne = originalFindOne;
  User.create = originalCreate;
  ResumeProfile.create = originalResumeCreate;
  if (originalClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
  else process.env.GOOGLE_CLIENT_ID = originalClientId;
}
