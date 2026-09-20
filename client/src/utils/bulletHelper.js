import { sanitizeUrl } from './urlHelper.js';

/**
 * Normalizes bullet arrays into [{ text: string, enabled: boolean }]
 * Handles flat strings, null/undefined, or already structured objects.
 */
export function normalizeBullets(rawBullets) {
  if (!Array.isArray(rawBullets)) return [];
  return rawBullets.map((item) => {
    if (typeof item === 'string') {
      return { text: item, enabled: true };
    }
    if (item && typeof item === 'object') {
      return {
        text: item.text ?? item.bullet ?? '',
        enabled: item.enabled !== false,
      };
    }
    return { text: String(item || ''), enabled: true };
  });
}

export const DEFAULT_SECTION_ORDER = ['education', 'experience', 'projects', 'skills', 'customSections'];

export function sanitizeSectionOrder(order) {
  if (!Array.isArray(order) || order.length === 0) {
    return [...DEFAULT_SECTION_ORDER];
  }
  const result = order.filter((k) => DEFAULT_SECTION_ORDER.includes(k));
  DEFAULT_SECTION_ORDER.forEach((k) => {
    if (!result.includes(k)) result.push(k);
  });
  return result;
}

/**
 * Normalizes an entire ResumeProfile document from the backend
 * so that all experiences, projects, skills, and custom sections have consistent structures.
 */
export function normalizeProfile(profile) {
  if (!profile) return null;

  return {
    ...profile,
    profileName: profile.profileName || 'Untitled Resume',
    sectionOrder: sanitizeSectionOrder(profile.sectionOrder),
    basics: {
      fullName: profile.basics?.fullName || '',
      email: profile.basics?.email || '',
      phone: profile.basics?.phone || '',
      location: profile.basics?.location || '',
      linkedinUrl: sanitizeUrl(profile.basics?.linkedinUrl || ''),
      githubUrl: sanitizeUrl(profile.basics?.githubUrl || ''),
      portfolioUrl: sanitizeUrl(profile.basics?.portfolioUrl || ''),
    },
    education: (profile.education || []).map((edu) => ({
      ...edu,
      enabled: edu.enabled !== false,
    })),
    experience: (profile.experience || []).map((exp) => ({
      ...exp,
      enabled: exp.enabled !== false,
      bullets: normalizeBullets(exp.bullets),
    })),
    projects: (profile.projects || []).map((proj) => ({
      ...proj,
      enabled: proj.enabled !== false,
      link: sanitizeUrl(proj.link || ''),
      techStack: Array.isArray(proj.techStack) ? proj.techStack : [],
      bullets: normalizeBullets(proj.bullets),
    })),
    skills: Array.isArray(profile.skills)
      ? profile.skills.map((s) => ({
          category: s.category || s.title || s.name || 'Skills',
          items: Array.isArray(s.items)
            ? s.items.map(String)
            : typeof s.items === 'string'
            ? s.items.split(',').map((it) => it.trim()).filter(Boolean)
            : [],
          enabled: s.enabled !== false,
        }))
      : [
          { category: 'Languages', items: Array.isArray(profile.skills?.languages) ? profile.skills.languages : [], enabled: true },
          { category: 'Frameworks', items: Array.isArray(profile.skills?.frameworks) ? profile.skills.frameworks : [], enabled: true },
          { category: 'Developer Tools', items: Array.isArray(profile.skills?.developerTools) ? profile.skills.developerTools : [], enabled: true },
          { category: 'Libraries', items: Array.isArray(profile.skills?.libraries) ? profile.skills.libraries : [], enabled: true },
        ].filter((c) => c.items.length > 0),
    customSections: (profile.customSections || []).map((sec) => ({
      ...sec,
      sectionTitle: sec.sectionTitle || 'Custom Section',
      enabled: sec.enabled !== false,
      items: (sec.items || []).map((item) => ({
        title: item.title || '',
        subtitle: item.subtitle || '',
        date: item.date || '',
        description: item.description || '',
        bullets: Array.isArray(item.bullets)
          ? item.bullets.map((b) =>
              typeof b === 'string'
                ? { text: b, enabled: true }
                : { text: String(b.text || b.bullet || ''), enabled: b.enabled !== false }
            )
          : normalizeBullets(item.bullets),
        enabled: item.enabled !== false,
      })),
    })),
  };
}

/**
 * Serializes the profile for backend saving.
 * Preserves structured bullets { text, enabled } in mixed arrays.
 */
export function serializeProfile(profile) {
  if (!profile) return null;

  return {
    ...profile,
    sectionOrder: sanitizeSectionOrder(profile.sectionOrder),
    experience: (profile.experience || []).map((exp) => ({
      ...exp,
      bullets: (exp.bullets || []).map((b) => ({
        text: typeof b === 'string' ? b : (b.text || ''),
        enabled: b.enabled !== false,
      })),
    })),
    projects: (profile.projects || []).map((proj) => ({
      ...proj,
      bullets: (proj.bullets || []).map((b) => ({
        text: typeof b === 'string' ? b : (b.text || ''),
        enabled: b.enabled !== false,
      })),
    })),
    skills: Array.isArray(profile.skills)
      ? profile.skills.map((s) => ({
          category: s.category || 'Skills',
          items: Array.isArray(s.items) ? s.items : [],
          enabled: s.enabled !== false,
        }))
      : profile.skills,
    customSections: (profile.customSections || []).map((sec) => ({
      ...sec,
      items: (sec.items || []).map((item) => ({
        ...item,
        bullets: (item.bullets || []).map((b) => ({
          text: typeof b === 'string' ? b : (b.text || ''),
          enabled: b.enabled !== false,
        })),
      })),
    })),
  };
}
