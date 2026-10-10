import React, { useState } from 'react';
import {
  AlertTriangle,
  Download,
  ExternalLink,
  X,
  ChevronDown,
  Terminal,
  Clock,
} from 'lucide-react';
import { Button, IconButton } from './primitives';
import { REMOTE_COMPILE_TIMEOUT_SECONDS } from '../utils/compilerConfig';

export default function CompilationErrorModal({
  isOpen,
  onClose,
  errorInfo,
  onDownloadTex,
  onOpenOverleaf,
  onRetry,
}) {
  const [showLogs, setShowLogs] = useState(true);

  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !errorInfo) return null;

  const isTimeout = Boolean(errorInfo.isTimeout);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(28, 25, 23, 0.45)' }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] rounded-[10px] border"
        style={{
          background: 'var(--color-bg-base)',
          borderColor: 'var(--color-border)',
          boxShadow: 'var(--shadow-popover)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-bg-subtle)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="p-1.5 rounded flex items-center justify-center"
              style={{
                color: isTimeout ? 'var(--color-warning)' : 'var(--color-danger)',
                background: isTimeout ? 'var(--color-warning-subtle)' : 'var(--color-danger-subtle)',
              }}
            >
              {isTimeout ? (
                <Clock size={16} strokeWidth={1.5} />
              ) : (
                <AlertTriangle size={16} strokeWidth={1.5} />
              )}
            </span>
            <div>
              <h3 className="text-xs font-semibold" style={{ color: 'var(--color-text-1)' }}>
                {isTimeout ? 'Compilation timed out' : 'Compilation failed'}
              </h3>
              <p className="text-[11px]" style={{ color: 'var(--color-text-3)' }}>
                {isTimeout
                  ? `Remote compiler took longer than ${REMOTE_COMPILE_TIMEOUT_SECONDS} seconds`
                  : 'LaTeX engine reported an error'}
              </p>
            </div>
          </div>

          <IconButton onClick={onClose} title="Dismiss">
            <X size={16} strokeWidth={1.5} />
          </IconButton>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto">
          <p className="text-xs leading-relaxed" style={{ color: 'var(--color-text-2)' }}>
            {errorInfo.message || 'An error occurred during LaTeX compilation.'}
          </p>

          {/* Recovery actions */}
          <div
            className="p-3 rounded border space-y-2.5"
            style={{
              background: 'var(--color-bg-subtle)',
              borderColor: 'var(--color-border)',
            }}
          >
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onRetry();
                  onClose();
                }}
              >
                <span>Try again</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  onDownloadTex();
                  onClose();
                }}
              >
                <Download size={14} strokeWidth={1.5} />
                <span>Download .tex</span>
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  onOpenOverleaf();
                  onClose();
                }}
              >
                <ExternalLink size={14} strokeWidth={1.5} />
                <span>Open in Overleaf</span>
              </Button>
            </div>
          </div>

          {/* Diagnostic Log */}
          {errorInfo.log && (
            <div
              className="border rounded overflow-hidden"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <button
                type="button"
                onClick={() => setShowLogs(!showLogs)}
                className="w-full px-3 py-1.5 flex items-center justify-between text-xs select-none"
                style={{
                  background: 'var(--color-bg-subtle)',
                  color: 'var(--color-text-2)',
                }}
              >
                <span className="flex items-center gap-1.5 text-[11px]">
                  <Terminal size={14} strokeWidth={1.5} />
                  Diagnostic output
                </span>
                <ChevronDown
                  size={14}
                  strokeWidth={1.5}
                  style={{
                    transform: showLogs ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform var(--duration-fast) var(--easing)',
                  }}
                />
              </button>

              {showLogs && (
                <pre
                  className="p-3 text-[11px] font-mono overflow-x-auto max-h-48 leading-relaxed whitespace-pre-wrap border-t m-0"
                  style={{
                    borderColor: 'var(--color-border)',
                    background: 'var(--color-bg-base)',
                    color: 'var(--color-text-3)',
                  }}
                >
                  {errorInfo.log}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-4 py-2.5 border-t flex justify-end"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-bg-subtle)',
          }}
        >
          <Button variant="secondary" size="sm" onClick={onClose}>
            Dismiss
          </Button>
        </div>
      </div>
    </div>
  );
}
