import React, { useState, useEffect, useRef } from 'react';
import { X, RotateCcw } from './icons';

/**
 * Individual Undo Toast Item with 8s countdown and pause-on-hover
 */
function UndoToastItem({ toast, onDismiss }) {
  const [isPaused, setIsPaused] = useState(false);
  const remainingRef = useRef(toast.duration || 8000);
  const lastTickRef = useRef(0);

  useEffect(() => {
    lastTickRef.current = Date.now();
  }, []);

  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const lastTick = lastTickRef.current || now;
      const elapsed = now - lastTick;
      lastTickRef.current = now;

      remainingRef.current -= elapsed;
      if (remainingRef.current <= 0) {
        clearInterval(interval);
        onDismiss(toast.id);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [isPaused, onDismiss, toast.id]);

  const handleMouseEnter = () => {
    setIsPaused(true);
  };

  const handleMouseLeave = () => {
    lastTickRef.current = Date.now();
    setIsPaused(false);
  };

  const handleUndoClick = () => {
    if (toast.onUndo) {
      toast.onUndo();
    }
    onDismiss(toast.id);
  };

  return (
    <div
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="jr-undo-toast-item pointer-events-auto px-3.5 py-2.5 rounded flex items-center gap-3 text-xs select-none"
      style={{
        backgroundColor: 'var(--ink-900)',
        color: 'var(--surface)',
        borderRadius: 'var(--r-md)',
        border: '1px solid var(--ink-900)',
        boxShadow: 'var(--shadow-md)',
        maxWidth: 'calc(100vw - 32px)',
      }}
      role="status"
    >
      <span className="font-normal" style={{ color: 'var(--surface)' }}>{toast.message}</span>

      <button
        type="button"
        onClick={handleUndoClick}
        className="flex items-center gap-1 font-medium transition-colors ml-1 focus:outline-none rounded px-1"
        style={{ color: 'var(--coral-500)' }}
        aria-label={`Undo ${toast.message}`}
      >
        <RotateCcw size={12} strokeWidth={2} />
        <span>Undo</span>
      </button>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="transition-colors p-0.5 rounded ml-0.5 focus:outline-none opacity-70 hover:opacity-100"
        style={{ color: 'var(--surface)' }}
        title="Dismiss toast"
        aria-label="Dismiss toast"
      >
        <X size={13} strokeWidth={1.5} />
      </button>
    </div>
  );
}

/**
 * UndoToastContainer
 * Fixed at bottom-center, max 3 stacked toasts.
 */
export default function UndoToastContainer({ toasts = [], onDismiss }) {
  if (!toasts || toasts.length === 0) return null;

  // Max 3 stacked
  const visibleToasts = toasts.slice(0, 3);

  return (
    <div
      className="jr-undo-toast-container fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col-reverse items-center gap-2 pointer-events-none"
      style={{ maxWidth: 'calc(100vw - 32px)' }}
      role="region"
      aria-label="Action notifications"
    >
      {visibleToasts.map((toast) => (
        <UndoToastItem
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}
