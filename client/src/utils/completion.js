const nonEmpty = (value) => typeof value === 'string' && value.trim().length > 0;

export function completion(profile = {}) {
  profile = profile || {};
  const sections = [
    { enabled: true, filled: nonEmpty(profile.basics?.fullName) && nonEmpty(profile.basics?.email) },
    { enabled: profile.educationEnabled !== false, filled: (profile.education || []).some((entry) => entry?.enabled !== false && nonEmpty(entry?.institution)) },
    { enabled: profile.experienceEnabled !== false, filled: (profile.experience || []).some((entry) => entry?.enabled !== false && nonEmpty(entry?.company)) },
    { enabled: profile.projectsEnabled !== false, filled: (profile.projects || []).some((entry) => entry?.enabled !== false && nonEmpty(entry?.title)) },
    { enabled: profile.skillsEnabled !== false, filled: (Array.isArray(profile.skills) ? profile.skills : []).some((category) => category?.enabled !== false && (category?.items || []).some(nonEmpty)) },
  ].filter((section) => section.enabled);

  const filled = sections.filter((section) => section.filled).length;
  const total = sections.length;
  return { filled, total, percent: total === 0 ? 0 : Math.round((filled / total) * 100) };
}

export default completion;
