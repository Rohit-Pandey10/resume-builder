import React, { useState } from 'react';
import { FileText, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { Button, Input, Field } from './primitives';

export default function AuthModal({ onLogin, onRegister }) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      if (isRegister) {
        await onRegister(email, password);
      } else {
        await onLogin(email, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(28, 25, 23, 0.45)' }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm p-6 space-y-5 rounded-[10px] border"
        style={{
          background: 'var(--color-bg-base)',
          borderColor: 'var(--color-border)',
          boxShadow: 'var(--shadow-popover)',
        }}
      >
        {/* Brand header */}
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0"
            style={{
              background: 'var(--color-bg-subtle)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-brand)',
            }}
          >
            <FileText size={16} strokeWidth={1.5} />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight" style={{ color: 'var(--color-text-1)' }}>
              JakeResume
            </h1>
            <p className="text-xs" style={{ color: 'var(--color-text-3)' }}>
              {isRegister ? 'Create an account to start editing' : 'Sign in to your account'}
            </p>
          </div>
        </div>

        {/* Tab switch */}
        <div
          className="flex p-0.5 rounded border"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-bg-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setIsRegister(false);
              setError('');
            }}
            className="flex-1 py-1 text-xs font-medium rounded transition-colors text-center"
            style={{
              background: !isRegister ? 'var(--color-bg-base)' : 'transparent',
              color: !isRegister ? 'var(--color-text-1)' : 'var(--color-text-3)',
              boxShadow: !isRegister ? 'var(--shadow-card)' : 'none',
            }}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => {
              setIsRegister(true);
              setError('');
            }}
            className="flex-1 py-1 text-xs font-medium rounded transition-colors text-center"
            style={{
              background: isRegister ? 'var(--color-bg-base)' : 'transparent',
              color: isRegister ? 'var(--color-text-1)' : 'var(--color-text-3)',
              boxShadow: isRegister ? 'var(--shadow-card)' : 'none',
            }}
          >
            Create account
          </button>
        </div>

        {/* Error alert */}
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Field label="Email">
            <Input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="developer@example.com"
            />
          </Field>

          <Field label="Password">
            <Input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </Field>

          <Button
            variant="primary"
            type="submit"
            disabled={loading}
            className="w-full justify-center"
          >
            {loading ? (
              <>
                <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                <span>Working…</span>
              </>
            ) : (
              <>
                <span>{isRegister ? 'Create account' : 'Sign in'}</span>
                <ArrowRight size={14} strokeWidth={1.5} />
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
