import React, { useState } from 'react';
import { Plus, Trash2, Copy, ChevronDown } from 'lucide-react';
import {
  Button,
  IconButton,
  Field,
  Input,
  Checkbox,
  EmptyState,
} from '../primitives';

export default function EducationSection({ education = [], onChange, onNotify }) {
  const [expandedIdx, setExpandedIdx] = useState(0);

  const handleAdd = () => {
    const newIdx = education.length;
    onChange([
      ...education,
      {
        institution: '',
        degree: '',
        location: '',
        startDate: '',
        endDate: '',
        gpa: '',
        enabled: true,
      },
    ]);
    setExpandedIdx(newIdx);
  };

  const handleDuplicate = (index, e) => {
    e?.stopPropagation();
    const orig = education[index];
    if (!orig) return;
    const cloned = JSON.parse(JSON.stringify(orig));
    delete cloned._id;
    cloned.institution = orig.institution ? `${orig.institution} (Copy)` : 'Institution (Copy)';

    const updated = [
      ...education.slice(0, index + 1),
      cloned,
      ...education.slice(index + 1),
    ];
    onChange(updated);
    setExpandedIdx(index + 1);
    onNotify?.(`Duplicated "${orig.institution || 'education entry'}".`, 'success');
  };

  const handleUpdate = (index, field, value) => {
    const updated = [...education];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange(updated);
  };

  const handleDelete = (index, e) => {
    e?.stopPropagation();
    onChange(education.filter((_, i) => i !== index));
    if (expandedIdx === index) {
      setExpandedIdx(Math.max(0, index - 1));
    }
  };

  const handleToggle = (index, e) => {
    e?.stopPropagation();
    const updated = [...education];
    updated[index] = {
      ...updated[index],
      enabled: !updated[index].enabled,
    };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2
            className="text-lg font-semibold tracking-tight"
            style={{ color: 'var(--color-text-primary, #1C1917)' }}
          >
            Education
          </h2>
          <p
            className="text-xs mt-0.5"
            style={{ color: 'var(--color-text-secondary, #57534E)' }}
          >
            Degrees, schools, coursework, and graduation dates.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleAdd}>
          <Plus size={14} strokeWidth={1.5} />
          <span>Add education</span>
        </Button>
      </div>

      {/* Entries List */}
      <div className="space-y-2">
        {education.length === 0 ? (
          <EmptyState
            action={
              <Button variant="secondary" size="sm" onClick={handleAdd}>
                <Plus size={14} strokeWidth={1.5} />
                <span>Add education</span>
              </Button>
            }
          >
            No education entries added yet.
          </EmptyState>
        ) : (
          education.map((edu, idx) => {
            const isExpanded = expandedIdx === idx;
            const subtitle = [edu.degree, edu.endDate ? `Grad: ${edu.endDate}` : '']
              .filter(Boolean)
              .join(' · ');

            return (
              <div
                key={idx}
                className="border rounded transition-colors"
                style={{
                  borderColor: isExpanded ? 'var(--color-border-strong, #D6CFC3)' : 'var(--color-border, #E7E2DA)',
                  backgroundColor: edu.enabled !== false ? '#FFFFFF' : 'var(--color-surface-subtle, #F5F2EC)',
                  opacity: edu.enabled !== false ? 1 : 0.6,
                }}
              >
                {/* 1-Line Collapsible Summary Header */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedIdx(isExpanded ? null : idx);
                    }
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 cursor-pointer select-none text-left"
                  style={{
                    backgroundColor: isExpanded ? 'var(--color-surface-subtle, #F5F2EC)' : 'transparent',
                    borderBottom: isExpanded ? '1px solid var(--color-border, #E7E2DA)' : 'none',
                  }}
                >
                  <div className="flex items-center gap-2.5 min-w-0 pr-2">
                    <div onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={edu.enabled !== false}
                        onChange={() => handleToggle(idx)}
                        title={edu.enabled !== false ? 'Enabled in resume' : 'Disabled'}
                      />
                    </div>
                    <div className="min-w-0">
                      <div
                        className="text-xs font-medium truncate"
                        style={{ color: 'var(--color-text-primary, #1C1917)' }}
                      >
                        {edu.institution || `Education #${idx + 1}`}
                      </div>
                      {subtitle && (
                        <div
                          className="text-[11px] truncate"
                          style={{ color: 'var(--color-text-muted, #78716C)' }}
                        >
                          {subtitle}
                        </div>
                      )}
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-1 flex-shrink-0"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <IconButton onClick={(e) => handleDuplicate(idx, e)} title="Duplicate">
                      <Copy size={14} strokeWidth={1.5} />
                    </IconButton>
                    <IconButton danger onClick={(e) => handleDelete(idx, e)} title="Delete">
                      <Trash2 size={14} strokeWidth={1.5} />
                    </IconButton>
                    <IconButton
                      onClick={() => setExpandedIdx(isExpanded ? null : idx)}
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      <ChevronDown
                        size={14}
                        strokeWidth={1.5}
                        style={{
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform var(--duration-fast, 150ms) var(--easing, ease-out)',
                        }}
                      />
                    </IconButton>
                  </div>
                </div>

                {/* Expanded Edit Form */}
                {isExpanded && (
                  <div className="p-3 space-y-3 bg-white">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Field label="Institution">
                        <Input
                          value={edu.institution || ''}
                          onChange={(e) => handleUpdate(idx, 'institution', e.target.value)}
                          placeholder="State University"
                        />
                      </Field>

                      <Field label="Degree / Major">
                        <Input
                          value={edu.degree || ''}
                          onChange={(e) => handleUpdate(idx, 'degree', e.target.value)}
                          placeholder="B.S. in Computer Science"
                        />
                      </Field>

                      <Field label="Location">
                        <Input
                          value={edu.location || ''}
                          onChange={(e) => handleUpdate(idx, 'location', e.target.value)}
                          placeholder="City, State"
                        />
                      </Field>

                      <Field label="GPA / Honors (optional)">
                        <Input
                          value={edu.gpa || ''}
                          onChange={(e) => handleUpdate(idx, 'gpa', e.target.value)}
                          placeholder="3.85 / 4.0"
                        />
                      </Field>

                      <Field label="Start date">
                        <Input
                          value={edu.startDate || ''}
                          onChange={(e) => handleUpdate(idx, 'startDate', e.target.value)}
                          placeholder="Aug 2020"
                        />
                      </Field>

                      <Field label="End date (or expected)">
                        <Input
                          value={edu.endDate || ''}
                          onChange={(e) => handleUpdate(idx, 'endDate', e.target.value)}
                          placeholder="May 2024"
                        />
                      </Field>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
