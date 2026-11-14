import React, { useRef, useEffect } from 'react';
import { CaretLeft, CaretRight, Check, EyeOff } from './icons';

const labels = {
  basics: 'Personal info',
  education: 'Education',
  experience: 'Experience',
  projects: 'Projects',
  skills: 'Skills',
  customSections: 'Custom',
};

function hasContent(profile, key) {
  if (key === 'basics') return Boolean(profile?.basics?.fullName && profile?.basics?.email);
  if (key === 'skills') {
    return (Array.isArray(profile?.skills) ? profile.skills : []).some(
      (category) => category?.enabled !== false && (category.items || []).some((item) => String(item || '').trim())
    );
  }
  const primary = { education: 'institution', experience: 'company', projects: 'title' }[key];
  return (profile?.[key] || []).some((entry) => entry?.enabled !== false && String(entry?.[primary] || '').trim());
}

export default function EditorStepper({ order, activeSection, profile, onSelect }) {
  const buttonsRef = useRef([]);
  const chipsRef = useRef([]);
  const steps = ['basics', ...order];
  const currentIndex = Math.max(0, steps.indexOf(activeSection));

  useEffect(() => {
    const chip = chipsRef.current[currentIndex];
    if (chip) {
      chip.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentIndex]);

  const moveFocus = (index, direction) => {
    const next = (index + direction + steps.length) % steps.length;
    buttonsRef.current[next]?.focus();
    onSelect(steps[next]);
  };

  return (
    <div className="jr-stepper-container">
      {/* ── COMPACT MOBILE STEPPER: <640px ── */}
      <div className="jr-stepper-compact">
        <div className="jr-stepper-compact-header">
          <div className="jr-stepper-compact-info">
            <span className="jr-stepper-compact-caption">Section {currentIndex + 1} of {steps.length}</span>
            <h2 className="jr-stepper-compact-title" role="heading" aria-level="2">
              {labels[activeSection] || activeSection}
            </h2>
          </div>
          <div className="jr-stepper-compact-nav">
            <button
              type="button"
              className="jr-stepper-nav-btn"
              disabled={currentIndex === 0}
              onClick={() => onSelect(steps[currentIndex - 1])}
              aria-label="Previous step"
              title="Previous step"
            >
              <CaretLeft size={18} />
            </button>
            <button
              type="button"
              className="jr-stepper-nav-btn"
              disabled={currentIndex === steps.length - 1}
              onClick={() => onSelect(steps[currentIndex + 1])}
              aria-label="Next step"
              title="Next step"
            >
              <CaretRight size={18} />
            </button>
          </div>
        </div>

        {/* Horizontal Scrollable Section Chips Rail */}
        <div
          className="jr-stepper-chip-rail"
          role="tablist"
          aria-label="Resume step progress"
        >
          {steps.map((stepKey, idx) => {
            const hidden = stepKey !== 'basics' && profile?.[`${stepKey}Enabled`] === false;
            const isCurrent = idx === currentIndex;
            const done = !hidden && hasContent(profile, stepKey);
            const stepName = labels[stepKey] || stepKey;

            return (
              <button
                key={stepKey}
                ref={(node) => { chipsRef.current[idx] = node; }}
                type="button"
                role="tab"
                aria-selected={isCurrent}
                aria-label={stepName}
                title={stepName}
                className={`jr-mobile-step-chip${isCurrent ? ' is-active' : ''}${done ? ' is-done' : ''}${hidden ? ' is-hidden' : ''}`}
                onClick={() => onSelect(stepKey)}
              >
                <span className="jr-step-chip-dot">
                  {hidden ? (
                    <EyeOff size={12} />
                  ) : done && !isCurrent ? (
                    <Check size={12} weight="bold" />
                  ) : (
                    <span className="jr-step-chip-num">{idx + 1}</span>
                  )}
                </span>
                <span className="jr-step-chip-label">{stepName}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── FULL STEPPER: >=640px ── */}
      <nav className="jr-editor-stepper" aria-label="Resume sections">
        {steps.map((key, index) => {
          const hidden = key !== 'basics' && profile?.[`${key}Enabled`] === false;
          const active = activeSection === key;
          const done = !hidden && hasContent(profile, key);
          return (
            <button
              key={key}
              ref={(node) => { buttonsRef.current[index] = node; }}
              type="button"
              className={`jr-editor-step${active ? ' is-active' : ''}${done ? ' is-done' : ''}${hidden ? ' is-hidden' : ''}`}
              aria-current={active ? 'step' : undefined}
              tabIndex={active ? 0 : -1}
              onClick={() => onSelect(key)}
              onKeyDown={(event) => {
                if (event.key === 'ArrowRight') {
                  event.preventDefault();
                  moveFocus(index, 1);
                }
                if (event.key === 'ArrowLeft') {
                  event.preventDefault();
                  moveFocus(index, -1);
                }
              }}
            >
              <span className="jr-editor-step-circle">
                {hidden ? <EyeOff size={15} /> : done && !active ? <Check size={16} weight="bold" /> : index + 1}
              </span>
              <span className="jr-editor-step-label">{labels[key] || key}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
