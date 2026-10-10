import assert from 'node:assert';
import {
  estimateBulletLines,
  estimatePageBudget,
} from './pageBudgetEstimator.js';

console.log('🧪 Starting Page Budget Estimator Test Suite...\n');

// Test 1: estimateBulletLines wrapping
console.log('1. Testing estimateBulletLines character wrapping...');
assert.strictEqual(estimateBulletLines(''), 0);
assert.strictEqual(estimateBulletLines(null), 0);
assert.strictEqual(estimateBulletLines('Short bullet item under 100 characters'), 1);
assert.strictEqual(
  estimateBulletLines(
    'A'.repeat(105) // 105 chars -> 1 + floor(105/100) = 2 lines
  ),
  2
);
assert.strictEqual(
  estimateBulletLines(
    'B'.repeat(210) // 210 chars -> 1 + floor(210/100) = 3 lines
  ),
  3
);
console.log('   ✅ estimateBulletLines returns accurate wrapped line counts.');

// Test 2: Null and empty profile handling
console.log('2. Testing empty and null profile handling...');
const emptyResult = estimatePageBudget(null);
assert.strictEqual(emptyResult.estimatedLines, 0);
assert.strictEqual(emptyResult.maxBudget, 48);
assert.strictEqual(emptyResult.percentage, 0);
assert.strictEqual(emptyResult.status, 'safe');
console.log('   ✅ Null profile safely returns 0 lines with safe status.');

// Test 3: Standard balanced profile (Safe status < 85%)
console.log('3. Testing standard resume profile within safe budget (<85%)...');
const sampleProfile = {
  basics: {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    phone: '555-123-4567',
  },
  education: [
    {
      institution: 'State University',
      degree: 'B.S. Computer Science',
      startDate: '2020',
      endDate: '2024',
      enabled: true,
    },
  ],
  experience: [
    {
      company: 'Tech Corp',
      role: 'Software Intern',
      enabled: true,
      bullets: [
        { text: 'Developed high-throughput caching service', enabled: true },
        { text: 'Optimized SQL database query latency by 40%', enabled: true },
      ],
    },
  ],
  projects: [
    {
      title: 'Distributed File Store',
      techStack: ['Go', 'Raft'],
      enabled: true,
      bullets: [
        { text: 'Implemented consensus leader election protocol', enabled: true },
      ],
    },
  ],
  skills: [
    { category: 'Languages', items: ['Go', 'Python', 'TypeScript'], enabled: true },
    { category: 'Databases', items: ['PostgreSQL', 'Redis'], enabled: true },
  ],
};

const safeBudget = estimatePageBudget(sampleProfile);
// Header: 4
// Education: 2 + 2 = 4
// Experience: 2 + 1.5 + 2 = 5.5
// Projects: 2 + 1.5 + 1 = 4.5
// Skills: 2 + 2 = 4
// Total = 22 lines. 22 / 48 = 46%
assert.strictEqual(safeBudget.breakdown.header, 4);
assert.strictEqual(safeBudget.breakdown.education, 4);
assert.strictEqual(safeBudget.breakdown.experience, 5.5);
assert.strictEqual(safeBudget.breakdown.projects, 4.5);
assert.strictEqual(safeBudget.breakdown.skills, 4);
assert.strictEqual(safeBudget.estimatedLines, 22);
assert.strictEqual(safeBudget.percentage, 46);
assert.strictEqual(safeBudget.status, 'safe');
console.log(`   ✅ Safe profile evaluated: ${safeBudget.estimatedLines}/${safeBudget.maxBudget} lines (${safeBudget.percentage}%) - status: ${safeBudget.status}.`);

// Test 4: Reactive bullet toggle behavior
console.log('4. Testing reactivity when disabling bullets and entries...');
const toggledProfile = {
  ...sampleProfile,
  experience: [
    {
      ...sampleProfile.experience[0],
      bullets: [
        { text: 'Developed high-throughput caching service', enabled: false }, // DISABLED
        { text: 'Optimized SQL database query latency by 40%', enabled: true },
      ],
    },
  ],
};
const toggledBudget = estimatePageBudget(toggledProfile);
assert.strictEqual(toggledBudget.estimatedLines, safeBudget.estimatedLines - 1);
assert.strictEqual(toggledBudget.breakdown.experience, safeBudget.breakdown.experience - 1);
console.log('   ✅ Disabling a bullet immediately reduces estimated lines by 1.');

// Test 5: Tight fit warning (85% - 100%)
console.log('5. Testing tight fit budget threshold (85-100% -> warning)...');
// Add bullets to push total to ~44 lines (44/48 = 92%)
const tightProfile = {
  ...sampleProfile,
  experience: [
    {
      company: 'Tech Corp',
      role: 'Software Intern',
      enabled: true,
      bullets: Array.from({ length: 12 }, (_, i) => ({
        text: `Accomplishment bullet item number ${i + 1} with standard detail`,
        enabled: true,
      })),
    },
    {
      company: 'Startup Hub',
      role: 'Junior Engineer',
      enabled: true,
      bullets: Array.from({ length: 8 }, (_, i) => ({
        text: `Secondary job accomplishment bullet item number ${i + 1}`,
        enabled: true,
      })),
    },
  ],
};
const tightBudget = estimatePageBudget(tightProfile);
assert(tightBudget.percentage >= 85 && tightBudget.percentage <= 100, `Expected 85-100%, got ${tightBudget.percentage}%`);
assert.strictEqual(tightBudget.status, 'warning');
console.log(`   ✅ Tight fit evaluated: ${tightBudget.estimatedLines}/${tightBudget.maxBudget} lines (${tightBudget.percentage}%) - status: warning.`);

// Test 6: Overflow threshold (> 100% -> overflow)
console.log('6. Testing overflow threshold (>100% -> overflow)...');
const overflowProfile = {
  ...tightProfile,
  projects: [
    {
      title: 'Project Alpha',
      enabled: true,
      bullets: Array.from({ length: 10 }, (_, i) => ({
        text: `Long detailed project feature implementation ${i + 1} across multiple services and modules`,
        enabled: true,
      })),
    },
  ],
};
const overflowBudget = estimatePageBudget(overflowProfile);
assert(overflowBudget.percentage > 100, `Expected >100%, got ${overflowBudget.percentage}%`);
assert.strictEqual(overflowBudget.status, 'overflow');
console.log(`   ✅ Overflow evaluated: ${overflowBudget.estimatedLines}/${overflowBudget.maxBudget} lines (${overflowBudget.percentage}%) - status: overflow.`);

console.log('\n========================================');
console.log('🎉 ALL PAGE BUDGET ESTIMATOR UNIT TESTS PASSED!');
console.log('========================================\n');
