import React, { useState } from 'react';
import { Copy, Check, FileCode } from '../icons';
import { Button } from '../primitives';

export default function LatexPreview({ texCode }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(texCode || '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy tex:', err);
    }
  };

  const lines = (texCode || '').split('\n');

  return (
    <div
      className="jr-latex-preview flex flex-col h-full rounded-md overflow-hidden border"
      style={{
        borderColor: 'var(--border)',
        background: 'var(--bg-app)',
      }}
    >
      {/* Top Toolbar */}
      <div
        className="flex items-center justify-between px-3 py-2 border-b gap-3 flex-shrink-0"
        style={{
          borderColor: 'var(--border)',
          background: 'var(--bg-canvas)',
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          <FileCode size={16} strokeWidth={1.5} style={{ color: 'var(--ink-500)' }} />
          <span className="font-mono text-xs font-medium" style={{ color: 'var(--ink-900)' }}>
            resume.tex
          </span>
          <span className="text-xs" style={{ color: 'var(--ink-500)' }}>
            {lines.length} lines
          </span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button variant="secondary" size="sm" onClick={handleCopy} title="Copy LaTeX source">
            {copied ? (
              <>
                <Check size={14} strokeWidth={1.5} style={{ color: 'var(--accent)' }} />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy size={14} strokeWidth={1.5} />
                <span>Copy</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Code Content */}
      <div
        className="flex-1 overflow-y-auto overflow-x-hidden font-mono text-xs leading-relaxed select-text p-3"
        style={{ background: 'var(--bg-app)' }}
      >
        <div className="flex min-w-full">
          {/* Line Numbers */}
          <div
            className="select-none text-right pr-3 font-mono border-r flex-shrink-0"
            style={{
              borderColor: 'var(--border)',
              color: 'var(--ink-500)',
              minWidth: '36px',
            }}
          >
            {lines.map((_, i) => (
              <div key={i} className="h-5">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Syntax Code Content */}
          <pre
            className="pl-3 flex-1 min-w-0 overflow-x-auto whitespace-pre font-mono m-0"
            style={{ color: 'var(--ink-900)' }}
          >
            {lines.map((line, i) => {
              const isComment = line.trim().startsWith('%');
              const isCommand = line.trim().startsWith('\\');

              return (
                <div key={i} className="h-5">
                  {isComment ? (
                    <span style={{ color: 'var(--ink-500)', fontStyle: 'italic' }}>
                      {line}
                    </span>
                  ) : isCommand ? (
                    <span style={{ color: 'var(--accent)', fontWeight: 500 }}>
                      {line}
                    </span>
                  ) : (
                    <span>{line}</span>
                  )}
                </div>
              );
            })}
          </pre>
        </div>
      </div>
    </div>
  );
}
