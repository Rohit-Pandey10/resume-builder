import React, { useState } from 'react';
import { Plus, Trash2, CheckSquare, Square, ListPlus, X, Copy } from 'lucide-react';

export default function ExperienceSection({ experience = [], onChange, onNotify }) {
  const [highlightedIdx, setHighlightedIdx] = useState(null);

  const handleAddJob = () => {
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
  };

  const handleDuplicateJob = (jobIdx) => {
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
    setHighlightedIdx(jobIdx + 1);
    setTimeout(() => setHighlightedIdx(null), 1500);
    if (onNotify) {
      onNotify(`Duplicated "${orig.role || orig.company || 'experience'}".`, 'success');
    }
  };

  const handleUpdateJob = (jobIdx, field, value) => {
    const updated = [...experience];
    updated[jobIdx] = {
      ...updated[jobIdx],
      [field]: value,
    };
    onChange(updated);
  };

  const handleDeleteJob = (jobIdx) => {
    onChange(experience.filter((_, i) => i !== jobIdx));
  };

  const handleToggleJob = (jobIdx) => {
    const updated = [...experience];
    updated[jobIdx] = {
      ...updated[jobIdx],
      enabled: !updated[jobIdx].enabled,
    };
    onChange(updated);
  };

  // Bullet-level management
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
    bullets[bulletIdx] = { ...bullets[bulletIdx], text };
    updated[jobIdx] = { ...updated[jobIdx], bullets };
    onChange(updated);
  };

  const handleToggleBullet = (jobIdx, bulletIdx) => {
    const updated = [...experience];
    const bullets = [...(updated[jobIdx].bullets || [])];
    bullets[bulletIdx] = {
      ...bullets[bulletIdx],
      enabled: !bullets[bulletIdx].enabled,
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
      {experience.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-slate-800 rounded-lg text-slate-500 text-xs">
          No experience entries added yet.
        </div>
      ) : (
        experience.map((exp, jobIdx) => (
          <div
            key={jobIdx}
            className={`p-3 rounded-lg border transition-all duration-300 text-xs ${
              highlightedIdx === jobIdx
                ? 'ring-2 ring-zinc-500 bg-zinc-900 border-zinc-500 shadow-md'
                : exp.enabled
                ? 'bg-zinc-950/60 border-zinc-800'
                : 'bg-zinc-950/20 border-zinc-800/40 opacity-60'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleJob(jobIdx)}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors"
                  title={exp.enabled ? 'Disable experience' : 'Enable experience'}
                >
                  {exp.enabled ? (
                    <CheckSquare className="w-4 h-4 text-zinc-200" />
                  ) : (
                    <Square className="w-4 h-4 text-zinc-600" />
                  )}
                </button>
                <span className="font-medium text-zinc-200 text-xs">
                  {exp.company ? `${exp.role || 'Role'} at ${exp.company}` : `Experience #${jobIdx + 1}`}
                </span>
                {!exp.enabled && (
                  <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-500 bg-zinc-800 px-1.5 py-0.5 rounded border border-zinc-700">
                    Disabled
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleDuplicateJob(jobIdx)}
                  className="text-zinc-500 hover:text-zinc-300 p-1 rounded hover:bg-zinc-800 transition-colors"
                  title="Duplicate experience entry"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteJob(jobIdx)}
                  className="text-zinc-500 hover:text-rose-400 p-1 rounded hover:bg-zinc-800 transition-colors"
                  title="Delete experience"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 mb-2.5">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">Company</label>
                <input
                  type="text"
                  value={exp.company || ''}
                  onChange={(e) => handleUpdateJob(jobIdx, 'company', e.target.value)}
                  placeholder="Acme Corp"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">Role / Job Title</label>
                <input
                  type="text"
                  value={exp.role || ''}
                  onChange={(e) => handleUpdateJob(jobIdx, 'role', e.target.value)}
                  placeholder="Software Engineer"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">Location</label>
                <input
                  type="text"
                  value={exp.location || ''}
                  onChange={(e) => handleUpdateJob(jobIdx, 'location', e.target.value)}
                  placeholder="New York, NY (or Remote)"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">Start Date</label>
                  <input
                    type="text"
                    value={exp.startDate || ''}
                    onChange={(e) => handleUpdateJob(jobIdx, 'startDate', e.target.value)}
                    placeholder="Jun 2023"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">End Date</label>
                  <input
                    type="text"
                    value={exp.endDate || ''}
                    onChange={(e) => handleUpdateJob(jobIdx, 'endDate', e.target.value)}
                    placeholder="Present"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                  />
                </div>
              </div>
            </div>

            {/* Individual Bullet Points Section */}
            <div className="mt-2.5 pt-2.5 border-t border-zinc-800/60">
              <div className="flex items-center justify-between mb-2">
                <span className="text-zinc-400 font-semibold text-[11px] uppercase tracking-wider">
                  Bullet Points ({exp.bullets?.filter((b) => b.enabled).length || 0}/{exp.bullets?.length || 0} active)
                </span>
                <button
                  type="button"
                  onClick={() => handleAddBullet(jobIdx)}
                  className="text-zinc-400 hover:text-zinc-200 text-[11px] flex items-center gap-1 font-medium transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add Bullet
                </button>
              </div>

              <div className="space-y-1.5">
                {(exp.bullets || []).map((bullet, bulletIdx) => (
                  <div
                    key={bulletIdx}
                    className={`flex items-start gap-2 p-2 rounded-md border transition-all ${
                      bullet.enabled
                        ? 'bg-zinc-900/60 border-zinc-800/80'
                        : 'bg-zinc-900/20 border-zinc-800/40 opacity-50'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleBullet(jobIdx, bulletIdx)}
                      className="mt-0.5 text-zinc-400 hover:text-zinc-200 transition-colors flex-shrink-0"
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
                      onChange={(e) => handleUpdateBulletText(jobIdx, bulletIdx, e.target.value)}
                      placeholder="Built and deployed high-traffic REST APIs using Express and Node.js..."
                      className="w-full bg-transparent text-zinc-200 placeholder:text-zinc-600 text-xs focus:outline-none resize-none leading-relaxed"
                    />

                    <button
                      type="button"
                      onClick={() => handleDeleteBullet(jobIdx, bulletIdx)}
                      className="text-zinc-500 hover:text-rose-400 p-0.5 rounded transition-colors flex-shrink-0"
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
        onClick={handleAddJob}
        className="w-full py-2 border border-dashed border-zinc-800 hover:border-zinc-600 rounded-md text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900/30 hover:bg-zinc-800/40 transition-colors flex items-center justify-center gap-1.5 font-medium"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Experience
      </button>
    </div>
  );
}
