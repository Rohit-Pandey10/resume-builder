import express from 'express';
import rateLimit from 'express-rate-limit';
import {
  googleLogin,
  logout,
  getMe
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { requireDatabase } from '../middleware/dbCheck.js';
import { sanitizeKeys } from '../middleware/sanitizeInput.js';

const router = express.Router();

// Auth Rate Limiter (30 attempts per 15 minutes per IP)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many authentication attempts. Please try again later.'
  }
});

router.use(sanitizeKeys);

router.post('/google', authLimiter, requireDatabase, googleLogin);
router.post('/logout', logout);
router.get('/me', protect, requireDatabase, getMe);

export default router;
