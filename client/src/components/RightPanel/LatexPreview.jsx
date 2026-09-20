import React, { useState } from 'react';
import { Copy, Check, FileCode, Sparkles } from 'lucide-react';
import PageBudgetGauge from './PageBudgetGauge.jsx';

export default function LatexPreview({ texCode, profile }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(texCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy tex:', err);
    }
  };

  const lines = (texCode || '').split('\n');

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-zinc-900/80 border-b border-zinc-800 gap-3 flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <FileCode className="w-4 h-4 text-zinc-400 flex-shrink-0" />
          <span className="font-mono text-xs font-medium text-zinc-200 truncate">
            resume.tex
          </span>
          <div className="hidden sm:flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 text-[10px] font-mono flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Sync
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Visual Single-Page Budget Gauge */}
          {profile && <PageBudgetGauge profile={profile} />}

          <span className="text-[11px] text-zinc-500 font-mono hidden md:inline">
            {lines.length} lines • {texCode.length} chars
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 transition-colors"
            title="Copy LaTeX Source"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copy Code</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="flex-1 overflow-auto font-mono text-[13px] leading-relaxed select-text p-4 bg-zinc-950">
        <div className="flex min-w-full">
          {/* Line Numbers */}
          <div className="select-none text-right pr-3 text-zinc-600 font-mono border-r border-zinc-800/80 flex-shrink-0">
            {lines.map((_, i) => (
              <div key={i} className="h-5">
                {i + 1}
              </div>
            ))}
          </div>

          {/* Syntax Code Content */}
          <pre className="pl-4 flex-1 text-zinc-300 overflow-x-auto whitespace-pre font-mono">
            {lines.map((line, i) => {
              // Clean lightweight syntax highlighting
              const isComment = line.trim().startsWith('%');
              const isCommand = line.trim().startsWith('\\');

              return (
                <div key={i} className="h-5">
                  {isComment ? (
                    <span className="text-zinc-500 italic">{line}</span>
                  ) : isCommand ? (
                    <span className="text-zinc-100 font-medium">{line}</span>
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
