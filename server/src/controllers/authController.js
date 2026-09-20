import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import ResumeProfile from '../models/ResumeProfile.js';

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

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters long'
      });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'A user with this email already exists'
      });
    }

    const user = await User.create({
      email: email.toLowerCase().trim(),
      password
    });

    // Automatically create an initial starter resume profile for the new user
    const initialProfile = await ResumeProfile.create({
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

    sendTokenResponse(user, 201, res, initialProfile);
  } catch (error) {
    next(error);
  }
};

// @desc    Login user & get token
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both email and password'
      });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
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
