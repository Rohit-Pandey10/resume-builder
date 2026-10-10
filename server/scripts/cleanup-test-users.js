/**
 * server/scripts/cleanup-test-users.js
 *
 * Cleanup script to purge seeded test accounts ending with "@test.com"
 * and their associated resume profiles from MongoDB.
 *
 * SAFETY:
 * - Defaults to DRY RUN mode.
 * - Does NOT perform deletions unless explicitly executed with `--confirm`.
 * - Only matches accounts where email ends with "@test.com" (case-insensitive).
 * - Prints matched email addresses and counts only; never prints credentials or tokens.
 *
 * USAGE:
 *   Dry run:
 *     node server/scripts/cleanup-test-users.js
 *
 *   Actual cleanup (DESTRUCTIVE):
 *     node server/scripts/cleanup-test-users.js --confirm
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import User from '../src/models/User.js';
import ResumeProfile from '../src/models/ResumeProfile.js';

dotenv.config();

async function main() {
  const isConfirmed = process.argv.includes('--confirm');
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('Error: MONGODB_URI environment variable is not defined.');
    process.exit(1);
  }

  console.log(`Connecting to MongoDB for test user cleanup... (Mode: ${isConfirmed ? 'EXECUTE' : 'DRY-RUN'})`);

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    const testUsers = await User.find(
      { email: { $regex: /@test\.com$/i } },
      { _id: 1, email: 1 }
    ).lean();

    console.log(`Found ${testUsers.length} test user(s) matching *@test.com:`);
    for (const u of testUsers) {
      console.log(`  - ${u.email}`);
    }

    if (testUsers.length === 0) {
      console.log('No test accounts found. Nothing to clean up.');
      await mongoose.disconnect();
      return;
    }

    const testUserIds = testUsers.map((u) => u._id);
    const matchedProfileCount = await ResumeProfile.countDocuments({
      userId: { $in: testUserIds },
    });

    console.log(`Associated resume profile count: ${matchedProfileCount}`);

    if (!isConfirmed) {
      console.log('\n[DRY RUN] No records were modified or deleted.');
      console.log('To permanently delete these test users and their profiles, rerun with --confirm:');
      console.log('  node server/scripts/cleanup-test-users.js --confirm');
    } else {
      console.log('\n[CONFIRMED] Proceeding with deletion...');
      const profileResult = await ResumeProfile.deleteMany({
        userId: { $in: testUserIds },
      });
      const userResult = await User.deleteMany({
        _id: { $in: testUserIds },
      });

      console.log(`Deleted ${userResult.deletedCount} user record(s).`);
      console.log(`Deleted ${profileResult.deletedCount} associated profile record(s).`);
      console.log('Cleanup completed successfully.');
    }
  } catch (err) {
    console.error(`Error during cleanup: ${err.message}`);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect().catch(() => {});
  }
}

main();
