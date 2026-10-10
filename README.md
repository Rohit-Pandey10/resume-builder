# JakeResume Builder

A clean, modern resume builder for software engineers that produces ATS-optimized, single-page LaTeX resumes with live browser PDF compilation and Google OAuth account synchronization.

---

## Quickstart

### Prerequisites
- Node.js $\ge 18.0.0$
- npm $\ge 9.0.0$

### 1. Installation
Clone the repository and install dependencies in both client and server:

```bash
# Clone
git clone <repository-url>
cd resume_agy

# Install dependencies
npm run install:all
# Or individually:
cd client && npm install && cd ../server && npm install && cd ..
```

### 2. Environment Configuration
Copy the provided environment templates:

```bash
# Server configuration
cp server/.env.example server/.env

# Client configuration
cp client/.env.example client/.env
```

Edit `server/.env` and `client/.env` with your values (see [DEPLOYMENT.md](DEPLOYMENT.md) for full variable details).

### 3. Running Locally
Run client and server concurrently:

```bash
# In terminal 1: Start backend API (port 5001)
cd server && npm run dev

# In terminal 2: Start Vite frontend (port 5173)
cd client && npm run dev
```

Visit `http://localhost:5173` in your browser.

### 4. Running Tests
Run the comprehensive verification suite across client and server:

```bash
# Full test suite (lint, unit tests, golden LaTeX tests, hostile LaTeX tests, builds)
npm run verify

# Individual test runners:
cd client && npm run test:all       # Unit + Golden + Hostile LaTeX tests
cd client && npm run test:e2e-prod   # Playwright production E2E suite
cd server && npm test               # Server auth, security & tenant isolation tests
```

### 5. Production Build
Build client and server bundles:

```bash
# Build Vite SPA
cd client && npm run build

# Check server syntax
cd server && npm run build
```

Production static assets are emitted to `client/dist/`.

---

## Deployment

JakeResume is pre-configured for serverless deployment on **Vercel** with a **MongoDB Atlas** database.

For complete step-by-step instructions on setting up Google OAuth credentials, MongoDB Atlas users, Vercel environment variables, running post-deploy smoke tests, and secret rotation procedures, please consult:

👉 **[DEPLOYMENT.md](DEPLOYMENT.md)**

---

## Architecture Overview

- **Frontend**: React 18, Vite, Lucide Icons, Vanilla CSS Design System with light warm tokens (`tokens.css`).
- **Storage**: Dual-engine architecture:
  - **Guest Mode**: 100% device-local storage via `localStorage` (`jakeresume:guest:v1`).
  - **Account Mode**: Google OAuth 2.0 Identity Services with encrypted MongoDB Atlas persistence.
- **Compiler**: 3-tier compilation engine:
  - In-browser live preview via proxied `/api/compile` endpoint with SHA-256 LRU cache.
  - Direct ATS `.tex` source code download.
  - One-click Overleaf cloud project export.
- **Security & Hygiene**: Content-Security-Policy (CSP), `X-Content-Type-Options: nosniff`, CORS protection, algorithm-pinned JWTs (`HS256`), NoSQL injection sanitizers, and hostile LaTeX sanitization.

---

## License
MIT
