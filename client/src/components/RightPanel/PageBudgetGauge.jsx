import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown } from 'lucide-react';
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
      dotColor: 'var(--color-success, #15803D)',
      barColor: 'var(--color-success, #15803D)',
      tagText: '1 page',
      advice: 'Content fits comfortably on a single page.',
    },
    warning: {
      dotColor: 'var(--color-warning, #B45309)',
      barColor: 'var(--color-warning, #B45309)',
      tagText: 'Tight',
      advice: 'Content is close to the 1-page ceiling.',
    },
    overflow: {
      dotColor: 'var(--color-danger, #B91C1C)',
      barColor: 'var(--color-danger, #B91C1C)',
      tagText: '2 pages',
      advice: 'Content will likely spill onto page 2. Toggle off 2–3 bullets.',
    },
  }[status] || {
    dotColor: 'var(--color-text-muted, #78716C)',
    barColor: 'var(--color-text-muted, #78716C)',
    tagText: '',
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
        className="flex items-center gap-1.5 px-2 py-1 rounded border text-xs transition-colors cursor-pointer select-none bg-white hover:bg-surface-subtle"
        style={{
          borderColor: 'var(--color-border, #E7E2DA)',
          color: 'var(--color-text-secondary, #57534E)',
        }}
        title="View single-page budget breakdown"
        aria-expanded={isOpen}
      >
        <span
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: statusConfig.dotColor,
            flexShrink: 0,
          }}
        />

        <span className="font-medium" style={{ color: 'var(--color-text-primary, #1C1917)' }}>
          {estimatedLines}/{maxBudget} lines
        </span>
        <span style={{ color: 'var(--color-text-muted, #78716C)' }}>·</span>
        <span>{statusConfig.tagText}</span>

        {/* Mini meter bar */}
        <div
          className="w-8 h-1 rounded overflow-hidden hidden sm:block ml-0.5"
          style={{ backgroundColor: 'var(--color-border, #E7E2DA)' }}
        >
          <div
            className="h-full transition-all"
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
            color: 'var(--color-text-muted, #78716C)',
            transform: isOpen ? 'rotate(180deg)' : 'none',
            transition: 'transform var(--transition-fast, 150ms ease-out)',
          }}
        />
      </button>

      {/* Popover Breakdown Dialog */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-1.5 w-72 rounded p-3 z-50 text-xs space-y-3 bg-white border"
          style={{
            borderColor: 'var(--color-border, #E7E2DA)',
            borderRadius: 'var(--radius-panel, 10px)',
            boxShadow: 'var(--shadow-popover, 0 8px 24px rgba(28,25,23,0.08))',
          }}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between pb-2 border-b"
            style={{ borderColor: 'var(--color-border, #E7E2DA)' }}
          >
            <span className="font-semibold text-xs" style={{ color: 'var(--color-text-primary, #1C1917)' }}>
              Page budget
            </span>
            <span className="text-[11px] font-medium" style={{ color: 'var(--color-text-secondary, #57534E)' }}>
              {percentage}% used
            </span>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <div
              className="w-full h-1.5 rounded overflow-hidden"
              style={{ backgroundColor: 'var(--color-border, #E7E2DA)' }}
            >
              <div
                className="h-full transition-all"
                style={{
                  width: `${Math.min(percentage, 100)}%`,
                  backgroundColor: statusConfig.barColor,
                }}
              />
            </div>
            <p className="text-[11px]" style={{ color: 'var(--color-text-secondary, #57534E)' }}>
              {statusConfig.advice}
            </p>
          </div>

          {/* Breakdown per Section */}
          <div className="space-y-1.5 pt-1">
            <div
              className="text-[11px] font-medium"
              style={{ color: 'var(--color-text-muted, #78716C)' }}
            >
              Line count breakdown
            </div>
            {sectionsList.map((sec) => (
              <div key={sec.key} className="flex items-center justify-between text-xs py-0.5">
                <span style={{ color: 'var(--color-text-primary, #1C1917)' }}>{sec.label}</span>
                <span className="font-medium" style={{ color: 'var(--color-text-secondary, #57534E)' }}>
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
