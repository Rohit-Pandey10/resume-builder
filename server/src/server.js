import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import resumeRoutes from './routes/resumeRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

if (!process.env.GOOGLE_CLIENT_ID) {
  console.info('Google sign-in is disabled: GOOGLE_CLIENT_ID is not configured.');
}
const REMOTE_COMPILE_TIMEOUT_MS = 30_000;

// Rate Limiters
// General API Rate Limiter (max 300 requests per 15 mins per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
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
    success: false,
    error: 'Compile rate limit exceeded. Please wait a minute.'
  }
});

// CORS Configuration
// On Vercel, client and API share the same domain — same-origin requests
// have no 'Origin' header, so the `!origin` guard handles them.
// We also allow any *.vercel.app preview URL and the configured CLIENT_URL.
const allowedOrigins = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:3000'
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (same-origin, mobile apps, curl)
      if (!origin) return callback(null, true);
      // Allow any Vercel preview/production URL (*.vercel.app)
      if (origin.endsWith('.vercel.app')) return callback(null, true);
      // Allow explicitly listed origins
      if (allowedOrigins.includes(origin)) return callback(null, true);
      // Allow all in non-production for local dev convenience
      if (process.env.NODE_ENV !== 'production') return callback(null, true);
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Compile is intentionally public for account and guest workspaces. It gets its own
// 200kb parser; every other API request keeps the stricter 100kb body limit below.
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
      return res.status(504).json({ error: 'Compilation service unreachable or timed out: ' + fetchErr.message });
    }
    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Compilation failed');
      return res.status(response.status >= 400 && response.status < 600 ? response.status : 500).json({ error: errorText });
    }

    const arrayBuffer = await response.arrayBuffer();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="resume.pdf"');
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Body & Cookie Parsers with 100kb request body protection for the rest of the API.
app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());

// Apply General Rate Limiter across all /api routes
app.use('/api', apiLimiter);

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'JakeResume API'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);

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
// On Vercel (VERCEL=1), the serverless handler in api/index.js drives the app instead.
if (process.env.VERCEL !== '1' && process.argv[1] && process.argv[1].endsWith('server.js')) {
  startServer();
}

export default app;
