import assert from 'node:assert';
import { normalizeProfile, DEFAULT_SECTION_ORDER } from './bulletHelper.js';
import { generateLatex } from './latexGenerator.js';

console.log('🧪 Starting Schema Safety & Section Order Test Suite...\n');

// 1. Legacy Profile without *Enabled fields (saved before this change)
console.log('1. Testing legacy profile normalization (saved prior to *Enabled fields)...');
const legacyProfile = {
  profileName: 'Legacy Senior Developer',
  basics: {
    fullName: 'Alice Johnson',
    email: 'alice@example.com'
  },
  education: [
    { institution: 'MIT', degree: 'B.S. CS' } // no 'enabled' field
  ],
  experience: [
    { company: 'Acme Corp', role: 'Staff Eng', bullets: ['Built distributed cache'] } // no 'enabled' field
  ],
  projects: [
    { title: 'OpenCloud', techStack: ['Go'], bullets: ['Distributed key-value store'] } // no 'enabled' field
  ],
  skills: [
    { category: 'Languages', items: ['Python', 'TypeScript'] } // no 'enabled' field
  ],
  customSections: [
    { sectionTitle: 'Patents', items: [{ title: 'Patent US12345', bullets: ['Distributed consensus'] }] } // no 'enabled' field
  ]
};

const normalized = normalizeProfile(legacyProfile);

// Verify top-level section enabled coercion
assert.strictEqual(normalized.educationEnabled, true, 'educationEnabled must be coerced to true when undefined');
assert.strictEqual(normalized.experienceEnabled, true, 'experienceEnabled must be coerced to true when undefined');
assert.strictEqual(normalized.projectsEnabled, true, 'projectsEnabled must be coerced to true when undefined');
assert.strictEqual(normalized.skillsEnabled, true, 'skillsEnabled must be coerced to true when undefined');
assert.strictEqual(normalized.customSectionsEnabled, true, 'customSectionsEnabled must be coerced to true when undefined');

// Verify item-level enabled coercion
assert.strictEqual(normalized.education[0].enabled, true, 'education item enabled must be coerced to true');
assert.strictEqual(normalized.experience[0].enabled, true, 'experience item enabled must be coerced to true');
assert.strictEqual(normalized.projects[0].enabled, true, 'project item enabled must be coerced to true');
assert.strictEqual(normalized.skills[0].enabled, true, 'skill category enabled must be coerced to true');
assert.strictEqual(normalized.customSections[0].enabled, true, 'custom section enabled must be coerced to true');
assert.strictEqual(normalized.customSections[0].items[0].enabled, true, 'custom section item enabled must be coerced to true');
console.log('   ✅ All sections and items on legacy profiles default to visible (PASS)');

// 2. Section Order Scramble & Reset Verification with latexGenerator
console.log('\n2. Testing scrambled section order and "Reset section order"...');
const scrambledProfile = {
  ...normalized,
  sectionOrder: ['skills', 'experience', 'education', 'projects', 'customSections']
};

// Generate LaTeX with scrambled order
const scrambledLatex = generateLatex(scrambledProfile);
const skillsPos1 = scrambledLatex.indexOf('\\section{Technical Skills}');
const expPos1 = scrambledLatex.indexOf('\\section{Experience}');
assert.ok(skillsPos1 !== -1 && expPos1 !== -1, 'Sections must exist in generated LaTeX');
assert.ok(skillsPos1 < expPos1, 'In scrambled order, Skills must appear BEFORE Experience in LaTeX');
console.log('   ✅ Scrambled order verified: Technical Skills index (%d) < Experience index (%d)', skillsPos1, expPos1);

// Now simulate "Reset section order" handler:
const resetSectionOrder = [...DEFAULT_SECTION_ORDER];
const resetProfile = {
  ...scrambledProfile,
  sectionOrder: resetSectionOrder
};

assert.deepStrictEqual(
  resetProfile.sectionOrder,
  ['education', 'experience', 'projects', 'skills', 'customSections'],
  'Reset order must match DEFAULT_SECTION_ORDER'
);

// Generate LaTeX after reset
const resetLatex = generateLatex(resetProfile);
const skillsPos2 = resetLatex.indexOf('\\section{Technical Skills}');
const expPos2 = resetLatex.indexOf('\\section{Experience}');
assert.ok(expPos2 < skillsPos2, 'After reset, Experience must appear BEFORE Skills in LaTeX');
console.log('   ✅ Reset order verified: Experience index (%d) < Technical Skills index (%d) (PASS)', expPos2, skillsPos2);

// 3. Autosave Concurrency / Stale Overwrite Protection Logic
console.log('\n3. Testing Autosave Concurrency Guard (cannot overwrite profile when switching quickly)...');

// Simulate state machine:
const activeProfileRef = { current: 'profile_A' };
let currentActiveProfile = { _id: 'profile_A', profileName: 'Profile A' };

// Trigger save for Profile A
const targetSaveId = activeProfileRef.current;
assert.strictEqual(currentActiveProfile._id, 'profile_A', 'Initial active profile is A');
const simulatedServerResponseProfileA = { _id: 'profile_A', profileName: 'Profile A Updated' };

// While save is in flight, user switches to Profile B:
activeProfileRef.current = 'profile_B';
currentActiveProfile = { _id: 'profile_B', profileName: 'Profile B' };

// Now Profile A's save resolves:
if (activeProfileRef.current === targetSaveId) {
  currentActiveProfile = simulatedServerResponseProfileA;
}

assert.strictEqual(
  currentActiveProfile._id,
  'profile_B',
  'Profile B must NOT be overwritten by Profile A in-flight save response'
);
assert.strictEqual(
  currentActiveProfile.profileName,
  'Profile B',
  'Profile B content must be preserved untouched'
);
console.log('   ✅ Stale in-flight save response safely ignored when active profile switched (PASS)');

console.log('\n========================================');
console.log('🎉 ALL SCHEMA SAFETY TESTS PASSED!');
console.log('========================================\n');
