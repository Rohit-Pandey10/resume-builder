import express from 'express';
import {
  googleLogin,
  logout,
  getMe
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/google', googleLogin);
router.post('/logout', logout);
router.get('/me', protect, getMe);

export default router;
