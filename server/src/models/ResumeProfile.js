import mongoose from 'mongoose';

const educationItemSchema = new mongoose.Schema(
  {
    institution: { type: String, default: '' },
    degree: { type: String, default: '' },
    location: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    gpa: { type: String, default: '' },
    enabled: { type: Boolean, default: true }
  },
  { _id: true }
);

const experienceItemSchema = new mongoose.Schema(
  {
    company: { type: String, default: '' },
    role: { type: String, default: '' },
    location: { type: String, default: '' },
    startDate: { type: String, default: '' },
    endDate: { type: String, default: '' },
    bullets: { type: [mongoose.Schema.Types.Mixed], default: [] },
    enabled: { type: Boolean, default: true }
  },
  { _id: true }
);

const projectItemSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    techStack: { type: [String], default: [] },
    link: { type: String, default: '' },
    bullets: { type: [mongoose.Schema.Types.Mixed], default: [] },
    enabled: { type: Boolean, default: true }
  },
  { _id: true }
);

const customSectionItemSchema = new mongoose.Schema(
  {
    title: { type: String, default: '' },
    subtitle: { type: String, default: '' },
    date: { type: String, default: '' },
    description: { type: String, default: '' },
    bullets: { type: [mongoose.Schema.Types.Mixed], default: [] },
    enabled: { type: Boolean, default: true }
  },
  { _id: true }
);

const customSectionSchema = new mongoose.Schema(
  {
    sectionTitle: { type: String, default: '' },
    enabled: { type: Boolean, default: true },
    items: { type: [customSectionItemSchema], default: [] }
  },
  { _id: true }
);

const resumeProfileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    profileName: {
      type: String,
      required: [true, 'Profile name is required'],
      trim: true,
      default: 'Default Profile'
    },
    basics: {
      fullName: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      location: { type: String, default: '' },
      linkedinUrl: { type: String, default: '' },
      githubUrl: { type: String, default: '' },
      portfolioUrl: { type: String, default: '' }
    },
    education: {
      type: [educationItemSchema],
      default: []
    },
    educationEnabled: {
      type: Boolean,
      default: true
    },
    experience: {
      type: [experienceItemSchema],
      default: []
    },
    experienceEnabled: {
      type: Boolean,
      default: true
    },
    projects: {
      type: [projectItemSchema],
      default: []
    },
    projectsEnabled: {
      type: Boolean,
      default: true
    },
    skills: {
      type: mongoose.Schema.Types.Mixed,
      default: []
    },
    skillsEnabled: {
      type: Boolean,
      default: true
    },
    customSections: {
      type: [customSectionSchema],
      default: []
    },
    customSectionsEnabled: {
      type: Boolean,
      default: true
    },
    sectionOrder: {
      type: [String],
      default: ['education', 'experience', 'projects', 'skills', 'customSections']
    }
  },
  {
    timestamps: true
  }
);

const ResumeProfile = mongoose.model('ResumeProfile', resumeProfileSchema);
export default ResumeProfile;
