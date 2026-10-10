import React, { useState, useEffect, useRef } from 'react';
import { X, RotateCcw } from 'lucide-react';

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
      className="pointer-events-auto bg-[#1C1917] text-white px-3.5 py-2.5 rounded-lg shadow-xl border border-stone-800 flex items-center gap-3 text-xs transition-all duration-150 animate-in fade-in slide-in-from-bottom-2 select-none"
      style={{
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
      }}
      role="status"
    >
      <span className="font-normal text-stone-200">{toast.message}</span>

      <button
        type="button"
        onClick={handleUndoClick}
        className="flex items-center gap-1 font-medium text-teal-400 hover:text-teal-300 transition-colors ml-1 focus:outline-none focus:ring-1 focus:ring-teal-400 rounded px-1"
        aria-label={`Undo ${toast.message}`}
      >
        <RotateCcw size={12} strokeWidth={2} />
        <span>Undo</span>
      </button>

      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-stone-400 hover:text-stone-200 transition-colors p-0.5 rounded ml-0.5 focus:outline-none"
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
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex flex-col-reverse items-center gap-2 pointer-events-none"
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
