import React, { useEffect, useRef } from 'react';
import {
  Check,
  Download,
  ExternalLink,
  FileCode,
  FilePdf,
  FileText,
  FileUp,
  LogOut,
  Plus,
  RotateCcw,
  SquaresFour,
  UserRound,
  X,
} from './icons';
import Logo from './Logo';

export default function Drawer({
  isOpen,
  onClose,
  route = 'resumes',
  activeProfileId,
  onNavigate,
  onOpenImport,
  mode,
  user,
  onOpenAuth,
  onLeaveGuest,
  onDeleteGuestData,
  onLogout,
  profiles = [],
  onSelectProfile,
  onCreateProfile,
  onCompilePdf,
  onDownloadPdf,
  onDownloadTex,
  onOpenOverleaf,
  hasCompiledPdf = false,
  isCompiling = false,
}) {
  const drawerRef = useRef(null);
  const previousActiveElement = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    previousActiveElement.current = document.activeElement;

    // Focus first interactive element inside drawer
    const focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusable = drawerRef.current?.querySelectorAll(focusableSelector);
    if (focusable && focusable.length > 0) {
      focusable[0].focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose?.();
        return;
      }

      if (e.key === 'Tab') {
        const elements = drawerRef.current?.querySelectorAll(focusableSelector);
        if (!elements || elements.length === 0) return;
        const first = elements[0];
        const last = elements[elements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      previousActiveElement.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const isGuest = mode === 'guest';
  const hasBuildResume = Boolean(activeProfileId);

  return (
    <div
      className="jr-app-drawer-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        ref={drawerRef}
        className="jr-app-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation drawer"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="jr-app-drawer-header">
          <div className="flex items-center gap-2.5">
            <Logo size={28} />
            <span className="font-semibold text-sm tracking-tight text-[var(--ink-900)]">
              JakeResume
            </span>
          </div>
          <button
            type="button"
            className="jr-drawer-close-btn w-10 h-10 flex items-center justify-center rounded-lg text-[var(--ink-600)] hover:bg-[var(--surface-sunken)] transition-colors"
            onClick={onClose}
            aria-label="Close navigation drawer"
          >
            <X size={20} />
          </button>
        </div>

        {/* User / Guest Status Card */}
        <div className="mx-4 my-2 p-3 rounded-xl border border-[var(--border)] bg-[var(--surface-sunken)] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[var(--surface)] border border-[var(--border)] flex items-center justify-center text-xs font-bold text-[var(--ink-900)] flex-shrink-0">
              {isGuest ? <UserRound size={17} /> : (user?.email?.[0] || 'U').toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[var(--ink-900)] truncate">
                {isGuest ? 'Guest user' : user?.email}
              </div>
              <div className="text-[11px] text-[var(--ink-500)] flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isGuest ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                <span>{isGuest ? 'Browser only' : 'Cloud synced'}</span>
              </div>
            </div>
          </div>
          {isGuest && (
            <button
              type="button"
              onClick={() => {
                onClose?.();
                onOpenAuth?.('Sign in with Google');
              }}
              className="text-[11px] font-semibold text-[var(--accent-ink)] bg-[var(--surface)] hover:bg-[var(--accent-tint)] px-2 py-1 rounded-md border border-[var(--border)] transition-colors whitespace-nowrap"
            >
              Sign in
            </button>
          )}
        </div>

        {/* Main Navigation */}
        <nav className="jr-app-drawer-nav" aria-label="Main navigation">
          {/* Home */}
          <a
            href="#/"
            className={`jr-app-drawer-item${route === 'landing' ? ' is-active' : ''}`}
            aria-current={route === 'landing' ? 'page' : undefined}
            onClick={() => {
              onNavigate?.('landing');
              onClose?.();
            }}
          >
            <Logo size={18} />
            <span>Home</span>
          </a>

          {/* Resumes */}
          <a
            href="#/resumes"
            className={`jr-app-drawer-item${route === 'resumes' ? ' is-active' : ''}`}
            aria-current={route === 'resumes' ? 'page' : undefined}
            onClick={() => {
              onNavigate?.('resumes');
              onClose?.();
            }}
          >
            <SquaresFour size={18} />
            <span className="flex-1">Resumes</span>
            {profiles.length > 0 && (
              <span className="text-[11px] font-medium px-1.5 py-0.5 rounded-full bg-[var(--surface-sunken)] text-[var(--ink-600)]">
                {profiles.length}
              </span>
            )}
          </a>

          {/* Build / Editor */}
          {hasBuildResume ? (
            <a
              href={`#/edit/${encodeURIComponent(activeProfileId)}`}
              className={`jr-app-drawer-item${route === 'edit' ? ' is-active' : ''}`}
              aria-current={route === 'edit' ? 'page' : undefined}
              onClick={() => {
                onNavigate?.('edit');
                onClose?.();
              }}
            >
              <FileText size={18} />
              <span>Resume Editor</span>
            </a>
          ) : (
            <button
              type="button"
              disabled
              title="Create a resume first"
              className="jr-app-drawer-item is-disabled"
              aria-disabled="true"
            >
              <FileText size={18} />
              <span>Resume Editor</span>
            </button>
          )}

          {/* Import resume */}
          <button
            type="button"
            className="jr-app-drawer-item"
            onClick={() => {
              onOpenImport?.();
              onClose?.();
            }}
          >
            <FileUp size={18} />
            <span>Import resume</span>
          </button>
        </nav>

        {/* Resume Quick Switcher (when multiple profiles exist) */}
        {profiles.length > 1 && (
          <div className="mx-4 my-2 pt-2 border-t border-[var(--border)]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)] mb-1.5 px-2">
              Switch resume
            </div>
            <div className="flex flex-col gap-0.5 max-h-36 overflow-y-auto">
              {profiles.map((p) => {
                const isSelected = p._id === activeProfileId;
                return (
                  <button
                    key={p._id}
                    type="button"
                    onClick={() => {
                      onSelectProfile?.(p._id);
                      onNavigate?.('edit');
                      onClose?.();
                    }}
                    className={`flex items-center justify-between w-full px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors text-left ${
                      isSelected
                        ? 'bg-[var(--accent-tint)] text-[var(--accent-ink)] font-semibold'
                        : 'text-[var(--ink-700)] hover:bg-[var(--surface-sunken)]'
                    }`}
                  >
                    <span className="truncate flex-1">{p.profileName || 'Untitled'}</span>
                    {isSelected && <Check size={14} className="text-[var(--accent-ink)] ml-2 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Export Tools (if in editor or resume exists) */}
        {hasBuildResume && (
          <div className="mx-4 my-2 pt-2 border-t border-[var(--border)]">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-500)] mb-1.5 px-2">
              Export options
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                disabled={!hasCompiledPdf || isCompiling}
                onClick={() => {
                  onClose?.();
                  onDownloadPdf?.();
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--ink-800)] hover:bg-[var(--surface-sunken)] disabled:opacity-40 disabled:pointer-events-none"
              >
                <Download size={14} />
                <span>PDF file</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose?.();
                  onDownloadTex?.();
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-[var(--border)] text-xs text-[var(--ink-800)] hover:bg-[var(--surface-sunken)]"
              >
                <FileCode size={14} />
                <span>.tex source</span>
              </button>
            </div>
          </div>
        )}

        {/* Account actions & footer */}
        <div className="jr-app-drawer-account mt-auto">
          {isGuest ? (
            <>
              <button
                type="button"
                className="jr-app-drawer-account-btn"
                onClick={() => {
                  onOpenAuth?.('Sign in with Google');
                  onClose?.();
                }}
              >
                Sign in with Google
              </button>
              <button
                type="button"
                className="jr-app-drawer-account-btn"
                onClick={() => {
                  onLeaveGuest?.();
                  onClose?.();
                }}
              >
                Leave guest mode
              </button>
              <button
                type="button"
                className="jr-app-drawer-account-btn jr-danger-text"
                onClick={() => {
                  onDeleteGuestData?.();
                  onClose?.();
                }}
              >
                Delete data on this device
              </button>
            </>
          ) : user ? (
            <button
              type="button"
              className="jr-app-drawer-account-btn"
              onClick={() => {
                onLogout?.();
                onClose?.();
              }}
            >
              <LogOut size={16} />
              <span>Sign out</span>
            </button>
          ) : (
            <button
              type="button"
              className="jr-app-drawer-account-btn"
              onClick={() => {
                onOpenAuth?.();
                onClose?.();
              }}
            >
              Sign in with Google
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
