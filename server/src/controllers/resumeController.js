import ResumeProfile from '../models/ResumeProfile.js';

// @desc    Get all resume profiles for logged in user
// @route   GET /api/resumes
// @access  Private
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
// @access  Private
export const getResumeById = async (req, res, next) => {
  try {
    const resume = await ResumeProfile.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume profile not found or unauthorized'
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
// @access  Private
export const createResume = async (req, res, next) => {
  try {
    // Enforce Per-User Profile Cap (Max 5 Resumes)
    const profileCount = await ResumeProfile.countDocuments({ userId: req.user._id });
    if (profileCount >= 5) {
      return res.status(400).json({
        success: false,
        error: 'Profile limit reached (maximum 5 profiles). Please delete an existing profile first.',
        message: 'Profile limit reached (maximum 5 profiles). Please delete an existing profile first.'
      });
    }

    const {
      profileName,
      basics,
      education,
      experience,
      projects,
      skills,
      customSections,
      sectionOrder
    } = req.body;

    const newResume = await ResumeProfile.create({
      userId: req.user._id,
      profileName: profileName || 'New Resume Profile',
      basics: basics || {},
      education: education || [],
      experience: experience || [],
      projects: projects || [],
      skills: skills || { languages: [], frameworks: [], developerTools: [], libraries: [] },
      customSections: customSections || [],
      sectionOrder: sectionOrder || undefined
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
// @access  Private
export const updateResume = async (req, res, next) => {
  try {
    let resume = await ResumeProfile.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume profile not found or unauthorized'
      });
    }

    const {
      profileName,
      basics,
      education,
      experience,
      projects,
      skills,
      customSections,
      sectionOrder
    } = req.body;

    if (profileName !== undefined) resume.profileName = profileName;
    if (basics !== undefined) resume.basics = basics;
    if (education !== undefined) resume.education = education;
    if (experience !== undefined) resume.experience = experience;
    if (projects !== undefined) resume.projects = projects;
    if (skills !== undefined) resume.skills = skills;
    if (customSections !== undefined) resume.customSections = customSections;
    if (sectionOrder !== undefined) resume.sectionOrder = sectionOrder;

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
// @access  Private
export const deleteResume = async (req, res, next) => {
  try {
    const resume = await ResumeProfile.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: 'Resume profile not found or unauthorized'
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
