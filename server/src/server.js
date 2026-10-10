import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { connectDB, isDbConnected } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

// 2.1 Startup config validation
if (process.env.NODE_ENV === 'production') {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error('FATAL: JWT_SECRET must be configured and at least 32 characters in production.');
  }
}

if (!process.env.MONGODB_URI) {
  console.warn('Warning: MONGODB_URI is not configured. Account persistence and authenticated routes are disabled (503 Service Unavailable).');
}

if (!process.env.GOOGLE_CLIENT_ID) {
  console.warn('Warning: GOOGLE_CLIENT_ID is not configured. Google authentication is disabled (503 Service Unavailable).');
}

if (!process.env.CLIENT_URL) {
  console.warn('Warning: CLIENT_URL is not configured. Cross-origin browser requests outside same-origin and Vercel domains will be rejected.');
}

// Global unhandled rejection safety
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason instanceof Error ? reason.message : 'Unknown error');
});

const app = express();
const PORT = process.env.PORT || 5001;

// Trust proxy for accurate client IP identification on Vercel reverse proxy
app.set('trust proxy', 1);

// Measure request duration for structured logging
app.use((req, res, next) => {
  req._startTime = Date.now();
  next();
});

const REMOTE_COMPILE_TIMEOUT_MS = 30_000;

// Rate Limiters
// General API Rate Limiter (max 300 requests per 15 mins per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please slow down.'
  }
});

// Strict Compiler Rate Limiter (max 10 compiles per minute per IP to protect proxy)
const compileLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Compile rate limit exceeded. Please wait a minute.'
  }
});

// CORS Configuration
const allowedOrigins = [
  process.env.CLIENT_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (same-origin, curl, server-to-server)
      if (!origin) return callback(null, true);
      // Allow explicitly listed origin
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow any Vercel deployment URL
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      // Allow local development origins only in non-production
      if (
        process.env.NODE_ENV !== 'production' &&
        (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))
      ) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Compile is intentionally public for account and guest workspaces.
// It gets its own 200kb parser; upstream target is fixed (no SSRF risk).
app.post('/api/compile', compileLimiter, express.json({ limit: '200kb' }), async (req, res) => {
  try {
    if (!req.is('application/json')) {
      return res.status(415).json({ error: 'Compile requests must use application/json' });
    }

    const { tex } = req.body || {};
    if (typeof tex !== 'string' || !tex.trim()) {
      return res.status(400).json({ error: 'Missing LaTeX source text (tex)' });
    }

    const compileUrl = `https://latexonline.cc/compile?text=${encodeURIComponent(tex)}&force=true`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REMOTE_COMPILE_TIMEOUT_MS);

    let response;
    try {
      response = await fetch(compileUrl, { signal: controller.signal });
    } catch (fetchErr) {
      clearTimeout(timeout);
      return res.status(504).json({ error: 'Compilation service unreachable or timed out' });
    }
    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Compilation failed');
      // Sanitize: never echo upstream HTML error pages into API JSON response
      let cleanMessage = errorText;
      if (cleanMessage.includes('<html') || cleanMessage.includes('<!DOCTYPE') || cleanMessage.includes('<body')) {
        cleanMessage = `Compilation upstream returned status ${response.status}`;
      }
      return res.status(response.status >= 400 && response.status < 600 ? response.status : 500).json({
        error: cleanMessage.slice(0, 2000)
      });
    }

    const arrayBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    res.status(500).json({ error: 'Internal compilation error' });
  }
});

// Body & Cookie Parsers with 1MB limit for profiles and authenticated payloads
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use(cookieParser());

// Apply General Rate Limiter across /api routes
app.use('/api', apiLimiter);

// 4.2 & 4.4 API security and cache headers
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  next();
});

// 2.10 Health Check (returns { ok, time, db, google }, no secrets, no versions, never throws)
app.get('/api/health', (req, res) => {
  try {
    res.status(200).json({
      ok: true,
      time: new Date().toISOString(),
      db: isDbConnected() ? 'up' : 'down',
      google: Boolean(process.env.GOOGLE_CLIENT_ID)
    });
  } catch (_e) {
    res.status(200).json({
      ok: false,
      time: new Date().toISOString(),
      db: 'down',
      google: false
    });
  }
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);

// 2.5 Unknown /api routes return 404 JSON
app.all('/api/*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Error Handling Middleware
app.use(errorHandler);

// Start server function (only used in local development — skipped on Vercel)
export const startServer = async () => {
  await connectDB();
  const server = app.listen(PORT, () => {
    console.log(`JakeResume Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
  return server;
};

// Auto-start when run directly via Node (e.g. `node src/server.js` or `npm run dev`).
if (process.env.VERCEL !== '1' && process.argv[1] && process.argv[1].endsWith('server.js')) {
  startServer();
}

export default app;
