import React from 'react';
import { AlertCircle, Loader2 } from './icons';
import { Button } from './primitives';

export default function GuestMigrationModal({
  profiles = [],
  progress = 0,
  inProgress = false,
  error = '',
  onAdd,
  onNotNow,
}) {
  const remaining = profiles.length;
  const total = progress + remaining;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'var(--surface)' }}
      role="dialog"
      aria-modal="true"
      aria-labelledby="guest-migration-title"
    >
      <div
        className="w-full max-w-md p-6 space-y-4 rounded-[10px] border"
        style={{
          backgroundColor: 'var(--bg-app)',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        <div className="space-y-1">
          <h2 id="guest-migration-title" className="text-base font-semibold" style={{ color: 'var(--ink-900)' }}>
            Add your guest resumes to your account?
          </h2>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-600)' }}>
            You have {total} resume{total === 1 ? '' : 's'} saved in this browser. Adding them copies them to your Google account.
          </p>
        </div>

        {error && (
          <div
            className="flex items-start gap-2 p-2.5 rounded border text-xs"
            style={{
              color: 'var(--danger)',
              backgroundColor: 'var(--danger-bg)',
              borderColor: 'var(--danger)',
            }}
            role="alert"
          >
            <AlertCircle size={14} className="flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {inProgress && (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--ink-600)' }} role="status" aria-live="polite">
            <Loader2 size={14} className="animate-spin" />
            <span>Adding {progress + 1} of {total} resumes…</span>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2">
          <Button variant="secondary" onClick={onNotNow} disabled={inProgress}>
            Not now
          </Button>
          <Button variant="primary" onClick={onAdd} disabled={inProgress || remaining === 0}>
            {inProgress ? 'Adding…' : 'Add to my account'}
          </Button>
        </div>
      </div>
    </div>
  );
}
