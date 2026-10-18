import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown } from '../icons';
import { estimatePageBudget } from '../../utils/pageBudgetEstimator.js';

/**
 * PageBudgetGauge Component
 *
 * Displays single-page budget status:
 * - Safe (<85% budget): Green dot, "38/48 lines · 1 page"
 * - Near Limit (85–100%): Amber dot, "45/48 lines · Tight"
 * - Overflow (>100%): Red dot, "53/48 lines · 2 pages"
 */
export default function PageBudgetGauge({ profile, _compact = false }) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef(null);

  const budget = useMemo(() => {
    return estimatePageBudget(profile);
  }, [profile]);

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

  const statusConfig = {
    safe: {
      barColor: 'var(--ink-600)',
      tagText: '1 page',
      shortTagText: '1 pg',
      advice: 'Content fits comfortably on a single page.',
    },
    warning: {
      barColor: 'var(--warning)',
      tagText: 'Tight',
      shortTagText: 'Tight',
      advice: 'Content is close to the 1-page ceiling.',
    },
    overflow: {
      barColor: 'var(--danger)',
      tagText: '2 pages',
      shortTagText: '2 pg',
      advice: 'Content will likely spill onto page 2. Toggle off 2–3 bullets.',
    },
  }[status] || {
    barColor: 'var(--ink-600)',
    tagText: '',
    shortTagText: '',
    advice: '',
  };

  const sectionsList = [
    { key: 'header', label: 'Header & contact', lines: breakdown.header },
    { key: 'experience', label: 'Experience', lines: breakdown.experience },
    { key: 'projects', label: 'Projects', lines: breakdown.projects },
    { key: 'skills', label: 'Skills', lines: breakdown.skills },
    { key: 'education', label: 'Education', lines: breakdown.education },
    { key: 'customSections', label: 'Custom sections', lines: breakdown.customSections },
  ].filter((s) => s.lines > 0);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="jr-page-budget-trigger flex items-center gap-1.5 px-2 py-1 rounded border text-xs cursor-pointer select-none bg-white hover:bg-surface-subtle"
        style={{
          borderColor: 'var(--border)',
          color: 'var(--ink-600)',
        }}
        title={`Page budget: ${estimatedLines}/${maxBudget} lines · ${statusConfig.tagText}`}
        aria-expanded={isOpen}
      >

        <span className="jr-budget-full font-medium" style={{ color: 'var(--ink-900)' }}>
          {estimatedLines}/{maxBudget} lines · {statusConfig.tagText}
        </span>
        <span className="jr-budget-short font-medium" style={{ color: 'var(--ink-900)' }}>
          {estimatedLines}/{maxBudget} · {statusConfig.shortTagText}
        </span>

        {/* Mini meter bar */}
        <div
          className="w-8 h-1 rounded overflow-hidden hidden sm:block ml-0.5"
          style={{ backgroundColor: 'var(--border)' }}
        >
          <div
            className="h-full"
            style={{
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: statusConfig.barColor,
            }}
          />
        </div>

        <ChevronDown
          size={12}
          strokeWidth={1.5}
          style={{
            color: 'var(--ink-500)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform var(--duration-fast, 120ms) var(--ease-out)',
          }}
        />
      </button>

      {/* Popover Breakdown Dialog */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1.5 w-72 rounded p-3 z-50 text-xs space-y-3 bg-white border"
          style={{
            borderColor: 'var(--border)',
            borderRadius: 'var(--r-md)',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between pb-2 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <span className="font-semibold text-xs" style={{ color: 'var(--ink-900)' }}>
              Page budget
            </span>
            <span className="text-[11px] font-medium" style={{ color: 'var(--ink-600)' }}>
              {percentage}% used
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div
              className="w-full h-1.5 rounded overflow-hidden"
              style={{ backgroundColor: 'var(--border)' }}
            >
              <div
                className="h-full"
                style={{
                  width: `${Math.min(percentage, 100)}%`,
                  backgroundColor: statusConfig.barColor,
                }}
              />
            </div>
            <p className="text-[11px]" style={{ color: 'var(--ink-600)' }}>
              {statusConfig.advice}
            </p>
          </div>

          {/* Breakdown per Section */}
          <div className="space-y-1.5 pt-1">
            <div
              className="text-[11px] font-medium"
              style={{ color: 'var(--ink-500)' }}
            >
              Line count breakdown
            </div>
            {sectionsList.map((sec) => (
              <div key={sec.key} className="flex items-center justify-between text-xs py-0.5">
                <span style={{ color: 'var(--ink-900)' }}>{sec.label}</span>
                <span className="font-medium" style={{ color: 'var(--ink-600)' }}>
                  {sec.lines} {sec.lines === 1 ? 'line' : 'lines'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
