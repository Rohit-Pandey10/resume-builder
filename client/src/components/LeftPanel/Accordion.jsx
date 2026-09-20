import React, { useState } from 'react';
import { ChevronDown, ChevronRight, ChevronUp } from 'lucide-react';

export default function Accordion({
  title,
  icon: Icon,
  badge,
  defaultOpen = true,
  children,
  headerAction,
  onMoveUp,
  onMoveDown,
  canMoveUp = true,
  canMoveDown = true,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-zinc-800/80 bg-zinc-900/50 overflow-hidden transition-colors">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 bg-zinc-900/80 hover:bg-zinc-800/50 transition-colors cursor-pointer select-none text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-md bg-zinc-800/90 text-zinc-300 border border-zinc-700/60">
            {Icon && <Icon className="w-4 h-4" />}
          </div>
          <span className="font-medium text-sm text-zinc-100 tracking-tight">
            {title}
          </span>
          {badge !== undefined && (
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-800/90 text-zinc-400 border border-zinc-700/50 font-mono">
              {badge}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Section Reordering Controls */}
          {(onMoveUp || onMoveDown) && (
            <div
              className="flex items-center gap-0.5 bg-zinc-800/90 p-0.5 rounded-md border border-zinc-700/50"
              onClick={(e) => e.stopPropagation()}
            >
              {onMoveUp && (
                <button
                  type="button"
                  disabled={!canMoveUp}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canMoveUp) onMoveUp();
                  }}
                  className={`p-1 rounded transition-colors ${
                    canMoveUp
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/60'
                      : 'text-zinc-600 opacity-30 cursor-not-allowed'
                  }`}
                  title={canMoveUp ? 'Move section up' : 'Top-most section'}
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </button>
              )}
              {onMoveDown && (
                <button
                  type="button"
                  disabled={!canMoveDown}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (canMoveDown) onMoveDown();
                  }}
                  className={`p-1 rounded transition-colors ${
                    canMoveDown
                      ? 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/60'
                      : 'text-zinc-600 opacity-30 cursor-not-allowed'
                  }`}
                  title={canMoveDown ? 'Move section down' : 'Bottom-most section'}
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}

          {headerAction && (
            <div onClick={(e) => e.stopPropagation()}>
              {headerAction}
            </div>
          )}
          <div className="text-zinc-400 p-1 rounded hover:bg-zinc-800">
            {isOpen ? (
              <ChevronDown className="w-4 h-4 transition-transform duration-200 text-zinc-400" />
            ) : (
              <ChevronRight className="w-4 h-4 transition-transform duration-200 text-zinc-500" />
            )}
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="p-3.5 border-t border-zinc-800/80 space-y-3 bg-zinc-950/40">
          {children}
        </div>
      )}
    </div>
  );
}
