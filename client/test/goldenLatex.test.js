import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import { fileURLToPath } from 'node:url';
import { generateLatex } from '../src/utils/latexGenerator.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const fixturesDir = path.join(__dirname, 'fixtures');

const fixtures = [
  { name: 'rich', jsonFile: 'richProfile.json', goldenFile: 'richProfile.golden.tex' },
  { name: 'legacy string-bullets', jsonFile: 'legacyBulletsProfile.json', goldenFile: 'legacyBulletsProfile.golden.tex' },
  { name: 'minimal', jsonFile: 'minimalProfile.json', goldenFile: 'minimalProfile.golden.tex' },
];

console.log('🧪 Running Golden LaTeX Byte-for-Byte Regression Suite...');

let allPassed = true;

for (const { name, jsonFile, goldenFile } of fixtures) {
  const jsonPath = path.join(fixturesDir, jsonFile);
  const goldenPath = path.join(fixturesDir, goldenFile);

  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const profile = JSON.parse(rawData);
  const generatedLatex = generateLatex(profile);

  if (process.argv.includes('--update-golden') || !fs.existsSync(goldenPath)) {
    fs.writeFileSync(goldenPath, generatedLatex, 'utf8');
    console.log(`  [UPDATED GOLDEN] ${goldenFile} written (${Buffer.byteLength(generatedLatex, 'utf8')} bytes)`);
  }

  const expectedGolden = fs.readFileSync(goldenPath, 'utf8');

  try {
    assert.equal(
      generatedLatex,
      expectedGolden,
      `Generated LaTeX does not match golden file byte-for-byte for: ${name}`
    );
    assert.equal(
      Buffer.byteLength(generatedLatex, 'utf8'),
      Buffer.byteLength(expectedGolden, 'utf8'),
      `Byte length mismatch for fixture: ${name}`
    );
    console.log(`  ✅ ${name} fixture passed byte-for-byte (${Buffer.byteLength(generatedLatex, 'utf8')} bytes)`);
  } catch (err) {
    console.error(`  ❌ Failed for fixture: ${name}`);
    console.error(err.message);
    allPassed = false;
  }
}

if (!allPassed) {
  console.error('\n❌ Golden LaTeX tests failed!');
  process.exit(1);
}

console.log('\n========================================');
console.log('🎉 ALL 3 GOLDEN LATEX FIXTURES MATCH BYTE-FOR-BYTE!');
console.log('========================================');
