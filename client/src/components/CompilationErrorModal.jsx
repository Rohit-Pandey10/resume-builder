import React, { useState } from 'react';
import {
  AlertTriangle,
  Download,
  ExternalLink,
  X,
  ChevronDown,
  ChevronUp,
  Terminal,
  Clock,
  Sparkles,
} from 'lucide-react';

export default function CompilationErrorModal({
  isOpen,
  onClose,
  errorInfo,
  onDownloadTex,
  onOpenOverleaf,
}) {
  const [showLogs, setShowLogs] = useState(true);

  if (!isOpen || !errorInfo) return null;

  const isTimeout = Boolean(errorInfo.isTimeout);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 bg-zinc-950/50">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg border ${
              isTimeout
                ? 'bg-amber-950/40 text-amber-400 border-amber-800/60'
                : 'bg-rose-950/40 text-rose-400 border-rose-800/60'
            }`}>
              {isTimeout ? <Clock className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                {isTimeout ? 'Cloud Compilation Timed Out (>7s)' : 'LaTeX Compilation Error'}
              </h3>
              <p className="text-[11px] text-zinc-400">
                Primary cloud compiler (latexonline.cc) could not finish in time
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 overflow-y-auto">
          <p className="text-xs text-zinc-300 leading-relaxed">
            {errorInfo.message || 'An error occurred while compiling your resume via latexonline.cc.'}
          </p>

          {/* Fallback Action Buttons Callout */}
          <div className="p-3.5 rounded-lg bg-zinc-950 border border-zinc-800 space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-200">
              <Sparkles className="w-4 h-4 text-zinc-400" />
              <span>Recommended Fallback Options</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-normal">
              You can instantly download the raw <code className="text-zinc-300">.tex</code> file to compile locally, or dispatch it to Overleaf with a single click:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => {
                  onDownloadTex();
                  onClose();
                }}
                className="w-full px-3.5 py-2 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-200 border border-zinc-800 font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <Download className="w-4 h-4 text-zinc-400" />
                <span>Download .tex File</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onOpenOverleaf();
                  onClose();
                }}
                className="w-full px-3.5 py-2 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs flex items-center justify-center gap-2 transition-colors shadow-sm"
              >
                <ExternalLink className="w-4 h-4 text-zinc-950" />
                <span>Open in Overleaf</span>
              </button>
            </div>
          </div>

          {/* Diagnostic Log */}
          {errorInfo.log && (
            <div className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-950">
              <button
                type="button"
                onClick={() => setShowLogs(!showLogs)}
                className="w-full px-3 py-2 bg-zinc-900 hover:bg-zinc-800/80 text-zinc-400 hover:text-zinc-200 text-xs flex items-center justify-between transition-colors select-none"
              >
                <span className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                  Diagnostic Output / Log
                </span>
                {showLogs ? (
                  <ChevronUp className="w-3.5 h-3.5 text-zinc-500" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                )}
              </button>

              {showLogs && (
                <pre className="p-3 text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-44 leading-relaxed whitespace-pre-wrap bg-zinc-950 border-t border-zinc-800">
                  {errorInfo.log}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition-colors"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}
