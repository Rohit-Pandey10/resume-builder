import React, { useEffect, useState } from 'react';
import { AlertCircle, FileText, Loader2, X } from 'lucide-react';
import { Button } from './primitives';
import GoogleSignInButton from './GoogleSignInButton';

export default function AuthModal({
  onGoogleSignIn,
  onContinueAsGuest,
  onClose,
  guestStorageBlocked = false,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || (typeof window !== 'undefined' && window.__TEST_GOOGLE_CLIENT_ID);

  useEffect(() => {
    document.title = 'Sign in - JakeResume';
  }, []);

  useEffect(() => {
    if (!onClose) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleGoogleCredential = async (credential) => {
    setError('');
    setLoading(true);
    try {
      await onGoogleSignIn(credential);
    } catch (err) {
      setError(err.status === 503
        ? "Google sign-in isn't available right now."
        : 'Google sign-in failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContinueAsGuest = async () => {
    setError('');
    setLoading(true);
    try {
      await onContinueAsGuest();
    } catch (err) {
      setError(err.code === 'GUEST_STORAGE_UNAVAILABLE'
        ? 'Guest mode needs browser storage, which is blocked in this browser.'
        : (err.message || 'Guest mode could not be started.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'var(--color-bg-app, #FAF8F5)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-title"
    >
      <div
        className="w-full max-w-sm p-6 space-y-5 rounded-[10px] border"
        style={{
          backgroundColor: '#FFFFFF',
          borderColor: 'var(--color-border, #E7E2DA)',
          boxShadow: 'var(--shadow-popover)',
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
              style={{
                backgroundColor: 'var(--color-accent-tint-bg, #F0FDFA)',
                border: '1px solid var(--color-border, #E7E2DA)',
                color: 'var(--color-accent, #0F766E)',
              }}
            >
              <FileText size={16} strokeWidth={1.5} />
            </div>
            <div>
              <h1 id="auth-title" className="text-sm font-semibold tracking-tight" style={{ color: 'var(--color-text-1)' }}>
                Sign in to JakeResume
              </h1>
              <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-3)' }}>
                Save your resumes to your account and open them on any device.
              </p>
            </div>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1 -mr-1 -mt-1 rounded text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
              aria-label="Close"
            >
              <X size={16} strokeWidth={1.5} />
            </button>
          )}
        </div>

        {googleClientId ? (
          <>
            <GoogleSignInButton
              onCredential={handleGoogleCredential}
              disabled={loading}
            />
            <div className="flex items-center gap-3 text-xs" style={{ color: 'var(--color-text-3)' }} aria-hidden="true">
              <span className="h-px flex-1" style={{ backgroundColor: 'var(--color-border)' }} />
              <span>or</span>
              <span className="h-px flex-1" style={{ backgroundColor: 'var(--color-border)' }} />
            </div>
          </>
        ) : (
          <p className="text-xs text-center" style={{ color: 'var(--color-text-3)' }}>
            Google sign-in isn&apos;t configured.
          </p>
        )}

        {error && (
          <div
            className="p-2.5 rounded border text-xs flex items-center gap-2"
            style={{
              background: 'var(--color-danger-subtle)',
              borderColor: 'var(--color-danger)',
              color: 'var(--color-danger-text)',
            }}
            role="alert"
          >
            <AlertCircle size={14} strokeWidth={1.5} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <div className="space-y-2">
          <Button
            variant="secondary"
            onClick={handleContinueAsGuest}
            disabled={loading || guestStorageBlocked}
            aria-busy={loading}
            className="w-full justify-center h-10"
          >
            {loading ? <Loader2 size={14} strokeWidth={1.5} className="animate-spin" /> : null}
            <span>Continue as guest</span>
          </Button>
          <p className="text-center text-[13px] leading-relaxed" style={{ color: 'var(--color-text-3)' }}>
            Guest resumes are stored only in this browser. Clearing site data deletes them.
          </p>
          <div className="pt-2 text-center border-t" style={{ borderColor: 'var(--color-border)' }}>
            <a
              href="/privacy.html"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs transition-colors hover:underline"
              style={{ color: 'var(--color-text-3)' }}
            >
              Privacy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
