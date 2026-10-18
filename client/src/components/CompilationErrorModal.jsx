import React, { useState, useRef } from 'react';
import {
  AlertTriangle,
  Download,
  ExternalLink,
  X,
  ChevronDown,
  Terminal,
  Clock,
} from './icons';
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
  const modalRef = useRef(null);

  React.useEffect(() => {
    const previousFocus = document.activeElement;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key !== 'Tab') return;
      const focusable = [...modalRef.current.querySelectorAll('button, textarea, input, [tabindex]:not([tabindex="-1"])')].filter((element) => !element.disabled);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    };
    if (isOpen) {
      requestAnimationFrame(() => modalRef.current?.querySelector('button')?.focus());
      window.addEventListener('keydown', handleKeyDown);
      return () => { window.removeEventListener('keydown', handleKeyDown); previousFocus?.focus?.(); };
    }
  }, [isOpen, onClose]);

  if (!isOpen || !errorInfo) return null;

  const isTimeout = Boolean(errorInfo.isTimeout);

  return (
    <div
      className="jr-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-4"
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="compilation-error-title"
    >
      <div
        className="jr-modal w-full max-w-lg overflow-hidden flex flex-col rounded-[10px] border"
        style={{
          background: 'var(--bg-app)',
          borderColor: 'var(--border)',
          boxShadow: 'var(--shadow-lg)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--bg-canvas)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <span
              className="p-1.5 rounded flex items-center justify-center"
              style={{
                color: isTimeout ? 'var(--warning)' : 'var(--danger)',
                background: isTimeout ? 'var(--warning-bg)' : 'var(--danger-bg)',
              }}
            >
              {isTimeout ? (
                <Clock size={16} strokeWidth={1.5} />
              ) : (
                <AlertTriangle size={16} strokeWidth={1.5} />
              )}
            </span>
            <div>
              <h3 id="compilation-error-title" className="text-xs font-semibold" style={{ color: 'var(--ink-900)' }}>
                {isTimeout ? 'PDF generation timed out' : 'PDF generation issue'}
              </h3>
              <p className="text-[11px]" style={{ color: 'var(--ink-500)' }}>
                {isTimeout
                  ? `Generation took longer than ${REMOTE_COMPILE_TIMEOUT_SECONDS} seconds`
                  : 'Document generation encountered an unexpected issue'}
              </p>
            </div>
          </div>

          <IconButton onClick={onClose} title="Dismiss">
            <X size={16} strokeWidth={1.5} />
          </IconButton>
        </div>

        {/* Body */}
        <div className="p-4 space-y-3.5 overflow-y-auto" tabIndex="0">
          <p className="text-xs leading-relaxed" style={{ color: 'var(--ink-600)' }}>
            {errorInfo.message || 'An issue occurred while generating your document.'}
          </p>

          {/* Recovery actions */}
          <div
            className="p-3 rounded border space-y-2.5"
            style={{
              background: 'var(--bg-canvas)',
              borderColor: 'var(--border)',
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
              style={{ borderColor: 'var(--border)' }}
            >
              <button
                type="button"
                onClick={() => setShowLogs(!showLogs)}
                className="w-full px-3 py-1.5 flex items-center justify-between text-xs select-none"
                style={{
                  background: 'var(--bg-canvas)',
                  color: 'var(--ink-600)',
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
                    borderColor: 'var(--border)',
                    background: 'var(--bg-app)',
                    color: 'var(--ink-500)',
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
            borderColor: 'var(--border)',
            background: 'var(--bg-canvas)',
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
