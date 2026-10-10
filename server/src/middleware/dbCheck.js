import { isDbConnected } from '../config/db.js';

export const requireDatabase = (req, res, next) => {
  if (!isDbConnected()) {
    return res.status(503).json({
      error: 'Account database is currently unavailable. Please try again later.'
    });
  }
  next();
};
