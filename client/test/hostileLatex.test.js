import assert from 'node:assert/strict';
import { escapeLatex, formatHref, generateLatex } from '../src/utils/latexGenerator.js';

console.log('🧪 Starting Hostile-Input LaTeX Sanitization Test Suite...\n');

// 1. Direct escapeLatex check on malicious LaTeX command injections
console.log('1. Testing raw malicious command escape strings...');
const hostileSnippets = [
  '\\input{/etc/passwd}',
  '\\write18{cat /etc/passwd}',
  '\\immediate\\write18{rm -rf /}',
  '}\\end{document}\\begin{document}',
  '% comment attack',
  '# hashtag attack',
  '& ampersand column attack',
  '_ underscore subscript attack',
  '^ circumflex superscript attack',
  '~ tilde space attack',
  '$ math mode delimiter attack $',
  '{ curly brace open attack',
  '} curly brace close attack',
  '\\\\ double backslash attack',
  '"><script>alert(1)</script>',
  '\\href{http://evil.com}{clickme}'
];

for (const snippet of hostileSnippets) {
  const escaped = escapeLatex(snippet);

  // Assert that raw backslash does not precede dangerous commands
  assert.ok(!escaped.includes('\\input{'), `Raw \\input must not survive in: ${escaped}`);
  assert.ok(!escaped.includes('\\write18'), `Raw \\write18 must not survive in: ${escaped}`);
  assert.ok(!escaped.includes('\\immediate'), `Raw \\immediate must not survive in: ${escaped}`);
  assert.ok(!escaped.includes('\\end{document}'), `Raw \\end{document} must not survive in: ${escaped}`);
  assert.ok(!escaped.startsWith('%'), `Unescaped % comment must not survive in: ${escaped}`);
  assert.ok(!escaped.includes('}{'), `Unescaped argument closing/reopening must not survive in: ${escaped}`);
}
console.log('   ✅ All dangerous control sequences safely converted to text macros');

// 2. Testing hostile full resume profile generated LaTeX
console.log('2. Testing hostile profile LaTeX document generation...');
const hostileProfile = {
  profileName: '\\input{/etc/passwd}',
  basics: {
    fullName: 'Robert }; \\end{document} \\immediate\\write18{echo pwned}',
    email: 'hacker%40evil.com#anchor',
    phone: '+1 (555) 000-0000 & 999',
    location: 'Underworld $HOME^2 ~ /root',
    linkedinUrl: 'https://linkedin.com/in/hacker}{pwned}',
    githubUrl: 'javascript:alert(1)',
    portfolioUrl: 'https://evil.com/exploit?a=1&b=2#attack'
  },
  education: [
    {
      institution: 'University of \\write18',
      degree: 'B.S. in Pwning % $ & _ ^ ~ { } \\',
      location: 'City \\input{shadow}',
      startDate: '2020',
      endDate: '2024',
      gpa: '4.0 \\immediate\\write',
      enabled: true
    }
  ],
  experience: [
    {
      company: 'Evil Corp \\textbackslash',
      role: 'Exploiter \\end{document}',
      location: 'Hell',
      startDate: '2022',
      endDate: '2024',
      bullets: [
        { text: '\\write18{whoami}', enabled: true },
        { text: '}\\end{document}\\begin{verbatim}', enabled: true },
        { text: '% Injected comment that hides resume content', enabled: true },
        { text: '$100,000 & 50% increase ^2 ~ test', enabled: true }
      ],
      enabled: true
    }
  ],
  projects: [
    {
      title: 'Exploit Project \\href{http://evil.com}',
      techStack: ['C++', 'LaTeX \\input', 'Bash \\write18'],
      link: 'https://github.com/exploit/hack}{escaped}',
      bullets: [
        { text: 'Pwned everything with \\immediate\\write18.', enabled: true }
      ],
      enabled: true
    }
  ],
  skills: [
    {
      category: 'Attack Skills % # $ & _ { } \\ ^ ~',
      items: ['\\input{/etc/passwd}', '\\write18{id}', 'normal skill'],
      enabled: true
    }
  ],
  customSections: [
    {
      sectionTitle: 'Malicious Section \\end{document}',
      enabled: true,
      items: [
        {
          title: 'Custom Title \\write18',
          subtitle: 'Sub \\immediate',
          date: '2024',
          bullets: [{ text: 'Bullet attack \\input{/etc/hosts}', enabled: true }],
          enabled: true
        }
      ]
    }
  ]
};

const generatedTex = generateLatex(hostileProfile);

// Verify that the document retains valid structural document bounds
assert.ok(generatedTex.includes('\\begin{document}'));
assert.ok(generatedTex.endsWith('\\end{document}\n'));

// Count occurrences of \end{document} — must be exactly 1 (at the very end)
const endDocMatches = generatedTex.match(/\\end\{document\}/g);
assert.equal(endDocMatches?.length, 1, 'There must be strictly ONE \\end{document} tag');

// Check that no user-injected \input, \write18, or \immediate commands exist in output
const forbiddenPatterns = [
  /\\input\{(?!\s*glyphtounicode)/, // only \input{glyphtounicode} from standard header allowed
  /\\write18/,
  /\\immediate/,
  /javascript:/,
];

for (const pattern of forbiddenPatterns) {
  assert.ok(
    !pattern.test(generatedTex),
    `Forbidden executable pattern ${pattern} found in generated LaTeX!`
  );
}
console.log('   ✅ Hostile resume profile safely neutralized with zero executable control leaks');

// 3. formatHref robustness on breaker payloads
console.log('3. Testing formatHref against malicious parameter splitting...');
const hrefBreaker = formatHref('https://example.com/path}{evil}{hack}', 'Display Text');
assert.ok(!hrefBreaker.includes('}{evil}{'), `Parameter splitting in href prevented: ${hrefBreaker}`);

const jsHref = formatHref('javascript:alert(1)', 'Click Me');
assert.equal(jsHref, '', 'javascript: URL in formatHref returns empty string');
console.log('   ✅ formatHref safely isolates URLs and display text');

console.log('\n========================================');
console.log('🎉 ALL HOSTILE LATEX INPUT TESTS PASSED!');
console.log('========================================\n');
