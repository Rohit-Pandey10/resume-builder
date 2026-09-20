import React from 'react';
import {
  FileText,
  Cpu,
  ExternalLink,
  Download,
  ShieldCheck,
  CheckCircle2,
  CheckCircle,
  Loader2,
  Sparkles,
  Eye,
  Layers,
} from 'lucide-react';
import PageBudgetGauge from './PageBudgetGauge.jsx';

export default function PdfPreviewPlaceholder({
  profile,
  onCompilePdf,
  onDownloadTex,
  onOpenOverleaf,
  isCompiling = false,
  lastCompiledPdfUrl = null,
}) {
  const activeEdu = (profile?.education || []).filter((e) => e.enabled).length;
  const activeExp = (profile?.experience || []).filter((e) => e.enabled).length;
  const activeProj = (profile?.projects || []).filter((p) => p.enabled).length;
  const totalActiveBullets =
    (profile?.experience || []).reduce(
      (acc, exp) => (exp.enabled ? acc + (exp.bullets || []).filter((b) => b.enabled).length : acc),
      0
    ) +
    (profile?.projects || []).reduce(
      (acc, proj) => (proj.enabled ? acc + (proj.bullets || []).filter((b) => b.enabled).length : acc),
      0
    );

  return (
    <div className="flex flex-col h-full bg-zinc-950 border border-zinc-800 rounded-xl overflow-hidden p-5 space-y-5 overflow-y-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3.5 border-b border-zinc-800 flex-shrink-0">
        <div>
          <h3 className="text-base font-semibold text-zinc-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-zinc-400" />
            3-Tier Compilation Engine
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Status and live ATS metrics for <span className="text-zinc-200 font-medium">{profile?.profileName || 'Active Resume'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Live Single-Page Budget Gauge */}
          {profile && <PageBudgetGauge profile={profile} />}

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-800 text-xs font-medium font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            Engine Operational
          </div>
        </div>
      </div>

      {/* Embedded PDF Viewer (if compiled) */}
      {lastCompiledPdfUrl && (
        <div className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg space-y-2 flex-shrink-0">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-200 flex items-center gap-1.5">
              <Eye className="w-4 h-4 text-zinc-400" />
              Latest Compiled PDF Available
            </span>
            <a
              href={lastCompiledPdfUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-300 hover:text-white text-xs flex items-center gap-1 font-medium"
            >
              Open in New Window <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <div className="h-64 rounded-md overflow-hidden border border-zinc-800 bg-zinc-950">
            <iframe
              src={lastCompiledPdfUrl}
              title="Compiled Resume PDF"
              className="w-full h-full"
            />
          </div>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-shrink-0">
        <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-center">
          <div className="text-xl font-bold text-zinc-100 font-mono">{activeEdu}</div>
          <div className="text-[11px] text-zinc-400">Education Entries</div>
        </div>
        <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-center">
          <div className="text-xl font-bold text-zinc-100 font-mono">{activeExp}</div>
          <div className="text-[11px] text-zinc-400">Active Jobs</div>
        </div>
        <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-center">
          <div className="text-xl font-bold text-zinc-100 font-mono">{activeProj}</div>
          <div className="text-[11px] text-zinc-400">Active Projects</div>
        </div>
        <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg text-center">
          <div className="text-xl font-bold text-zinc-200 font-mono">{totalActiveBullets}</div>
          <div className="text-[11px] text-zinc-400">Active Bullets</div>
        </div>
      </div>

      {/* ATS Compliance Checklist */}
      <div className="p-4 rounded-lg bg-zinc-900/40 border border-zinc-800 space-y-2.5 text-xs flex-shrink-0">
        <div className="flex items-center gap-2 font-semibold text-zinc-200">
          <ShieldCheck className="w-4 h-4 text-zinc-400" />
          ATS Compliance Pre-checks
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-zinc-400">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>Standard Jake's 1-column layout</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>glyphtounicode & pdfgentounicode=1</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>Selectable text without graphical tables</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>LaTeX character sanitization active</span>
          </div>
        </div>
      </div>

      {/* 3-Tier Compilation Architecture Controls */}
      <div className="space-y-3 flex-shrink-0">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
          Compilation Engine Controls & Fallbacks
        </h4>

        <div className="space-y-2.5 text-xs">
          {/* Tier 1 */}
          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-zinc-900/50 border border-zinc-800">
            <div className="p-2 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/60 flex-shrink-0">
              <Cpu className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-zinc-200">Tier 1: Primary Cloud Compiler (latexonline.cc)</div>
              <p className="text-zinc-400 text-[11px] mt-0.5 leading-normal">
                Direct compilation returning PDF binary download.
              </p>
            </div>
            <button
              type="button"
              onClick={onCompilePdf}
              disabled={isCompiling}
              className="px-3.5 py-1.5 rounded-md bg-zinc-100 hover:bg-white text-zinc-950 font-medium text-xs transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50 flex-shrink-0"
            >
              {isCompiling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Compiling...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Compile PDF</span>
                </>
              )}
            </button>
          </div>

          {/* Tier 2 */}
          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-zinc-900/50 border border-zinc-800">
            <div className="p-2 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/60 flex-shrink-0">
              <Download className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-zinc-200">Tier 2: Fallback 1 — Direct .tex Download</div>
              <p className="text-zinc-400 text-[11px] mt-0.5 leading-normal">
                Instant client-side Blob generation of raw source for local pdflatex compilation.
              </p>
            </div>
            <button
              type="button"
              onClick={onDownloadTex}
              className="px-3.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-medium text-xs transition-colors flex items-center gap-1.5 flex-shrink-0"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Download .tex</span>
            </button>
          </div>

          {/* Tier 3 */}
          <div className="flex items-start gap-3 p-3.5 rounded-lg bg-zinc-900/50 border border-zinc-800">
            <div className="p-2 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/60 flex-shrink-0">
              <ExternalLink className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="font-semibold text-zinc-200">Tier 3: Fallback 2 — 1-Click Overleaf Dispatch</div>
              <p className="text-zinc-400 text-[11px] mt-0.5 leading-normal">
                HTML form dispatch into Overleaf Web IDE with populated template for collaborative editing.
              </p>
            </div>
            <button
              type="button"
              onClick={onOpenOverleaf}
              className="px-3.5 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 font-medium text-xs transition-colors flex items-center gap-1.5 flex-shrink-0"
            >
              <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
              <span>Open in Overleaf</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
