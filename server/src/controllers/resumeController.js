import ResumeProfile from '../models/ResumeProfile.js';

// @desc    Get all resume profiles for logged in user
// @route   GET /api/resumes
// @access  Private (scoped by req.user._id in database query)
export const getResumes = async (req, res, next) => {
  try {
    const resumes = await ResumeProfile.find({ userId: req.user._id }).sort({ updatedAt: -1 });
    res.status(200).json({
      success: true,
      count: resumes.length,
      data: resumes
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get a single resume profile by ID
// @route   GET /api/resumes/:id
// @access  Private (scoped by _id AND userId in database query)
export const getResumeById = async (req, res, next) => {
  try {
    const resume = await ResumeProfile.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!resume) {
      return res.status(404).json({
        error: 'Resume profile not found'
      });
    }

    res.status(200).json({
      success: true,
      data: resume
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new resume profile
// @route   POST /api/resumes
// @access  Private (assigns userId strictly from authenticated session)
export const createResume = async (req, res, next) => {
  try {
    const profileCount = await ResumeProfile.countDocuments({ userId: req.user._id });
    if (profileCount >= 5) {
      return res.status(400).json({
        error: 'Profile limit reached (maximum 5 profiles). Please delete an existing profile first.'
      });
    }

    const {
      profileName,
      basics,
      education,
      educationEnabled,
      experience,
      experienceEnabled,
      projects,
      projectsEnabled,
      skills,
      skillsEnabled,
      customSections,
      customSectionsEnabled,
      sectionOrder
    } = req.body || {};

    const newResume = await ResumeProfile.create({
      userId: req.user._id,
      profileName: (typeof profileName === 'string' && profileName.trim()) ? profileName.trim() : 'New Resume Profile',
      basics: (basics && typeof basics === 'object') ? basics : {},
      education: Array.isArray(education) ? education : [],
      educationEnabled: educationEnabled !== false,
      experience: Array.isArray(experience) ? experience : [],
      experienceEnabled: experienceEnabled !== false,
      projects: Array.isArray(projects) ? projects : [],
      projectsEnabled: projectsEnabled !== false,
      skills: (skills && (Array.isArray(skills) || typeof skills === 'object')) ? skills : { languages: [], frameworks: [], developerTools: [], libraries: [] },
      skillsEnabled: skillsEnabled !== false,
      customSections: Array.isArray(customSections) ? customSections : [],
      customSectionsEnabled: customSectionsEnabled !== false,
      sectionOrder: Array.isArray(sectionOrder) ? sectionOrder : undefined
    });

    res.status(201).json({
      success: true,
      data: newResume
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Update a resume profile
// @route   PUT /api/resumes/:id
// @access  Private (scoped by _id AND userId in query; whitelisted fields only)
export const updateResume = async (req, res, next) => {
  try {
    const resume = await ResumeProfile.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!resume) {
      return res.status(404).json({
        error: 'Resume profile not found'
      });
    }

    const {
      profileName,
      basics,
      education,
      educationEnabled,
      experience,
      experienceEnabled,
      projects,
      projectsEnabled,
      skills,
      skillsEnabled,
      customSections,
      customSectionsEnabled,
      sectionOrder
    } = req.body || {};

    // Strict whitelisting prevents mass assignment of userId, _id, or createdAt
    if (profileName !== undefined) resume.profileName = String(profileName).trim();
    if (basics !== undefined && typeof basics === 'object') resume.basics = basics;
    if (education !== undefined && Array.isArray(education)) resume.education = education;
    if (educationEnabled !== undefined) resume.educationEnabled = Boolean(educationEnabled);
    if (experience !== undefined && Array.isArray(experience)) resume.experience = experience;
    if (experienceEnabled !== undefined) resume.experienceEnabled = Boolean(experienceEnabled);
    if (projects !== undefined && Array.isArray(projects)) resume.projects = projects;
    if (projectsEnabled !== undefined) resume.projectsEnabled = Boolean(projectsEnabled);
    if (skills !== undefined && typeof skills === 'object') resume.skills = skills;
    if (skillsEnabled !== undefined) resume.skillsEnabled = Boolean(skillsEnabled);
    if (customSections !== undefined && Array.isArray(customSections)) resume.customSections = customSections;
    if (customSectionsEnabled !== undefined) resume.customSectionsEnabled = Boolean(customSectionsEnabled);
    if (sectionOrder !== undefined && Array.isArray(sectionOrder)) resume.sectionOrder = sectionOrder;

    const updatedResume = await resume.save();

    res.status(200).json({
      success: true,
      data: updatedResume
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete a resume profile
// @route   DELETE /api/resumes/:id
// @access  Private (scoped by _id AND userId in database query)
export const deleteResume = async (req, res, next) => {
  try {
    const resume = await ResumeProfile.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!resume) {
      return res.status(404).json({
        error: 'Resume profile not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Resume profile deleted successfully',
      id: req.params.id
    });
  } catch (error) {
    next(error);
  }
};
