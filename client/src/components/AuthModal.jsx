import React, { useState, useEffect, useRef } from 'react';
import {
  FileText,
  UploadSimple,
  DownloadSimple,
  AlertCircle,
  Loader2,
  ArrowRight,
  X,
} from './icons';
import GoogleSignInButton from './GoogleSignInButton';

function Swoosh() {
  return (
    <svg className="jr-landing-swoosh" viewBox="0 0 240 20" preserveAspectRatio="none" aria-hidden="true">
      <path d="M4 14 C65 22 155 18 236 4" />
    </svg>
  );
}

function SparkleStrokes() {
  return (
    <svg className="jr-landing-sparkles" viewBox="0 0 40 40" aria-hidden="true">
      <line x1="8" y1="28" x2="2" y2="34" />
      <line x1="14" y1="18" x2="4" y2="14" />
      <line x1="26" y1="12" x2="20" y2="2" />
    </svg>
  );
}

function ResumeArtifact() {
  return (
    <div className="jr-landing-composition-wrap" aria-hidden="true">
      {/* 1. Mint blob top-right */}
      <div className="jr-composition-shape jr-shape-mint" data-decor="shape" />

      {/* 2. Lavender rounded square behind-left (rotated 8deg) */}
      <div className="jr-composition-shape jr-shape-lavender" data-decor="shape" />

      {/* 3. Two peach triangles */}
      <div className="jr-shape-triangle jr-triangle-left" data-decor="shape" />
      <div className="jr-shape-triangle jr-triangle-right" data-decor="shape" />

      {/* 4. The paper (rotated -2deg, 6px coral top bar) */}
      <div className="jr-landing-paper">
        {/* 5. Sparkles: three short coral strokes at paper's top-left corner */}
        <SparkleStrokes />
        <div className="jr-landing-paper-heading">
          <div>
            <div className="jr-landing-paper-name">Alex Carter</div>
            <div className="jr-landing-paper-role">Product Designer</div>
          </div>
          <div className="jr-landing-paper-avatar" data-decor="avatar">AC</div>
        </div>
        <div className="jr-landing-paper-contact">
          San Francisco, CA · alex@portfolio.com · linkedin.com/in/alex
        </div>

        <div className="jr-landing-paper-section">SUMMARY</div>
        <div className="jr-landing-paper-lines">
          <span />
          <span />
          <span className="short" />
        </div>

        <div className="jr-landing-paper-section">EXPERIENCE</div>
        <div className="jr-landing-paper-role-line">
          <b>Senior Product Designer</b>
          <small>2022 – Present</small>
        </div>
        <div className="jr-landing-paper-subline">Ripple Labs · San Francisco, CA</div>
        <div className="jr-landing-paper-lines">
          <span />
          <span className="short" />
        </div>

        <div className="jr-landing-paper-section">EDUCATION</div>
        <div className="jr-landing-paper-role-line">
          <b>B.S. in Computer Science</b>
          <small>2018 – 2022</small>
        </div>
        <div className="jr-landing-paper-subline">UC Berkeley</div>
      </div>

      {/* 6. Annotation (Caveat font with curved arrow pointing up-right) */}
      <div className="jr-landing-annotation">
        <span className="jr-annotation-text">
          Turn your experience<br />into opportunity
        </span>
        <svg className="jr-annotation-arrow" viewBox="0 0 76 46" aria-hidden="true">
          <path d="M6 38 C28 42 54 36 68 12 M52 13 L68 12 L65 27" />
        </svg>
      </div>
    </div>
  );
}

function ErrorAlert({ error }) {
  if (!error) return null;
  return (
    <div className="jr-auth-error" role="alert">
      <AlertCircle size={15} weight="bold" />
      <span>{error}</span>
    </div>
  );
}

function AuthActions({
  authLoading,
  isLoggedIn,
  sessionCaption,
  onNavigateToResumes,
  googleClientId,
  loading,
  error,
  onGoogleCredential,
  onContinueAsGuest,
  onImportResume,
  guestStorageBlocked,
  googleWrapRef,
  pulseGoogle,
}) {
  if (authLoading) {
    return (
      <div className="jr-landing-actions" aria-label="Loading..." style={{ minHeight: '166px' }}>
        <div className="jr-skeleton" style={{ height: '44px', width: '100%', borderRadius: 'var(--r-md)', marginBottom: '16px', background: 'var(--border)' }} />
        <div className="jr-skeleton" style={{ height: '16px', width: '40px', margin: '0 auto 16px', borderRadius: 'var(--r-sm)', background: 'var(--border)' }} />
        <div className="jr-landing-action-row" style={{ marginBottom: '14px' }}>
          <div className="jr-skeleton" style={{ height: '48px', borderRadius: 'var(--r-md)', background: 'var(--border)' }} />
          <div className="jr-skeleton" style={{ height: '48px', borderRadius: 'var(--r-md)', background: 'var(--border)' }} />
        </div>
        <div className="jr-skeleton" style={{ height: '14px', width: '220px', margin: '0 auto', borderRadius: 'var(--r-sm)', background: 'var(--border)' }} />
      </div>
    );
  }

  if (isLoggedIn) {
    return (
      <div className="jr-landing-actions" aria-label="Get started">
        <button
          type="button"
          className="jr-btn jr-btn-lg jr-btn-primary"
          onClick={onNavigateToResumes}
          style={{ width: '100%', height: '48px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
        >
          <span>Open your resumes</span>
          <ArrowRight size={18} />
        </button>
        <p className="jr-auth-guest-note" style={{ marginTop: '12px' }}>
          {sessionCaption}
        </p>
      </div>
    );
  }

  return (
    <div className="jr-landing-actions" aria-label="Get started">
      <ErrorAlert error={error} />
      {googleClientId ? (
        <div
          ref={googleWrapRef}
          tabIndex={-1}
          className={`jr-auth-google-wrap ${pulseGoogle ? 'jr-focus-pulse' : ''}`.trim()}
        >
          <GoogleSignInButton
            onCredential={onGoogleCredential}
            disabled={loading}
            theme="filled_black"
          />
        </div>
      ) : (
        <p className="jr-auth-provider-note">Google sign-in isn&apos;t configured.</p>
      )}
      <div className="jr-auth-divider"><span>or</span></div>
      <div className="jr-landing-action-row">
        <button
          type="button"
          className="jr-btn jr-btn-lg jr-btn-secondary"
          onClick={onContinueAsGuest}
          disabled={loading || guestStorageBlocked}
          aria-busy={loading}
        >
          {loading ? <Loader2 size={18} className="animate-spin" /> : <FileText size={18} />}
          <span>Start as guest</span>
        </button>
        <button
          type="button"
          className="jr-btn jr-btn-lg jr-btn-secondary"
          onClick={onImportResume}
          disabled={loading || guestStorageBlocked}
          aria-busy={loading}
        >
          <UploadSimple size={18} />
          <span>Import resume</span>
        </button>
      </div>
      <p className="jr-auth-guest-note">Guest resumes are saved in this browser only.</p>
    </div>
  );
}

function AuthPanel({ googleClientId, loading, error, onGoogleCredential, onContinueAsGuest, onClose, onImportResume, guestStorageBlocked }) {
  return (
    <div className="jr-landing-auth-backdrop" role="dialog" aria-modal="true" aria-labelledby="auth-title">
      <div className="jr-landing-auth-card">
        <button type="button" onClick={onClose} className="jr-auth-close" aria-label="Close sign in"><X size={18} /></button>
        <div className="jr-auth-panel-icon"><FileText size={20} /></div>
        <h2 id="auth-title">Let&apos;s make it happen.</h2>
        <p className="jr-auth-panel-copy">Sign in to save your resumes across devices, or jump straight in with a guest workspace.</p>
        <AuthActions
          authLoading={false}
          isLoggedIn={false}
          sessionCaption=""
          googleClientId={googleClientId}
          loading={loading}
          error={error}
          onGoogleCredential={onGoogleCredential}
          onContinueAsGuest={onContinueAsGuest}
          onImportResume={onImportResume}
          guestStorageBlocked={guestStorageBlocked}
        />
      </div>
    </div>
  );
}

export default function AuthModal({
  authLoading = false,
  mode = null,
  user = null,
  showAuthPanel: propShowAuthPanel,
  onCloseAuthPanel,
  onNavigateToResumes,
  onGoogleSignIn,
  onContinueAsGuest,
  onOpenImport,
  guestStorageBlocked = false,
  signInTrigger = 0,
}) {
  const [internalShowAuthPanel, setInternalShowAuthPanel] = useState(false);
  const showAuthPanel = propShowAuthPanel !== undefined ? propShowAuthPanel : internalShowAuthPanel;
  const setShowAuthPanel = (val) => {
    setInternalShowAuthPanel(val);
    if (!val) onCloseAuthPanel?.();
  };
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pulseGoogle, setPulseGoogle] = useState(false);
  const actionsRef = useRef(null);
  const googleWrapRef = useRef(null);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || (typeof window !== 'undefined' && window.__TEST_GOOGLE_CLIENT_ID);

  const handleSignInClick = () => {
    actionsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      setPulseGoogle(true);
      setTimeout(() => {
        setPulseGoogle(false);
      }, 1200);
    }, 0);
  };

  useEffect(() => {
    document.title = "JakeResume - Build a resume in the Jake's Resume format";
  }, []);

  useEffect(() => {
    if (signInTrigger > 0) {
      handleSignInClick();
    }
  }, [signInTrigger]);

  useEffect(() => {
    if (!showAuthPanel) return undefined;
    const handleKeyDown = (e) => { if (e.key === 'Escape') setShowAuthPanel(false); };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showAuthPanel]);

  const handleGoogleCredential = async (credential) => {
    setError('');
    setLoading(true);
    try {
      await onGoogleSignIn(credential);
    } catch (err) {
      setError(err.status === 503 ? "Google sign-in isn't available right now." : 'Google sign-in failed. Try again.');
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
      setError(err.code === 'GUEST_STORAGE_UNAVAILABLE' ? 'Guest mode needs browser storage, which is blocked in this browser.' : (err.message || 'Guest mode could not be started.'));
    } finally {
      setLoading(false);
    }
  };

  const handleImportResume = async () => {
    setError('');
    setLoading(true);
    try {
      await onContinueAsGuest();
      onOpenImport?.();
    } catch (err) {
      setError(err.code === 'GUEST_STORAGE_UNAVAILABLE' ? 'Guest mode needs browser storage, which is blocked in this browser.' : (err.message || 'Guest mode could not be started.'));
    } finally {
      setLoading(false);
    }
  };

  const isLoggedIn = Boolean(user || mode === 'guest');
  const sessionCaption = user
    ? 'Signed in with Google'
    : mode === 'guest'
    ? 'Guest mode: saved in this browser only.'
    : '';

  return (
    <main className="jr-landing-page">
      <div className="jr-landing-shell">
        <section className="jr-landing-hero" aria-labelledby="landing-title">
          <div className="jr-landing-copy">
            <h1 id="landing-title" tabIndex="-1">
              <span className="jr-headline-line">Build a resume</span>
              <span className="jr-headline-line">that <span className="jr-headline-highlight">gets noticed<Swoosh /></span></span>
            </h1>
            <p className="jr-landing-lede">
              Fill in your details section by section, preview the PDF, and export when you&apos;re ready.
            </p>
            <div ref={actionsRef}>
              <AuthActions
                authLoading={authLoading}
                isLoggedIn={isLoggedIn}
                sessionCaption={sessionCaption}
                onNavigateToResumes={onNavigateToResumes}
                googleClientId={googleClientId}
                loading={loading}
                error={error}
                onGoogleCredential={handleGoogleCredential}
                onContinueAsGuest={handleContinueAsGuest}
                onImportResume={handleImportResume}
                guestStorageBlocked={guestStorageBlocked}
                googleWrapRef={googleWrapRef}
                pulseGoogle={pulseGoogle}
              />
            </div>
          </div>
          <ResumeArtifact />
        </section>

        <section className="jr-landing-features" aria-label="JakeResume features">
          <div className="jr-landing-feature-card">
            <span className="jr-feature-icon jr-feature-icon-lavender" data-decor="feature-tile">
              <FileText size={22} weight="duotone" />
            </span>
            <div className="jr-feature-text">
              <b>Jake&apos;s Resume format</b>
              <small>A clean, single-column LaTeX layout.</small>
            </div>
          </div>
          <div className="jr-landing-feature-card">
            <span className="jr-feature-icon jr-feature-icon-mint" data-decor="feature-tile">
              <UploadSimple size={22} weight="duotone" />
            </span>
            <div className="jr-feature-text">
              <b>Import your resume</b>
              <small>Paste AI-extracted JSON to fill every section.</small>
            </div>
          </div>
          <div className="jr-landing-feature-card">
            <span className="jr-feature-icon jr-feature-icon-peach" data-decor="feature-tile">
              <DownloadSimple size={22} weight="duotone" />
            </span>
            <div className="jr-feature-text">
              <b>Export your way</b>
              <small>PDF, .tex or Overleaf.</small>
            </div>
          </div>
        </section>
      </div>
      {showAuthPanel && (
        <AuthPanel
          googleClientId={googleClientId}
          loading={loading}
          error={error}
          onGoogleCredential={handleGoogleCredential}
          onContinueAsGuest={handleContinueAsGuest}
          onImportResume={handleImportResume}
          onClose={() => setShowAuthPanel(false)}
          guestStorageBlocked={guestStorageBlocked}
        />
      )}
    </main>
  );
}
