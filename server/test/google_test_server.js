import app from '../src/server.js';
import { setGoogleTokenVerifierForTests } from '../src/controllers/authController.js';
import { connectDB, disconnectDB } from '../src/config/db.js';

const port = Number(process.env.GOOGLE_TEST_PORT || 5100);
process.env.GOOGLE_CLIENT_ID = 'browser-test-client-id';

setGoogleTokenVerifierForTests(async (credential, audience) => ({
  sub: `browser-test-${credential}`,
  email: `${credential}@example.test`,
  email_verified: true,
  aud: audience,
}));

await connectDB();
const server = app.listen(port, () => {
  console.log(`Google verifier test server listening on ${port}`);
});

const shutdown = async () => {
  await new Promise((resolve) => server.close(resolve));
  await disconnectDB();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
