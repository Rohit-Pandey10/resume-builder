import React, { useState } from 'react';
import { Plus, Trash2, Copy, ChevronDown, X } from 'lucide-react';
import {
  Button,
  IconButton,
  Field,
  Input,
  Textarea,
  Checkbox,
  EmptyState,
} from '../primitives';

const normalizeBullet = (bullet) => {
  if (typeof bullet === 'string') return { text: bullet, enabled: true };
  if (bullet && typeof bullet === 'object') {
    return {
      text: bullet.text ?? bullet.bullet ?? '',
      enabled: bullet.enabled !== false,
    };
  }
  return { text: String(bullet || ''), enabled: true };
};

export default function ExperienceSection({ experience = [], onChange, onNotify }) {
  const [expandedIdx, setExpandedIdx] = useState(0);

  const handleAddJob = () => {
    const newIdx = experience.length;
    onChange([
      ...experience,
      {
        company: '',
        role: '',
        location: '',
        startDate: '',
        endDate: '',
        bullets: [{ text: '', enabled: true }],
        enabled: true,
      },
    ]);
    setExpandedIdx(newIdx);
  };

  const handleDuplicateJob = (jobIdx, e) => {
    e?.stopPropagation();
    const orig = experience[jobIdx];
    if (!orig) return;
    const cloned = JSON.parse(JSON.stringify(orig));
    delete cloned._id;
    cloned.role = orig.role ? `${orig.role} (Copy)` : 'Role (Copy)';

    const updated = [
      ...experience.slice(0, jobIdx + 1),
      cloned,
      ...experience.slice(jobIdx + 1),
    ];
    onChange(updated);
    setExpandedIdx(jobIdx + 1);
    onNotify?.(`Duplicated "${orig.company || 'experience entry'}".`, 'success');
  };

  const handleUpdateJob = (jobIdx, field, value) => {
    const updated = [...experience];
    updated[jobIdx] = {
      ...updated[jobIdx],
      [field]: value,
    };
    onChange(updated);
  };

  const handleDeleteJob = (jobIdx, e) => {
    e?.stopPropagation();
    onChange(experience.filter((_, i) => i !== jobIdx));
    if (expandedIdx === jobIdx) {
      setExpandedIdx(Math.max(0, jobIdx - 1));
    }
  };

  const handleToggleJob = (jobIdx, e) => {
    e?.stopPropagation();
    const updated = [...experience];
    updated[jobIdx] = {
      ...updated[jobIdx],
      enabled: !updated[jobIdx].enabled,
    };
    onChange(updated);
  };

  // Bullet management
  const handleAddBullet = (jobIdx) => {
    const updated = [...experience];
    const currentBullets = updated[jobIdx].bullets || [];
    updated[jobIdx] = {
      ...updated[jobIdx],
      bullets: [...currentBullets, { text: '', enabled: true }],
    };
    onChange(updated);
  };

  const handleUpdateBulletText = (jobIdx, bulletIdx, text) => {
    const updated = [...experience];
    const bullets = [...(updated[jobIdx].bullets || [])];
    const current = normalizeBullet(bullets[bulletIdx]);
    bullets[bulletIdx] = { ...current, text };
    updated[jobIdx] = { ...updated[jobIdx], bullets };
    onChange(updated);
  };

  const handleToggleBullet = (jobIdx, bulletIdx) => {
    const updated = [...experience];
    const bullets = [...(updated[jobIdx].bullets || [])];
    const current = normalizeBullet(bullets[bulletIdx]);
    bullets[bulletIdx] = {
      ...current,
      enabled: !current.enabled,
    };
    updated[jobIdx] = { ...updated[jobIdx], bullets };
    onChange(updated);
  };

  const handleDeleteBullet = (jobIdx, bulletIdx) => {
    const updated = [...experience];
    const bullets = (updated[jobIdx].bullets || []).filter((_, i) => i !== bulletIdx);
    updated[jobIdx] = { ...updated[jobIdx], bullets };
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
            Experience
          </h2>
          <p
            className="text-xs mt-0.5"
            style={{ color: 'var(--color-text-secondary, #57534E)' }}
          >
            Work history, internships, and key accomplishments.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleAddJob}>
          <Plus size={14} strokeWidth={1.5} />
          <span>Add experience</span>
        </Button>
      </div>

      {/* Entries List */}
      <div className="space-y-2">
        {experience.length === 0 ? (
          <EmptyState
            action={
              <Button variant="secondary" size="sm" onClick={handleAddJob}>
                <Plus size={14} strokeWidth={1.5} />
                <span>Add experience</span>
              </Button>
            }
          >
            No experience entries added yet.
          </EmptyState>
        ) : (
          experience.map((exp, jobIdx) => {
            const isExpanded = expandedIdx === jobIdx;
            const normalizedBullets = (exp.bullets || []).map(normalizeBullet);
            const activeBulletsCount = normalizedBullets.filter((b) => b.enabled).length;
            const totalBulletsCount = normalizedBullets.length;
            const subtitle = [
              exp.role,
              exp.startDate || exp.endDate ? `${exp.startDate || ''} – ${exp.endDate || ''}` : '',
              `${activeBulletsCount}/${totalBulletsCount} bullets`,
            ]
              .filter(Boolean)
              .join(' · ');

            return (
              <div
                key={jobIdx}
                className="border rounded transition-colors"
                style={{
                  borderColor: isExpanded ? 'var(--color-border-strong, #D6CFC3)' : 'var(--color-border, #E7E2DA)',
                  backgroundColor: exp.enabled !== false ? '#FFFFFF' : 'var(--color-surface-subtle, #F5F2EC)',
                  opacity: exp.enabled !== false ? 1 : 0.6,
                }}
              >
                {/* 1-Line Collapsible Summary Header */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedIdx(isExpanded ? null : jobIdx)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedIdx(isExpanded ? null : jobIdx);
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
                        checked={exp.enabled !== false}
                        onChange={() => handleToggleJob(jobIdx)}
                        title={exp.enabled !== false ? 'Enabled in resume' : 'Disabled'}
                      />
                    </div>
                    <div className="min-w-0">
                      <div
                        className="text-xs font-medium truncate"
                        style={{ color: 'var(--color-text-primary, #1C1917)' }}
                      >
                        {exp.company || `Experience #${jobIdx + 1}`}
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
                    <IconButton onClick={(e) => handleDuplicateJob(jobIdx, e)} title="Duplicate">
                      <Copy size={14} strokeWidth={1.5} />
                    </IconButton>
                    <IconButton danger onClick={(e) => handleDeleteJob(jobIdx, e)} title="Delete">
                      <Trash2 size={14} strokeWidth={1.5} />
                    </IconButton>
                    <IconButton
                      onClick={() => setExpandedIdx(isExpanded ? null : jobIdx)}
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
                      <Field label="Company">
                        <Input
                          value={exp.company || ''}
                          onChange={(e) => handleUpdateJob(jobIdx, 'company', e.target.value)}
                          placeholder="Acme Corp"
                        />
                      </Field>

                      <Field label="Role / Title">
                        <Input
                          value={exp.role || ''}
                          onChange={(e) => handleUpdateJob(jobIdx, 'role', e.target.value)}
                          placeholder="Software Engineer"
                        />
                      </Field>

                      <Field label="Location">
                        <Input
                          value={exp.location || ''}
                          onChange={(e) => handleUpdateJob(jobIdx, 'location', e.target.value)}
                          placeholder="New York, NY (or Remote)"
                        />
                      </Field>

                      <div className="grid grid-cols-2 gap-2">
                        <Field label="Start date">
                          <Input
                            value={exp.startDate || ''}
                            onChange={(e) => handleUpdateJob(jobIdx, 'startDate', e.target.value)}
                            placeholder="Jun 2023"
                          />
                        </Field>
                        <Field label="End date">
                          <Input
                            value={exp.endDate || ''}
                            onChange={(e) => handleUpdateJob(jobIdx, 'endDate', e.target.value)}
                            placeholder="Present"
                          />
                        </Field>
                      </div>
                    </div>

                    {/* Bullet Points */}
                    <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border, #E7E2DA)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary, #1C1917)' }}>
                          Bullet points ({activeBulletsCount}/{totalBulletsCount})
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddBullet(jobIdx)}
                        >
                          <Plus size={12} strokeWidth={1.5} />
                          <span>Add bullet</span>
                        </Button>
                      </div>

                      <div className="space-y-1.5">
                        {normalizedBullets.map((bullet, bulletIdx) => (
                          <div
                            key={bulletIdx}
                            className="flex items-start gap-2 p-1.5 rounded border transition-colors"
                            style={{
                              borderColor: 'var(--color-border, #E7E2DA)',
                              backgroundColor: bullet.enabled ? '#FFFFFF' : 'var(--color-surface-subtle, #F5F2EC)',
                              opacity: bullet.enabled ? 1 : 0.6,
                            }}
                          >
                            <div className="mt-1">
                              <Checkbox
                                checked={bullet.enabled}
                                onChange={() => handleToggleBullet(jobIdx, bulletIdx)}
                                title={bullet.enabled ? 'Enabled in resume' : 'Disabled'}
                              />
                            </div>

                            <Textarea
                              inline
                              rows={2}
                              value={bullet.text || ''}
                              onChange={(e) => handleUpdateBulletText(jobIdx, bulletIdx, e.target.value)}
                              placeholder="Describe your accomplishment or impact…"
                            />

                            <IconButton
                              danger
                              onClick={() => handleDeleteBullet(jobIdx, bulletIdx)}
                              title="Remove bullet"
                            >
                              <X size={14} strokeWidth={1.5} />
                            </IconButton>
                          </div>
                        ))}
                      </div>
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
