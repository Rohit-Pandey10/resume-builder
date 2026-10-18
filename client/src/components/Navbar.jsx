import React from 'react';
import {
  CaretDown,
  Check,
  Download,
  ExternalLink,
  FilePdf,
  FileText,
  FileUp,
  Loader2,
  Menu,
  RotateCcw,
  UserRound,
  X,
} from './icons';
import { Button, MenuDivider, MenuItem, Popover } from './primitives';
import Logo from './Logo';

export default function Navbar({
  route = 'resumes',
  user,
  profiles = [],
  activeProfileId,
  onSelectProfile,
  onOpenImport,
  onLogout,
  mode = 'account',
  onOpenAuth,
  onLeaveGuest,
  onDeleteGuestData,
  onCompilePdf,
  onDownloadTex,
  onOpenOverleaf,
  onDownloadPdf,
  hasCompiledPdf = false,
  isCompiling = false,
  compileElapsedSeconds = 0,
  isPdfOutOfDate = false,
  onOpenMobileMenu,
  onGoDashboard,
}) {
  const isGuest = mode === 'guest';
  const isLoggedIn = Boolean(user || isGuest);
  const isEditor = route === 'edit';
  const isLanding = route === 'landing';
  const isNewVisitor = isLanding && !isLoggedIn;

  const compileTooltip = 'Compiles your resume to PDF. Sends your resume text to a third-party LaTeX service.';
  const compileLabel = hasCompiledPdf ? 'Recompile' : 'Compile PDF';
  const compileVariant = (!hasCompiledPdf || isPdfOutOfDate) ? 'accent-outline' : 'secondary';

  const buildHref = activeProfileId ? `#/edit/${encodeURIComponent(activeProfileId)}` : undefined;

  return (
    <header className="jr-topbar">
      {/* LEFT: Hamburger (<1024px, unless new visitor on landing), Logo, Primary Nav (>=1024px) */}
      <div className="jr-topbar-left">
        {!isNewVisitor && (
          <button
            type="button"
            className="jr-topbar-menu-button"
            onClick={onOpenMobileMenu}
            aria-label="Open navigation drawer"
          >
            <Menu size={20} />
          </button>
        )}

        <a
          href="#/"
          className="jr-topbar-brand"
          onClick={(e) => {
            if (isLanding) {
              e.preventDefault();
            }
          }}
          aria-label="JakeResume home"
        >
          {/* Below 768px show mark only, >=768px show mark + wordmark */}
          <Logo size={32} className="jr-topbar-logo" />
        </a>

        {/* Primary nav: >=1024px, visible for returning guests, signed-in users, dashboard, editor */}
        {!isNewVisitor && (
          <nav className="jr-primary-nav" aria-label="Primary navigation">
            <a
              href="#/"
              className={`jr-nav-link${isLanding ? ' is-active' : ''}`}
              aria-current={isLanding ? 'page' : undefined}
            >
              Home
            </a>
            <a
              href="#/resumes"
              className={`jr-nav-link${route === 'resumes' ? ' is-active' : ''}`}
              aria-current={route === 'resumes' ? 'page' : undefined}
              onClick={(e) => {
                if (onGoDashboard && route !== 'resumes') {
                  e.preventDefault();
                  onGoDashboard();
                }
              }}
            >
              Resumes
            </a>
            {buildHref ? (
              <a
                href={buildHref}
                className={`jr-nav-link${isEditor ? ' is-active' : ''}`}
                aria-current={isEditor ? 'page' : undefined}
              >
                Build
              </a>
            ) : (
              <button
                type="button"
                disabled
                title="Create a resume first"
                className="jr-nav-link is-disabled"
                aria-disabled="true"
              >
                Build
              </button>
            )}
          </nav>
        )}
      </div>

      {/* RIGHT SIDE */}
      <div className="jr-topbar-right">
        {/* LANDING FOR NEW VISITORS: Privacy link + "Sign in" secondary button only */}
        {isNewVisitor ? (
          <div className="jr-landing-topbar-actions">
            <a className="jr-landing-privacy" href="/privacy.html">Privacy</a>
            <Button
              variant="secondary"
              size="md"
              className="jr-landing-signin-btn"
              onClick={() => onOpenAuth?.('Sign in')}
            >
              Sign in
            </Button>
          </div>
        ) : (
          <>
            {/* EDITOR CONTROLS: Import resume, Compile PDF, Export (8px gaps) */}
            {isEditor && (
              <div className="jr-topbar-editor-actions">
                {/* 1. Import resume (secondary) */}
                <Button
                  variant="secondary"
                  size="md"
                  className="jr-topbar-btn-import"
                  onClick={onOpenImport}
                  title="Import resume"
                  aria-label="Import resume"
                >
                  <FileUp size={17} />
                  <span className="jr-btn-label">Import resume</span>
                </Button>

                {/* 2. Compile PDF / Recompile (accent-outline if no PDF / out of date, secondary if up to date) */}
                <Button
                  variant={compileVariant}
                  size="md"
                  className={`jr-topbar-btn-compile${isCompiling ? ' is-busy' : ''}`}
                  onClick={onCompilePdf}
                  disabled={isCompiling}
                  aria-busy={isCompiling}
                  title={compileTooltip}
                  aria-label={isCompiling ? `Compiling… ${compileElapsedSeconds}s` : compileLabel}
                >
                  {isCompiling ? (
                    <>
                      <Loader2 size={16} className="animate-spin flex-shrink-0" />
                      <span className="jr-compile-busy-text">Compiling... {compileElapsedSeconds}s</span>
                    </>
                  ) : (
                    <>
                      <FilePdf size={18} className="flex-shrink-0" />
                      <span className="jr-btn-label">{compileLabel}</span>
                    </>
                  )}
                </Button>

                {/* 3. Export (dark) with 3 rows popover */}
                <Popover
                  align="end"
                  width={216}
                  trigger={
                    <Button
                      variant="dark"
                      size="md"
                      className="jr-topbar-btn-export"
                      aria-label="Export options"
                    >
                      <Download size={17} />
                      <span className="jr-btn-label">Export</span>
                      <CaretDown size={15} className="jr-export-caret" />
                    </Button>
                  }
                >
                  <div className="jr-topbar-export-menu" role="menu">
                    <span
                      title={!hasCompiledPdf ? 'Compiles first if needed' : undefined}
                      className="block w-full"
                    >
                      <MenuItem
                        icon={isCompiling ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                        disabled={!hasCompiledPdf || isCompiling}
                        onClick={onDownloadPdf}
                      >
                        Download PDF
                      </MenuItem>
                    </span>
                    <MenuItem icon={<FileText size={16} />} onClick={onDownloadTex}>
                      Download .tex
                    </MenuItem>
                    <MenuItem icon={<ExternalLink size={16} />} onClick={onOpenOverleaf}>
                      Open in Overleaf
                    </MenuItem>
                  </div>
                </Popover>
              </div>
            )}

            {/* AVATAR MENU (with Guest pill beside it at >=768px, inside menu header below 768px) */}
            <Popover
              align="end"
              width={240}
              trigger={
                <div className="jr-account-trigger">
                  {isGuest && <span className="jr-guest-pill jr-guest-pill-desktop">Guest</span>}
                  <button
                    type="button"
                    className="jr-avatar"
                    title={isGuest ? 'Guest menu' : (user?.email || 'Account menu')}
                    aria-label={isGuest ? 'Guest menu' : 'Account menu'}
                  >
                    {isGuest ? <UserRound size={17} /> : (user?.email?.[0] || 'U').toUpperCase()}
                  </button>
                </div>
              }
            >
              <div className="jr-account-menu" role="menu">
                <div className="jr-account-summary">
                  <div className="jr-account-header-row">
                    <span>{isGuest ? 'Guest' : 'Signed in as'}</span>
                    {isGuest && <span className="jr-guest-pill jr-guest-pill-mobile">Guest</span>}
                  </div>
                  <strong>{isGuest ? 'Saved in this browser only' : user?.email}</strong>
                </div>

                {!isGuest && (
                  <>
                    <div className="jr-topbar-menu-label">Switch resume</div>
                    {profiles.map((profile) => (
                      <MenuItem
                        key={profile._id}
                        icon={profile._id === activeProfileId ? <Check size={16} /> : <FileText size={16} />}
                        active={profile._id === activeProfileId}
                        onClick={() => onSelectProfile?.(profile._id)}
                      >
                        {profile.profileName}
                      </MenuItem>
                    ))}
                  </>
                )}

                <MenuDivider />

                {isGuest ? (
                  <>
                    <MenuItem icon={<UserRound size={16} />} onClick={() => onOpenAuth?.('Sign in with Google')}>
                      Sign in with Google
                    </MenuItem>
                    <MenuItem icon={<X size={16} />} onClick={onLeaveGuest}>
                      Leave guest mode
                    </MenuItem>
                    <MenuItem icon={<RotateCcw size={16} />} danger onClick={onDeleteGuestData}>
                      Delete data on this device
                    </MenuItem>
                  </>
                ) : (
                  <MenuItem icon={<X size={16} />} onClick={onLogout}>
                    Sign out
                  </MenuItem>
                )}
              </div>
            </Popover>
          </>
        )}
      </div>
    </header>
  );
}
