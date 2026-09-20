import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  Info,
  Sliders,
  Layers,
  Sparkles,
} from 'lucide-react';
import { estimatePageBudget } from '../../utils/pageBudgetEstimator.js';

/**
 * PageBudgetGauge Component
 *
 * Displays a live, proactive metric in the UI so users know whether their
 * resume will comfortably fit on 1 page or spill onto page 2 before compiling.
 *
 * States:
 * - Safe (<85% budget): Subtle emerald badge (e.g. "38 / 48 lines • 1 Page Fit")
 * - Near Limit (85–100%): Amber warning badge (e.g. "45 / 48 lines • Tight fit")
 * - Overflow (>100%): Red badge with alert icon (e.g. "53 / 48 lines • Likely 2 pages!")
 *
 * Clicking toggles a detailed section-by-section breakdown popover.
 */
export default function PageBudgetGauge({ profile, compact = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  const budget = useMemo(() => {
    return estimatePageBudget(profile);
  }, [profile]);

  // Dismiss popover when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const { estimatedLines, maxBudget, percentage, status, breakdown } = budget;

  // Status configuration
  const config = {
    safe: {
      badgeClass:
        'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700',
      dotClass: 'bg-emerald-400',
      barColor: 'bg-emerald-500',
      tagText: '1 Page Fit',
      advice: 'Your resume comfortably fits on a single page.',
    },
    warning: {
      badgeClass:
        'bg-zinc-900 text-amber-300 border-amber-800/60 hover:bg-zinc-800',
      dotClass: 'bg-amber-400',
      barColor: 'bg-amber-500',
      tagText: 'Tight fit',
      advice: 'Content is close to the 1-page ceiling. Check spacing after compilation.',
    },
    overflow: {
      badgeClass:
        'bg-zinc-900 text-rose-300 border-rose-800/60 hover:bg-zinc-800',
      dotClass: 'bg-rose-400 animate-pulse',
      barColor: 'bg-rose-500',
      tagText: 'Likely 2 pages!',
      advice: 'Likely spills to page 2! Consider toggling off 2–3 bullets or shortening text.',
    },
  }[status] || {
    badgeClass: 'bg-zinc-900 text-zinc-300 border-zinc-800',
    dotClass: 'bg-zinc-400',
    barColor: 'bg-zinc-500',
    tagText: '',
    advice: '',
  };

  // Section breakdown rows
  const sectionsList = [
    { key: 'header', label: 'Header & Contact', lines: breakdown.header },
    { key: 'experience', label: 'Work Experience', lines: breakdown.experience },
    { key: 'projects', label: 'Projects', lines: breakdown.projects },
    { key: 'skills', label: 'Technical Skills', lines: breakdown.skills },
    { key: 'education', label: 'Education', lines: breakdown.education },
    { key: 'customSections', label: 'Custom Sections', lines: breakdown.customSections },
  ].filter((s) => s.lines > 0);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Trigger Button - Clean Micro-Pill */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-xs font-mono transition-all select-none cursor-pointer ${config.badgeClass}`}
        title="Click to view single-page budget breakdown"
      >
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${config.dotClass}`} />

        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-zinc-200">
            {estimatedLines}/{maxBudget} lines
          </span>
          <span className="text-[10px] text-zinc-500">•</span>
          <span className="font-medium">{config.tagText}</span>
        </div>

        {/* Mini Meter Bar */}
        <div className="w-10 h-1.5 bg-zinc-950 rounded-full overflow-hidden ml-1 border border-zinc-800 hidden sm:block">
          <div
            className={`h-full rounded-full transition-all duration-300 ${config.barColor}`}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>

        <ChevronDown
          className={`w-3 h-3 opacity-60 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Popover Breakdown Dialog */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-88 rounded-xl bg-zinc-900 border border-zinc-800 shadow-xl p-4 z-50 text-zinc-200 animate-in fade-in zoom-in-95 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700">
                <Layers className="w-4 h-4" />
              </div>
              <span className="font-semibold text-xs text-zinc-200 uppercase tracking-wider">
                1-Page Budget Breakdown
              </span>
            </div>
            <span
              className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${config.badgeClass}`}
            >
              {percentage}% used
            </span>
          </div>

          {/* Meter Bar & Total */}
          <div className="mt-3.5 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">Total Vertical Usage:</span>
              <span className="font-semibold text-zinc-100">
                {estimatedLines} / {maxBudget} lines
              </span>
            </div>
            <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 relative">
              <div
                className={`h-full rounded-full transition-all duration-300 ${config.barColor}`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>0% (Empty)</span>
              <span>85% (Tight)</span>
              <span>100% (Limit: {maxBudget} lines)</span>
            </div>
          </div>

          {/* Advice / Status Message */}
          <div
            className={`mt-3 p-2.5 rounded-md text-xs leading-relaxed border ${
              status === 'overflow'
                ? 'bg-rose-950/30 border-rose-800/60 text-rose-200'
                : status === 'warning'
                ? 'bg-amber-950/30 border-amber-800/60 text-amber-200'
                : 'bg-emerald-950/30 border-emerald-800/60 text-emerald-200'
            }`}
          >
            <p className="flex items-start gap-1.5">
              <span className="mt-0.5">•</span>
              <span>{config.advice}</span>
            </p>
          </div>

          {/* Section-by-Section Consumption Table */}
          <div className="mt-3.5 space-y-2">
            <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders className="w-3 h-3 text-zinc-500" />
              <span>Lines by Section</span>
            </div>

            <div className="space-y-1.5 bg-zinc-950 p-2.5 rounded-md border border-zinc-800">
              {sectionsList.map((sec) => {
                const secPct = Math.round((sec.lines / maxBudget) * 100);
                return (
                  <div
                    key={sec.key}
                    className="flex items-center justify-between text-xs py-0.5 font-mono"
                  >
                    <span className="text-zinc-300 text-[11px]">{sec.label}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-400 text-[11px]">
                        ~{sec.lines} {sec.lines === 1 ? 'line' : 'lines'}
                      </span>
                      <span className="text-[10px] text-zinc-500 w-9 text-right">
                        ({secPct}%)
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Pro-Tip Footer */}
          <div className="mt-3 pt-2.5 border-t border-zinc-800 text-[11px] text-zinc-400 flex items-start gap-1.5 leading-normal">
            <span className="w-1.5 h-1.5 rounded-full bg-zinc-400 mt-1.5 flex-shrink-0" />
            <span>
              <strong className="text-zinc-300">Tip:</strong> Toggle off less relevant bullets in the editor to instantly check fit without losing your text.
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
