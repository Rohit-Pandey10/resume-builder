/**
 * Single-Page Height/Line Estimator Utility
 *
 * Jake's Resume standard format is strictly a 1-page budget.
 * At 11pt font size, letterpaper, and standard 0.5in margins, a single page
 * holds roughly 46–50 total vertical lines (default budget: 48 lines).
 */

export const MAX_PAGE_BUDGET = 48;

/**
 * Calculates estimated line count for a single bullet text item.
 * Baseline: 1 line
 * Word wrap: +1 additional line for every ~100 characters of text.
 *
 * @param {string} text - Raw bullet text
 * @returns {number} - Estimated line count (minimum 1 for non-empty text)
 */
export function estimateBulletLines(text) {
  if (!text) return 0;
  const str = String(text).trim();
  if (!str) return 0;
  return 1 + Math.floor(str.length / 100);
}

/**
 * Computes deterministic single-page vertical line usage based on active enabled items.
 *
 * Line budget calculation rules:
 * - Header / Contact info: ~4 lines
 * - Each active section header (\section): ~2 lines
 * - Education item: ~2 lines (institution + degree/dates)
 * - Experience / Project subheading: ~1.5 lines
 * - Each enabled bullet item: ~1 line + additional line for every ~100 characters
 * - Skills category line: ~1 line
 * - Custom section item: ~1.5 lines + bullets (or description)
 *
 * @param {Object} profile - ResumeProfile document
 * @param {number} maxBudget - Target line budget (default 48)
 * @returns {Object} {
 *   estimatedLines: number,
 *   maxBudget: number,
 *   percentage: number,
 *   status: 'safe' | 'warning' | 'overflow',
 *   breakdown: {
 *     header: number,
 *     education: number,
 *     experience: number,
 *     projects: number,
 *     skills: number,
 *     customSections: number
 *   }
 * }
 */
export function estimatePageBudget(profile, maxBudget = MAX_PAGE_BUDGET) {
  const breakdown = {
    header: 0,
    education: 0,
    experience: 0,
    projects: 0,
    skills: 0,
    customSections: 0,
  };

  if (!profile) {
    return {
      estimatedLines: 0,
      maxBudget,
      percentage: 0,
      status: 'safe',
      breakdown,
    };
  }

  // 1. Header / Contact info: ~4 lines
  const basics = profile.basics || {};
  const hasBasics = Boolean(
    (basics.fullName && basics.fullName.trim()) ||
    (basics.email && basics.email.trim()) ||
    (basics.phone && basics.phone.trim()) ||
    (basics.location && basics.location.trim()) ||
    (basics.linkedinUrl && basics.linkedinUrl.trim()) ||
    (basics.githubUrl && basics.githubUrl.trim()) ||
    (basics.portfolioUrl && basics.portfolioUrl.trim())
  );
  if (hasBasics) {
    breakdown.header = 4;
  }

  // 2. Education
  const activeEdu = (profile.education || []).filter((e) => e && e.enabled !== false);
  if (activeEdu.length > 0) {
    let eduLines = 2; // \section{Education}
    activeEdu.forEach(() => {
      eduLines += 2; // Institution + Degree/Dates
    });
    breakdown.education = eduLines;
  }

  // 3. Experience
  const activeExp = (profile.experience || []).filter((e) => e && e.enabled !== false);
  if (activeExp.length > 0) {
    let expLines = 2; // \section{Experience}
    activeExp.forEach((exp) => {
      expLines += 1.5; // Role, Company, Location, Dates
      const bullets = (exp.bullets || []).filter(
        (b) => b && b.enabled !== false && (typeof b === 'string' ? b.trim() : (b.text || b.bullet))
      );
      bullets.forEach((b) => {
        const text = typeof b === 'string' ? b : (b.text || b.bullet || '');
        expLines += estimateBulletLines(text);
      });
    });
    breakdown.experience = expLines;
  }

  // 4. Projects
  const activeProj = (profile.projects || []).filter((p) => p && p.enabled !== false);
  if (activeProj.length > 0) {
    let projLines = 2; // \section{Projects}
    activeProj.forEach((proj) => {
      projLines += 1.5; // Project Title, Tech Stack, Link
      const bullets = (proj.bullets || []).filter(
        (b) => b && b.enabled !== false && (typeof b === 'string' ? b.trim() : (b.text || b.bullet))
      );
      bullets.forEach((b) => {
        const text = typeof b === 'string' ? b : (b.text || b.bullet || '');
        projLines += estimateBulletLines(text);
      });
    });
    breakdown.projects = projLines;
  }

  // 5. Technical Skills
  let activeSkillCategories = [];
  if (Array.isArray(profile.skills)) {
    activeSkillCategories = profile.skills.filter(
      (s) => s && s.enabled !== false && (s.category || s.title || s.name)
    );
  } else if (profile.skills && typeof profile.skills === 'object') {
    activeSkillCategories = Object.entries(profile.skills).filter(
      ([_, items]) => Array.isArray(items) && items.length > 0
    );
  }
  if (activeSkillCategories.length > 0) {
    let skillLines = 2; // \section{Technical Skills}
    activeSkillCategories.forEach((cat) => {
      // 1 line base per category
      let catLine = 1;
      // If items string or array is excessively long (>120 chars), wrap to 2nd line
      const itemsList = Array.isArray(cat.items)
        ? cat.items.join(', ')
        : typeof cat.items === 'string'
        ? cat.items
        : '';
      if (itemsList.length > 120) {
        catLine += Math.floor(itemsList.length / 120);
      }
      skillLines += catLine;
    });
    breakdown.skills = skillLines;
  }

  // 6. Custom Sections
  const activeCustomSecs = (profile.customSections || []).filter(
    (sec) => sec && sec.enabled !== false && sec.sectionTitle
  );
  if (activeCustomSecs.length > 0) {
    let customLines = 0;
    activeCustomSecs.forEach((sec) => {
      const activeItems = (sec.items || []).filter((i) => i && i.enabled !== false);
      if (activeItems.length > 0) {
        customLines += 2; // \section{Custom Section}
        activeItems.forEach((item) => {
          customLines += 1.5; // Heading + Subtitle + Date
          const bullets = (item.bullets || []).filter(
            (b) => b && b.enabled !== false && (typeof b === 'string' ? b.trim() : (b.text || b.bullet))
          );
          if (bullets.length > 0) {
            bullets.forEach((b) => {
              const text = typeof b === 'string' ? b : (b.text || b.bullet || '');
              customLines += estimateBulletLines(text);
            });
          } else if (item.description && String(item.description).trim()) {
            customLines += estimateBulletLines(item.description);
          }
        });
      }
    });
    breakdown.customSections = customLines;
  }

  const rawTotal =
    breakdown.header +
    breakdown.education +
    breakdown.experience +
    breakdown.projects +
    breakdown.skills +
    breakdown.customSections;

  const estimatedLines = Math.round(rawTotal);
  const percentage = Math.round((estimatedLines / maxBudget) * 100);

  let status = 'safe';
  if (percentage > 100) {
    status = 'overflow';
  } else if (percentage >= 85) {
    status = 'warning';
  }

  return {
    estimatedLines,
    maxBudget,
    percentage,
    status,
    breakdown,
  };
}
