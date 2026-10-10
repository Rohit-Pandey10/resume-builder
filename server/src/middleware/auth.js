import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check httpOnly cookie
    if (req.cookies && req.cookies.token && typeof req.cookies.token === 'string') {
      token = req.cookies.token;
    }
    // 2. Authorization Bearer header
    else if (req.headers.authorization && typeof req.headers.authorization === 'string') {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[0] === 'Bearer') {
        token = parts[1];
      }
    }

    if (!token) {
      return res.status(401).json({
        error: 'Not authorized, no token provided'
      });
    }

    const secret = process.env.JWT_SECRET || (process.env.NODE_ENV !== 'production' ? 'supersecretjakeresumejwtkey2026!' : null);
    if (!secret) {
      return res.status(503).json({
        error: 'Authentication service temporarily unavailable'
      });
    }

    // Pin algorithm explicitly to HS256 to prevent algorithm confusion attacks
    const decoded = jwt.verify(token, secret, { algorithms: ['HS256'] });

    if (!decoded || !decoded.id) {
      return res.status(401).json({
        error: 'Invalid token payload'
      });
    }

    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        error: 'User belonging to this token no longer exists'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      error: 'Not authorized, token invalid or expired'
    });
  }
};
