import React, { useEffect, useRef } from 'react';
import { LogOut, UserRound, X } from './icons';
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
        <div className="jr-app-drawer-header">
          <Logo size={28} />
          <button
            type="button"
            className="jr-drawer-close-btn"
            onClick={onClose}
            aria-label="Close navigation drawer"
          >
            <X size={20} />
          </button>
        </div>

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
            <span>Resumes</span>
          </a>

          {/* Build */}
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
              <span>Build</span>
            </a>
          ) : (
            <button
              type="button"
              disabled
              title="Create a resume first"
              className="jr-app-drawer-item is-disabled"
              aria-disabled="true"
            >
              <span>Build</span>
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
            <span>Import resume</span>
          </button>
        </nav>

        {/* Account items */}
        <div className="jr-app-drawer-account">
          <div className="jr-app-drawer-account-label">
            <UserRound size={18} />
            <span>{isGuest ? 'Guest' : (user?.email || 'Account')}</span>
          </div>

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
