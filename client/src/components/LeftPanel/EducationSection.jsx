import React, { useState } from 'react';
import { Plus, Trash2, GraduationCap, CheckSquare, Square, Copy } from 'lucide-react';

export default function EducationSection({ education = [], onChange, onNotify }) {
  const [highlightedIdx, setHighlightedIdx] = useState(null);

  const handleAdd = () => {
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
  };

  const handleDuplicate = (index) => {
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
    setHighlightedIdx(index + 1);
    setTimeout(() => setHighlightedIdx(null), 1500);
    if (onNotify) {
      onNotify(`Duplicated "${orig.institution || 'education entry'}".`, 'success');
    }
  };

  const handleUpdate = (index, field, value) => {
    const updated = [...education];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    onChange(updated);
  };

  const handleDelete = (index) => {
    onChange(education.filter((_, i) => i !== index));
  };

  const handleToggle = (index) => {
    const updated = [...education];
    updated[index] = {
      ...updated[index],
      enabled: !updated[index].enabled,
    };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      {education.length === 0 ? (
        <div className="text-center py-6 border border-dashed border-zinc-800 rounded-md text-zinc-500 text-xs">
          No education entries added yet.
        </div>
      ) : (
        education.map((edu, idx) => (
          <div
            key={idx}
            className={`p-3.5 rounded-lg border transition-all duration-200 text-xs ${
              highlightedIdx === idx
                ? 'ring-1 ring-zinc-500 bg-zinc-900 border-zinc-700'
                : edu.enabled
                ? 'bg-zinc-900/60 border-zinc-800/80'
                : 'bg-zinc-950/40 border-zinc-800/40 opacity-60'
            }`}
          >
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-zinc-800/80">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggle(idx)}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors"
                  title={edu.enabled ? 'Disable entry' : 'Enable entry'}
                >
                  {edu.enabled ? (
                    <CheckSquare className="w-4 h-4 text-zinc-200" />
                  ) : (
                    <Square className="w-4 h-4 text-zinc-600" />
                  )}
                </button>
                <span className="font-medium text-zinc-200">
                  {edu.institution || `Education #${idx + 1}`}
                </span>
                {!edu.enabled && (
                  <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-400 bg-zinc-800 px-1.5 py-0.5 rounded">
                    Disabled
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleDuplicate(idx)}
                  className="text-zinc-500 hover:text-zinc-300 p-1 rounded transition-colors"
                  title="Duplicate education entry"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(idx)}
                  className="text-zinc-500 hover:text-rose-400 p-1 rounded transition-colors"
                  title="Delete education"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
                  Institution
                </label>
                <input
                  type="text"
                  value={edu.institution || ''}
                  onChange={(e) => handleUpdate(idx, 'institution', e.target.value)}
                  placeholder="Harvard University"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
                  Degree
                </label>
                <input
                  type="text"
                  value={edu.degree || ''}
                  onChange={(e) => handleUpdate(idx, 'degree', e.target.value)}
                  placeholder="B.S. in Computer Science"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
                  Location
                </label>
                <input
                  type="text"
                  value={edu.location || ''}
                  onChange={(e) => handleUpdate(idx, 'location', e.target.value)}
                  placeholder="Cambridge, MA"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
                  GPA (Optional)
                </label>
                <input
                  type="text"
                  value={edu.gpa || ''}
                  onChange={(e) => handleUpdate(idx, 'gpa', e.target.value)}
                  placeholder="3.9 / 4.0"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
                  Start Date
                </label>
                <input
                  type="text"
                  value={edu.startDate || ''}
                  onChange={(e) => handleUpdate(idx, 'startDate', e.target.value)}
                  placeholder="Aug 2020"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
                  End Date
                </label>
                <input
                  type="text"
                  value={edu.endDate || ''}
                  onChange={(e) => handleUpdate(idx, 'endDate', e.target.value)}
                  placeholder="May 2024"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md px-2.5 py-1.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                />
              </div>
            </div>
          </div>
        ))
      )}

      <button
        type="button"
        onClick={handleAdd}
        className="w-full py-2 border border-dashed border-zinc-800 hover:border-zinc-600 rounded-md text-xs text-zinc-400 hover:text-zinc-200 bg-zinc-900/30 hover:bg-zinc-800/40 transition-colors flex items-center justify-center gap-1.5 font-medium"
      >
        <Plus className="w-3.5 h-3.5" />
        Add Education
      </button>
    </div>
  );
}
