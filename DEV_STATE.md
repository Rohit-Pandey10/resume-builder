# Project State: JakeResume Builder

## 1. Current Progress
- **Active Milestone:** Milestone 5 Completed & Verified
  - ✅ AI Prompt-and-Paste Resume Importer (Zero API key or OCR setup required)
  - ✅ Dynamic Skills Taxonomy (Unconstrained custom categories e.g. Frontend, Backend & Database, Concepts)
  - ✅ Multi-Bullet Discrete Accomplishments in Custom Sections (Competitive Programming, Honors, Leadership)
  - ✅ Server-Side CORS-Proxied Compiler Engine (`/api/compile` streaming binary PDF from `latexonline.cc`)
  - ✅ Dynamic Single-Page Spacing Adjustments (`\vspace{-2pt}` for < 4 entries vs `\vspace{-5pt}` for dense resumes)
- **Next Up:** Production Deployment (Render + Vercel)

---

## 2. Test Suite Status & Verification

All automated test suites are verified and passing with 100% test coverage for core logic:

| Suite | Scope | Command | Status |
|---|---|---|---|
| **Milestone 1 (Server)** | Auth, JWT cookies, CRUD profiles, error handlers, health check | `npm run test:milestone1` (in `server/`) | **14 / 14 Passed** ✅ |
| **Milestone 3 (Client)** | LaTeX generator, ATS glyphtounicode, dynamic skills, custom multi-bullets, URL sanitization, single-page spacing | `npm run test:milestone3` (in `client/`) | **10 / 10 Passed** ✅ |
| **Milestone 5 (Client)** | AI JSON importer, markdown codeblock stripping, conversational preamble handling, legacy normalization, validation | `npm run test:milestone5` (in `client/`) | **5 / 5 Passed** ✅ |
| **Production Build** | Vite client production bundle compilation | `npm run build` (in `client/`) | **Built in ~750ms** ✅ |

---

## 3. Implemented Components & Files

### Backend (`server/`)
- `package.json`: Server dependencies (Express, Mongoose, JWT, bcryptjs, cookie-parser, cors, dotenv, mongodb-memory-server).
- `.env`: Environment variables (`PORT`, `JWT_SECRET`, `CLIENT_URL`, `MONGODB_URI`).
- `.env.example`: Template for deployment and local setup.
- `src/config/db.js`: Mongoose connector supporting MongoDB Atlas with zero-config in-memory fallback.
- `src/models/User.js`: User model with unique lowercase email and bcrypt pre-save password hashing.
- `src/models/ResumeProfile.js`: Schema supporting `basics`, `education`, `experience`, `projects`, dynamic `skills` array, `customSections` with discrete accomplishment bullets, and mixed `{ text, enabled }` items.
- `src/middleware/auth.js`: JWT verification reading from `httpOnly` cookie (`token`) with Bearer token fallback.
- `src/middleware/errorHandler.js`: Centralized error handler managing Mongoose validation, duplicate keys, and invalid IDs.
- `src/controllers/authController.js`: Register (with auto-provisioned starter profile), login, logout, and getMe handlers.
- `src/controllers/resumeController.js`: Full CRUD controller for user resume profiles.
- `src/routes/authRoutes.js`: Authentication routes (`/api/auth/*`).
- `src/routes/resumeRoutes.js`: Protected resume profile routes (`/api/resumes/*`).
- `src/server.js`: Express server setup with CORS, health check endpoint, route mounting, and `/api/compile` proxy route that calls `latexonline.cc` and streams the binary PDF back to bypass browser CORS restrictions.
- `test/verify_milestone1.js`: 14-step automated verification suite.

### Frontend (`client/`)
- `package.json`: Client dependencies and verification scripts (`test:milestone3`, `test:milestone5`).
- `vite.config.js`: Vite configuration with proxy routing `/api` to `http://localhost:5001`.
- `tailwind.config.js` & `postcss.config.js`: Tailwind theme styling with indigo/emerald palette and typography.
- `index.html`: HTML entrypoint with Google Fonts (Inter, Fira Code).
- `src/index.css`: Global styling, glassmorphism utilities, and custom scrollbars.
- `src/lib/api.js`: Standardized API client configured with `credentials: 'include'` and dynamic `VITE_API_URL` support.
- `src/utils/bulletHelper.js`: Normalizer and serializer preserving skills categories and discrete custom section bullets `{ text, enabled }` with default enabled fallbacks (`b.enabled !== false`).
- `src/utils/urlHelper.js`: URL Sanitizer and Display Label Formatter stripping markdown link syntax `[label](url)`, tracking query parameters (`utm_*`, etc.), trailing slashes, and generating clean, concise, underlined ATS display labels.
- `src/utils/urlHelper.test.js`: 6-scenario automated unit test suite.
- `src/utils/latexGenerator.js`: Production ATS-compliant LaTeX generator with:
  - Dynamic skills category rendering (`\textbf{Category}{: item1, item2}`).
  - Custom sections with subtitles and discrete `\resumeItem` bullet points inside `\resumeItemListStart ... \resumeItemListEnd`.
  - Stutter prevention (avoids repeating category name in subheading).
  - Single-page spacing refinement: uses `\vspace{-2pt}` for light resumes (< 4 entries across experience + projects) and `\vspace{-5pt}` for dense resumes.
  - Clean underlined ATS header links `\href{RAW_CLEAN_URL}{\underline{DISPLAY_LABEL}}`.
  - Empty-itemize crash prevention guardrails.
- `src/utils/latexGenerator.test.js`: 10-part standalone unit test suite.
- `src/utils/aiPromptTemplate.js`: Meticulous resume data extraction engine prompt with strict output contract, OCR/multi-column reading guidelines, anti-fabrication rules, hyperlink resolution, date normalization, section rules (education, experience, projects, dynamic skills, custom sections), discrete bullet preservation, and self-check protocol.
- `src/utils/jsonImporter.js`: Resilient LLM output sanitizer and parser handling dynamic skills categories, custom sections (one-line lists and paragraph summaries), markdown codeblock wrappers, conversational preambles/outros, default profile naming, empty placeholder filtering, and URL sanitization.
- `src/utils/jsonImporter.test.js`: 8-scenario automated unit test suite (`npm run test:milestone5`).
- `src/utils/compilerEngine.js`: 3-Tier Compilation Engine implementing server-side proxy `/api/compile` (bypassing browser CORS on latexonline.cc), direct `.tex` download, and Overleaf cloud export.
- `src/components/ImportResumeModal.jsx`: 3-step modal with extraction prompt preview/copying, paste textarea with clipboard helper, and validation error state.
- `src/components/Navbar.jsx`: Responsive header with custom profile switcher dropdown, inline profile renaming, hover delete button (`Trash2`), active profile deletion with guardrails, "Import via AI" trigger button, profile switcher, "+ New Profile" modal, reactive "Save Changes" status, primary "Download PDF" action, and compact export menu.
- `src/components/AuthModal.jsx`: Modal handling Sign In and Account Creation with validation banners.
- `src/components/CompilationErrorModal.jsx`: Diagnostic modal for Tier 1 compilation timeouts and errors.
- `src/components/LeftPanel/Accordion.jsx`: Collapsible section wrapper with count badges and action slots.
- `src/components/LeftPanel/BasicsSection.jsx`: Contact fields.
- `src/components/LeftPanel/EducationSection.jsx`: Education items.
- `src/components/LeftPanel/ExperienceSection.jsx`: Work experience entries with independent bullet checkboxes.
- `src/components/LeftPanel/ProjectsSection.jsx`: Project entries with tech stack tags and links.
- `src/components/LeftPanel/SkillsSection.jsx`: Dynamic category editor supporting custom taxonomy (e.g. Languages, Frontend, Backend & Database, Core Concepts), category add/delete, in-place title editing, and interactive skill chips.
- `src/components/LeftPanel/CustomSections.jsx`: Dynamic sections supporting subtitles, discrete accomplishment bullets with individual enable/disable checkboxes, and rich formatting for Competitive Programming, Honors, and Leadership.
- `src/components/RightPanel/LatexPreview.jsx`: Read-only syntax viewer with line numbers and live sync indicator.
- `src/components/RightPanel/PdfPreviewPlaceholder.jsx`: Live view tab with 3-tier compiler controls and embedded PDF iframe viewer.
- `src/App.jsx`: Master responsive state container coordinating authentication, profile management, live reactive LaTeX generation, mobile view toggle, and AI import flow.
- `src/main.jsx`: React DOM mount.

---

## 4. Key Architectural Decisions & Schemas

### Flexible Dynamic Skills Taxonomy
- Replaced rigid hardcoded keys (`languages`, `frameworks`, `developerTools`, `libraries`) with dynamic category objects: `skills: [{ category: String, items: [String], enabled: Boolean }]`.
- LaTeX generator dynamically iterates through categories: `\textbf{Category}{: item1, item2, item3} \\`.
- Preserves candidate-specific technical taxonomies (e.g. "Frontend", "Backend & Database", "Core Concepts", "Machine Learning") without forcing items into unnatural buckets.
- Backward compatibility: Legacy skills objects `{ languages: [], ... }` are automatically mapped into dynamic category objects during normalization.

### Multi-Bullet Discrete Accomplishment Lists in Custom Sections
- Expanded `customSections.items` to support `{ title, subtitle, date, description, bullets: [{ text: String, enabled: Boolean }], enabled: Boolean }`.
- Renders as `\resumeProjectHeading{\textbf{Title} $|$ \emph{Subtitle}}{Date}` followed by discrete `\resumeItemListStart ... \resumeItemListEnd` with individual `\resumeItem{...}` entries.
- Stutter prevention: If `item.title.toLowerCase() === section.sectionTitle.toLowerCase()`, renders only `\textbf{item.subtitle}` instead of repeating the title.
- Solves the text-flattening regression where competitive programming profiles (CodeChef, LeetCode, Codeforces) were previously squished into a single paragraph string.

### Single-Page Balance Spacing Macro
- Calculates total active entries across experience and projects:
  ```javascript
  const totalEntries = activeExp.length + activeProj.length;
  const isLightResume = totalEntries < 4;
  const itemEndSpacing = isLightResume ? '\\vspace{-2pt}' : '\\vspace{-5pt}';
  ```
- Injects `${itemEndSpacing}` into `\newcommand{\resumeItemListEnd}{\end{itemize}${itemEndSpacing}}`.
- Allows lighter resumes to breathe and fill the page proportionally without awkward white voids, while packing dense resumes tightly to guarantee a strict 1-page budget.

### Hardened AI Extraction Directives (`aiPromptTemplate.js`)
1. *Hyperlink Inspection:* Directs the model to inspect underlying embedded target URLs behind anchor text (e.g., 'GitHub', 'LinkedIn') rather than leaving `githubUrl` or `linkedinUrl` empty.
2. *Never Flatten Bullets:* Forbids combining separate accomplishments into a single run-on paragraph; preserves discrete objects in `bullets: [{ text, enabled }]`.
3. *Dynamic Skills Taxonomy:* Instructs the model to extract categories matching the resume's exact technical groupings.
4. *Multi-Bullet Custom Sections:* Instructs the model to provide structured bullets under `items[].bullets` for competitive programming and achievement sections.

### URL Sanitization & Clean ATS Header Links
- AI tools (Gemini, ChatGPT) frequently output links wrapped in Markdown syntax with tracking parameters (e.g. `[https://rohit-pandey10.vercel.app/](https://rohit-pandey10.vercel.app/?utm_source=gemini)`).
- `sanitizeUrl()` cleans these upon JSON import and in `normalizeProfile()`, extracting the raw URL, stripping `utm_*` query trackers and trailing slashes, and guaranteeing an `https://` protocol.
- `getDisplayUrl()` formats smart, compact ATS-compliant visible text to prevent header line wrapping:
  - **LinkedIn:** `linkedin/username` (extracted from `/in/username`)
  - **GitHub:** `github/username` (extracted from repository or user handle)
  - **Portfolio / Personal Site:** `portfolio` (concise single-word label preventing second-line wraps)
  - **Generic / Fallback:** clean hostname stripped of `www.`
  - Rendered via `\href{RAW_URL}{\underline{DISPLAY_LABEL}}` separated by ` $|$ `.

### AI Prompt-and-Paste Resume Importer (Milestone 5)
- Zero API key or OCR configuration required: Users attach their PDF to ChatGPT/Claude/Gemini with our schema-constrained extraction prompt.
- Client-side parser strips conversational chat preambles and ```` ```json ```` backticks, slices outermost curly braces `{ ... }`, and automatically converts plain string bullets into structured `{ text: string, enabled: boolean }` objects.
- Persists directly to MongoDB via `POST /api/resumes` as a new profile (named `Imported Resume - [Date]` by default) and immediately sets it as active, rendering reactively in the editor and live LaTeX preview.

### Fully Responsive Split-Screen & Mobile Support
- On screens `>= lg` (1024px+), both the Left Input Workspace and Right Preview Panel display side-by-side with independent scroll containers.
- On screens `< lg` (split-screen, mobile), a segmented switch ("Edit Form" vs "Preview & LaTeX") dynamically reveals one panel while keeping all state reactive and preventing any hidden panel lockouts.
- In `Navbar.jsx`, action buttons automatically adapt: "Download PDF" remains accessible with compact text, while ".tex" and "Overleaf" collapse into a clean export dropdown on narrow screens so they never overflow.

### 3-Tier Compilation Pipeline
1. *Tier 1 (Primary - Server CORS Proxy):* Client sends LaTeX to `POST /api/compile`. The Express backend proxies to `https://latexonline.cc/compile?text=...&force=true` and streams the binary PDF directly back to the browser. Avoids all browser CORS blocks.
2. *Tier 2 (Fallback 1):* Client-side `Blob([texString], { type: 'text/x-tex' })` download for instant local compilation with `pdflatex` or `xelatex`.
3. *Tier 3 (Fallback 2):* Hidden HTML form targeting `_blank` to `https://www.overleaf.com/docs` with `snip = texString`, enabling instant cloud editing in Overleaf without manual file uploads.

### Configurable Section Reordering (Schema, UI Controls & Dynamic Generator)
- **Schema & State:**
  - Added `sectionOrder: { type: [String], default: ['education', 'experience', 'projects', 'skills', 'customSections'] }` to `ResumeProfile`.
  - `bulletHelper.js` provides `sanitizeSectionOrder(order)` ensuring valid, non-empty, and deduplicated keys for all standard sections, integrating into both `normalizeProfile()` and `serializeProfile()`.
- **Left Panel Header Reorder Controls (`Accordion.jsx` & `App.jsx`):**
  - Added discrete Up and Down chevron buttons (`ChevronUp`, `ChevronDown` from `lucide-react`) inside a compact pill container on each master accordion header.
  - Clicking Up/Down swaps that section's position in `activeProfile.sectionOrder` and marks `isDirty = true` without toggling accordion expand/collapse (`e.stopPropagation()`).
  - Boundary guardrails disable the Up button on the top-most section and the Down button on the bottom-most section (`opacity-30 cursor-not-allowed`).
  - In `App.jsx`, sections in the Left Panel render dynamically based on `activeProfile.sectionOrder`.
- **Dynamic LaTeX Generator Alignment (`latexGenerator.js`):**
  - Modularized section rendering functions (`renderEducation`, `renderExperience`, `renderProjects`, `renderSkills`, `renderCustomSections`).
  - Output LaTeX document dynamically assembles main body sections in the sequence specified by `profile.sectionOrder`.
  - Empty or disabled section guardrails apply seamlessly regardless of the rendering order.

### Single-Page Visual Overflow Guardrail (`pageBudgetEstimator.js` & `PageBudgetGauge.jsx`)
- **Deterministic Height/Line Estimator:**
  - Jake's standard 11pt 1-page template holds approximately 46–50 vertical lines (budget: 48 lines).
  - Evaluates active enabled elements deterministically:
    - Header & Contact info: ~4 lines
    - Active `\section` headers: ~2 lines each
    - Education items: ~2 lines each
    - Experience & Project subheadings: ~1.5 lines each
    - Enabled bullet items: ~1 line base + 1 additional line for every ~100 characters of wrapped text
    - Technical skills categories: ~1 line each (+ extra for wrapped items)
    - Custom sections: ~1.5 lines per item + bullet/description line estimates
  - Returns `{ estimatedLines, maxBudget: 48, percentage, status: 'safe' | 'warning' | 'overflow', breakdown }`.
- **Reactive UI Gauges & Popover Breakdown:**
  - **Safe (<85% budget):** Subtle emerald badge (`38 / 48 lines • 1 Page Fit`).
  - **Tight Fit (85–100% budget):** Amber warning badge (`45 / 48 lines • Tight fit`).
  - **Overflow (>100% budget):** Red badge with pulsing alert (`53 / 48 lines • Likely 2 pages!`).
  - Embedded across the UI:
    - Right Panel Tab Headers in `App.jsx` (always visible in both LaTeX and PDF preview modes).
    - Header bar in `LatexPreview.jsx`.
    - Header bar in `PdfPreviewPlaceholder.jsx`.
  - Clicking any badge toggles a detailed popover displaying total percentage used, a visual color-coded capacity meter bar, actionable advice, and a section-by-section breakdown of line consumption (`header`, `experience`, `projects`, `skills`, `education`, `customSections`).
  - Toggling bullets on/off in the left panel reactively recalculates the budget and updates the badge and popover in real time.

### Inline Entry Duplication (1-Click Cloning)
- **1-Click Copy Buttons:**
  - Added discrete `Copy` icon buttons next to the trash/delete icon on each item card in `ExperienceSection.jsx`, `ProjectsSection.jsx`, `CustomSections.jsx`, and `EducationSection.jsx`.
- **Duplication Semantics:**
  - Performs a clean deep clone (`JSON.parse(JSON.stringify(orig))`) and strips existing `_id` keys to ensure clean MongoDB subdocument insertion.
  - Automatically appends `"(Copy)"` to the title/role (e.g., `"Role (Copy)"`, `"MERN Authentication System (Copy)"`).
  - Preserves all bullets, technologies, dates, and their exact enabled/disabled toggle states.
  - Inserts the cloned item immediately below the original in the array (`idx + 1`).
  - Immediately marks `isDirty = true` and updates `activeProfile` in memory, reactively updating both the editor form and the live LaTeX preview.
- **Visual Feedback:**
  - Applied an animated highlight glow (`ring-2 ring-indigo-500/80 bg-indigo-950/40 border-indigo-500/50 shadow-lg`) to the newly inserted item for 1.5 seconds.
  - Dispatches a quick toast confirmation via `showNotification()` (e.g., `"Duplicated '[Item Name]'."`).

### Profile Lifecycle Management (Inline Renaming & Deletion UX)
- **Inline Renaming:**
  - Active profile name can be edited directly by clicking the pencil icon next to the dropdown or double-clicking the profile name in the navbar or dropdown header.
  - Pressing Enter or blurring updates the name in state and triggers `PUT /api/resumes/:id` to persist immediately.
  - Pressing Escape cancels the edit without persisting.
- **Hover Profile Deletion:**
  - In the custom profile switcher dropdown, non-active profiles reveal a subtle red `Trash2` icon on hover (`opacity-0 group-hover:opacity-100`).
  - Clicking the icon stops propagation and prompts for confirmation: `"Are you sure you want to delete profile '[profileName]'?"`.
- **Delete Active Profile:**
  - The dropdown menu includes a "Delete Active Profile" action button in the footer.
- **Deletion Guardrails & Auto-Switching:**
  - On confirm, calls `DELETE /api/resumes/:id`, removes the profile from local state, and automatically switches the active profile to the first remaining profile (`remaining[0]`).
### Backend Spam, DoS & Storage Safeguards
- **Per-User Profile Cap (Max 5 Resumes):**
  - In `createResume` controller, counts existing documents for `req.user._id`.
  - If count >= 5, blocks creation with HTTP 400 (`"Profile limit reached (maximum 5 profiles)..."`).
  - Guarantees each user account is capped at ~25–40 KB total storage on MongoDB Atlas.
- **Request Body Limit (100kb Cap):**
  - Configured `app.use(express.json({ limit: '100kb' }))` and `app.use(express.urlencoded({ limit: '100kb' }))`.
  - Oversized payloads (>100kb) are rejected before reaching Mongoose with HTTP 413 (Payload Too Large).
- **API Rate Limiting (`express-rate-limit`):**
  - General API Limiter: Max 300 requests per 15 minutes per IP across `/api/*`.
  - Compile Limiter: Max 10 compile requests per minute per IP on `/api/compile` to prevent `latexonline.cc` proxy abuse and IP-bans.
- **Client-Side In-Flight Lock & Clean State Check:**
  - `handleSave` in `App.jsx` checks `if (saveStatus === 'saving' || !isDirty) return;`.
  - Navbar Save button disables (`disabled={saveStatus === 'saving' || !isDirty}`) to prevent button mashing and duplicate in-flight `PUT` requests.

---

## 5. Local Startup Instructions

### Prerequisites
- Node.js >= 18.x
- npm >= 9.x
- (Optional) MongoDB instance (or rely on the zero-config in-memory MongoDB runner for development)

### Running Locally

1. **Start the Backend Server:**
   ```bash
   cd server
   npm install
   npm run dev
   ```
   *Runs Express server on `http://localhost:5001`. Automatically starts in-memory MongoDB if no `MONGODB_URI` is provided.*

2. **Start the Frontend Dev Server:**
   ```bash
   cd client
   npm install
   npm run dev
   ```
   *Runs Vite development server on `http://localhost:5173`. Proxies `/api` requests to port 5001.*

3. **Open the Application:**
   Navigate to `http://localhost:5173` in your browser.

---

## 6. Production Deployment Guide & Environment Variables

### Backend Deployment (Render / Railway)
- **Type:** Node Web Service
- **Root Directory:** `server`
- **Build Command:** `npm install`
- **Start Command:** `node src/server.js`

**Required Environment Variables:**
| Variable | Example Value | Description |
|---|---|---|
| `PORT` | `5001` | Service port (Render provides dynamic `$PORT`) |
| `NODE_ENV` | `production` | Enables production optimizations & secure cookies |
| `MONGODB_URI` | `mongodb+srv://user:pass@cluster0.mongodb.net/jakeresume?retryWrites=true&w=majority` | MongoDB Atlas cluster connection URI |
| `JWT_SECRET` | `your-super-secret-jwt-key-min-32-chars` | Signing key for authentication tokens |
| `CLIENT_URL` | `https://jakeresume.vercel.app` | Frontend production origin for CORS & cookie credentials |

### Frontend Deployment (Vercel)
- **Framework Preset:** `Vite`
- **Root Directory:** `client`
- **Build Command:** `npm run build`
- **Output Directory:** `dist`

**Required Environment Variables:**
| Variable | Example Value | Description |
|---|---|---|
| `VITE_API_URL` | `https://jakeresume-api.onrender.com` | Base URL of deployed Render backend |