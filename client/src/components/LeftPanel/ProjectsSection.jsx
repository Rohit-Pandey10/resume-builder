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

export default function ProjectsSection({ projects = [], onChange, onNotify, onDeleteAction }) {
  const [expandedIdx, setExpandedIdx] = useState(0);
  const [techInput, setTechInput] = useState({});

  const handleAddProject = () => {
    const newIdx = projects.length;
    onChange([
      ...projects,
      {
        title: '',
        techStack: [],
        link: '',
        bullets: [{ text: '', enabled: true }],
        enabled: true,
      },
    ]);
    setExpandedIdx(newIdx);
  };

  const handleDuplicateProject = (projIdx, e) => {
    e?.stopPropagation();
    const orig = projects[projIdx];
    if (!orig) return;
    const cloned = JSON.parse(JSON.stringify(orig));
    delete cloned._id;
    cloned.title = orig.title ? `${orig.title} (Copy)` : 'Project (Copy)';

    const updated = [
      ...projects.slice(0, projIdx + 1),
      cloned,
      ...projects.slice(projIdx + 1),
    ];
    onChange(updated);
    setExpandedIdx(projIdx + 1);
    onNotify?.(`Duplicated "${orig.title || 'project'}".`, 'success');
  };

  const handleUpdateProject = (projIdx, field, value) => {
    const updated = [...projects];
    updated[projIdx] = {
      ...updated[projIdx],
      [field]: value,
    };
    onChange(updated);
  };

  const handleDeleteProject = (projIdx, e) => {
    e?.stopPropagation();
    onChange(projects.filter((_, i) => i !== projIdx));
    if (expandedIdx === projIdx) {
      setExpandedIdx(Math.max(0, projIdx - 1));
    }
    onDeleteAction?.('Project entry deleted');
  };

  const handleToggleProject = (projIdx) => {
    const updated = [...projects];
    updated[projIdx] = {
      ...updated[projIdx],
      enabled: !updated[projIdx].enabled,
    };
    onChange(updated);
  };

  // Tech stack tags
  const handleAddTech = (projIdx) => {
    const tag = (techInput[projIdx] || '').trim();
    if (!tag) return;
    const updated = [...projects];
    const currentStack = updated[projIdx].techStack || [];
    if (!currentStack.includes(tag)) {
      updated[projIdx] = {
        ...updated[projIdx],
        techStack: [...currentStack, tag],
      };
      onChange(updated);
    }
    setTechInput({ ...techInput, [projIdx]: '' });
  };

  const handleRemoveTech = (projIdx, tagToRemove) => {
    const updated = [...projects];
    updated[projIdx] = {
      ...updated[projIdx],
      techStack: (updated[projIdx].techStack || []).filter((t) => t !== tagToRemove),
    };
    onChange(updated);
  };

  // Bullets
  const handleAddBullet = (projIdx) => {
    const updated = [...projects];
    const currentBullets = updated[projIdx].bullets || [];
    updated[projIdx] = {
      ...updated[projIdx],
      bullets: [...currentBullets, { text: '', enabled: true }],
    };
    onChange(updated);
  };

  const handleUpdateBulletText = (projIdx, bulletIdx, text) => {
    const updated = [...projects];
    const bullets = [...(updated[projIdx].bullets || [])];
    const current = normalizeBullet(bullets[bulletIdx]);
    bullets[bulletIdx] = { ...current, text };
    updated[projIdx] = { ...updated[projIdx], bullets };
    onChange(updated);
  };

  const handleToggleBullet = (projIdx, bulletIdx) => {
    const updated = [...projects];
    const bullets = [...(updated[projIdx].bullets || [])];
    const current = normalizeBullet(bullets[bulletIdx]);
    bullets[bulletIdx] = {
      ...current,
      enabled: !current.enabled,
    };
    updated[projIdx] = { ...updated[projIdx], bullets };
    onChange(updated);
  };

  const handleDeleteBullet = (projIdx, bulletIdx) => {
    const updated = [...projects];
    const bullets = (updated[projIdx].bullets || []).filter((_, i) => i !== bulletIdx);
    updated[projIdx] = { ...updated[projIdx], bullets };
    onChange(updated);
    onDeleteAction?.('Bullet deleted');
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
            Projects
          </h2>
          <p
            className="text-xs mt-0.5"
            style={{ color: 'var(--color-text-secondary, #57534E)' }}
          >
            Technical projects, open-source work, and applications.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={handleAddProject}>
          <Plus size={14} strokeWidth={1.5} />
          <span>Add project</span>
        </Button>
      </div>

      {/* Projects List */}
      <div className="space-y-2">
        {projects.length === 0 ? (
          <EmptyState
            action={
              <Button variant="secondary" size="sm" onClick={handleAddProject}>
                <Plus size={14} strokeWidth={1.5} />
                <span>Add project</span>
              </Button>
            }
          >
            No projects added yet.
          </EmptyState>
        ) : (
          projects.map((proj, projIdx) => {
            const isExpanded = expandedIdx === projIdx;
            const normalizedBullets = (proj.bullets || []).map(normalizeBullet);
            const activeBulletsCount = normalizedBullets.filter((b) => b.enabled).length;
            const totalBulletsCount = normalizedBullets.length;
            const techSummary = (proj.techStack || []).slice(0, 3).join(', ');
            const subtitle = [
              techSummary,
              `${activeBulletsCount}/${totalBulletsCount} bullets`,
            ]
              .filter(Boolean)
              .join(' · ');

            return (
              <div
                key={projIdx}
                className="border rounded transition-colors"
                style={{
                  borderColor: isExpanded ? 'var(--color-border-strong, #D6CFC3)' : 'var(--color-border, #E7E2DA)',
                  backgroundColor: proj.enabled !== false ? '#FFFFFF' : 'var(--color-surface-subtle, #F5F2EC)',
                  opacity: proj.enabled !== false ? 1 : 0.6,
                }}
              >
                {/* 1-Line Collapsible Summary Header */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => setExpandedIdx(isExpanded ? null : projIdx)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setExpandedIdx(isExpanded ? null : projIdx);
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
                        checked={proj.enabled !== false}
                        onChange={() => handleToggleProject(projIdx)}
                        title={proj.enabled !== false ? 'Enabled in resume' : 'Disabled'}
                      />
                    </div>
                    <div className="min-w-0">
                      <div
                        className="text-xs font-medium truncate"
                        style={{ color: 'var(--color-text-primary, #1C1917)' }}
                      >
                        {proj.title || `Project #${projIdx + 1}`}
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
                    <IconButton onClick={(e) => handleDuplicateProject(projIdx, e)} title="Duplicate">
                      <Copy size={14} strokeWidth={1.5} />
                    </IconButton>
                    <IconButton danger onClick={(e) => handleDeleteProject(projIdx, e)} title="Delete">
                      <Trash2 size={14} strokeWidth={1.5} />
                    </IconButton>
                    <IconButton
                      onClick={() => setExpandedIdx(isExpanded ? null : projIdx)}
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
                      <Field label="Project title">
                        <Input
                          value={proj.title || ''}
                          onChange={(e) => handleUpdateProject(projIdx, 'title', e.target.value)}
                          placeholder="e.g. Distributed Task Queue"
                        />
                      </Field>

                      <Field label="Link / Repository">
                        <Input
                          value={proj.link || ''}
                          onChange={(e) => handleUpdateProject(projIdx, 'link', e.target.value)}
                          placeholder="https://github.com/username/project"
                        />
                      </Field>
                    </div>

                    {/* Tech Stack Chips */}
                    <Field label="Technologies & tools">
                      <div className="flex gap-2">
                        <Input
                          value={techInput[projIdx] || ''}
                          onChange={(e) => setTechInput({ ...techInput, [projIdx]: e.target.value })}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddTech(projIdx);
                            }
                          }}
                          placeholder="Type technology (e.g. React, Go, Docker) and press Enter"
                        />
                        <Button
                          variant="secondary"
                          onClick={() => handleAddTech(projIdx)}
                          disabled={!(techInput[projIdx] || '').trim()}
                        >
                          Add
                        </Button>
                      </div>

                      {/* Chip list */}
                      {(proj.techStack || []).length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {(proj.techStack || []).map((tech, tIdx) => (
                            <span
                              key={tIdx}
                              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border"
                              style={{
                                backgroundColor: 'var(--color-surface-subtle, #F5F2EC)',
                                borderColor: 'var(--color-border, #E7E2DA)',
                                color: 'var(--color-text-primary, #1C1917)',
                              }}
                            >
                              <span>{tech}</span>
                              <button
                                type="button"
                                onClick={() => handleRemoveTech(projIdx, tech)}
                                className="hover:text-danger"
                              >
                                <X size={12} strokeWidth={1.5} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </Field>

                    {/* Bullet Points */}
                    <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border, #E7E2DA)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary, #1C1917)' }}>
                          Bullet points ({activeBulletsCount}/{totalBulletsCount})
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleAddBullet(projIdx)}
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
                                onChange={() => handleToggleBullet(projIdx, bulletIdx)}
                                title={bullet.enabled ? 'Enabled in resume' : 'Disabled'}
                              />
                            </div>

                            <Textarea
                              inline
                              rows={2}
                              value={bullet.text || ''}
                              onChange={(e) => handleUpdateBulletText(projIdx, bulletIdx, e.target.value)}
                              placeholder="Implemented core features using…"
                            />

                            <IconButton
                              danger
                              onClick={() => handleDeleteBullet(projIdx, bulletIdx)}
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
