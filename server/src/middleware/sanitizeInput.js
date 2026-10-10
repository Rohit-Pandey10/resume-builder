/**
 * Input sanitization and safety middleware
 *
 * 1. Rejects any object key starting with '$' or containing '.' (NoSQL operator injection prevention).
 * 2. Enforces upper bounds on string lengths and array sizes to prevent payload exhaustion attacks.
 */

const MAX_STRING_LENGTH = 10_000;
const MAX_ARRAY_LENGTH = 100;
const MAX_PROFILE_NAME_LENGTH = 200;

function hasProhibitedKeys(obj) {
  if (!obj || typeof obj !== 'object') return false;

  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      return true;
    }
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      if (hasProhibitedKeys(obj[key])) {
        return true;
      }
    }
  }
  return false;
}

function exceedsSizeBounds(obj, depth = 0) {
  if (depth > 15 || !obj) return false;

  if (Array.isArray(obj)) {
    if (obj.length > MAX_ARRAY_LENGTH) return true;
    for (const item of obj) {
      if (typeof item === 'string' && item.length > MAX_STRING_LENGTH) return true;
      if (typeof item === 'object' && exceedsSizeBounds(item, depth + 1)) return true;
    }
    return false;
  }

  if (typeof obj === 'object') {
    for (const [k, v] of Object.entries(obj)) {
      if (k === 'profileName' && typeof v === 'string' && v.length > MAX_PROFILE_NAME_LENGTH) {
        return true;
      }
      if (typeof v === 'string' && v.length > MAX_STRING_LENGTH) {
        return true;
      }
      if (typeof v === 'object' && exceedsSizeBounds(v, depth + 1)) {
        return true;
      }
    }
  }

  return false;
}

export const sanitizeKeys = (req, res, next) => {
  if (req.body && hasProhibitedKeys(req.body)) {
    return res.status(400).json({ error: 'Prohibited characters ($ or .) found in payload keys' });
  }
  if (req.query && hasProhibitedKeys(req.query)) {
    return res.status(400).json({ error: 'Prohibited characters ($ or .) found in query keys' });
  }
  if (req.params && hasProhibitedKeys(req.params)) {
    return res.status(400).json({ error: 'Prohibited characters ($ or .) found in route parameters' });
  }
  next();
};

export const validateProfilePayload = (req, res, next) => {
  if (req.body && exceedsSizeBounds(req.body)) {
    return res.status(400).json({ error: 'Request payload exceeds maximum field or array length limits' });
  }
  next();
};
