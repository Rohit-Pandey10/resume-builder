# DESIGN SPEC (source of truth for the UI redesign)

## 0. Working rules (apply to EVERY task that references this file)
- Presentation layer only: no changes to data models, API shapes, auth logic, stores,
  generated LaTeX, compile pipeline or undo/redo logic. New UI state (route, active step,
  last-saved time) is allowed. If a design needs a logic change, stop and report it.
- No new dependencies except @phosphor-icons/react if not already installed. No router
  library (use hash routing), no animation library, no UI kit, no CSS-in-JS.
- No raster images, stock photos or remote assets. Decorative art is inline SVG/CSS only.
- The CSP must keep working: fonts only from the Google Fonts hosts already allowed; no
  new hosts.
- Test policy:
  - While implementing, run NO test commands: no npm test, no e2e or Playwright suites, no
    lint, no build, no dev server. Work through all numbered items with file reads and edits
    only. Do not re-read files you just edited; batch edits per file.
  - When every item is implemented, do ONE verification pass, in this order: (1) npm run lint,
    (2) npm run build, (3) npm test, once, (4) one Playwright script (not committed) that
    captures the screenshots and performs the checks listed under VERIFY in a single run.
  - If something fails: fix it, then rerun only the failing command or test file, at most once.
    Anything still failing is NOT DONE with the error line. Do not chase failures in tests that
    are unrelated to files you touched; just report them.
  - Update selectors and labels in existing tests that your changes moved, while editing, but do
    not run them until the verification pass. Do not write new test files.
  - Never loosen an assertion to pass.
- Never print or quote secrets. Do not leave dev servers running. Commit after each
  numbered item.
- Finish every task with a checklist: each item DONE / NOT DONE / NOT RUN with evidence
  (file and how verified), plus lint, build and test results and the requested screenshots.

## 1. Truthful content (hard rule)
Only show things the app really does. Do NOT carry over these mockup elements: nav links
(Features, Templates, Pricing, Resources); rail items Templates, Design, Suggestions,
Settings; the notification bell; "Free plan", "No credit card required", "ATS-friendly",
"Trusted by job seekers", "modern templates", "expert guidance", "real-time feedback";
Professional summary or title fields; date pickers; "I currently work here"; character
counters; a "Template" tab; any quality score. Never use the words free, ATS, AI-powered, real-time, "Live preview" or reimagined. No fake logos, testimonials, ratings or user counts.
Approved copy (use exactly):
- Hero title: "Build a resume that gets noticed"
- Hero subline: "Fill in your details section by section, preview the PDF, and export when
  you're ready."
- Guest caption: "Guest resumes are saved in this browser only."
- Feature tiles: ("Jake's Resume format", "A clean, single-column LaTeX layout."),
  ("Import your resume", "Paste AI-extracted JSON to fill every section."),
  ("Export your way", "PDF, .tex or Overleaf.")
- Annotation: "Turn your experience into opportunity"
- Dashboard: title "Your resumes"; buttons "Create new resume" and "Import resume";
  create card title "Create your next opportunity", text "Start a new resume for a
  different role or industry.", button "Create your resume".

## 2. Colour (CSS variables in tokens.css)
Surfaces: --bg-app #FBF7F3 (warm cream page); --bg-canvas #F3EEE8 (behind the paper
preview, hover wash); --surface #FFFFFF; --surface-sunken #F8F3EE; --border #ECE6DE;
--border-strong #DCD4C9.
Text: --ink-900 #1B2236 (headings, dark buttons); --ink-600 #5A6275 (secondary);
--ink-500 #5F677B (muted, placeholders).
Accent (single hue, coral): --accent #CC4727 (filled buttons, white text);
--accent-hover #B93F21; --accent-pressed #A5381C; --accent-ink #B93F21 (accent text on
white/cream); --coral-500 #E5603C (decoration only: large display text, rings, swoosh,
sparkles); --accent-tint #FFF1EB; --accent-tint-border #F9D3C4.
Dark button: fill --ink-900, hover #2A3350, pressed #141A2B, white text.
Decorative tints (thumbnails, feature tiles, landing shapes ONLY; never for state):
lavender bg #EEEAFB / ink #5A48C3; mint bg #DFF2EA / ink #247156; peach bg #FDE9DF /
ink #A83A20.
Semantic: success #2A7450 on #EAF6EF; warning #8C5C13 on #FFF6E3; danger #B3261E on
#FDECEA.
Focus: border --accent plus ring 0 0 0 3px rgba(204,71,39,.28).
Rules: one accent hue only; navy is the only dark; no gradients, glow, glassmorphism or
pure-black text.
Contrast pairs to verify (text >= 4.5:1, large text >= 3:1, icons >= 3:1): ink-900 and
ink-600 and ink-500 on surface, bg-app, bg-canvas; white on accent, accent-hover, ink-900;
accent-ink on surface, bg-app, accent-tint; coral-500 on bg-app (large only); each
semantic colour on its background; tint inks on tint backgrounds (icons).

## 3. Typography
Exactly three loaded families, one Google Fonts request (preconnect, display=swap):
https://fonts.googleapis.com/css2?family=Caveat:wght@600&family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Inter:wght@400;500;600&display=swap
(adjust the URL if Google rejects it). Inter = UI; Fraunces = display roles only, with
font-optical-sizing auto; Caveat = the single landing annotation. Code and LaTeX source use
the system monospace stack, no webfont. Fallbacks: system-ui, Georgia, cursive. Delete
every other font declaration.
Roles (size/line-height/weight/tracking):
- display-xl Fraunces 56/60/700/-0.02em (landing hero only; 40/44 below 768px)
- display-lg Fraunces 36/42/600/-0.015em (page titles)
- display-md Fraunces 28/34/600/-0.01em (editor heading, create card title)
- title Inter 16/24/600; body Inter 14/22/400; label Inter 13/18/500 (buttons 14/20/500,
  large buttons 16/24/500); caption Inter 12/16/400; annotation Caveat 24/28/600
- Wordmark: Inter 600 18px. Fraunces never appears in buttons, labels or forms.
Rules: sentence case; text-wrap balance on display text; tabular-nums on counts and
percentages; antialiased rendering.

## 4. Space, shape, depth, motion, layout
Space scale (4px base), the only allowed values: 4 8 12 16 20 24 32 40 48 64 80.
Radii: --r-sm 6 (chips, tags), --r-md 10 (buttons, inputs, menus), --r-lg 14 (cards,
thumbnails), --r-xl 20 (modals, hero shapes, landing panels), full (avatars, step circles,
rings, switches). Nothing else.
Control heights: sm 32, md 40, lg 48; icon button 36 (32 small); 44px touch targets
below 768px.
Elevation (navy-tinted, rgba(27,34,54,x)): xs 0 1px 2px .04; sm 0 1px 3px .06 + 0 1px 2px
.04; md 0 6px 16px .08 + 0 2px 4px .04; lg 0 16px 40px .12 + 0 4px 8px .05; paper
0 10px 30px .10 + 0 1px 3px .08. Cards at rest = border + sm. Never a strong border and a
strong shadow together.
Layout: top bar 64px; left rail 80px; card padding 24 (16 below 480px); gap between cards
20; landing container max-width 1200; page side padding 24 (16 on mobile).
Motion: --ease-out cubic-bezier(.2,.8,.2,1); durations 120 / 180 / 240ms. Allowed: hover,
press, focus, overlays, accordions, 150ms route fade, a one-time 600ms ring draw, a
one-time hero fade-up with 40ms stagger. Animate only transform, opacity, background,
border-color, box-shadow, stroke-dashoffset. No `transition: all`, no bounce, no looping
animation except spinner, skeleton shimmer and the saving dot. prefers-reduced-motion
disables everything.

## 5. Icons
@phosphor-icons/react, imported ONLY through src/components/icons.jsx with semantic names
(use the installed version's real export names; e.g. SquaresFour, PencilSimpleLine,
UploadSimple, DownloadSimple, FileText, Plus, CaretDown, ArrowRight, Check, Eye, EyeSlash,
ArrowUUpLeft, ArrowUUpRight, DotsThree, Trash, Warning, X, MagnifyingGlassPlus,
MagnifyingGlassMinus, ArrowsClockwise, Code, FilePdf, User, GraduationCap, Briefcase,
FolderSimple, Wrench, Stack). Weights: regular for UI; duotone ONLY inside 44px feature
tiles and empty-state tiles; fill for the active rail item. Sizes: 16 (inline, buttons,
menus), 18 (icon buttons), 20 (rail), 24 (feature tiles), 32 (empty-state tile); no other
sizes. Colour: currentColor; ink-500 default, ink-900 on hover, accent-ink when active.
Icon tile: 44px (36 inside cards), r-md, tint background with the tint ink. No emoji. No
icons inside text inputs.

## 6. Components (implement once in primitives; remove ad hoc styling)
- Button: primary (accent fill, white text, inset 0 1px 0 rgba(255,255,255,.16) + xs
  shadow; hover accent-hover + sm; active translateY(1px)); dark (ink-900 fill; ONLY for
  Export and "Create your resume"); secondary (white, 1px border-strong, xs shadow; hover
  surface-sunken); ghost. Sizes sm/md/lg. Loading shows a spinner without changing width,
  aria-busy. Disabled opacity .5 with no shadow. Visible focus ring.
- Input/Textarea/Select: 40px, r-md, 1px border-strong, surface fill, placeholder ink-500,
  hover surface-sunken, focus accent border + ring, error danger border + message with
  icon (role="alert"). Label above (13/500 ink-900), helper 12 ink-500. Textarea min 96,
  vertical resize.
- Card: surface, 1px border, r-lg, shadow-sm, padding 24. Interactive variant: hover md
  shadow + translateY(-1px), focus ring. Header pattern: title + caption left, slot right
  (icon tile or switch).
- Segmented control: container bg-canvas, r-md, padding 4; segments 32px, r-sm; active =
  white + xs shadow + ink-900; inactive ink-600; aria-selected.
- Switch 36x20 (accent when on). Chip/badge: r-sm, 24px, caption. Menu/popover: surface,
  border, r-md, md shadow, 36px items. Modal: r-xl, lg shadow, overlay rgba(27,34,54,.40),
  no blur. Toast: border + md shadow, status icon left, ghost accent Undo. Avatar: 36px
  circle, accent-tint bg, accent-ink letter 600. Thin warm scrollbars; selection colour
  accent-tint-border.

## 7. Brand, head, routing
- Logo mark: Single mark everywhere: a coral (#CC4727) rounded square (corner radius 22% of size) containing a white page glyph with a folded top-right corner (~46% of width, centred) and two short horizontal coral lines inside the page (the second shorter). Flat: no gradient, no shadow. Source in client/src/brand/mark.svg (viewBox 0 0 64 64). Rendered via <Logo> component (mark + "JakeResume" wordmark, Inter 600 18px, and mark-only variant) inlining mark.svg via Vite ?raw import. Header mark size: 32px.
- Favicons and brand assets (client/public/): favicon.svg, favicon.ico (16/32/48 multi-frame PNG-in-ICO container), apple-touch-icon.png 180x180 (tile fills canvas, no transparency), icon-192.png, icon-512.png, og-image.jpg 1200x690, site.webmanifest. Script scripts/generate-brand-assets.mjs renders PNGs and writes the pure ICO container without new dependencies.
- Head (client/index.html): <html lang="en">, charset, viewport, title "JakeResume - Build a resume in the Jake's Resume format", meta description (<=155 chars), application-name / apple-mobile-web-app-title "JakeResume", theme-color #FBF7F3, color-scheme light, icon links, Open Graph & Twitter meta tags, <noscript> message "JakeResume needs JavaScript to run." Absolute URL tags (canonical, og:url, absolute og:image/twitter:image) emitted strictly when VITE_SITE_URL is set at build time via transformIndexHtml plugin in vite.config.js; no literal %VITE_SITE_URL% remains in dist/index.html.
- Route titles: Landing "JakeResume - Build a resume in the Jake's Resume format", Dashboard "JakeResume - Your resumes", Editor "JakeResume - {resume title}" ("JakeResume - Untitled resume" if empty), Privacy "JakeResume - Privacy". Focus moves to page h1 on route change.
- Routing entry flow: Bare URL and "#/" always render landing. Unset hash replaces to "#/". Deep links (#/resumes, #/edit/<id>) gate on valid session or guest mode; unauthenticated links redirect to "#/". No restoring last route on startup. Active session/guest changes landing hero actions to "Open your resumes" primary lg button with caption and top-bar "Your resumes" button; auth-loading state renders skeleton of equal height without layout shift. Sign-out, leave guest, delete guest data return to "#/".

## 8. Navigation and shell
The left rail is removed and global navigation lives in the top bar; Compile PDF is a top-level button; the phrases "Live preview", "real-time" and "realtime" are banned.
