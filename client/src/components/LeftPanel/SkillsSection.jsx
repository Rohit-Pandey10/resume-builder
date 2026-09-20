import React, { useState } from 'react';
import { Plus, X, Trash2, FolderPlus, Tag, CheckSquare, Square } from 'lucide-react';

const DEFAULT_CATEGORIES = [
  'Languages',
  'Frontend',
  'Backend & Database',
  'Core Concepts',
  'Developer Tools',
];

export default function SkillsSection({ skills = [], onChange }) {
  const [newCatName, setNewCatName] = useState('');
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [skillInputs, setSkillInputs] = useState({});

  // Normalize skills to dynamic categories array
  const categories = Array.isArray(skills)
    ? skills
    : [
        { category: 'Languages', items: skills?.languages || [], enabled: true },
        { category: 'Frameworks', items: skills?.frameworks || [], enabled: true },
        { category: 'Developer Tools', items: skills?.developerTools || [], enabled: true },
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
      enabled: updated[catIdx].enabled !== undefined ? !updated[catIdx].enabled : false,
    };
    onChange(updated);
  };

  const handleDeleteCategory = (catIdx) => {
    const updated = categories.filter((_, idx) => idx !== catIdx);
    onChange(updated);
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
    const existing = new Set(categories.map((c) => c.category.toLowerCase()));
    const toAdd = DEFAULT_CATEGORIES.filter((c) => !existing.has(c.toLowerCase())).map((name) => ({
      category: name,
      items: [],
      enabled: true,
    }));
    onChange([...categories, ...toAdd]);
  };

  return (
    <div className="space-y-3.5 text-xs">
      {categories.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-zinc-800 rounded-lg space-y-3">
          <p className="text-zinc-500 text-xs">No skill categories defined yet.</p>
          <div className="flex justify-center gap-2">
            <button
              type="button"
              onClick={handleAddDefaultCategories}
              className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-md text-xs font-medium transition-colors"
            >
              Add Standard Categories
            </button>
            <button
              type="button"
              onClick={() => setShowAddCategory(true)}
              className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 rounded-md text-xs font-medium transition-colors"
            >
              Add Custom Category
            </button>
          </div>
        </div>
      ) : (
        categories.map((cat, catIdx) => {
          const items = cat.items || [];
          const isEnabled = cat.enabled !== false;

          return (
            <div
              key={catIdx}
              className={`p-3 rounded-lg border transition-all ${
                isEnabled
                  ? 'bg-zinc-900/60 border-zinc-800/80'
                  : 'bg-zinc-950/30 border-zinc-800/40 opacity-60'
              }`}
            >
              {/* Category Header */}
              <div className="flex items-center justify-between gap-2 mb-2 pb-1.5 border-b border-zinc-800/80">
                <div className="flex items-center gap-1.5 flex-1">
                  <button
                    type="button"
                    onClick={() => handleToggleCategory(catIdx)}
                    className="text-zinc-400 hover:text-zinc-200 flex-shrink-0"
                    title={isEnabled ? 'Disable category in LaTeX' : 'Enable category in LaTeX'}
                  >
                    {isEnabled ? (
                      <CheckSquare className="w-3.5 h-3.5 text-zinc-200" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-zinc-600" />
                    )}
                  </button>

                  <Tag className="w-3.5 h-3.5 text-zinc-400 flex-shrink-0" />
                  <input
                    type="text"
                    value={cat.category || ''}
                    onChange={(e) => handleUpdateCategoryTitle(catIdx, e.target.value)}
                    placeholder="Category (e.g. Languages, Frontend)"
                    className="bg-transparent font-medium text-zinc-200 text-xs focus:outline-none focus:border-b border-zinc-500 px-1 flex-1"
                  />
                  <span className="text-[10px] text-zinc-500 font-mono">
                    ({items.length})
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteCategory(catIdx)}
                  className="text-zinc-500 hover:text-rose-400 p-0.5 rounded transition-colors flex-shrink-0"
                  title="Delete category"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Chips container */}
              <div className="flex flex-wrap gap-1.5 mb-2.5 min-h-[24px]">
                {items.length === 0 ? (
                  <span className="text-zinc-600 text-[11px] italic">
                    No skills added yet
                  </span>
                ) : (
                  items.map((item, itIdx) => (
                    <span
                      key={itIdx}
                      className="inline-flex items-center gap-1 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-200 px-2 py-0.5 rounded text-[11px] transition-colors"
                    >
                      {item}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(catIdx, item)}
                        className="text-zinc-400 hover:text-rose-400 ml-0.5 transition-colors"
                        title="Remove skill"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>

              {/* Input for adding skills */}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={skillInputs[catIdx] || ''}
                  onChange={(e) =>
                    setSkillInputs({ ...skillInputs, [catIdx]: e.target.value })
                  }
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSkills(catIdx);
                    }
                  }}
                  placeholder="Add skill (or comma-separated e.g. React, Next.js)..."
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 text-xs"
                />
                <button
                  type="button"
                  onClick={() => handleAddSkills(catIdx)}
                  className="px-2.5 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-md transition-colors flex items-center gap-1 font-medium"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </button>
              </div>
            </div>
          );
        })
      )}

      {/* Add New Category Modal / Input */}
      {showAddCategory ? (
        <form
          onSubmit={handleCreateCategory}
          className="p-3 bg-zinc-900 border border-zinc-700 rounded-lg space-y-2"
        >
          <label className="block text-zinc-300 font-medium text-[11px] uppercase tracking-wider">
            New Skill Category
          </label>
          <input
            type="text"
            autoFocus
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="e.g. Core Concepts, Cloud & DevOps, Databases"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 text-xs"
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddCategory(false)}
              className="px-2.5 py-1 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newCatName.trim()}
              className="px-3 py-1 bg-zinc-100 hover:bg-white text-zinc-950 rounded-md font-medium disabled:opacity-50 transition-colors"
            >
              Add Category
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddCategory(true)}
          className="w-full py-2 border border-dashed border-zinc-800 hover:border-zinc-600 rounded-md text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900/30 hover:bg-zinc-800/40 transition-colors flex items-center justify-center gap-1.5 font-medium"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          Add Skill Category
        </button>
      )}
    </div>
  );
}

