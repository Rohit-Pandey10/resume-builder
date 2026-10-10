import { normalizeBullets, normalizeProfile } from './bulletHelper.js';
import { sanitizeUrl } from './urlHelper.js';

/**
 * Sanitizes and parses raw text from external LLMs into a valid ResumeProfile object.
 * Handles markdown fences, conversational preambles/postscripts, and missing optional fields.
 *
 * @param {string} rawText - The raw response copied from ChatGPT, Claude, Gemini, etc.
 * @returns {object} A normalized ResumeProfile object ready to be saved to MongoDB.
 * @throws {Error} Descriptive error message if parsing or structural validation fails.
 */
export function parseImportedResume(rawText) {
  if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
    throw new Error('Please paste the JSON response from your AI tool.');
  }

  let cleaned = rawText.trim();

  // 1. Strip leading and trailing markdown code block wrappers (e.g. ```json ... ```)
  cleaned = cleaned.replace(/^```(?:json|JSON)?\s*/i, '');
  cleaned = cleaned.replace(/\s*```$/, '');
  cleaned = cleaned.trim();

  // 2. Extract substring between the first '{' and the last '}'
  // This discards any conversational preamble (e.g., "Here is your JSON:") or closing text
  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');

  if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
    throw new Error(
      'Could not find a valid JSON object in the pasted text. Ensure the AI output contains curly braces { ... }.'
    );
  }

  const jsonCandidate = cleaned.slice(firstBrace, lastBrace + 1);

  // 3. Parse JSON with safe error handling
  let parsed;
  try {
    parsed = JSON.parse(jsonCandidate);
  } catch (err) {
    throw new Error(
      `Invalid JSON syntax: ${err.message}. Please check that the pasted text is valid JSON.`,
      { cause: err }
    );
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Parsed output is not a valid resume JSON object.');
  }

  // 4. Default Profile Naming: "Imported Resume - [Month Year]"
  const currentDateStr = new Date().toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
  const defaultProfileName = `Imported Resume - ${currentDateStr}`;

  let finalProfileName = defaultProfileName;
  if (
    parsed.profileName &&
    typeof parsed.profileName === 'string' &&
    parsed.profileName.trim() &&
    parsed.profileName.trim() !== 'Imported Resume'
  ) {
    finalProfileName = parsed.profileName.trim();
  }

  // 5. Structure validation and default backfilling
  const rawBasics = (parsed.basics && typeof parsed.basics === 'object') ? parsed.basics : {};

  const structuredProfile = {
    profileName: finalProfileName,
    basics: {
      fullName: String(rawBasics.fullName || ''),
      email: String(rawBasics.email || ''),
      phone: String(rawBasics.phone || ''),
      location: String(rawBasics.location || ''),
      linkedinUrl: sanitizeUrl(String(rawBasics.linkedinUrl || '')),
      githubUrl: sanitizeUrl(String(rawBasics.githubUrl || '')),
      portfolioUrl: sanitizeUrl(String(rawBasics.portfolioUrl || '')),
    },
    education: Array.isArray(parsed.education)
      ? parsed.education
          .filter((edu) => edu && (edu.institution?.trim() || edu.degree?.trim() || edu.location?.trim()))
          .map((edu) => ({
            institution: String(edu.institution || ''),
            degree: String(edu.degree || ''),
            location: String(edu.location || ''),
            startDate: String(edu.startDate || ''),
            endDate: String(edu.endDate || ''),
            gpa: String(edu.gpa || ''),
            enabled: edu.enabled !== undefined ? Boolean(edu.enabled) : true,
          }))
      : [],
    experience: Array.isArray(parsed.experience)
      ? parsed.experience
          .filter(
            (exp) =>
              exp &&
              (exp.company?.trim() ||
                exp.role?.trim() ||
                (Array.isArray(exp.bullets) &&
                  exp.bullets.some((b) => (typeof b === 'string' ? b : b?.text)?.trim())))
          )
          .map((exp) => ({
            company: String(exp.company || ''),
            role: String(exp.role || ''),
            location: String(exp.location || ''),
            startDate: String(exp.startDate || ''),
            endDate: String(exp.endDate || ''),
            bullets: normalizeBullets(exp.bullets),
            enabled: exp.enabled !== undefined ? Boolean(exp.enabled) : true,
          }))
      : [],
    projects: Array.isArray(parsed.projects)
      ? parsed.projects
          .filter(
            (proj) =>
              proj &&
              (proj.title?.trim() ||
                (Array.isArray(proj.techStack) && proj.techStack.length > 0) ||
                (Array.isArray(proj.bullets) &&
                  proj.bullets.some((b) => (typeof b === 'string' ? b : b?.text)?.trim())))
          )
          .map((proj) => ({
            title: String(proj.title || ''),
            techStack: Array.isArray(proj.techStack)
              ? proj.techStack.map((t) => String(t || '').trim()).filter(Boolean)
              : typeof proj.techStack === 'string' && proj.techStack.trim()
              ? proj.techStack.split(',').map((s) => s.trim()).filter(Boolean)
              : [],
            link: sanitizeUrl(String(proj.link || '')),
            bullets: normalizeBullets(proj.bullets),
            enabled: proj.enabled !== undefined ? Boolean(proj.enabled) : true,
          }))
      : [],
    skills: Array.isArray(parsed.skills)
      ? parsed.skills
          .filter((cat) => cat && (cat.category || cat.title || cat.name))
          .map((cat) => ({
            category: String(cat.category || cat.title || cat.name || 'Skills').trim(),
            items: Array.isArray(cat.items)
              ? cat.items.map((it) => String(it || '').trim()).filter(Boolean)
              : typeof cat.items === 'string' && cat.items.trim()
              ? cat.items.split(',').map((s) => s.trim()).filter(Boolean)
              : [],
            enabled: cat.enabled !== false,
          }))
          .filter((cat) => cat.category && cat.items.length > 0)
      : [
          {
            category: 'Languages',
            items: Array.isArray(parsed.skills?.languages)
              ? parsed.skills.languages.map((s) => String(s || '').trim()).filter(Boolean)
              : [],
            enabled: true,
          },
          {
            category: 'Frameworks',
            items: Array.isArray(parsed.skills?.frameworks)
              ? parsed.skills.frameworks.map((s) => String(s || '').trim()).filter(Boolean)
              : [],
            enabled: true,
          },
          {
            category: 'Developer Tools',
            items: Array.isArray(parsed.skills?.developerTools)
              ? parsed.skills.developerTools.map((s) => String(s || '').trim()).filter(Boolean)
              : [],
            enabled: true,
          },
          {
            category: 'Libraries',
            items: Array.isArray(parsed.skills?.libraries)
              ? parsed.skills.libraries.map((s) => String(s || '').trim()).filter(Boolean)
              : [],
            enabled: true,
          },
        ].filter((c) => c.items.length > 0),
    customSections: Array.isArray(parsed.customSections)
      ? parsed.customSections
          .filter(
            (sec) =>
              sec &&
              (String(sec.sectionTitle || sec.title || '').trim() ||
                (Array.isArray(sec.items) && sec.items.length > 0))
          )
          .map((sec) => ({
            sectionTitle: String(sec.sectionTitle || sec.title || 'Custom Section').trim() || 'Custom Section',
            items: Array.isArray(sec.items)
              ? sec.items
                  .filter(
                    (item) =>
                      item &&
                      (item.title?.trim() ||
                        item.subtitle?.trim() ||
                        item.description?.trim() ||
                        (Array.isArray(item.bullets) &&
                          item.bullets.some((b) => (typeof b === 'string' ? b : b?.text)?.trim())))
                  )
                  .map((item) => ({
                    title: String(item.title || ''),
                    subtitle: String(item.subtitle || ''),
                    date: String(item.date || ''),
                    description: String(item.description || ''),
                    bullets: Array.isArray(item.bullets)
                      ? item.bullets.map((b) =>
                          typeof b === 'string'
                            ? { text: b, enabled: true }
                            : { text: String(b.text || b.bullet || ''), enabled: b.enabled !== false }
                        )
                      : normalizeBullets(item.bullets),
                    enabled: item.enabled !== false,
                  }))
              : [],
          }))
          .filter((sec) => sec.items.length > 0 || sec.sectionTitle !== 'Custom Section')
      : [],
  };

  // 6. Guarantee complete normalization
  return normalizeProfile(structuredProfile);
}
