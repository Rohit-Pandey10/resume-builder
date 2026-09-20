import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Plus,
  Save,
  Check,
  Loader2,
  Download,
  ExternalLink,
  LogOut,
  ChevronDown,
  Sparkles,
  AlertCircle,
  FileCode,
  Trash2,
  Edit2,
  X,
} from 'lucide-react';

export default function Navbar({
  user,
  profiles = [],
  activeProfileId,
  activeProfile,
  onSelectProfile,
  onCreateProfile,
  onDeleteProfile,
  onRenameProfile,
  onOpenImport,
  onSave,
  saveStatus,
  isDirty,
  onLogout,
  onCompilePdf,
  onDownloadTex,
  onOpenOverleaf,
  isCompiling = false,
}) {
  const [showNewProfileModal, setShowNewProfileModal] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [cloneCurrent, setCloneCurrent] = useState(true);
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Profile switcher & renaming state
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [isEditingActiveName, setIsEditingActiveName] = useState(false);
  const [editNameValue, setEditNameValue] = useState('');
  const profileDropdownRef = useRef(null);
  const inlineInputRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileDropdownRef.current && !profileDropdownRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showProfileMenu]);

  useEffect(() => {
    if (isEditingActiveName && inlineInputRef.current) {
      inlineInputRef.current.focus();
      inlineInputRef.current.select();
    }
  }, [isEditingActiveName]);

  const handleStartRename = (e) => {
    if (e) e.stopPropagation();
    setEditNameValue(activeProfile?.profileName || '');
    setIsEditingActiveName(true);
  };

  const handleSaveRename = () => {
    const trimmed = editNameValue.trim();
    if (trimmed && trimmed !== activeProfile?.profileName && onRenameProfile) {
      onRenameProfile(activeProfileId, trimmed);
    }
    setIsEditingActiveName(false);
  };

  const handleRenameKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsEditingActiveName(false);
    }
  };

  const handleCreateSubmit = (e) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    onCreateProfile(newProfileName.trim(), cloneCurrent);
    setNewProfileName('');
    setShowNewProfileModal(false);
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-zinc-950/95 border-b border-zinc-800 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 flex-shrink-0">
        <div className="w-full flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo & Title */}
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <div className="flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-md bg-zinc-900 text-zinc-100 border border-zinc-800 flex-shrink-0">
              <FileText className="w-4 h-4 text-zinc-300" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="font-semibold text-xs sm:text-sm text-zinc-100 tracking-tight">
                  JakeResume
                </span>
                <span className="hidden sm:inline text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                  LaTeX ATS
                </span>
              </div>
              <p className="hidden xl:block text-[11px] text-zinc-500 font-normal">
                Strict 1-Page Resume Builder
              </p>
            </div>
          </div>

          {/* Center: Profile Switcher & Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            {/* Custom Profile Switcher Dropdown */}
            <div className="relative min-w-0" ref={profileDropdownRef}>
              {isEditingActiveName ? (
                <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-600 rounded-md px-2 py-1">
                  <input
                    ref={inlineInputRef}
                    type="text"
                    value={editNameValue}
                    onChange={(e) => setEditNameValue(e.target.value)}
                    onKeyDown={handleRenameKeyDown}
                    onBlur={handleSaveRename}
                    className="bg-transparent text-zinc-100 text-xs font-medium focus:outline-none w-24 sm:w-36 md:w-44"
                    placeholder="Profile name..."
                  />
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleSaveRename();
                    }}
                    className="p-0.5 text-zinc-300 hover:text-white"
                    title="Save name"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setIsEditingActiveName(false);
                    }}
                    className="p-0.5 text-zinc-500 hover:text-zinc-300"
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowProfileMenu((prev) => !prev)}
                    onDoubleClick={handleStartRename}
                    className="flex items-center gap-1.5 bg-zinc-900 hover:bg-zinc-800/80 text-zinc-100 text-xs font-medium rounded-md pl-2.5 sm:pl-3 pr-2 py-1.5 border border-zinc-800 hover:border-zinc-700 focus:outline-none transition-colors w-24 sm:w-36 md:w-44 max-w-[180px] text-left group"
                    title="Click to switch profile, double-click to rename"
                  >
                    <span className="truncate flex-1">
                      {activeProfile?.profileName || 'Select Profile'}
                    </span>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-200 transition-transform flex-shrink-0 ${
                        showProfileMenu ? 'rotate-180 text-zinc-200' : ''
                      }`}
                    />
                  </button>

                  {/* Inline rename pencil icon right next to profile button */}
                  <button
                    type="button"
                    onClick={handleStartRename}
                    className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors flex-shrink-0"
                    title="Rename active profile"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Dropdown Menu Popover */}
              {showProfileMenu && (
                <div className="absolute top-full left-0 mt-1.5 w-64 sm:w-72 bg-zinc-900 border border-zinc-800 rounded-lg shadow-xl z-50 overflow-hidden divide-y divide-zinc-800">
                  {/* Header: Active Profile & Rename */}
                  <div className="p-2.5 bg-zinc-950/80 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
                        Active Profile
                      </span>
                      <p
                        className="text-xs font-medium text-zinc-100 truncate cursor-pointer hover:text-white transition-colors"
                        onDoubleClick={() => {
                          setShowProfileMenu(false);
                          handleStartRename();
                        }}
                        title="Double-click to rename"
                      >
                        {activeProfile?.profileName || 'No active profile'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        handleStartRename();
                      }}
                      className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded transition-colors"
                      title="Rename Active Profile"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Profile List */}
                  <div className="max-h-56 overflow-y-auto py-1">
                    <div className="px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      All Profiles ({profiles.length})
                    </div>
                    {profiles.map((p) => {
                      const isActive = p._id === activeProfileId;
                      return (
                        <div
                          key={p._id}
                          onClick={() => {
                            if (!isActive) {
                              onSelectProfile(p._id);
                            }
                            setShowProfileMenu(false);
                          }}
                          className={`group flex items-center justify-between px-3 py-2 text-xs transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-zinc-800/80 text-zinc-100 font-medium'
                              : 'text-zinc-300 hover:bg-zinc-800/40 hover:text-zinc-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 min-w-0 pr-2">
                            {isActive ? (
                              <Check className="w-3.5 h-3.5 text-zinc-100 flex-shrink-0" />
                            ) : (
                              <span className="w-3.5 h-3.5 flex-shrink-0" />
                            )}
                            <span className="truncate">{p.profileName}</span>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            {isActive ? (
                              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                                Active
                              </span>
                            ) : (
                              /* Subtle trash icon next to each non-active profile on hover */
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDeleteProfile(p._id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded transition-all"
                                title={`Delete "${p.profileName}"`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Action Footer */}
                  <div className="p-1 bg-zinc-950/80 flex flex-col gap-0.5">
                    {/* Delete Active Profile Button */}
                    <button
                      type="button"
                      disabled={profiles.length <= 1}
                      onClick={() => {
                        setShowProfileMenu(false);
                        onDeleteProfile(activeProfileId);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        profiles.length <= 1
                          ? 'text-zinc-600 cursor-not-allowed opacity-50'
                          : 'text-rose-400 hover:bg-zinc-800 hover:text-rose-300'
                      }`}
                      title={
                        profiles.length <= 1
                          ? 'Cannot delete only remaining profile'
                          : 'Delete Active Profile'
                      }
                    >
                      <span className="flex items-center gap-2">
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Active Profile</span>
                      </span>
                      {profiles.length <= 1 && (
                        <span className="text-[10px] text-zinc-600 font-mono">1 Left</span>
                      )}
                    </button>

                    {/* New Profile Shortcut */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileMenu(false);
                        setShowNewProfileModal(true);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Create New Profile</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowNewProfileModal(true)}
              className="p-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 text-xs flex items-center gap-1 transition-colors flex-shrink-0"
              title="Create New Profile"
            >
              <Plus className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden md:inline">New</span>
            </button>

            {/* Import via AI Button */}
            <button
              type="button"
              onClick={onOpenImport}
              className="border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs px-2.5 sm:px-3 py-1.5 rounded-md transition-colors flex items-center gap-1.5 flex-shrink-0 font-medium"
              title="Import Resume via AI (ChatGPT, Claude, Gemini)"
            >
              <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
              <span className="hidden sm:inline">Import via AI</span>
            </button>

            {/* Save Button with reactive status */}
            <button
              type="button"
              onClick={onSave}
              disabled={saveStatus === 'saving' || !isDirty}
              className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all flex-shrink-0 ${
                isDirty
                  ? 'bg-zinc-800 hover:bg-zinc-750 text-zinc-100 border border-zinc-700'
                  : 'bg-zinc-950 text-zinc-500 border border-zinc-800 opacity-60 cursor-not-allowed'
              }`}
            >
              {saveStatus === 'saving' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-400" />
                  <span className="hidden sm:inline">Saving...</span>
                </>
              ) : isDirty ? (
                <>
                  <Save className="w-3.5 h-3.5 text-zinc-300" />
                  <span className="hidden sm:inline">Save</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="hidden sm:inline text-zinc-500">Saved</span>
                </>
              )}
            </button>
          </div>

          {/* Right: Compilers & User */}
          <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
            {/* Primary Action: Download PDF */}
            <button
              type="button"
              onClick={onCompilePdf}
              disabled={isCompiling}
              className="bg-zinc-100 hover:bg-white text-zinc-950 font-medium px-3 sm:px-3.5 py-1.5 rounded-md text-xs shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 active:scale-95 flex-shrink-0"
              title="Compile ATS-compliant PDF"
            >
              {isCompiling ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-950" />
                  <span className="hidden sm:inline">Compiling...</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5 text-zinc-950" />
                  <span className="hidden sm:inline">Download </span>
                  <span>PDF</span>
                </>
              )}
            </button>

            {/* Desktop Actions (.tex and Overleaf direct buttons) */}
            <div className="hidden lg:flex items-center gap-1.5">
              <button
                type="button"
                onClick={onDownloadTex}
                className="border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1.5 font-medium"
                title="Download raw .tex file"
              >
                <Download className="w-3.5 h-3.5 text-zinc-400" />
                <span>.tex</span>
              </button>
              <button
                type="button"
                onClick={onOpenOverleaf}
                className="border border-zinc-800 hover:bg-zinc-800 text-zinc-300 text-xs px-2.5 py-1.5 rounded-md transition-colors flex items-center gap-1.5 font-medium"
                title="Open directly in Overleaf"
              >
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                <span>Overleaf</span>
              </button>
            </div>

            {/* Narrow / Split Screen Actions Menu (< lg dropdown) */}
            <div className="relative lg:hidden">
              <button
                type="button"
                onClick={() => setShowExportMenu((prev) => !prev)}
                className="px-2 py-1.5 rounded-md bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-xs flex items-center gap-1 transition-colors"
                title="Export Options (.tex, Overleaf)"
              >
                <FileCode className="w-3.5 h-3.5 text-zinc-400" />
                <ChevronDown className={`w-3 h-3 text-zinc-400 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
              </button>

              {showExportMenu && (
                <>
                  <div
                    className="fixed inset-0 z-40"
                    onClick={() => setShowExportMenu(false)}
                  />
                  <div className="absolute right-0 mt-1.5 w-48 bg-zinc-900 border border-zinc-800 rounded-md shadow-xl p-1 z-50 flex flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => {
                        setShowExportMenu(false);
                        onDownloadTex();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 transition-colors"
                    >
                      <Download className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Download .tex Source</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowExportMenu(false);
                        onOpenOverleaf();
                      }}
                      className="w-full text-left px-2.5 py-1.5 rounded text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white flex items-center gap-2 transition-colors"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-400" />
                      <span>Open in Overleaf</span>
                    </button>
                  </div>
                </>
              )}
            </div>

            {/* User info & Logout */}
            <div className="flex items-center gap-2 pl-1.5 sm:pl-2 border-l border-zinc-800">
              <div className="hidden xl:block text-right">
                <div className="text-xs font-medium text-zinc-300 truncate max-w-[120px]">
                  {user?.email}
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors flex-shrink-0"
                title="Log Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* New Profile Modal */}
      {showNewProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-md p-5 shadow-2xl space-y-3.5">
            <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
              <Plus className="w-4 h-4 text-zinc-300" />
              Create Resume Profile
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Profiles allow you to maintain distinct targeted resumes (e.g. SWE Intern, Systems, ML) while toggling entries easily.
            </p>

            <form onSubmit={handleCreateSubmit} className="space-y-3.5">
              <div>
                <label className="block text-[11px] uppercase tracking-wider font-semibold text-zinc-400 mb-1">
                  Profile Name
                </label>
                <input
                  type="text"
                  autoFocus
                  value={newProfileName}
                  onChange={(e) => setNewProfileName(e.target.value)}
                  placeholder="e.g. Fullstack Engineer"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-md py-1.5 px-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="cloneCheckbox"
                  checked={cloneCurrent}
                  onChange={(e) => setCloneCurrent(e.target.checked)}
                  className="w-3.5 h-3.5 rounded bg-zinc-950 border-zinc-800 text-zinc-100 focus:ring-zinc-500 accent-zinc-100"
                />
                <label htmlFor="cloneCheckbox" className="text-xs text-zinc-300 select-none">
                  Clone entries from current profile (<span className="text-zinc-100 font-medium">{activeProfile?.profileName}</span>)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setShowNewProfileModal(false)}
                  className="px-3 py-1.5 rounded-md text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newProfileName.trim()}
                  className="px-3.5 py-1.5 rounded-md text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 disabled:opacity-50 transition-colors shadow-sm"
                >
                  Create Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
