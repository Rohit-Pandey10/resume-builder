import React, { useState } from 'react';
import { Plus, Trash2, CheckSquare, Square, Link as LinkIcon, X, Copy } from 'lucide-react';

export default function ProjectsSection({ projects = [], onChange, onNotify }) {
  const [techInput, setTechInput] = useState({});
  const [highlightedIdx, setHighlightedIdx] = useState(null);

  const handleAddProject = () => {
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
  };

  const handleDuplicateProject = (projIdx) => {
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
    setHighlightedIdx(projIdx + 1);
    setTimeout(() => setHighlightedIdx(null), 1500);
    if (onNotify) {
      onNotify(`Duplicated "${orig.title || 'project'}".`, 'success');
    }
  };

  const handleUpdateProject = (projIdx, field, value) => {
    const updated = [...projects];
    updated[projIdx] = {
      ...updated[projIdx],
      [field]: value,
    };
    onChange(updated);
  };

  const handleDeleteProject = (projIdx) => {
    onChange(projects.filter((_, i) => i !== projIdx));
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

  // Bullet items
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
    bullets[bulletIdx] = { ...bullets[bulletIdx], text };
    updated[projIdx] = { ...updated[projIdx], bullets };
    onChange(updated);
  };

  const handleToggleBullet = (projIdx, bulletIdx) => {
    const updated = [...projects];
    const bullets = [...(updated[projIdx].bullets || [])];
    bullets[bulletIdx] = {
      ...bullets[bulletIdx],
      enabled: !bullets[bulletIdx].enabled,
    };
    updated[projIdx] = { ...updated[projIdx], bullets };
    onChange(updated);
  };

  const handleDeleteBullet = (projIdx, bulletIdx) => {
    const updated = [...projects];
    const bullets = (updated[projIdx].bullets || []).filter((_, i) => i !== bulletIdx);
    updated[projIdx] = { ...updated[projIdx], bullets };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {projects.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-zinc-800 rounded-md text-zinc-500 text-xs">
          No projects added yet.
        </div>
      ) : (
        projects.map((proj, projIdx) => (
          <div
            key={projIdx}
            className={`p-3.5 rounded-lg border transition-all duration-200 text-xs ${
              highlightedIdx === projIdx
                ? 'ring-1 ring-zinc-500 bg-zinc-900 border-zinc-700'
                : proj.enabled
                ? 'bg-zinc-900/60 border-zinc-800/80'
                : 'bg-zinc-950/40 border-zinc-800/40 opacity-60'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleProject(projIdx)}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors"
                  title={proj.enabled ? 'Disable project' : 'Enable project'}
                >
                  {proj.enabled ? (
                    <CheckSquare className="w-4 h-4 text-zinc-200" />
                  ) : (
                    <Square className="w-4 h-4 text-zinc-600" />
                  )}
                </button>
                <span className="font-medium text-zinc-200">
                  {proj.title || `Project #${projIdx + 1}`}
                </span>
                {!proj.enabled && (
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                    Disabled
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleDuplicateProject(projIdx)}
                  className="text-zinc-500 hover:text-zinc-300 p-1 rounded transition-colors"
                  title="Duplicate project entry"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteProject(projIdx)}
                  className="text-zinc-500 hover:text-rose-400 p-1 rounded transition-colors"
                  title="Delete project"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Inputs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-3">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
                  Project Title
                </label>
                <input
                  type="text"
                  value={proj.title || ''}
                  onChange={(e) => handleUpdateProject(projIdx, 'title', e.target.value)}
                  placeholder="JakeResume Platform"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
                  Project Link / URL
                </label>
                <div className="relative">
                  <LinkIcon className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="url"
                    value={proj.link || ''}
                    onChange={(e) => handleUpdateProject(projIdx, 'link', e.target.value)}
                    placeholder="https://github.com/user/project"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md pl-8 pr-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                  />
                </div>
              </div>
            </div>

            {/* Tech Stack Tags */}
            <div className="mb-3">
              <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
                Technologies Used
              </label>
              <div className="flex flex-wrap items-center gap-1.5 p-2 bg-zinc-950 border border-zinc-800 rounded-md">
                {(proj.techStack || []).map((tech, tIdx) => (
                  <span
                    key={tIdx}
                    className="inline-flex items-center gap-1 bg-zinc-900 border border-zinc-800 text-zinc-200 px-2 py-0.5 rounded text-[11px]"
                  >
                    {tech}
                    <button
                      type="button"
                      onClick={() => handleRemoveTech(projIdx, tech)}
                      className="text-zinc-400 hover:text-zinc-200"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
                <div className="flex items-center gap-1 min-w-[120px] flex-1">
                  <input
                    type="text"
                    value={techInput[projIdx] || ''}
                    onChange={(e) => setTechInput({ ...techInput, [projIdx]: e.target.value })}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ',') {
                        e.preventDefault();
                        handleAddTech(projIdx);
                      }
                    }}
                    placeholder="Add tag (press Enter)..."
                    className="bg-transparent text-zinc-200 placeholder:text-zinc-600 text-xs focus:outline-none w-full"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddTech(projIdx)}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Bullet Points */}
            <div className="mt-3 pt-3 border-t border-zinc-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-400 font-medium text-[11px] uppercase tracking-wider">
                  Bullet Points ({proj.bullets?.filter((b) => b.enabled).length || 0}/{proj.bullets?.length || 0} active)
                </span>
                <button
                  type="button"
                  onClick={() => handleAddBullet(projIdx)}
                  className="text-zinc-300 hover:text-white text-[11px] flex items-center gap-1 font-medium transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add Bullet
                </button>
              </div>

              <div className="space-y-2">
                {(proj.bullets || []).map((bullet, bulletIdx) => (
                  <div
                    key={bulletIdx}
                    className={`flex items-start gap-2 p-2 rounded-md border transition-all ${
                      bullet.enabled
                        ? 'bg-zinc-950/80 border-zinc-800'
                        : 'bg-zinc-950/30 border-zinc-800/40 opacity-50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleBullet(projIdx, bulletIdx)}
                      className="mt-1 text-zinc-400 hover:text-zinc-200 transition-colors flex-shrink-0"
                      title={bullet.enabled ? 'Disable bullet from resume' : 'Enable bullet'}
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
                      onChange={(e) => handleUpdateBulletText(projIdx, bulletIdx, e.target.value)}
                      placeholder="Implemented distributed cache layer reducing 95th percentile latency by 35%..."
                      className="w-full bg-transparent text-zinc-200 placeholder:text-zinc-600 text-xs focus:outline-none resize-none leading-relaxed"
                    />

                    <button
                      type="button"
                      onClick={() => handleDeleteBullet(projIdx, bulletIdx)}
                      className="text-zinc-600 hover:text-rose-400 p-0.5 rounded transition-colors flex-shrink-0"
                      title="Remove bullet"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))
      )}

      <button
        type="button"
        onClick={handleAddProject}
        className="w-full py-2 border border-dashed border-zinc-800 hover:border-zinc-600 rounded-md text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900/30 hover:bg-zinc-800/40 transition-colors flex items-center justify-center gap-1.5 font-medium"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Project
      </button>
    </div>
  );
}
