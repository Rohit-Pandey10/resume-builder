import assert from 'node:assert/strict';
import {
  GUEST_STORAGE_KEY,
  localStore,
} from './profileStore.js';

const values = new Map();
const listeners = new Map();
const fakeStorage = {
  getItem(key) {
    return values.has(key) ? values.get(key) : null;
  },
  setItem(key, value) {
    values.set(key, String(value));
  },
  removeItem(key) {
    values.delete(key);
  },
};

globalThis.window = {
  localStorage: fakeStorage,
  addEventListener(type, listener) {
    listeners.set(type, listener);
  },
  removeEventListener(type) {
    listeners.delete(type);
  },
};

async function run() {
  const first = await localStore.list();
  assert.equal(first.data.length, 1);
  assert.match(first.data[0]._id, /^guest-/);
  assert.equal(first.dirty, false);

  const updated = await localStore.update(first.data[0]._id, {
    profileName: 'Guest edited resume',
  });
  assert.equal(updated.data.profileName, 'Guest edited resume');
  const afterEdit = await localStore.list();
  assert.equal(afterEdit.data[0].profileName, 'Guest edited resume');
  assert.equal(afterEdit.dirty, true);

  const migration = await localStore.getMigrationSnapshot();
  assert.equal(migration.profiles.length, 1);
  await localStore.markMigrationDismissed();
  assert.equal(await localStore.getMigrationSnapshot(), null);

  values.set(GUEST_STORAGE_KEY, '{not valid json');
  const recovered = await localStore.list();
  assert.equal(recovered.data.length, 1);
  assert.equal([...values.keys()].some((key) => key.startsWith('jakeresume:guest:corrupt-')), true);

  assert.equal(listeners.size, 0);
  console.log('✅ Guest local store shape, persistence, dirty migration flag, and corrupt backup checks passed.');
}

run().catch((error) => {
  console.error('❌ Guest store verification failed:', error);
  process.exit(1);
});
