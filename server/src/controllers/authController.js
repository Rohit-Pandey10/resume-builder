import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User.js';
import ResumeProfile from '../models/ResumeProfile.js';

const GOOGLE_CREDENTIAL_MAX_LENGTH = 10_000;
const googleClient = new OAuth2Client();
const defaultGoogleTokenVerifier = async (credential, audience) => {
  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience
  });
  return ticket.getPayload();
};
let googleTokenVerifier = defaultGoogleTokenVerifier;

export const setGoogleTokenVerifierForTests = (verifier = defaultGoogleTokenVerifier) => {
  googleTokenVerifier = verifier;
};

const generateToken = (userId) => {
  const secret = process.env.JWT_SECRET || 'supersecretjakeresumejwtkey2026!';
  return jwt.sign({ id: userId }, secret, { expiresIn: '7d' });
};

const sendTokenResponse = (user, statusCode, res, defaultProfile = null) => {
  const token = generateToken(user._id);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  };

  res.cookie('token', token, cookieOptions);

  res.status(statusCode).json({
    success: true,
    user: {
      _id: user._id,
      email: user.email,
      createdAt: user.createdAt
    },
    token, // Provided for Authorization header compatibility
    ...(defaultProfile && { defaultProfileId: defaultProfile._id })
  });
};

const createStarterProfile = async (user) => ResumeProfile.create({
  userId: user._id,
  profileName: 'SWE Intern - General',
  basics: {
    fullName: 'Jake Example',
    email: user.email,
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
    libraries: ['Mongoose', 'Tailwind CSS', 'JWT']
  },
  customSections: []
});

// @desc    Verify a Google Identity Services ID token and create a normal session
// @route   POST /api/auth/google
// @access  Public
export const googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body || {};
    if (typeof credential !== 'string' || !credential.trim() || credential.length > GOOGLE_CREDENTIAL_MAX_LENGTH) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google credential'
      });
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
      return res.status(503).json({
        success: false,
        message: 'Google sign-in is not configured'
      });
    }

    let payload;
    try {
      payload = await googleTokenVerifier(credential, process.env.GOOGLE_CLIENT_ID);
    } catch (_error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google credential'
      });
    }

    if (!payload?.sub) {
      return res.status(401).json({
        success: false,
        message: 'Invalid Google credential'
      });
    }

    if (!payload.email || payload.email_verified !== true) {
      return res.status(403).json({
        success: false,
        message: 'Google account email is not verified'
      });
    }

    const normalizedEmail = payload.email.toLowerCase().trim();
    let user = await User.findOne({ googleId: payload.sub });
    let initialProfile = null;

    if (!user) {
      user = await User.findOne({ email: normalizedEmail });
      if (user) {
        user.googleId = payload.sub;
        await user.save();
      } else {
        user = await User.create({ email: normalizedEmail, googleId: payload.sub });
        initialProfile = await createStarterProfile(user);
      }
    }

    return sendTokenResponse(user, 200, res, initialProfile);
  } catch (error) {
    return next(error);
  }
};

// @desc    Logout user & clear cookie
// @route   POST /api/auth/logout
// @access  Public
export const logout = async (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
};
