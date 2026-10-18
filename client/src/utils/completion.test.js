import assert from 'node:assert/strict';
import { completion } from './completion.js';

assert.deepEqual(completion({}), { filled: 0, total: 5, percent: 0 });
assert.deepEqual(completion(null), { filled: 0, total: 5, percent: 0 });
assert.deepEqual(completion({ basics: { fullName: 'Jane Doe', email: 'jane@example.com' }, education: [{ institution: 'State U' }], experience: [{ company: 'Acme' }], projects: [{ title: 'Portfolio' }], skills: [{ items: ['React'] }] }), { filled: 5, total: 5, percent: 100 });
assert.deepEqual(completion({ basics: { fullName: 'Jane Doe', email: 'jane@example.com' }, educationEnabled: false, experienceEnabled: false, projectsEnabled: false, skillsEnabled: false }), { filled: 1, total: 1, percent: 100 });
console.log('✅ Completion helper tests passed.');
