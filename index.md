# JakeResume Project Index & Architecture Map

## 1. Architecture Overview
Full-stack resume builder formatted specifically for the classic Jake's Resume LaTeX template. Supports both Guest mode (stored locally via `localStorage` / `IndexedDB`) and authenticated accounts (MongoDB Atlas + Google Sign-In).

### Monorepo Structure
- `client/`: React 18 + Vite SPA, Tailwind CSS with custom CSS tokens (`src/tokens.css`, `src/index.css`).
- `server/`: Express 4 API server with Mongoose, JWT auth cookies, Google OAuth verify, and LaTeX compilation proxy.
- `api/`: Vercel serverless functions wrapping the Express app.

---

## 2. File Locations & Directory Map

### Client (`client/src/`)
- `App.jsx`: Top-level orchestrator; routes (`#/`, `#/resumes`, `#/edit/:id`), mobile view toggles, compile handling.
- `tokens.css`: Core design tokens (warm palette, ink scale, shadows, radiuses).
- `index.css`: Layout styles, responsive breakpoints, topbar/subbar, preview, dashboard.
- `components/`:
  - `Navbar.jsx`: Global top navigation bar (logo, links, compile, export, account/guest popover).
  - `EditorSubbar.jsx`: Editor contextual toolbar (breadcrumb, rename input/popover, save status, undo/redo).
  - `Drawer.jsx`: Mobile navigation drawer (overlay menu with routes, import, auth/guest controls).
  - `EditorStepper.jsx`: Step-by-step section navigation with compact mobile and expanded desktop modes.
  - `EditorSectionCard.jsx`: Collapsible/form container card with add button and next step action.
  - `ResumeDashboard.jsx`: Resumes management view (grid/list of profiles, duplicate, rename, delete).
  - `AuthModal.jsx`: Landing hero action card (Google sign-in, guest mode, import).
  - `stageshow/`: Stageshow product UI kit components:
    - `StageshowProductHero.jsx`: High-craft split-pane JakeResume showcase (macOS window chrome, live LaTeX preview, satellite Page Budget gauge).
    - `StageshowBento.jsx`: Restrained 3-card bento grid (ATS engine, single-page budget estimator, local guest vault).
    - `stageshow.css`: Stageshow tokens, macOS chrome, LaTeX paper layout, and mobile-responsive styles.
  - `RightPanel/`: PDF and LaTeX preview panes (`PdfPreviewPlaceholder.jsx`, `LatexPreview.jsx`, `PageBudgetGauge.jsx`).
  - `LeftPanel/`: Resume form sections (`BasicsSection.jsx`, `EducationSection.jsx`, `ExperienceSection.jsx`, `ProjectsSection.jsx`, `SkillsSection.jsx`, `CustomSections.jsx`).
  - `primitives/`: Reusable primitives (`Button.jsx`, `IconButton.jsx`, `Input.jsx`, `Popover.jsx`, etc.).

### Server (`server/src/`)
- `server.js`: Express app entry, routes mounting, CORS, LaTeX compile proxy.
- `controllers/`: `authController.js`, `resumeController.js`.
- `models/`: `User.js`, `ResumeProfile.js`.
- `middleware/`: `auth.js`, `errorHandler.js`.

---

## 3. Key Data Models & State Stores

### Stores & Client State
- `client/src/stores/profileStore.js`:
  - `getMode()` / `setMode()`: Switches between `'account'` and `'guest'`.
  - `localStore`: `localStorage` CRUD for guest mode resumes.
  - `remoteStore`: REST API calls to `/api/resumes` for authenticated users.

### API Endpoints (`server/src/routes/`)
- `GET/POST /api/auth/*`: Google auth verification, session `me`, logout.
- `GET/POST/PUT/DELETE /api/resumes/*`: Resume profiles CRUD.
- `POST /api/compile`: LaTeX compilation proxy to `latexonline.cc` streaming binary PDF.
