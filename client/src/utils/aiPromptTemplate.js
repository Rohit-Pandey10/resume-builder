/**
 * Extraction prompt template for external LLMs (ChatGPT, Claude, Gemini).
 * Users copy this prompt and attach their resume PDF to generate schema-compliant JSON.
 */
export const AI_EXTRACTION_PROMPT = `You are an expert resume data extractor. Extract the details from the attached resume PDF into the EXACT JSON schema provided below.

STRICT RULES:
1. Return ONLY a valid JSON object.
2. Do NOT write any conversational intro or outro (no "Here is your JSON:").
3. Do NOT wrap in markdown backticks (no \`\`\`json).
4. INSPECT HYPERLINKS: Look for clickable text annotations (e.g. 'GitHub', 'LinkedIn', 'Portfolio'). Extract the underlying embedded destination URLs into githubUrl, linkedinUrl, and portfolioUrl. Do NOT leave them empty if the PDF contains embedded link targets.
5. NEVER FLATTEN BULLETS: Never merge distinct accomplishments or achievement bullet points into a single run-on paragraph. Every distinct accomplishment must remain an independent object in the bullets array: {"text": "bullet description here", "enabled": true}.
6. DYNAMIC SKILLS CATEGORIZATION: Group technical skills under the exact category names shown in the resume (e.g. "Languages", "Frontend", "Backend", "Database", "Core Concepts", "Developer Tools"). Format skills as an array of category objects: [{"category": "Languages", "items": ["JavaScript", "C++"]}].
7. ALL DATES: All dates should be strings (e.g. "Aug 2024 - Present" or "2022 - 2026").
8. MULTI-BULLET CUSTOM SECTIONS: In customSections (e.g. Competitive Programming, Achievements, Certifications), format items with discrete bullets under items[].bullets where applicable.

JSON SCHEMA:
{
  "profileName": "Imported Resume",
  "basics": {
    "fullName": "",
    "email": "",
    "phone": "",
    "location": "",
    "linkedinUrl": "",
    "githubUrl": "",
    "portfolioUrl": ""
  },
  "education": [
    {
      "institution": "",
      "degree": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "gpa": "",
      "enabled": true
    }
  ],
  "experience": [
    {
      "company": "",
      "role": "",
      "location": "",
      "startDate": "",
      "endDate": "",
      "bullets": [
        { "text": "", "enabled": true }
      ],
      "enabled": true
    }
  ],
  "projects": [
    {
      "title": "",
      "techStack": [],
      "link": "",
      "bullets": [
        { "text": "", "enabled": true }
      ],
      "enabled": true
    }
  ],
  "skills": [
    {
      "category": "Languages",
      "items": []
    },
    {
      "category": "Frontend",
      "items": []
    },
    {
      "category": "Backend & Database",
      "items": []
    },
    {
      "category": "Core Concepts",
      "items": []
    }
  ],
  "customSections": [
    {
      "sectionTitle": "Competitive Programming & Achievements",
      "items": [
        {
          "title": "Competitive Programming Profiles",
          "subtitle": "LeetCode, Codeforces, CodeChef",
          "date": "2024 - Present",
          "bullets": [
            { "text": "", "enabled": true }
          ],
          "enabled": true
        }
      ]
    }
  ]
}`;
