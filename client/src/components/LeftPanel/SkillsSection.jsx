import React, { useState } from 'react';
import { Plus, X, Trash2, Tag } from 'lucide-react';
import {
  Button,
  IconButton,
  Input,
  Field,
  Checkbox,
  EmptyState,
} from '../primitives';

const DEFAULT_CATEGORIES = [
  'Languages',
  'Frameworks',
  'Developer tools',
  'Libraries',
];

export default function SkillsSection({ skills = [], onChange, onDeleteAction }) {
  const [newCatName, setNewCatName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [skillInputs, setSkillInputs] = useState({});

  // Normalize skills to dynamic categories array
  const categories = Array.isArray(skills)
    ? skills.map((c) => ({
        ...c,
        category: (c && (c.category || c.title || c.name)) || 'Skills',
        items: Array.isArray(c?.items) ? c.items : [],
        enabled: c?.enabled !== false,
      }))
    : [
        { category: 'Languages', items: skills?.languages || [], enabled: true },
        { category: 'Frameworks', items: skills?.frameworks || [], enabled: true },
        { category: 'Developer tools', items: skills?.developerTools || [], enabled: true },
        { category: 'Libraries', items: skills?.libraries || [], enabled: true },
      ].filter((c) => c.items && c.items.length > 0);

  const handleUpdateCategoryTitle = (catIdx, newTitle) => {
    const updated = [...categories];
    updated[catIdx] = { ...updated[catIdx], category: newTitle };
    onChange(updated);
  };

  const handleToggleCategory = (catIdx) => {
    const updated = [...categories];
    updated[catIdx] = {
      ...updated[catIdx],
      enabled: !updated[catIdx].enabled,
    };
    onChange(updated);
  };

  const handleDeleteCategory = (catIdx) => {
    const updated = categories.filter((_, idx) => idx !== catIdx);
    onChange(updated);
    onDeleteAction?.('Skill category deleted');
  };

  const handleAddSkills = (catIdx) => {
    const raw = skillInputs[catIdx] || '';
    const newItems = raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (newItems.length === 0) return;

    const updated = [...categories];
    const current = updated[catIdx].items || [];
    const merged = Array.from(new Set([...current, ...newItems]));

    updated[catIdx] = { ...updated[catIdx], items: merged };
    onChange(updated);
    setSkillInputs({ ...skillInputs, [catIdx]: '' });
  };

  const handleRemoveSkill = (catIdx, itemToRemove) => {
    const updated = [...categories];
    updated[catIdx] = {
      ...updated[catIdx],
      items: (updated[catIdx].items || []).filter((it) => it !== itemToRemove),
    };
    onChange(updated);
    onDeleteAction?.('Skill item deleted');
  };

  const handleCreateCategory = (e) => {
    e?.preventDefault();
    const title = newCatName.trim();
    if (!title) return;

    onChange([
      ...categories,
      {
        category: title,
        items: [],
        enabled: true,
      },
    ]);

    setNewCatName('');
    setShowAddCategory(false);
  };

  const handleAddDefaultCategories = () => {
    const existing = new Set(
      categories.map((c) => (c?.category ? String(c.category).toLowerCase() : ''))
    );
    const toAdd = DEFAULT_CATEGORIES.filter((c) => !existing.has(c.toLowerCase())).map((name) => ({
      category: name,
      items: [],
      enabled: true,
    }));
    onChange([...categories, ...toAdd]);
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
            Skills
          </h2>
          <p
            className="text-xs mt-0.5"
            style={{ color: 'var(--color-text-secondary, #57534E)' }}
          >
            Languages, frameworks, developer tools, and libraries.
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setShowAddCategory(true)}>
          <Plus size={14} strokeWidth={1.5} />
          <span>Add category</span>
        </Button>
      </div>

      {/* Categories List */}
      <div className="space-y-3">
        {categories.length === 0 ? (
          <EmptyState
            action={
              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={handleAddDefaultCategories}>
                  Add standard categories
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowAddCategory(true)}>
                  Add custom category
                </Button>
              </div>
            }
          >
            No skill categories defined yet.
          </EmptyState>
        ) : (
          categories.map((cat, catIdx) => {
            const items = cat.items || [];
            const isEnabled = cat.enabled !== false;

            return (
              <div
                key={catIdx}
                className="border rounded p-3 space-y-2.5 transition-colors bg-white"
                style={{
                  borderColor: 'var(--color-border, #E7E2DA)',
                  opacity: isEnabled ? 1 : 0.6,
                }}
              >
                {/* Category Header */}
                <div
                  className="flex items-center justify-between gap-2 pb-2 border-b"
                  style={{ borderColor: 'var(--color-border, #E7E2DA)' }}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Checkbox
                      checked={isEnabled}
                      onChange={() => handleToggleCategory(catIdx)}
                      title={isEnabled ? 'Enabled in resume' : 'Disabled'}
                    />
                    <Tag size={14} strokeWidth={1.5} style={{ color: 'var(--color-text-muted, #78716C)' }} />
                    <input
                      type="text"
                      value={cat.category || ''}
                      onChange={(e) => handleUpdateCategoryTitle(catIdx, e.target.value)}
                      placeholder="Category title…"
                      className="bg-transparent text-xs font-medium focus:outline-none flex-1 min-w-0"
                      style={{ color: 'var(--color-text-primary, #1C1917)' }}
                    />
                    <span className="text-[11px]" style={{ color: 'var(--color-text-muted, #78716C)' }}>
                      ({items.length})
                    </span>
                  </div>

                  <IconButton danger onClick={() => handleDeleteCategory(catIdx)} title="Delete category">
                    <Trash2 size={14} strokeWidth={1.5} />
                  </IconButton>
                </div>

                {/* Skill Chips */}
                <div className="flex flex-wrap gap-1.5 min-h-[24px]">
                  {items.length === 0 ? (
                    <span className="text-[11px] italic" style={{ color: 'var(--color-text-muted, #78716C)' }}>
                      No skills added yet
                    </span>
                  ) : (
                    items.map((item, itIdx) => (
                      <span
                        key={itIdx}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs border"
                        style={{
                          backgroundColor: 'var(--color-surface-subtle, #F5F2EC)',
                          borderColor: 'var(--color-border, #E7E2DA)',
                          color: 'var(--color-text-primary, #1C1917)',
                        }}
                      >
                        <span>{item}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveSkill(catIdx, item)}
                          className="hover:text-danger"
                          title={`Remove ${item}`}
                        >
                          <X size={12} strokeWidth={1.5} />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Add Skills Input */}
                <div className="flex gap-2 pt-1">
                  <Input
                    value={skillInputs[catIdx] || ''}
                    onChange={(e) => setSkillInputs({ ...skillInputs, [catIdx]: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSkills(catIdx);
                      }
                    }}
                    placeholder="Type skill name (comma-separated for multiple) and press Enter"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => handleAddSkills(catIdx)}
                    disabled={!(skillInputs[catIdx] || '').trim()}
                  >
                    Add
                  </Button>
                </div>
              </div>
            );
          })
        )}

        {/* Create Category Modal / Inline Form */}
        {showAddCategory && (
          <form
            onSubmit={handleCreateCategory}
            className="p-3 border rounded space-y-2.5 bg-white"
            style={{
              borderColor: 'var(--color-border-strong, #D6CFC3)',
              boxShadow: 'var(--shadow-popover)',
            }}
          >
            <Field label="Category title" hint="e.g. Cloud & DevOps, Databases, Testing">
              <Input
                autoFocus
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="e.g. Cloud & Infrastructure"
              />
            </Field>
            <div className="flex justify-end gap-2 pt-1">
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setShowAddCategory(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={!newCatName.trim()}
              >
                Create category
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
