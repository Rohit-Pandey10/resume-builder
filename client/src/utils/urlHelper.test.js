import assert from 'node:assert';
import { sanitizeUrl, getDisplayUrl } from './urlHelper.js';

console.log('🧪 Starting URL Helper Test Suite...\n');

// 1. Markdown link with query tracking params
console.log('1. Testing markdown link with tracking query params...');
const mdInput = '[https://rohit-pandey10.vercel.app/](https://rohit-pandey10.vercel.app/?utm_source=gemini)';
const clean1 = sanitizeUrl(mdInput);
assert.strictEqual(clean1, 'https://rohit-pandey10.vercel.app');
const display1 = getDisplayUrl(mdInput, 'portfolio');
assert.strictEqual(display1, 'portfolio');
console.log('   ✅ Markdown link extracted, query params stripped, and compact portfolio label returned.');

// 2. LinkedIn URL with trailing slash and query params
console.log('2. Testing LinkedIn URL with trailing slash...');
const linkedinInput = 'https://www.linkedin.com/in/rohit-pandey/?utm_campaign=share';
const clean2 = sanitizeUrl(linkedinInput);
assert.strictEqual(clean2, 'https://www.linkedin.com/in/rohit-pandey');
const display2 = getDisplayUrl(linkedinInput, 'linkedin');
assert.strictEqual(display2, 'linkedin/rohit-pandey');
console.log('   ✅ LinkedIn URL cleaned with compact handle extracted.');

// 3. GitHub URL without protocol
console.log('3. Testing GitHub URL without protocol...');
const githubInput = 'github.com/rohit-pandey';
const clean3 = sanitizeUrl(githubInput);
assert.strictEqual(clean3, 'https://github.com/rohit-pandey');
const display3 = getDisplayUrl(githubInput, 'github');
assert.strictEqual(display3, 'github/rohit-pandey');
console.log('   ✅ Protocol prepended for href and compact github handle returned.');

// 4. Labeled markdown link [My Portfolio](url)
console.log('4. Testing labeled markdown link...');
const labeledMd = '[My Portfolio](https://portfolio.dev/projects?utm_source=chatgpt&utm_medium=web)';
const clean4 = sanitizeUrl(labeledMd);
assert.strictEqual(clean4, 'https://portfolio.dev/projects');
const display4 = getDisplayUrl(labeledMd, 'portfolio');
assert.strictEqual(display4, 'portfolio');
console.log('   ✅ Labeled markdown parsed, cleaned, and compact portfolio returned.');

// 5. Bare brackets [url]
console.log('5. Testing bare bracket syntax [url]...');
const bracketInput = '[https://portfolio.dev]';
const clean5 = sanitizeUrl(bracketInput);
assert.strictEqual(clean5, 'https://portfolio.dev');
const display5 = getDisplayUrl(bracketInput);
assert.strictEqual(display5, 'portfolio.dev');
console.log('   ✅ Bare bracket link cleaned.');

// 6. Null and empty edge cases
console.log('6. Testing null and empty edge cases...');
assert.strictEqual(sanitizeUrl(''), '');
assert.strictEqual(sanitizeUrl(null), '');
assert.strictEqual(sanitizeUrl(undefined), '');
assert.strictEqual(getDisplayUrl(''), '');
assert.strictEqual(getDisplayUrl(null), '');
console.log('   ✅ Null and empty inputs handled safely.');

// 7. Dangerous protocol rejection
console.log('7. Testing dangerous protocol rejection (javascript:, data:, vbscript:)...');
assert.strictEqual(sanitizeUrl('javascript:alert(1)'), '');
assert.strictEqual(sanitizeUrl('data:text/html,<script>'), '');
assert.strictEqual(sanitizeUrl('vbscript:msgbox'), '');
assert.strictEqual(sanitizeUrl('mailto:test@example.com'), 'mailto:test@example.com');
console.log('   ✅ Dangerous protocol strings successfully rejected.');

console.log('\n========================================');
console.log('🎉 ALL URL HELPER UNIT TESTS PASSED!');
console.log('========================================\n');
