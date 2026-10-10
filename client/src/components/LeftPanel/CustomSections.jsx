import React, { useState } from 'react';
import { Plus, Trash2, Copy, ChevronDown, X, Eye, EyeOff } from 'lucide-react';
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

export default function CustomSections({ customSections = [], onChange, onNotify, onDeleteAction }) {
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [expandedItemKeys, setExpandedItemKeys] = useState({});

  const toggleItemExpanded = (secIdx, itemIdx) => {
    const key = `${secIdx}-${itemIdx}`;
    setExpandedItemKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleCreateSection = (e) => {
    e?.preventDefault();
    const title = newSectionTitle.trim();
    if (!title) return;

    onChange([
      ...customSections,
      {
        sectionTitle: title,
        items: [],
        enabled: true,
      },
    ]);
    setNewSectionTitle('');
    setShowAddModal(false);
  };

  const handleDeleteSection = (secIdx) => {
    const title = customSections[secIdx]?.sectionTitle;
    onChange(customSections.filter((_, idx) => idx !== secIdx));
    if (onDeleteAction) {
      onDeleteAction('Custom section deleted');
    } else {
      onNotify?.(`Removed "${title || 'custom section'}".`, 'info');
    }
  };

  const handleUpdateSectionTitle = (secIdx, title) => {
    const updated = [...customSections];
    updated[secIdx] = { ...updated[secIdx], sectionTitle: title };
    onChange(updated);
  };

  const handleToggleSection = (secIdx) => {
    const updated = [...customSections];
    updated[secIdx] = {
      ...updated[secIdx],
      enabled: !updated[secIdx].enabled,
    };
    onChange(updated);
  };

  // Item operations
  const handleAddItem = (secIdx) => {
    const updated = [...customSections];
    const items = [...(updated[secIdx].items || [])];
    const newIdx = items.length;
    items.push({
      title: '',
      subtitle: '',
      date: '',
      bullets: [{ text: '', enabled: true }],
      enabled: true,
    });
    updated[secIdx] = { ...updated[secIdx], items };
    onChange(updated);
    setExpandedItemKeys((prev) => ({ ...prev, [`${secIdx}-${newIdx}`]: true }));
  };

  const handleUpdateItem = (secIdx, itemIdx, field, value) => {
    const updated = [...customSections];
    const items = [...(updated[secIdx].items || [])];
    items[itemIdx] = { ...items[itemIdx], [field]: value };
    updated[secIdx] = { ...updated[secIdx], items };
    onChange(updated);
  };

  const handleToggleItem = (secIdx, itemIdx, e) => {
    e?.stopPropagation();
    const updated = [...customSections];
    const items = [...(updated[secIdx].items || [])];
    items[itemIdx] = {
      ...items[itemIdx],
      enabled: !items[itemIdx].enabled,
    };
    updated[secIdx] = { ...updated[secIdx], items };
    onChange(updated);
  };

  const handleDeleteItem = (secIdx, itemIdx, e) => {
    e?.stopPropagation();
    const updated = [...customSections];
    const items = (updated[secIdx].items || []).filter((_, i) => i !== itemIdx);
    updated[secIdx] = { ...updated[secIdx], items };
    onChange(updated);
    onDeleteAction?.('Custom item deleted');
  };

  const handleDuplicateItem = (secIdx, itemIdx, e) => {
    e?.stopPropagation();
    const orig = customSections[secIdx]?.items?.[itemIdx];
    if (!orig) return;
    const cloned = JSON.parse(JSON.stringify(orig));
    delete cloned._id;
    cloned.title = orig.title ? `${orig.title} (Copy)` : 'Item (Copy)';

    const updated = [...customSections];
    const items = [...(updated[secIdx].items || [])];
    items.splice(itemIdx + 1, 0, cloned);
    updated[secIdx] = { ...updated[secIdx], items };
    onChange(updated);
    setExpandedItemKeys((prev) => ({ ...prev, [`${secIdx}-${itemIdx + 1}`]: true }));
  };

  // Bullets
  const handleAddBullet = (secIdx, itemIdx) => {
    const updated = [...customSections];
    const items = [...(updated[secIdx].items || [])];
    const currentBullets = items[itemIdx].bullets || [];
    items[itemIdx] = {
      ...items[itemIdx],
      bullets: [...currentBullets, { text: '', enabled: true }],
    };
    updated[secIdx] = { ...updated[secIdx], items };
    onChange(updated);
  };

  const handleUpdateBulletText = (secIdx, itemIdx, bulletIdx, text) => {
    const updated = [...customSections];
    const items = [...(updated[secIdx].items || [])];
    const bullets = [...(items[itemIdx].bullets || [])];
    const current = normalizeBullet(bullets[bulletIdx]);
    bullets[bulletIdx] = { ...current, text };
    items[itemIdx] = { ...items[itemIdx], bullets };
    updated[secIdx] = { ...updated[secIdx], items };
    onChange(updated);
  };

  const handleToggleBullet = (secIdx, itemIdx, bulletIdx) => {
    const updated = [...customSections];
    const items = [...(updated[secIdx].items || [])];
    const bullets = [...(items[itemIdx].bullets || [])];
    const current = normalizeBullet(bullets[bulletIdx]);
    bullets[bulletIdx] = {
      ...current,
      enabled: !current.enabled,
    };
    items[itemIdx] = { ...items[itemIdx], bullets };
    updated[secIdx] = { ...updated[secIdx], items };
    onChange(updated);
  };

  const handleDeleteBullet = (secIdx, itemIdx, bulletIdx) => {
    const updated = [...customSections];
    const items = [...(updated[secIdx].items || [])];
    const bullets = (items[itemIdx].bullets || []).filter((_, i) => i !== bulletIdx);
    items[itemIdx] = { ...items[itemIdx], bullets };
    updated[secIdx] = { ...updated[secIdx], items };
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
            Custom sections
          </h2>
          <p
            className="text-xs mt-0.5"
            style={{ color: 'var(--color-text-secondary, #57534E)' }}
          >
            Certifications, awards, publications, and leadership activities.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setShowAddModal(true)}>
          <Plus size={14} strokeWidth={1.5} />
          <span>Add section</span>
        </Button>
      </div>

      {/* Sections List */}
      <div className="space-y-4">
        {customSections.length === 0 ? (
          <EmptyState
            action={
              <Button variant="secondary" size="sm" onClick={() => setShowAddModal(true)}>
                <Plus size={14} strokeWidth={1.5} />
                <span>Add section</span>
              </Button>
            }
          >
            No custom sections created yet.
          </EmptyState>
        ) : (
          customSections.map((section, secIdx) => (
            <div
              key={secIdx}
              className="border rounded p-3 space-y-3 bg-white"
              style={{
                borderColor: 'var(--color-border, #E7E2DA)',
                opacity: section.enabled !== false ? 1 : 0.6,
              }}
            >
              {/* Section Title Header */}
              <div
                className="flex items-center justify-between gap-3 pb-2 border-b"
                style={{ borderColor: 'var(--color-border, #E7E2DA)' }}
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleSection(secIdx)}
                    className="w-5 h-5 flex items-center justify-center rounded hover:opacity-80 flex-shrink-0 transition-opacity"
                    style={{
                      color: section.enabled !== false
                        ? 'var(--color-text-secondary, #57534E)'
                        : 'var(--color-text-muted, #78716C)',
                    }}
                    title={section.enabled !== false ? 'Hide section from resume' : 'Show section in resume'}
                    aria-label={section.enabled !== false ? 'Hide section' : 'Show section'}
                  >
                    {section.enabled !== false ? (
                      <Eye size={14} strokeWidth={1.5} />
                    ) : (
                      <EyeOff size={14} strokeWidth={1.5} />
                    )}
                  </button>
                  <input
                    type="text"
                    value={section.sectionTitle || ''}
                    onChange={(e) => handleUpdateSectionTitle(secIdx, e.target.value)}
                    placeholder="Section title…"
                    className="bg-transparent text-xs font-semibold focus:outline-none flex-1 min-w-0"
                    style={{ color: 'var(--color-text-primary, #1C1917)' }}
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleAddItem(secIdx)}
                    className="flex-shrink-0"
                  >
                    <Plus size={12} strokeWidth={1.5} />
                    <span>Add item</span>
                  </Button>
                </div>

                <div className="flex items-center flex-shrink-0">
                  <IconButton
                    danger
                    onClick={() => handleDeleteSection(secIdx)}
                    title="Delete section"
                    aria-label="Delete section"
                  >
                    <Trash2 size={14} strokeWidth={1.5} />
                  </IconButton>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-2">
                {(section.items || []).length === 0 ? (
                  <div
                    className="p-3 rounded border text-xs text-center flex items-center justify-center gap-1.5"
                    style={{
                      borderColor: 'var(--color-border, #E7E2DA)',
                      backgroundColor: 'var(--color-surface-subtle, #F5F2EC)',
                      color: 'var(--color-text-muted, #78716C)',
                    }}
                  >
                    <span>Not in resume until it has an item.</span>
                    <button
                      type="button"
                      onClick={() => handleAddItem(secIdx)}
                      className="underline font-medium hover:opacity-80 ml-1"
                      style={{ color: 'var(--color-accent, #0F766E)' }}
                    >
                      Add an item
                    </button>
                  </div>
                ) : (
                  (section.items || []).map((item, itemIdx) => {
                  const itemKey = `${secIdx}-${itemIdx}`;
                  const isExpanded = expandedItemKeys[itemKey] ?? (itemIdx === 0);
                  const normalizedBullets = (item.bullets || []).map(normalizeBullet);
                  const activeBulletsCount = normalizedBullets.filter((b) => b.enabled).length;
                  const totalBulletsCount = normalizedBullets.length;
                  const subtitle = [
                    item.subtitle,
                    item.date,
                    totalBulletsCount > 0 ? `${activeBulletsCount}/${totalBulletsCount} bullets` : '',
                  ]
                    .filter(Boolean)
                    .join(' · ');

                  return (
                    <div
                      key={itemIdx}
                      className="border rounded transition-colors"
                      style={{
                        borderColor: isExpanded ? 'var(--color-border-strong, #D6CFC3)' : 'var(--color-border, #E7E2DA)',
                        backgroundColor: item.enabled !== false ? '#FFFFFF' : 'var(--color-surface-subtle, #F5F2EC)',
                        opacity: item.enabled !== false ? 1 : 0.6,
                      }}
                    >
                      {/* Item Summary Header */}
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => toggleItemExpanded(secIdx, itemIdx)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            toggleItemExpanded(secIdx, itemIdx);
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
                              checked={item.enabled !== false}
                              onChange={(e) => handleToggleItem(secIdx, itemIdx, e)}
                              title={item.enabled !== false ? 'Enabled in resume' : 'Disabled'}
                            />
                          </div>
                          <div className="min-w-0">
                            <div
                              className="text-xs font-medium truncate"
                              style={{ color: 'var(--color-text-primary, #1C1917)' }}
                            >
                              {item.title || `Item #${itemIdx + 1}`}
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

                        <div className="flex items-center gap-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                          <IconButton onClick={(e) => handleDuplicateItem(secIdx, itemIdx, e)} title="Duplicate">
                            <Copy size={14} strokeWidth={1.5} />
                          </IconButton>
                          <IconButton danger onClick={(e) => handleDeleteItem(secIdx, itemIdx, e)} title="Delete">
                            <Trash2 size={14} strokeWidth={1.5} />
                          </IconButton>
                          <IconButton onClick={() => toggleItemExpanded(secIdx, itemIdx)} title={isExpanded ? 'Collapse' : 'Expand'}>
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

                      {/* Expanded Item Form */}
                      {isExpanded && (
                        <div className="p-3 space-y-3 bg-white">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Field label="Title / Role">
                              <Input
                                value={item.title || ''}
                                onChange={(e) => handleUpdateItem(secIdx, itemIdx, 'title', e.target.value)}
                                placeholder="e.g. Lead Author, Certified Developer"
                              />
                            </Field>

                            <Field label="Subtitle / Organization">
                              <Input
                                value={item.subtitle || ''}
                                onChange={(e) => handleUpdateItem(secIdx, itemIdx, 'subtitle', e.target.value)}
                                placeholder="e.g. IEEE Conference, Amazon Web Services"
                              />
                            </Field>

                            <Field label="Date / Year">
                              <Input
                                value={item.date || ''}
                                onChange={(e) => handleUpdateItem(secIdx, itemIdx, 'date', e.target.value)}
                                placeholder="e.g. 2023"
                              />
                            </Field>
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
                                onClick={() => handleAddBullet(secIdx, itemIdx)}
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
                                      onChange={() => handleToggleBullet(secIdx, itemIdx, bulletIdx)}
                                      title={bullet.enabled ? 'Enabled in resume' : 'Disabled'}
                                    />
                                  </div>

                                  <Textarea
                                    inline
                                    rows={2}
                                    value={bullet.text || ''}
                                    onChange={(e) =>
                                      handleUpdateBulletText(secIdx, itemIdx, bulletIdx, e.target.value)
                                    }
                                    placeholder="Accomplishment bullet point…"
                                  />

                                  <IconButton
                                    danger
                                    onClick={() => handleDeleteBullet(secIdx, itemIdx, bulletIdx)}
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
                }))}
              </div>
            </div>
          ))
        )}

        {/* Add Section Form */}
        {showAddModal && (
          <form
            onSubmit={handleCreateSection}
            className="p-3 border rounded space-y-2.5 bg-white"
            style={{
              borderColor: 'var(--color-border-strong, #D6CFC3)',
              boxShadow: 'var(--shadow-popover)',
            }}
          >
            <Field label="Section title" hint="e.g. Leadership & Activities, Certifications, Publications">
              <Input
                autoFocus
                value={newSectionTitle}
                onChange={(e) => setNewSectionTitle(e.target.value)}
                placeholder="e.g. Certifications"
              />
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={!newSectionTitle.trim()}
              >
                Create section
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
