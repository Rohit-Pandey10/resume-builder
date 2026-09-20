import React, { useState } from 'react';
import { Plus, Trash2, CheckSquare, Square, X, FolderPlus, ListPlus, Copy } from 'lucide-react';

export default function CustomSections({ customSections = [], onChange, onNotify }) {
  const [newSectionTitle, setNewSectionTitle] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [highlightedKey, setHighlightedKey] = useState(null);

  const handleDuplicateItem = (secIdx, itemIdx) => {
    const updated = [...customSections];
    const items = [...(updated[secIdx].items || [])];
    const orig = items[itemIdx];
    if (!orig) return;
    const cloned = JSON.parse(JSON.stringify(orig));
    delete cloned._id;
    cloned.title = orig.title ? `${orig.title} (Copy)` : 'Item (Copy)';

    const updatedItems = [
      ...items.slice(0, itemIdx + 1),
      cloned,
      ...items.slice(itemIdx + 1),
    ];
    updated[secIdx] = { ...updated[secIdx], items: updatedItems };
    onChange(updated);
    const key = `${secIdx}-${itemIdx + 1}`;
    setHighlightedKey(key);
    setTimeout(() => setHighlightedKey(null), 1500);
    if (onNotify) {
      onNotify(`Duplicated "${orig.title || 'custom item'}".`, 'success');
    }
  };

  const handleCreateSection = (e) => {
    e?.preventDefault();
    const title = newSectionTitle.trim();
    if (!title) return;

    onChange([
      ...customSections,
      {
        sectionTitle: title,
        items: [
          {
            title: '',
            subtitle: '',
            date: '',
            description: '',
            bullets: [{ text: '', enabled: true }],
            enabled: true,
          },
        ],
      },
    ]);

    setNewSectionTitle('');
    setShowAddModal(false);
  };

  const handleDeleteSection = (secIdx) => {
    onChange(customSections.filter((_, i) => i !== secIdx));
  };

  const handleUpdateSectionTitle = (secIdx, newTitle) => {
    const updated = [...customSections];
    updated[secIdx] = { ...updated[secIdx], sectionTitle: newTitle };
    onChange(updated);
  };

  const handleAddItem = (secIdx) => {
    const updated = [...customSections];
    const items = updated[secIdx].items || [];
    updated[secIdx] = {
      ...updated[secIdx],
      items: [
        ...items,
        {
          title: '',
          subtitle: '',
          date: '',
          description: '',
          bullets: [{ text: '', enabled: true }],
          enabled: true,
        },
      ],
    };
    onChange(updated);
  };

  const handleUpdateItem = (secIdx, itemIdx, field, value) => {
    const updated = [...customSections];
    const items = [...(updated[secIdx].items || [])];
    items[itemIdx] = { ...items[itemIdx], [field]: value };
    updated[secIdx] = { ...updated[secIdx], items };
    onChange(updated);
  };

  const handleToggleItem = (secIdx, itemIdx) => {
    const updated = [...customSections];
    const items = [...(updated[secIdx].items || [])];
    items[itemIdx] = {
      ...items[itemIdx],
      enabled: !items[itemIdx].enabled,
    };
    updated[secIdx] = { ...updated[secIdx], items };
    onChange(updated);
  };

  const handleDeleteItem = (secIdx, itemIdx) => {
    const updated = [...customSections];
    const items = (updated[secIdx].items || []).filter((_, i) => i !== itemIdx);
    updated[secIdx] = { ...updated[secIdx], items };
    onChange(updated);
  };

  // Bullet items handlers
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
    bullets[bulletIdx] = { ...bullets[bulletIdx], text };
    items[itemIdx] = { ...items[itemIdx], bullets };
    updated[secIdx] = { ...updated[secIdx], items };
    onChange(updated);
  };

  const handleToggleBullet = (secIdx, itemIdx, bulletIdx) => {
    const updated = [...customSections];
    const items = [...(updated[secIdx].items || [])];
    const bullets = [...(items[itemIdx].bullets || [])];
    bullets[bulletIdx] = {
      ...bullets[bulletIdx],
      enabled: !bullets[bulletIdx].enabled,
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
  };

  return (
    <div className="space-y-4 text-xs">
      {customSections.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-zinc-800 rounded-md text-zinc-500">
          No custom sections added yet (e.g. Competitive Programming, Achievements, Certifications).
        </div>
      ) : (
        customSections.map((section, secIdx) => (
          <div key={secIdx} className="p-3.5 rounded-lg bg-zinc-900/60 border border-zinc-800/80 space-y-3">
            {/* Section Header */}
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800/80">
              <input
                type="text"
                value={section.sectionTitle || ''}
                onChange={(e) => handleUpdateSectionTitle(secIdx, e.target.value)}
                placeholder="Section Title (e.g. Achievements)"
                className="bg-transparent font-semibold text-zinc-200 text-sm focus:outline-none focus:border-b border-zinc-500 px-1 flex-1"
              />

              <button
                type="button"
                onClick={() => handleDeleteSection(secIdx)}
                className="text-zinc-500 hover:text-rose-400 p-1 rounded transition-colors"
                title="Delete section"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Section Items */}
            <div className="space-y-3">
              {(section.items || []).map((item, itemIdx) => (
                <div
                  key={itemIdx}
                  className={`p-3 rounded-lg border transition-all duration-200 ${
                    highlightedKey === `${secIdx}-${itemIdx}`
                      ? 'ring-1 ring-zinc-500 bg-zinc-900 border-zinc-700'
                      : item.enabled
                      ? 'bg-zinc-950/80 border-zinc-800'
                      : 'bg-zinc-950/30 border-zinc-800/40 opacity-60'
                  }`}
                >
                  {/* Item Header Row 1: Checkbox, Title, Date, Duplicate & Delete */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => handleToggleItem(secIdx, itemIdx)}
                      className="text-zinc-400 hover:text-zinc-200 flex-shrink-0"
                      title={item.enabled ? 'Disable item' : 'Enable item'}
                    >
                      {item.enabled ? (
                        <CheckSquare className="w-3.5 h-3.5 text-zinc-200" />
                      ) : (
                        <Square className="w-3.5 h-3.5 text-zinc-600" />
                      )}
                    </button>

                    <input
                      type="text"
                      value={item.title || ''}
                      onChange={(e) => handleUpdateItem(secIdx, itemIdx, 'title', e.target.value)}
                      placeholder="Item Title (e.g. Competitive Programming, Hackathon Winner)"
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 font-medium"
                    />

                    <input
                      type="text"
                      value={item.date || ''}
                      onChange={(e) => handleUpdateItem(secIdx, itemIdx, 'date', e.target.value)}
                      placeholder="Date (e.g. 2024 - Present)"
                      className="w-32 bg-zinc-950 border border-zinc-800 rounded-md px-2 py-1 text-right text-xs text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500"
                    />

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDuplicateItem(secIdx, itemIdx)}
                        className="text-zinc-500 hover:text-zinc-300 p-0.5 rounded transition-colors"
                        title="Duplicate item"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteItem(secIdx, itemIdx)}
                        className="text-zinc-500 hover:text-rose-400 p-0.5 rounded transition-colors"
                        title="Delete item"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Item Subtitle Row */}
                  <div className="mb-2 pl-5">
                    <input
                      type="text"
                      value={item.subtitle || ''}
                      onChange={(e) => handleUpdateItem(secIdx, itemIdx, 'subtitle', e.target.value)}
                      placeholder="Subtitle / Context (e.g. LeetCode, Codeforces, CodeChef)"
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1 text-zinc-200 placeholder:text-zinc-600 text-xs focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                    />
                  </div>

                  {/* Bullet Points Section */}
                  <div className="pl-5 pt-1 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400 font-medium text-[11px] uppercase tracking-wider">
                        Bullet Points ({item.bullets?.filter((b) => b.enabled).length || 0}/{item.bullets?.length || 0})
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddBullet(secIdx, itemIdx)}
                        className="text-zinc-300 hover:text-white text-[11px] flex items-center gap-1 font-medium transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        Add Bullet
                      </button>
                    </div>

                    {(item.bullets || []).map((bullet, bulletIdx) => (
                      <div
                        key={bulletIdx}
                        className={`flex items-start gap-2 p-1.5 rounded-md border transition-all ${
                          bullet.enabled
                            ? 'bg-zinc-900/80 border-zinc-800'
                            : 'bg-zinc-950/20 border-zinc-800/40 opacity-50'
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleBullet(secIdx, itemIdx, bulletIdx)}
                          className="mt-1 text-zinc-400 hover:text-zinc-200 transition-colors flex-shrink-0"
                          title={bullet.enabled ? 'Disable bullet' : 'Enable bullet'}
                        >
                          {bullet.enabled ? (
                            <CheckSquare className="w-3.5 h-3.5 text-zinc-200" />
                          ) : (
                            <Square className="w-3.5 h-3.5 text-zinc-600" />
                          )}
                        </button>

                        <textarea
                          rows={2}
                          value={bullet.text || ''}
                          onChange={(e) =>
                            handleUpdateBulletText(secIdx, itemIdx, bulletIdx, e.target.value)
                          }
                          placeholder="Accomplishment bullet point (e.g. CodeChef Rating: 1359, solved 180+ problems)..."
                          className="flex-1 bg-transparent text-zinc-200 placeholder:text-zinc-600 text-xs focus:outline-none resize-none leading-relaxed"
                        />

                        <button
                          type="button"
                          onClick={() => handleDeleteBullet(secIdx, itemIdx, bulletIdx)}
                          className="mt-1 text-zinc-500 hover:text-rose-400 p-0.5 rounded transition-colors flex-shrink-0"
                          title="Delete bullet"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {/* Fallback description textarea if bullets is empty */}
                    {(!item.bullets || item.bullets.length === 0) && (
                      <div>
                        <textarea
                          rows={2}
                          value={item.description || ''}
                          onChange={(e) => handleUpdateItem(secIdx, itemIdx, 'description', e.target.value)}
                          placeholder="Description of role, award, or contribution..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-200 placeholder:text-zinc-600 text-xs focus:outline-none focus:border-zinc-500 resize-none leading-relaxed"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleAddItem(secIdx)}
              className="text-zinc-400 hover:text-zinc-200 text-xs flex items-center gap-1 font-medium transition-colors pt-1"
            >
              <Plus className="w-3 h-3" />
              Add Item to {section.sectionTitle || 'Section'}
            </button>
          </div>
        ))
      )}

      {showAddModal ? (
        <form onSubmit={handleCreateSection} className="p-3 bg-zinc-900 border border-zinc-700 rounded-lg space-y-2">
          <label className="block text-zinc-300 font-medium text-[11px] uppercase tracking-wider">
            New Section Title
          </label>
          <input
            type="text"
            autoFocus
            value={newSectionTitle}
            onChange={(e) => setNewSectionTitle(e.target.value)}
            placeholder="e.g. Competitive Programming, Certifications, Leadership"
            className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 text-xs"
          />
          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-2.5 py-1 rounded text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newSectionTitle.trim()}
              className="px-3 py-1 bg-zinc-100 hover:bg-white text-zinc-950 rounded-md font-medium disabled:opacity-50 transition-colors"
            >
              Create Section
            </button>
          </div>
        </form>
      ) : (
        <button
          type="button"
          onClick={() => setShowAddModal(true)}
          className="w-full py-2 border border-dashed border-zinc-800 hover:border-zinc-600 rounded-md text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900/30 hover:bg-zinc-800/40 transition-colors flex items-center justify-center gap-1.5 font-medium"
        >
          <FolderPlus className="w-3.5 h-3.5" />
          Add Custom Section
        </button>
      )}
    </div>
  );
}

