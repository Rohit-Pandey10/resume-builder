import { normalizeProfile } from './bulletHelper.js';

export const STARTER_PROFILE_NAME = 'SWE Intern - General';

export function createStarterProfile(email, id) {
  return normalizeProfile({
    _id: id,
    profileName: STARTER_PROFILE_NAME,
    basics: {
      fullName: 'Jake Example',
      email,
      phone: '123-456-7890',
      location: 'San Francisco, CA',
      linkedinUrl: 'https://linkedin.com/in/jake-example',
      githubUrl: 'https://github.com/jake-example',
      portfolioUrl: 'https://jake-example.dev'
    },
    education: [
      {
        institution: 'State University',
        degree: 'Bachelor of Science in Computer Science',
        location: 'City, ST',
        startDate: 'Aug 2020',
        endDate: 'May 2024',
        gpa: '3.85 / 4.0',
        enabled: true
      }
    ],
    experience: [
      {
        company: 'Tech Corp',
        role: 'Software Engineering Intern',
        location: 'San Francisco, CA',
        startDate: 'Jun 2023',
        endDate: 'Aug 2023',
        bullets: [
          'Developed RESTful microservices using Node.js and Express, improving API response times by 25%.',
          'Implemented automated testing suites with 90%+ code coverage for critical payment pipelines.'
        ],
        enabled: true
      }
    ],
    projects: [
      {
        title: 'JakeResume Builder',
        techStack: ['React', 'Node.js', 'Express', 'MongoDB', 'LaTeX'],
        link: 'https://github.com/example/jakeresume',
        bullets: [
          'Engineered an ATS-friendly resume generation platform with live LaTeX rendering.',
          'Implemented dynamic multi-profile management and 3-tier PDF compilation pipeline.'
        ],
        enabled: true
      }
    ],
    skills: {
      languages: ['JavaScript', 'TypeScript', 'Python', 'C++', 'SQL'],
      frameworks: ['React', 'Node.js', 'Express', 'Next.js'],
      developerTools: ['Git', 'Docker', 'VS Code', 'Postman'],
      libraries: ['Mongoose', 'MongoDB', 'JWT']
    },
    customSections: []
  });
}
