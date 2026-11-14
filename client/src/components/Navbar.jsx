import React, { useState } from 'react';
import {
  CaretDown,
  CaretLeft,
  Check,
  Download,
  ExternalLink,
  FilePdf,
  FileText,
  FileUp,
  Loader2,
  Menu,
  Redo2,
  RotateCcw,
  Undo2,
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
  // Mobile editor props
  activeTitle = 'Untitled Resume',
  saveStatus = 'saved',
  isDirty = false,
  lastSavedAt,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onRenameProfile,
  onResetSectionOrder,
}) {
  const isGuest = mode === 'guest';
  const isLoggedIn = Boolean(user || isGuest);
  const isEditor = route === 'edit';
  const isLanding = route === 'landing';
  const isNewVisitor = isLanding && !isLoggedIn;

  const [mobileRenameOpen, setMobileRenameOpen] = useState(false);
  const [tempTitle, setTempTitle] = useState(activeTitle);

  const compileTooltip = 'Compiles your resume to PDF. Sends your resume text to a third-party LaTeX service.';
  const compileLabel = hasCompiledPdf ? 'Recompile' : 'Compile PDF';
  const compileVariant = (!hasCompiledPdf || isPdfOutOfDate) ? 'accent-outline' : 'secondary';

  const buildHref = activeProfileId ? `#/edit/${encodeURIComponent(activeProfileId)}` : undefined;

  const commitMobileRename = () => {
    const trimmed = tempTitle.trim();
    setMobileRenameOpen(false);
    if (trimmed && trimmed !== activeTitle) {
      onRenameProfile?.(activeProfileId, trimmed);
    }
  };

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

        {isEditor && (
          <button
            type="button"
            className="md:hidden flex items-center gap-0.5 px-1.5 py-1 text-xs font-medium text-[var(--ink-600)] hover:text-[var(--ink-900)] rounded flex-shrink-0"
            onClick={onGoDashboard}
            aria-label="Back to resumes"
            title="Back to resumes"
          >
            <CaretLeft size={16} />
            <span>Resumes</span>
          </button>
        )}

        <a
          href="#/"
          className={`jr-topbar-brand ${isEditor ? 'hidden sm:flex' : 'flex'}`}
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

      {/* MOBILE-ONLY EDITOR TITLE & SAVE INDICATOR (< 768px in editor) */}
      {isEditor && (
        <div className="jr-mobile-title-center md:hidden flex items-center justify-center gap-1.5 min-w-0 px-1 flex-1">
          <Popover
            align="center"
            width={260}
            open={mobileRenameOpen}
            onOpenChange={(open) => {
              setMobileRenameOpen(open);
              if (open) setTempTitle(activeTitle);
            }}
            trigger={
              <button
                type="button"
                className="jr-mobile-title-btn flex items-center gap-1 max-w-[125px] xs:max-w-[160px] py-1 px-1.5 rounded hover:bg-[var(--surface-sunken)] transition-colors"
                title={`Resume: ${activeTitle}. Tap to rename.`}
                aria-label={`Resume title: ${activeTitle}`}
              >
                <span className="truncate text-xs font-semibold text-[var(--ink-900)]">{activeTitle}</span>
                <CaretDown size={12} className="text-[var(--ink-500)] flex-shrink-0" />
              </button>
            }
          >
            <div className="p-3 flex flex-col gap-2.5">
              <label className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)]">
                Rename Resume
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={tempTitle}
                  onChange={(e) => setTempTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') commitMobileRename();
                    if (e.key === 'Escape') setMobileRenameOpen(false);
                  }}
                  autoFocus
                  className="flex-1 px-2.5 py-1.5 text-xs rounded border border-[var(--border)] bg-[var(--surface)] text-[var(--ink-900)] focus:outline-none focus:border-[var(--accent)]"
                  placeholder="Resume title"
                />
                <Button size="sm" variant="primary" onClick={commitMobileRename}>
                  Save
                </Button>
              </div>
              {onResetSectionOrder && (
                <button
                  type="button"
                  onClick={() => {
                    setMobileRenameOpen(false);
                    onResetSectionOrder?.();
                  }}
                  className="flex items-center gap-1.5 text-xs text-[var(--ink-600)] hover:text-[var(--ink-900)] pt-1"
                >
                  <RotateCcw size={13} />
                  <span>Reset section order</span>
                </button>
              )}
            </div>
          </Popover>

          {/* Autosave Status Dot */}
          <span
            className="jr-mobile-save-dot flex items-center justify-center w-3 h-3 flex-shrink-0"
            title={
              saveStatus === 'saving'
                ? 'Saving changes…'
                : saveStatus === 'not-saved'
                ? 'Not saved'
                : isDirty
                ? 'Unsaved changes'
                : 'All changes saved'
            }
          >
            {saveStatus === 'saving' ? (
              <Loader2 size={12} className="animate-spin text-[var(--accent)]" />
            ) : saveStatus === 'not-saved' ? (
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            ) : isDirty ? (
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </span>
        </div>
      )}

      {/* RIGHT SIDE */}
      <div className="jr-topbar-right">
        {/* LANDING: Privacy link + "Sign in" (or "Your resumes" for returning users) */}
        {isLanding ? (
          <div className="jr-landing-topbar-actions flex items-center gap-2">
            {isNewVisitor ? (
              <>
                <a className="jr-landing-privacy" href="/privacy.html">Privacy</a>
                <Button
                  variant="secondary"
                  size="md"
                  className="jr-landing-signin jr-landing-signin-btn"
                  onClick={() => onOpenAuth?.('Sign in')}
                >
                  Sign in
                </Button>
              </>
            ) : (
              <Button
                variant="secondary"
                size="md"
                className="jr-landing-signin jr-landing-signin-btn"
                onClick={onGoDashboard}
              >
                Your resumes
              </Button>
            )}
          </div>
        ) : (
          <>
            {/* EDITOR CONTROLS */}
            {isEditor && (
              <div className="jr-topbar-editor-actions flex items-center gap-1.5 sm:gap-2">
                {/* Mobile Undo / Redo buttons */}
                <div className="md:hidden flex items-center gap-0.5">
                  <button
                    type="button"
                    onClick={onUndo}
                    disabled={!canUndo}
                    title="Undo (⌘Z)"
                    aria-label="Undo"
                    className="w-8 h-8 flex items-center justify-center rounded text-[var(--ink-600)] disabled:opacity-25 hover:bg-[var(--surface-sunken)] active:scale-95 transition-all"
                  >
                    <Undo2 size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={onRedo}
                    disabled={!canRedo}
                    title="Redo (⌘Y)"
                    aria-label="Redo"
                    className="w-8 h-8 flex items-center justify-center rounded text-[var(--ink-600)] disabled:opacity-25 hover:bg-[var(--surface-sunken)] active:scale-95 transition-all"
                  >
                    <Redo2 size={16} />
                  </button>
                </div>

                {/* 1. Import resume (secondary, desktop) */}
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

                {/* 2. Compile PDF / Recompile (desktop) */}
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
