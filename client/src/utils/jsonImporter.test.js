import assert from 'node:assert';
import { parseImportedResume } from './jsonImporter.js';

console.log('🧪 Starting Milestone 5: AI Resume Importer Test Suite...\n');

// 1. Clean JSON test with dynamic skills array and custom sections with bullets
console.log('1. Testing clean JSON input with dynamic skills and multi-bullet custom sections...');
const cleanJson = JSON.stringify({
  profileName: 'Senior Backend Engineer',
  basics: {
    fullName: 'Jane Doe',
    email: 'jane@example.com',
    phone: '+1 555-0199',
    location: 'San Francisco, CA',
    linkedinUrl: 'https://linkedin.com/in/janedoe',
    githubUrl: 'https://github.com/janedoe',
    portfolioUrl: 'https://janedoe.dev',
  },
  education: [
    {
      institution: 'UC Berkeley',
      degree: 'B.S. in Computer Science',
      location: 'Berkeley, CA',
      startDate: 'Aug 2018',
      endDate: 'May 2022',
      gpa: '3.92',
      enabled: true,
    },
  ],
  experience: [
    {
      company: 'TechCorp',
      role: 'Staff Engineer',
      location: 'San Francisco, CA',
      startDate: 'June 2022',
      endDate: 'Present',
      bullets: [
        { text: 'Architected high-throughput distributed microservices.', enabled: true },
        { text: 'Mentored 8 junior and mid-level software engineers.', enabled: true },
      ],
      enabled: true,
    },
  ],
  projects: [
    {
      title: 'Distributed Cache',
      techStack: ['Go', 'Raft', 'gRPC'],
      link: 'https://github.com/janedoe/cache',
      bullets: [{ text: 'Implemented Raft consensus algorithm.', enabled: true }],
      enabled: true,
    },
  ],
  skills: [
    { category: 'Languages', items: ['Go', 'TypeScript', 'Python'], enabled: true },
    { category: 'Frontend', items: ['React', 'Next.js'], enabled: true },
    { category: 'Backend & Database', items: ['Node.js', 'PostgreSQL', 'Redis'], enabled: true },
    { category: 'Core Concepts', items: ['Distributed Systems', 'REST APIs'], enabled: true },
  ],
  customSections: [
    {
      sectionTitle: 'Competitive Programming & Achievements',
      items: [
        {
          title: 'Competitive Programming Profiles',
          subtitle: 'LeetCode, Codeforces, CodeChef',
          date: '2024 - Present',
          bullets: [
            { text: 'Solved 180+ problems across LeetCode, Codeforces, and CodeChef.', enabled: true },
            { text: 'CodeChef Rating: 1359 (Max: 1371) across 18 competitive rounds.', enabled: true },
          ],
          enabled: true,
        },
      ],
    },
  ],
});

const result1 = parseImportedResume(cleanJson);
assert.strictEqual(result1.profileName, 'Senior Backend Engineer');
assert.strictEqual(result1.basics.fullName, 'Jane Doe');
assert.strictEqual(result1.education.length, 1);
assert.strictEqual(result1.experience[0].bullets.length, 2);
assert.strictEqual(result1.experience[0].bullets[0].enabled, true);

// Verify dynamic skills categories
assert.strictEqual(result1.skills.length, 4);
assert.strictEqual(result1.skills[0].category, 'Languages');
assert.deepStrictEqual(result1.skills[0].items, ['Go', 'TypeScript', 'Python']);
assert.strictEqual(result1.skills[1].category, 'Frontend');
assert.strictEqual(result1.skills[2].category, 'Backend & Database');
assert.strictEqual(result1.skills[3].category, 'Core Concepts');

// Verify custom sections with subtitle and discrete bullets
assert.strictEqual(result1.customSections.length, 1);
assert.strictEqual(result1.customSections[0].sectionTitle, 'Competitive Programming & Achievements');
assert.strictEqual(result1.customSections[0].items[0].title, 'Competitive Programming Profiles');
assert.strictEqual(result1.customSections[0].items[0].subtitle, 'LeetCode, Codeforces, CodeChef');
assert.strictEqual(result1.customSections[0].items[0].bullets.length, 2);
assert.strictEqual(result1.customSections[0].items[0].bullets[0].text, 'Solved 180+ problems across LeetCode, Codeforces, and CodeChef.');
assert.strictEqual(result1.customSections[0].items[0].bullets[0].enabled, true);
console.log('   ✅ Clean JSON with dynamic skills & multi-bullet custom sections parsed correctly.');

// 2. Markdown fence stripping (```json ... ```)
console.log('2. Testing markdown codeblock stripping (```json ... ```)...');
const markdownWrapped = `\`\`\`json\n${cleanJson}\n\`\`\``;
const result2 = parseImportedResume(markdownWrapped);
assert.strictEqual(result2.basics.fullName, 'Jane Doe');
assert.strictEqual(result2.experience[0].company, 'TechCorp');
console.log('   ✅ Markdown code fences stripped successfully.');

// 3. Conversational preamble and postamble stripping
console.log('3. Testing conversational preamble and postscript stripping...');
const conversationalText = `Here is the extracted resume JSON as requested by your prompt:

\`\`\`json
${cleanJson}
\`\`\`

I hope this helps you build an ATS-compliant resume! Feel free to ask if you need changes.`;
const result3 = parseImportedResume(conversationalText);
assert.strictEqual(result3.basics.email, 'jane@example.com');
assert.strictEqual(result3.projects[0].title, 'Distributed Cache');
console.log('   ✅ Conversational preamble and outro stripped successfully.');

// 4. Missing optional fields and defaults (with legacy skills fallback)
console.log('4. Testing missing optional fields, legacy skills object compatibility & default naming...');
const legacyJson = JSON.stringify({
  basics: {
    fullName: 'John Smith',
  },
  experience: [
    {
      company: 'Acme Inc',
      bullets: ['Built REST API endpoints', 'Wrote unit tests'],
    },
  ],
  skills: {
    languages: ['Python', 'C++'],
    frameworks: ['Flask'],
  },
});
const result4 = parseImportedResume(legacyJson);
assert.ok(result4.profileName.startsWith('Imported Resume -'));
assert.strictEqual(result4.basics.fullName, 'John Smith');
assert.strictEqual(result4.basics.email, '');
assert.strictEqual(result4.education.length, 0);
assert.strictEqual(result4.experience.length, 1);
assert.strictEqual(result4.experience[0].bullets.length, 2);
assert.strictEqual(result4.experience[0].bullets[0].text, 'Built REST API endpoints');
assert.strictEqual(result4.experience[0].bullets[0].enabled, true);
assert.strictEqual(result4.experience[0].bullets[1].text, 'Wrote unit tests');
assert.strictEqual(result4.experience[0].bullets[1].enabled, true);

// Verify legacy skills object converted to category objects
assert.strictEqual(result4.skills.length, 2);
assert.strictEqual(result4.skills[0].category, 'Languages');
assert.deepStrictEqual(result4.skills[0].items, ['Python', 'C++']);
assert.strictEqual(result4.skills[1].category, 'Frameworks');
assert.deepStrictEqual(result4.skills[1].items, ['Flask']);
assert.deepStrictEqual(result4.customSections, []);
console.log('   ✅ Legacy skills objects normalized to dynamic categories, safe defaults backfilled.');

// 5. Error handling on invalid input or malformed JSON
console.log('5. Testing error handling on malformed input...');
assert.throws(() => parseImportedResume(''), /Please paste the JSON response/);
assert.throws(() => parseImportedResume('Hello world, no json here!'), /Could not find a valid JSON object/);
assert.throws(() => parseImportedResume('{"profileName": "Broken JSON"'), /Could not find a valid JSON object/);
assert.throws(() => parseImportedResume('{"profileName": broken_unquoted_value}'), /Invalid JSON syntax/);
console.log('   ✅ Informative error messages thrown on invalid inputs.');

// 6. Testing AI_EXTRACTION_PROMPT contract validation
console.log('6. Testing AI_EXTRACTION_PROMPT structure and rules...');
import('./aiPromptTemplate.js').then(({ AI_EXTRACTION_PROMPT }) => {
  assert.ok(AI_EXTRACTION_PROMPT.includes('ROLE'), 'Prompt must define ROLE');
  assert.ok(AI_EXTRACTION_PROMPT.includes('OUTPUT CONTRACT'), 'Prompt must define OUTPUT CONTRACT');
  assert.ok(AI_EXTRACTION_PROMPT.includes('READING THE SOURCE'), 'Prompt must define READING THE SOURCE');
  assert.ok(AI_EXTRACTION_PROMPT.includes('NEVER FABRICATE'), 'Prompt must define NEVER FABRICATE');
  assert.ok(AI_EXTRACTION_PROMPT.includes('LINKS'), 'Prompt must define LINKS');
  assert.ok(AI_EXTRACTION_PROMPT.includes('DATES'), 'Prompt must define DATES');
  assert.ok(AI_EXTRACTION_PROMPT.includes('SECTION RULES'), 'Prompt must define SECTION RULES');
  assert.ok(AI_EXTRACTION_PROMPT.includes('BULLETS'), 'Prompt must define BULLETS');
  assert.ok(AI_EXTRACTION_PROMPT.includes('SELF-CHECK'), 'Prompt must define SELF-CHECK');
  assert.ok(AI_EXTRACTION_PROMPT.includes('SCHEMA'), 'Prompt must define SCHEMA');
  console.log('   ✅ AI_EXTRACTION_PROMPT contains all required sections.');
});

// 7. Testing one-line custom sections (certifications/awards) and paragraph summary items
console.log('7. Testing custom section variations (one-line certifications and paragraph summary)...');
const customSectionsJson = JSON.stringify({
  basics: { fullName: 'Alex Rivera' },
  customSections: [
    {
      sectionTitle: 'Summary',
      items: [
        {
          title: '',
          subtitle: '',
          date: '',
          bullets: [{ text: 'Full-stack software engineer with 6+ years of experience in distributed systems.', enabled: true }],
          enabled: true,
        },
      ],
    },
    {
      sectionTitle: 'Certifications',
      items: [
        {
          title: 'AWS Certified Solutions Architect - Associate',
          subtitle: '',
          date: '',
          bullets: [],
          enabled: true,
        },
        {
          title: 'Certified Kubernetes Administrator (CKA)',
          subtitle: '',
          date: '',
          bullets: [],
          enabled: true,
        },
      ],
    },
  ],
});
const result7 = parseImportedResume(customSectionsJson);
assert.strictEqual(result7.customSections.length, 2);
assert.strictEqual(result7.customSections[0].sectionTitle, 'Summary');
assert.strictEqual(result7.customSections[0].items[0].bullets[0].text, 'Full-stack software engineer with 6+ years of experience in distributed systems.');
assert.strictEqual(result7.customSections[1].sectionTitle, 'Certifications');
assert.strictEqual(result7.customSections[1].items.length, 2);
assert.strictEqual(result7.customSections[1].items[0].title, 'AWS Certified Solutions Architect - Associate');
assert.strictEqual(result7.customSections[1].items[0].bullets.length, 0);
console.log('   ✅ One-line lists and paragraph summaries parsed accurately.');

// 8. Testing empty schema / non-resume graceful fallback
console.log('8. Testing empty schema and placeholder filtering...');
const emptySchemaJson = JSON.stringify({
  profileName: 'Imported Resume',
  basics: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
  },
  education: [
    { institution: '', degree: '', location: '', startDate: '', endDate: '', gpa: '', enabled: true },
  ],
  experience: [
    { company: '', role: '', location: '', startDate: '', endDate: '', bullets: [{ text: '', enabled: true }], enabled: true },
  ],
  projects: [
    { title: '', techStack: [], link: '', bullets: [{ text: '', enabled: true }], enabled: true },
  ],
  skills: [
    { category: '', items: [] },
  ],
  customSections: [
    { sectionTitle: '', items: [{ title: '', subtitle: '', date: '', bullets: [{ text: '', enabled: true }], enabled: true }] },
  ],
});
const result8 = parseImportedResume(emptySchemaJson);
assert.strictEqual(result8.education.length, 0);
assert.strictEqual(result8.experience.length, 0);
assert.strictEqual(result8.projects.length, 0);
assert.strictEqual(result8.skills.length, 0);
assert.strictEqual(result8.customSections.length, 0);
console.log('   ✅ Empty placeholders and absent sections gracefully filtered to clean empty arrays.');

// 9. Testing non-empty bullets with empty title, and custom section with empty items array
console.log('9. Testing preservation of empty-title bullet entries and custom sections with 0 items...');
const edgeCaseJson = JSON.stringify({
  basics: { fullName: 'Alex Rivera' },
  customSections: [
    {
      sectionTitle: 'Summary',
      items: [
        {
          title: '', // Empty title
          subtitle: '',
          date: '',
          bullets: [{ text: 'Staff engineer with 10+ years architecting cloud-native distributed systems.', enabled: true }],
          enabled: true,
        },
      ],
    },
    {
      sectionTitle: 'hello', // Custom section with 0 items
      items: [],
    },
  ],
});
const result9 = parseImportedResume(edgeCaseJson);
assert.strictEqual(result9.customSections.length, 2, 'Both custom sections must be preserved');
assert.strictEqual(result9.customSections[0].sectionTitle, 'Summary');
assert.strictEqual(result9.customSections[0].items.length, 1, 'Entry with empty title but non-empty bullets must NOT be removed');
assert.strictEqual(result9.customSections[0].items[0].title, '');
assert.strictEqual(result9.customSections[0].items[0].bullets[0].text, 'Staff engineer with 10+ years architecting cloud-native distributed systems.');

assert.strictEqual(result9.customSections[1].sectionTitle, 'hello');
assert.strictEqual(result9.customSections[1].items.length, 0, 'Custom section with 0 items must NOT be removed');
console.log('   ✅ Empty-title entries with bullets and zero-item custom sections are preserved.');

console.log('\n========================================');
console.log('🎉 ALL MILESTONE 5 UNIT TESTS PASSED!');
console.log('========================================\n');

