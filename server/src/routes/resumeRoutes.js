import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  getResumes,
  getResumeById,
  createResume,
  updateResume,
  deleteResume
} from '../controllers/resumeController.js';
import { protect } from '../middleware/auth.js';
import { requireDatabase } from '../middleware/dbCheck.js';
import { sanitizeKeys, validateProfilePayload } from '../middleware/sanitizeInput.js';

const router = express.Router();

// Profile Write Rate Limiter (60 writes per minute per IP)
const profileWriteLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many profile updates. Please slow down.'
  }
});

// All resume routes require authentication and available database connection
router.use(protect);
router.use(requireDatabase);
router.use(sanitizeKeys);

router.route('/')
  .get(getResumes)
  .post(profileWriteLimiter, validateProfilePayload, createResume);

router.route('/:id')
  .get(getResumeById)
  .put(profileWriteLimiter, validateProfilePayload, updateResume)
  .delete(profileWriteLimiter, deleteResume);

export default router;
