import React, { useState, useEffect } from 'react';
import {
  User,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Wrench,
  Layers,
  ChevronDown,
  Plus,
  Eye,
  EyeOff,
  PanelLeftClose,
  PanelLeft,
  X,
} from 'lucide-react';
import { IconButton } from './primitives';

export default function Sidebar({
  activeSection = 'basics',
  onSelectSection,
  sectionOrder = ['education', 'experience', 'projects', 'skills', 'customSections'],
  profile,
  onToggleSectionEnabled,
  profiles = [],
  activeProfileId,
  onSelectProfile,
  onCreateProfile,
  isCollapsed = false,
  onToggleCollapse,
  mode = 'account',
  onOpenAuth,
  isMobileOpen = false,
  onCloseMobile,
}) {
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [showNewProfileInput, setShowNewProfileInput] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');

  // Close profile dropdown on outside click
  useEffect(() => {
    if (!profileDropdownOpen) return;
    const handleClick = () => setProfileDropdownOpen(false);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [profileDropdownOpen]);

  // Section meta definitions
  const sectionMeta = {
    basics: {
      id: 'basics',
      label: 'Personal & contact',
      icon: User,
      isCore: true,
      hasData: Boolean(profile?.basics?.fullName || profile?.basics?.email),
      count: null,
      enabled: true,
    },
    education: {
      id: 'education',
      label: 'Education',
      icon: GraduationCap,
      isCore: false,
      hasData: (profile?.education || []).some((e) => e && (e.institution || e.degree)),
      count: (profile?.education || []).filter((e) => e.enabled !== false).length,
      enabled: profile?.educationEnabled !== false,
    },
    experience: {
      id: 'experience',
      label: 'Experience',
      icon: Briefcase,
      isCore: false,
      hasData: (profile?.experience || []).some((e) => e && (e.company || e.role)),
      count: (profile?.experience || []).filter((e) => e.enabled !== false).length,
      enabled: profile?.experienceEnabled !== false,
    },
    projects: {
      id: 'projects',
      label: 'Projects',
      icon: FolderGit2,
      isCore: false,
      hasData: (profile?.projects || []).some((p) => p && p.title),
      count: (profile?.projects || []).filter((p) => p.enabled !== false).length,
      enabled: profile?.projectsEnabled !== false,
    },
    skills: {
      id: 'skills',
      label: 'Skills',
      icon: Wrench,
      isCore: false,
      hasData: Array.isArray(profile?.skills)
        ? profile.skills.some((c) => (c.items || []).length > 0)
        : Boolean(profile?.skills),
      count: Array.isArray(profile?.skills)
        ? profile.skills.filter((c) => c.enabled !== false && (c.items || []).length > 0).length
        : null,
      enabled: profile?.skillsEnabled !== false,
    },
    customSections: {
      id: 'customSections',
      label: 'Custom sections',
      icon: Layers,
      isCore: false,
      hasData: (profile?.customSections || []).some(
        (s) => s.enabled !== false && (s.items || []).some((item) => item && item.enabled !== false)
      ),
      count: (profile?.customSections || []).reduce((acc, s) => {
        if (s.enabled === false) return acc;
        return acc + (s.items || []).filter((item) => item && item.enabled !== false).length;
      }, 0),
      hasEmptySections: (profile?.customSections || []).some(
        (s) => s.enabled !== false && (!s.items || s.items.length === 0)
      ),
      enabled: profile?.customSectionsEnabled !== false,
    },
  };

  const handleCreateProfileSubmit = (e) => {
    e.preventDefault();
    if (!newProfileName.trim()) return;
    onCreateProfile(newProfileName.trim());
    setNewProfileName('');
    setShowNewProfileInput(false);
    setProfileDropdownOpen(false);
  };

  const currentProfileObj = profiles.find((p) => p._id === activeProfileId);

  const sidebarContent = (
    <div
      className="h-full flex flex-col justify-between select-none"
      style={{
        backgroundColor: 'var(--color-bg-app, #FAF8F5)',
        width: isCollapsed ? '56px' : '240px',
        transition: 'width var(--transition-fast, 150ms ease-out)',
      }}
    >
      {/* Top Header / Profile Switcher */}
      <div
        className="p-2 border-b flex-shrink-0"
        style={{ borderColor: 'var(--color-border, #E7E2DA)' }}
      >
        {!isCollapsed ? (
          <div className="relative">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setProfileDropdownOpen(!profileDropdownOpen);
              }}
              className="w-full h-9 px-2 rounded flex items-center justify-between text-left text-xs font-medium border transition-colors"
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: profileDropdownOpen
                  ? 'var(--color-border-strong, #D6CFC3)'
                  : 'var(--color-border, #E7E2DA)',
                color: 'var(--color-text-primary, #1C1917)',
              }}
              aria-expanded={profileDropdownOpen}
              aria-label="Switch active profile"
            >
              <span className="truncate mr-1">
                {currentProfileObj?.profileName || 'Select profile'}
              </span>
              <ChevronDown
                size={14}
                strokeWidth={1.5}
                style={{
                  transform: profileDropdownOpen ? 'rotate(180deg)' : 'none',
                  transition: 'transform var(--transition-fast, 150ms ease-out)',
                  color: 'var(--color-text-secondary, #57534E)',
                }}
              />
            </button>

            {/* Profile Dropdown Menu */}
            {profileDropdownOpen && (
              <div
                className="absolute top-10 left-0 w-full z-50 p-1 border rounded"
                style={{
                  backgroundColor: '#FFFFFF',
                  borderColor: 'var(--color-border, #E7E2DA)',
                  boxShadow: 'var(--shadow-popover, 0 8px 24px rgba(28,25,23,0.08))',
                  borderRadius: 'var(--radius-panel, 10px)',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="max-h-48 overflow-y-auto space-y-0.5">
                  {profiles.map((p) => {
                    const isSelected = p._id === activeProfileId;
                    return (
                      <button
                        key={p._id}
                        type="button"
                        onClick={() => {
                          onSelectProfile(p._id);
                          setProfileDropdownOpen(false);
                        }}
                        className="w-full h-8 px-2 rounded text-left text-xs flex items-center justify-between transition-colors"
                        style={{
                          backgroundColor: isSelected
                            ? 'var(--color-surface-subtle, #F5F2EC)'
                            : 'transparent',
                          color: isSelected
                            ? 'var(--color-accent, #0F766E)'
                            : 'var(--color-text-primary, #1C1917)',
                          fontWeight: isSelected ? 500 : 400,
                        }}
                      >
                        <span className="truncate">{p.profileName}</span>
                        {isSelected && (
                          <span
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: 'var(--color-accent, #0F766E)' }}
                          />
                        )}
                      </button>
                    );
                  })}
                </div>

                <div
                  className="pt-1 mt-1 border-t"
                  style={{ borderColor: 'var(--color-border, #E7E2DA)' }}
                >
                  {showNewProfileInput ? (
                    <form onSubmit={handleCreateProfileSubmit} className="p-1 space-y-1.5">
                      <input
                        type="text"
                        autoFocus
                        value={newProfileName}
                        onChange={(e) => setNewProfileName(e.target.value)}
                        placeholder="Profile title…"
                        className="w-full h-7 px-2 text-xs border rounded bg-white"
                        style={{
                          borderColor: 'var(--color-border, #E7E2DA)',
                          color: 'var(--color-text-primary, #1C1917)',
                        }}
                      />
                      <div className="flex gap-1 justify-end">
                        <button
                          type="button"
                          onClick={() => setShowNewProfileInput(false)}
                          className="px-2 py-0.5 text-xs"
                          style={{ color: 'var(--color-text-3)' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={!newProfileName.trim()}
                          className="px-2 py-0.5 text-xs rounded font-medium disabled:opacity-50"
                          style={{
                            backgroundColor: 'var(--color-brand)',
                            color: '#FFFFFF',
                          }}
                        >
                          Create
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setShowNewProfileInput(true)}
                      className="w-full h-7 px-2 rounded text-left text-xs flex items-center gap-1.5 hover:bg-surface-subtle transition-colors"
                      style={{ color: 'var(--color-accent, #0F766E)' }}
                    >
                      <Plus size={14} strokeWidth={1.5} />
                      <span>New profile</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center">
            <IconButton
              onClick={() => onSelectSection('basics')}
              title={currentProfileObj?.profileName || 'Profile'}
            >
              <User size={16} strokeWidth={1.5} />
            </IconButton>
          </div>
        )}
      </div>

      {/* Middle: Section Navigation List */}
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
        {/* 1. Basics (Fixed Core Header) */}
        {(() => {
          const item = sectionMeta.basics;
          const isSelected = activeSection === 'basics';
          return (
            <div
              key="basics"
              onClick={() => onSelectSection('basics')}
              className="group relative flex items-center h-9 px-2 rounded cursor-pointer transition-colors"
              style={{
                backgroundColor: isSelected
                  ? 'var(--color-surface-subtle, #F5F2EC)'
                  : 'transparent',
                color: isSelected
                  ? 'var(--color-accent, #0F766E)'
                  : 'var(--color-text-primary, #1C1917)',
                borderLeft: isSelected ? '2px solid var(--color-accent, #0F766E)' : '2px solid transparent',
              }}
              aria-current={isSelected ? 'true' : undefined}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectSection('basics');
                }
              }}
            >
              <item.icon
                size={16}
                strokeWidth={1.5}
                className="flex-shrink-0"
                style={{
                  color: isSelected
                    ? 'var(--color-accent, #0F766E)'
                    : 'var(--color-text-secondary, #57534E)',
                }}
              />

              {!isCollapsed && (
                <div className="flex-1 min-w-0 ml-2.5 flex items-center justify-between">
                  <span className="text-xs font-medium truncate">{item.label}</span>
                  {item.hasData && (
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 ml-1.5"
                      style={{ backgroundColor: 'var(--color-accent, #0F766E)' }}
                      title="Completed section"
                    />
                  )}
                </div>
              )}
            </div>
          );
        })()}

        {/* Dynamic Sections */}
        {sectionOrder.map((sectionKey) => {
          const item = sectionMeta[sectionKey];
          if (!item) return null;
          const isSelected = activeSection === sectionKey;
          const isEnabled = item.enabled;

          return (
            <div
              key={sectionKey}
              className="group relative flex items-center h-9 px-2 rounded transition-colors"
              style={{
                backgroundColor: isSelected
                  ? 'var(--color-surface-subtle, #F5F2EC)'
                  : 'transparent',
                color: isSelected
                  ? 'var(--color-accent, #0F766E)'
                  : !item.hasData
                  ? 'var(--color-text-muted, #78716C)'
                  : isEnabled
                  ? 'var(--color-text-primary, #1C1917)'
                  : 'var(--color-text-muted, #78716C)',
                opacity: isEnabled ? 1 : 0.55,
                borderLeft: isSelected ? '2px solid var(--color-accent, #0F766E)' : '2px solid transparent',
              }}
            >
              <button
                type="button"
                onClick={() => onSelectSection(sectionKey)}
                className="flex-1 flex items-center min-w-0 text-left h-full focus:outline-none"
                aria-current={isSelected ? 'true' : undefined}
                aria-label={item.label}
                title={
                  isCollapsed
                    ? `${item.label} (${item.count ?? 0})`
                    : !item.hasData
                    ? 'Not in resume until it has an item'
                    : undefined
                }
              >
                <item.icon
                  size={16}
                  strokeWidth={1.5}
                  className="flex-shrink-0"
                  style={{
                    color: isSelected
                      ? 'var(--color-accent, #0F766E)'
                      : !item.hasData
                      ? 'var(--color-text-muted, #78716C)'
                      : isEnabled
                      ? 'var(--color-text-secondary, #57534E)'
                      : 'var(--color-text-muted, #78716C)',
                  }}
                />

                {!isCollapsed && (
                  <div className="flex-1 min-w-0 ml-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 min-w-0 flex-1">
                      <span className="text-xs font-medium truncate">{item.label}</span>
                      {typeof item.count === 'number' && item.count > 0 && (
                        <span
                          className="text-[11px] font-normal"
                          style={{ color: 'var(--color-text-muted, #78716C)' }}
                        >
                          {item.count}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </button>

              {!isCollapsed && (
                <div className="flex items-center gap-0.5 flex-shrink-0 ml-1">
                  <div
                    className={`flex items-center transition-opacity ${
                      isEnabled
                        ? 'opacity-0 group-hover:opacity-100 group-focus-within:opacity-100'
                        : 'opacity-100'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleSectionEnabled?.(sectionKey);
                      }}
                      className="w-5 h-5 flex items-center justify-center rounded hover:opacity-80 focus:outline-none"
                      style={{
                        color: isEnabled ? 'var(--color-text-2)' : 'var(--color-text-muted, #78716C)',
                      }}
                      title={isEnabled ? 'Hide section from resume' : 'Show section in resume'}
                      aria-label={isEnabled ? `Hide ${item.label}` : `Show ${item.label}`}
                    >
                      {isEnabled ? (
                        <Eye size={13} strokeWidth={1.5} />
                      ) : (
                        <EyeOff size={13} strokeWidth={1.5} />
                      )}
                    </button>
                  </div>

                  {item.hasData && isEnabled && (
                    <span
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0 ml-1"
                      style={{ backgroundColor: 'var(--color-accent, #0F766E)' }}
                      title="Completed section"
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Footer Actions: only Collapse sidebar */}
      <div
        className="p-2 border-t flex-shrink-0"
        style={{ borderColor: 'var(--color-border, #E7E2DA)' }}
      >
        {mode === 'guest' && !isCollapsed && (
          <div
            className="mb-2 p-2 rounded border space-y-1.5"
            style={{
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-bg-subtle)',
            }}
          >
            <p className="text-[11px] leading-relaxed" style={{ color: 'var(--color-text-2)' }}>
              Guest mode. Resumes are saved in this browser only.
            </p>
            <button
              type="button"
              onClick={onOpenAuth}
              className="text-[11px] font-medium"
              style={{ color: 'var(--color-brand)' }}
            >
              Sign in with Google
            </button>
          </div>
        )}
        <button
          type="button"
          onClick={onToggleCollapse}
          className="w-full h-8 px-2 rounded text-xs flex items-center gap-2 hover:bg-surface-subtle transition-colors"
          style={{
            color: 'var(--color-text-muted, #78716C)',
            justifyContent: isCollapsed ? 'center' : 'flex-start',
          }}
          title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? (
            <PanelLeft size={16} strokeWidth={1.5} />
          ) : (
            <>
              <PanelLeftClose size={16} strokeWidth={1.5} />
              <span>Collapse sidebar</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop & Tablet Sidebar (>= 1024px) */}
      <aside
        className="hidden lg:flex flex-col flex-shrink-0 h-full border-r z-20"
        style={{
          borderColor: 'var(--color-border, #E7E2DA)',
          width: isCollapsed ? '56px' : '240px',
        }}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (< 1024px) */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 transition-opacity"
            style={{ background: 'var(--color-bg-overlay)' }}
            onClick={onCloseMobile}
            aria-hidden="true"
          />

          {/* Drawer content */}
          <div
            className="relative w-64 max-w-[80vw] h-full shadow-xl z-10 flex flex-col"
            style={{ backgroundColor: 'var(--color-bg-app, #FAF8F5)' }}
          >
            <div className="absolute top-2 right-2 z-20">
              <IconButton onClick={onCloseMobile} title="Close navigation">
                <X size={16} strokeWidth={1.5} />
              </IconButton>
            </div>
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
