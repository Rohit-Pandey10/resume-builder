import assert from 'node:assert';
import { ProfileHistoryManager, isDiscreteChange } from './historyHelper.js';

console.log('Testing ProfileHistoryManager and historyHelper...');

// Test 1: Max 100 steps
{
  const manager = new ProfileHistoryManager(100);
  const baseProfile = { profileName: 'Test', education: [] };
  
  for (let i = 0; i < 110; i++) {
    manager.pushDiscrete({ ...baseProfile, step: i });
  }

  assert.strictEqual(manager.past.length, 100, 'Past stack should not exceed 100 items');
  assert.strictEqual(manager.past[0].step, 10, 'Oldest states beyond 100 should be pruned');
  assert.strictEqual(manager.past[99].step, 109, 'Most recent state before current is kept');
  console.log('✔ Test 1 passed: Max 100 steps enforced and pruned oldest');
}

// Test 2: Discrete changes vs Typing detection
{
  const prevExp = [
    { company: 'Google', role: 'SWE', bullets: [{ text: 'Built X', enabled: true }] }
  ];
  const typingExp = [
    { company: 'Google Inc', role: 'SWE', bullets: [{ text: 'Built X', enabled: true }] }
  ];
  const addBulletExp = [
    { company: 'Google', role: 'SWE', bullets: [{ text: 'Built X', enabled: true }, { text: 'Built Y', enabled: true }] }
  ];
  const deleteBulletExp = [
    { company: 'Google', role: 'SWE', bullets: [] }
  ];
  const toggleBulletExp = [
    { company: 'Google', role: 'SWE', bullets: [{ text: 'Built X', enabled: false }] }
  ];
  const addJobExp = [
    ...prevExp,
    { company: 'Meta', role: 'SWE', bullets: [] }
  ];
  const deleteJobExp = [];

  assert.strictEqual(isDiscreteChange(prevExp, typingExp), false, 'Text change should not be discrete');
  assert.strictEqual(isDiscreteChange(prevExp, addBulletExp), true, 'Add bullet should be discrete');
  assert.strictEqual(isDiscreteChange(prevExp, deleteBulletExp), true, 'Delete bullet should be discrete');
  assert.strictEqual(isDiscreteChange(prevExp, toggleBulletExp), true, 'Toggle bullet should be discrete');
  assert.strictEqual(isDiscreteChange(prevExp, addJobExp), true, 'Add entry should be discrete');
  assert.strictEqual(isDiscreteChange(prevExp, deleteJobExp), true, 'Delete entry should be discrete');
  console.log('✔ Test 2 passed: isDiscreteChange accurately classifies discrete vs typing changes');
}

// Test 3: Typing debouncing (~800ms) grouping
{
  const manager = new ProfileHistoryManager(100);
  const profile0 = { basics: { name: 'J' } };
  const profile1 = { basics: { name: 'Ja' } };
  const profile2 = { basics: { name: 'Jak' } };
  const profile3 = { basics: { name: 'Jake' } };

  manager.recordTyping(profile0);
  manager.recordTyping(profile1);
  manager.recordTyping(profile2);

  // During typing burst, only 1 snapshot was created in past stack
  assert.strictEqual(manager.past.length, 1);
  assert.deepStrictEqual(manager.past[0], profile0, 'Snapshot in past should be original before burst');

  // Undo should restore profile0
  const undone = manager.undo(profile3);
  assert.deepStrictEqual(undone, profile0, 'Undo restores state before typing burst');
  assert.strictEqual(manager.canRedo(), true);

  // Redo restores profile3
  const redone = manager.redo(undone);
  assert.deepStrictEqual(redone, profile3, 'Redo restores state after typing burst');
  console.log('✔ Test 3 passed: Typing burst grouped into single history step');
}

// Test 4: Discrete add, delete, toggle, reset are 1 step each
{
  const manager = new ProfileHistoryManager(100);
  const state0 = { education: [] };
  const state1 = { education: [{ institution: 'MIT', enabled: true }] };
  const state2 = { education: [{ institution: 'MIT', enabled: false }] }; // toggle
  const state3 = { education: [] }; // delete

  // Add
  manager.pushDiscrete(state0);
  // Toggle
  manager.pushDiscrete(state1);
  // Delete
  manager.pushDiscrete(state2);

  assert.strictEqual(manager.past.length, 3);

  // Undo delete -> restores state2
  const u1 = manager.undo(state3);
  assert.deepStrictEqual(u1, state2);

  // Undo toggle -> restores state1
  const u2 = manager.undo(u1);
  assert.deepStrictEqual(u2, state1);

  // Undo add -> restores state0
  const u3 = manager.undo(u2);
  assert.deepStrictEqual(u3, state0);

  assert.strictEqual(manager.canUndo(), false);
  console.log('✔ Test 4 passed: Each discrete operation is exactly one history step');
}

// Test 5: Clear history on profile switch and sign out
{
  const manager = new ProfileHistoryManager(100);
  manager.pushDiscrete({ profileName: 'P1' });
  assert.strictEqual(manager.canUndo(), true);

  manager.clear();
  assert.strictEqual(manager.canUndo(), false);
  assert.strictEqual(manager.canRedo(), false);
  assert.strictEqual(manager.past.length, 0);
  assert.strictEqual(manager.future.length, 0);
  console.log('✔ Test 5 passed: History cleared properly');
}

console.log('All ProfileHistoryManager tests passed!');
