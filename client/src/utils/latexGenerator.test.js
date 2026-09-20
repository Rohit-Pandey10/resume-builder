import assert from 'node:assert';
import { escapeLatex, formatHref, generateLatex } from './latexGenerator.js';

console.log('🧪 Starting Milestone 3: LaTeX Generator & Sanitizer Test Suite...\n');

// 1. Test escapeLatex precision and order
console.log('1. Testing escapeLatex character escaping and backslash order...');
{
  assert.strictEqual(escapeLatex('R&D'), 'R\\&D');
  assert.strictEqual(escapeLatex('100% growth'), '100\\% growth');
  assert.strictEqual(escapeLatex('C++'), 'C++');
  assert.strictEqual(escapeLatex('#hashtag'), '\\#hashtag');
  assert.strictEqual(escapeLatex('$10k revenue'), '\\$10k revenue');
  assert.strictEqual(escapeLatex('foo_bar_baz'), 'foo\\_bar\\_baz');
  assert.strictEqual(escapeLatex('param{id}'), 'param\\{id\\}');
  assert.strictEqual(escapeLatex('~approx'), '\\textasciitilde{}approx');
  assert.strictEqual(escapeLatex('2^10 power'), '2\\textasciicircum{}10 power');
  
  // Test backslash first order: \ must NOT cause double-escaping of subsequent \\textbackslash{}
  assert.strictEqual(escapeLatex('path\\to\\dir'), 'path\\textbackslash{}to\\textbackslash{}dir');
  assert.strictEqual(escapeLatex('\\#not_comment'), '\\textbackslash{}\\#not\\_comment');
  console.log('   ✅ Character escaping order and reserved tokens validated.');
}

// 2. Test formatHref URL vs Display Text Rule
console.log('2. Testing formatHref unescaped raw URL vs escaped label...');
{
  const rawUrl = 'https://github.com/rohit_pandey?tab=repositories&type=public';
  const display = 'github.com/rohit_pandey';
  const hrefResult = formatHref(rawUrl, display);

  // Raw URL must retain raw underscores and ampersands
  assert.ok(
    hrefResult.startsWith('\\href{https://github.com/rohit_pandey?tab=repositories&type=public}'),
    'Raw URL must not escape _ or &'
  );
  // Display text must have escaped characters
  assert.ok(
    hrefResult.includes('{\\underline{github.com/rohit\\_pandey}}'),
    'Display text must have escaped \\_'
  );
  console.log('   ✅ Raw URLs preserved and display text safely escaped.');
}

// 3. Test ATS Compliance and Jake's Resume Template Skeleton
console.log('3. Testing ATS macros and packages in generated document...');
{
  const mockProfile = {
    profileName: 'SWE Intern',
    basics: {
      fullName: 'Jake Example',
      email: 'jake@example.com',
      phone: '123-456-7890',
      githubUrl: 'https://github.com/jake_dev',
    },
    education: [],
    experience: [],
    projects: [],
    skills: {},
    customSections: []
  };

  const tex = generateLatex(mockProfile);

  assert.ok(tex.includes('\\input{glyphtounicode}'), 'Must include \\input{glyphtounicode}');
  assert.ok(tex.includes('\\pdfgentounicode=1'), 'Must include \\pdfgentounicode=1');
  assert.ok(tex.includes('\\documentclass[letterpaper,11pt]{article}'), 'Must use 11pt article');
  assert.ok(tex.includes('\\usepackage{latexsym}'), 'Must include latexsym');
  assert.ok(tex.includes('\\usepackage[empty]{fullpage}'), 'Must include fullpage');
  assert.ok(tex.includes('\\usepackage{titlesec}'), 'Must include titlesec');
  assert.ok(tex.includes('\\usepackage{marvosym}'), 'Must include marvosym');
  assert.ok(tex.includes('\\usepackage{verbatim}'), 'Must include verbatim');
  assert.ok(tex.includes('\\usepackage{enumitem}'), 'Must include enumitem');
  assert.ok(tex.includes('\\usepackage[hidelinks]{hyperref}'), 'Must include hyperref');
  assert.ok(tex.includes('\\usepackage{fancyhdr}'), 'Must include fancyhdr');
  assert.ok(tex.includes('\\usepackage[english]{babel}'), 'Must include babel');
  assert.ok(tex.includes('\\usepackage{tabularx}'), 'Must include tabularx');
  assert.ok(tex.includes('\\resumeSubheading'), 'Must define \\resumeSubheading');
  assert.ok(tex.includes('\\resumeProjectHeading'), 'Must define \\resumeProjectHeading');
  assert.ok(tex.includes('\\resumeItem'), 'Must define \\resumeItem');
  console.log('   ✅ ATS glyphtounicode and all required packages verified.');
}

// 4. Test Bullet and Item Toggles Reactivity
console.log('4. Testing enabled/disabled filtering for items and bullets...');
{
  const profileWithToggles = {
    basics: { fullName: 'Alex Coder' },
    experience: [
      {
        company: 'Active Corp',
        role: 'SWE',
        location: 'Remote',
        startDate: '2022',
        endDate: '2023',
        enabled: true,
        bullets: [
          { text: 'Enabled bullet point with R&D and 100% test coverage', enabled: true },
          { text: 'Disabled bullet point that should not appear', enabled: false }
        ]
      },
      {
        company: 'Disabled Corp',
        role: 'Intern',
        location: 'City',
        enabled: false,
        bullets: [{ text: 'Hidden work item', enabled: true }]
      }
    ],
    projects: [
      {
        title: 'Active Project with C++',
        techStack: ['C++', 'Node_JS'],
        enabled: true,
        bullets: [
          { text: 'Project bullet 1', enabled: true },
          { text: 'Project bullet 2 disabled', enabled: false }
        ]
      },
      {
        title: 'Hidden Project',
        enabled: false,
        bullets: [{ text: 'Hidden', enabled: true }]
      }
    ]
  };

  const tex = generateLatex(profileWithToggles);

  // Active entries must appear with escaped text
  assert.ok(tex.includes('Active Corp'), 'Active company must be present');
  assert.ok(tex.includes('Enabled bullet point with R\\&D and 100\\% test coverage'), 'Active bullet must be escaped');
  assert.ok(tex.includes('Active Project with C++'), 'Active project must be present');
  assert.ok(tex.includes('Node\\_JS'), 'Tech stack item must be escaped');

  // Disabled entries and bullets must NOT appear
  assert.ok(!tex.includes('Disabled bullet point that should not appear'), 'Disabled bullet must be omitted');
  assert.ok(!tex.includes('Disabled Corp'), 'Disabled experience must be omitted');
  assert.ok(!tex.includes('Hidden Project'), 'Disabled project must be omitted');
  console.log('   ✅ Enabled item and bullet filtering confirmed.');
}

// 5. Test Empty Section Guardrails (Prevent LaTeX Empty Itemize Crash)
console.log('5. Testing empty section guardrails and empty list crash prevention...');
{
  const profileWithEmptySections = {
    basics: { fullName: 'Empty State Tester' },
    education: [
      { institution: 'School', degree: 'Degree', enabled: false }
    ],
    experience: [
      {
        company: 'No Bullets Corp',
        role: 'Consultant',
        location: 'NY',
        enabled: true,
        bullets: [
          { text: 'Disabled 1', enabled: false },
          { text: '   ', enabled: true } // Empty whitespace bullet
        ]
      }
    ],
    projects: [],
    skills: {
      languages: [],
      frameworks: [],
      developerTools: [],
      libraries: []
    }
  };

  const tex = generateLatex(profileWithEmptySections);

  // Education is all disabled -> no \section{Education}
  assert.ok(!tex.includes('\\section{Education}'), 'Empty/disabled Education section must be omitted');

  // Projects is empty -> no \section{Projects}
  assert.ok(!tex.includes('\\section{Projects}'), 'Empty Projects section must be omitted');

  // Skills is empty -> no \section{Technical Skills}
  assert.ok(!tex.includes('\\section{Technical Skills}'), 'Empty Technical Skills section must be omitted');

  // Experience has entry, but all bullets are disabled/empty:
  // In the document body, it must NOT call \resumeItemListStart or \resumeItemListEnd
  const body = tex.split('\\begin{document}')[1];
  assert.ok(body.includes('No Bullets Corp'), 'Experience entry itself appears in body');
  assert.ok(!body.includes('\\resumeItemListStart'), 'Empty itemize environment must NOT be called in body');
  assert.ok(!body.includes('\\resumeItemListEnd'), 'Empty itemize end must NOT be called in body');
  console.log('   ✅ Empty sections and itemize crash prevention guardrails verified.');
}

// 6. Test ATS Header Links & Markdown URL Sanitization
console.log('6. Testing ATS header links format and markdown link sanitization...');
{
  const profileWithDirtyLinks = {
    basics: {
      fullName: 'Rohit Pandey',
      email: 'rohit@example.com',
      phone: '+1 555-0100',
      linkedinUrl: 'https://www.linkedin.com/in/rohit-pandey/?utm_campaign=share',
      githubUrl: 'github.com/rohit-pandey',
      portfolioUrl: '[https://rohit-pandey10.vercel.app/](https://rohit-pandey10.vercel.app/?utm_source=gemini)',
    },
    education: [],
    experience: [],
    projects: [
      {
        title: 'Cloud Project',
        link: '[Live Demo](https://cloud-demo.dev/?utm_source=test)',
        enabled: true,
        bullets: [{ text: 'Deployed serverless app', enabled: true }],
      },
    ],
    skills: {},
    customSections: [],
  };

  const tex = generateLatex(profileWithDirtyLinks);

  // Assert header contains clean \href{URL}{\underline{LABEL}} without markdown brackets or tracking params
  assert.ok(
    tex.includes('\\href{https://rohit-pandey10.vercel.app}{\\underline{portfolio}}'),
    'Portfolio link must use compact portfolio label'
  );
  assert.ok(
    tex.includes('\\href{https://www.linkedin.com/in/rohit-pandey}{\\underline{linkedin/rohit-pandey}}'),
    'LinkedIn link must have compact display label'
  );
  assert.ok(
    tex.includes('\\href{https://github.com/rohit-pandey}{\\underline{github/rohit-pandey}}'),
    'GitHub link must have compact display label'
  );
  assert.ok(!tex.includes('utm_source=gemini'), 'Tracking parameter must be stripped from tex');
  assert.ok(!tex.includes('[https://'), 'Markdown bracket syntax must not leak into tex');

  // Assert project link is also sanitized
  assert.ok(
    tex.includes('\\href{https://cloud-demo.dev}{\\underline{Cloud Project}}'),
    'Project link must be cleanly sanitized'
  );

  console.log('   ✅ Clean, underlined ATS header and project links validated.');
}

// 7. Test Dynamic Skills Categories Schema
console.log('7. Testing dynamic skills categories LaTeX generation...');
{
  const profileWithDynamicSkills = {
    basics: { fullName: 'Skills Candidate' },
    education: [],
    experience: [],
    projects: [],
    skills: [
      { category: 'Languages', items: ['JavaScript', 'C++', 'C', 'Java (Basic)'], enabled: true },
      { category: 'Frontend', items: ['HTML5', 'CSS3', 'Tailwind CSS', 'React.js'], enabled: true },
      { category: 'Backend & Database', items: ['Node.js', 'Express.js', 'MongoDB'], enabled: true },
      { category: 'Core Concepts', items: ['MVC Architecture', 'REST APIs', 'JWT Auth'], enabled: true },
      { category: 'Disabled Tools', items: ['Docker', 'Vim'], enabled: false },
    ],
    customSections: [],
  };

  const tex = generateLatex(profileWithDynamicSkills);

  assert.ok(
    tex.includes('\\textbf{Languages}{: JavaScript, C++, C, Java (Basic)}'),
    'Languages category must format correctly'
  );
  assert.ok(
    tex.includes('\\textbf{Frontend}{: HTML5, CSS3, Tailwind CSS, React.js}'),
    'Frontend category must format correctly'
  );
  assert.ok(
    tex.includes('\\textbf{Backend \\& Database}{: Node.js, Express.js, MongoDB}'),
    'Backend & Database category must escape ampersand and format items'
  );
  assert.ok(
    tex.includes('\\textbf{Core Concepts}{: MVC Architecture, REST APIs, JWT Auth}'),
    'Core Concepts category must format correctly'
  );
  assert.ok(!tex.includes('Disabled Tools'), 'Disabled skill categories must be excluded from tex');

  console.log('   ✅ Dynamic skills categories accurately generated with custom taxonomy.');
}

// 8. Test Multi-Bullet Support in Custom Sections
console.log('8. Testing multi-bullet discrete list rendering in custom sections...');
{
  const profileWithCustomBullets = {
    basics: { fullName: 'Competitive Programmer' },
    education: [],
    experience: [],
    projects: [],
    skills: [],
    customSections: [
      {
        sectionTitle: 'Competitive Programming & Achievements',
        items: [
          {
            title: 'Competitive Programming Profiles',
            subtitle: 'LeetCode, Codeforces, CodeChef',
            date: '2024 -- Present',
            bullets: [
              { text: 'Solved 180+ problems across LeetCode, Codeforces, and CodeChef.', enabled: true },
              { text: 'CodeChef Rating: 1359 (Max: 1371) across 18 competitive rounds.', enabled: true },
              { text: 'Disabled bullet point', enabled: false },
            ],
            enabled: true,
          },
        ],
      },
    ],
  };

  const tex = generateLatex(profileWithCustomBullets);

  // Section title
  assert.ok(
    tex.includes('\\section{Competitive Programming \\& Achievements}'),
    'Custom section title must be escaped and rendered as \\section'
  );

  // Subtitle heading formatting: \resumeProjectHeading{\textbf{Title} $|$ \emph{Subtitle}}{Date}
  assert.ok(
    tex.includes('\\textbf{Competitive Programming Profiles} $|$ \\emph{LeetCode, Codeforces, CodeChef}'),
    'Item heading with subtitle must format correctly'
  );

  // Discrete \resumeItem bullets inside itemize
  assert.ok(
    tex.includes('\\resumeItem{Solved 180+ problems across LeetCode, Codeforces, and CodeChef.}'),
    'Bullet 1 must be rendered as discrete \\resumeItem'
  );
  assert.ok(
    tex.includes('\\resumeItem{CodeChef Rating: 1359 (Max: 1371) across 18 competitive rounds.}'),
    'Bullet 2 must be rendered as discrete \\resumeItem'
  );
  assert.ok(
    !tex.includes('Disabled bullet point'),
    'Disabled bullet points must be omitted'
  );

  console.log('   ✅ Multi-bullet custom sections rendered inside discrete \\resumeItemList environments.');
}

// 9. Test Default Enabled Fallback & Custom Section Title Stutter Prevention
console.log('9. Testing default enabled fallback & custom section title stutter prevention...');
{
  const profileWithStutterAndImplicitEnabled = {
    basics: {
      fullName: 'Alice Dev',
      email: 'alice@example.com',
      phone: '+1 555-0123',
      githubUrl: '',
      linkedinUrl: '',
      portfolioUrl: '',
    },
    education: [],
    experience: [],
    projects: [],
    // Skills categories WITHOUT explicit enabled property (undefined)
    skills: [
      { category: 'Languages', items: ['Python', 'TypeScript'] },
      { category: 'Frameworks', items: ['FastAPI', 'React'] },
    ],
    customSections: [
      {
        sectionTitle: 'Competitive Programming',
        items: [
          {
            // Title exactly matches sectionTitle (stutter case)
            title: 'Competitive Programming',
            subtitle: 'LeetCode, Codeforces, CodeChef',
            date: '2024 -- Present',
            // Bullets WITHOUT explicit enabled property (undefined)
            bullets: [
              { text: 'Solved 250+ algorithmic problems.' },
              'Codeforces Specialist (Rating: 1420)',
            ],
          },
        ],
      },
    ],
  };

  const tex = generateLatex(profileWithStutterAndImplicitEnabled);

  // 1. Verify skills render even when enabled is undefined
  assert.ok(
    tex.includes('\\section{Technical Skills}'),
    'Technical Skills section must render when enabled is undefined'
  );
  assert.ok(
    tex.includes('\\textbf{Languages}{: Python, TypeScript}'),
    'Languages must render when enabled is undefined'
  );
  assert.ok(
    tex.includes('\\textbf{Frameworks}{: FastAPI, React}'),
    'Frameworks must render when enabled is undefined'
  );

  // 2. Verify title stutter prevention: \resumeProjectHeading{\textbf{item.subtitle}}{date}
  assert.ok(
    tex.includes('\\resumeProjectHeading\n      {\\textbf{LeetCode, Codeforces, CodeChef}}{2024 -- Present}'),
    'Stuttering section title must NOT be repeated in subheading'
  );
  assert.ok(
    !tex.includes('\\textbf{Competitive Programming} $|$'),
    'Subheading must not duplicate the section title'
  );

  // 3. Verify bullets render even when enabled is undefined
  assert.ok(
    tex.includes('\\resumeItem{Solved 250+ algorithmic problems.}'),
    'Bullet with undefined enabled must render by default'
  );
  assert.ok(
    tex.includes('\\resumeItem{Codeforces Specialist (Rating: 1420)}'),
    'Plain string bullet must render by default'
  );

  // 4. Verify contact line has no trailing or empty $|$ delimiters
  assert.ok(
    tex.includes('\\small +1 555-0123 $|$ \\href{mailto:alice@example.com}{\\underline{alice@example.com}}'),
    'Contact line must join existing fields without trailing $|$'
  );
  assert.ok(
    !tex.includes('$|$ \\href{}{\\underline{}}'),
    'Must not render empty href or dangling delimiters'
  );
  assert.ok(
    !tex.includes('$|$ \n'),
    'Must not have dangling delimiter at end of line'
  );

  console.log('   ✅ Default enabled fallback, title stutter prevention, and graceful URLs validated.');
}

// 10. Test Subtle Spacing Adjustments for Single-Page Balance
console.log('10. Testing single-page spacing adjustments based on entry count...');
{
  const lightProfile = {
    basics: { fullName: 'Light Profile' },
    experience: [{ company: 'Only Corp', role: 'Dev', enabled: true, bullets: [{ text: 'Code' }] }],
    projects: [{ title: 'Single Project', enabled: true, bullets: [{ text: 'Built app' }] }],
  };
  const lightTex = generateLatex(lightProfile);
  assert.ok(
    lightTex.includes('\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-2pt}}'),
    'Light profile (< 4 entries) must use \\vspace{-2pt} for proportional page balance'
  );

  const denseProfile = {
    basics: { fullName: 'Dense Profile' },
    experience: [
      { company: 'Corp 1', enabled: true, bullets: [{ text: 'Task 1' }] },
      { company: 'Corp 2', enabled: true, bullets: [{ text: 'Task 2' }] },
    ],
    projects: [
      { title: 'Project 1', enabled: true, bullets: [{ text: 'App 1' }] },
      { title: 'Project 2', enabled: true, bullets: [{ text: 'App 2' }] },
    ],
  };
  const denseTex = generateLatex(denseProfile);
  assert.ok(
    denseTex.includes('\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}'),
    'Dense profile (>= 4 entries) must use \\vspace{-5pt} for tighter packing'
  );
  console.log('   ✅ Subtle single-page spacing adjustments verified.');
}

// 11. Test Dynamic Section Reordering
console.log('11. Testing dynamic section reordering...');
{
  const reorderedProfile = {
    basics: { fullName: 'Reordered Candidate' },
    education: [{ institution: 'Harvard', degree: 'BA', enabled: true }],
    experience: [{ company: 'Google', role: 'SWE', enabled: true, bullets: [{ text: 'Built search' }] }],
    projects: [{ title: 'Resume App', enabled: true, bullets: [{ text: 'Built app' }] }],
    skills: [{ category: 'Languages', items: ['JS', 'Go'], enabled: true }],
    customSections: [],
    sectionOrder: ['experience', 'projects', 'education', 'skills', 'customSections'],
  };

  const tex = generateLatex(reorderedProfile);
  const expIdx = tex.indexOf('\\section{Experience}');
  const projIdx = tex.indexOf('\\section{Projects}');
  const eduIdx = tex.indexOf('\\section{Education}');
  const skillsIdx = tex.indexOf('\\section{Technical Skills}');

  assert.ok(expIdx !== -1, 'Experience section must be present');
  assert.ok(projIdx !== -1, 'Projects section must be present');
  assert.ok(eduIdx !== -1, 'Education section must be present');
  assert.ok(skillsIdx !== -1, 'Skills section must be present');

  assert.ok(expIdx < projIdx, 'Experience must precede Projects');
  assert.ok(projIdx < eduIdx, 'Projects must precede Education');
  assert.ok(eduIdx < skillsIdx, 'Education must precede Technical Skills');
  console.log('   ✅ Dynamic section reordering verified in generated LaTeX.');
}

console.log('\n========================================');
console.log('🎉 ALL MILESTONE 3 UNIT TESTS PASSED!');
console.log('========================================\n');


