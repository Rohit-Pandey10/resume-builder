import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  LogOut,
  Edit2,
  MoreHorizontal,
  FileUp,
  Menu,
  Check,
  Loader2,
} from 'lucide-react';
import { Button, IconButton, Popover, MenuItem, MenuDivider } from './primitives';

export default function Navbar({
  user,
  profiles = [],
  activeProfileId,
  activeProfile,
  onSelectProfile,
  onRenameProfile,
  onOpenImport,
  saveStatus = 'saved',
  isDirty = false,
  onLogout,
  onCompilePdf,
  onDownloadTex,
  onOpenOverleaf,
  isCompiling = false,
  onOpenMobileMenu,
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const inputRef = useRef(null);

  const activeTitle = activeProfile?.profileName || 'Untitled Resume';
  const titleValue = editedTitle ?? activeTitle;

  useEffect(() => {
    if (isEditingTitle && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditingTitle]);

  const handleStartRename = () => {
    setEditedTitle(activeTitle);
    setIsEditingTitle(true);
  };

  const handleCommitRename = () => {
    const trimmed = (editedTitle ?? '').trim();
    setIsEditingTitle(false);
    setEditedTitle(null);
    if (trimmed && trimmed !== activeTitle && onRenameProfile) {
      onRenameProfile(activeProfileId, trimmed);
    }
  };

  const handleCancelRename = () => {
    setIsEditingTitle(false);
    setEditedTitle(null);
  };

  const handleTitleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleCommitRename();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelRename();
    }
  };

  return (
    <header
      className="h-[52px] w-full px-3 sm:px-4 flex items-center justify-between z-30 select-none border-b"
      style={{
        backgroundColor: '#FFFFFF',
        borderColor: 'var(--color-border, #E7E2DA)',
      }}
    >
      {/* Left: Mobile Menu Trigger + Brand Logo */}
      <div className="flex items-center gap-2.5 min-w-0">
        {/* Hamburger for mobile / tablet drawer */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 rounded hover:bg-surface-subtle transition-colors"
          style={{ color: 'var(--color-text-secondary, #57534E)' }}
          aria-label="Open navigation drawer"
        >
          <Menu size={18} strokeWidth={1.5} />
        </button>

        {/* Brand */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div
            className="w-6 h-6 rounded flex items-center justify-center font-bold text-xs"
            style={{
              backgroundColor: 'var(--color-accent-tint-bg, #F0FDFA)',
              color: 'var(--color-accent, #0F766E)',
              border: '1px solid var(--color-accent-tint-brd, #99F6E4)',
            }}
          >
            <FileText size={14} strokeWidth={1.5} />
          </div>
          <span
            className="text-sm font-semibold tracking-tight hidden xs:inline"
            style={{ color: 'var(--color-text-primary, #1C1917)' }}
          >
            JakeResume
          </span>
        </div>

        {/* Divider */}
        <div
          className="h-4 w-[1px] hidden sm:block mx-1"
          style={{ backgroundColor: 'var(--color-border, #E7E2DA)' }}
        />

        {/* Center-Left: Inline-Editable Profile Title */}
        <div className="min-w-0 max-w-[140px] sm:max-w-[260px] md:max-w-[360px]">
          {isEditingTitle ? (
            <input
              ref={inputRef}
              type="text"
              value={titleValue}
              onChange={(e) => setEditedTitle(e.target.value)}
              onBlur={handleCommitRename}
              onKeyDown={handleTitleKeyDown}
              className="h-7 px-1.5 text-xs font-medium rounded border w-full focus:outline-none"
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: 'var(--color-accent, #0F766E)',
                color: 'var(--color-text-primary, #1C1917)',
                boxShadow: '0 0 0 2px rgba(15, 118, 110, 0.20)',
              }}
              aria-label="Profile title"
            />
          ) : (
            <button
              type="button"
              onClick={handleStartRename}
              className="group flex items-center gap-1.5 px-1.5 py-1 rounded text-xs font-medium text-left truncate transition-colors hover:bg-surface-subtle"
              style={{ color: 'var(--color-text-primary, #1C1917)' }}
              title="Click to rename profile"
              aria-label={`Rename ${activeTitle}`}
            >
              <span className="truncate">{activeTitle}</span>
              <Edit2
                size={12}
                strokeWidth={1.5}
                className="opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity"
                style={{ color: 'var(--color-text-muted, #78716C)' }}
              />
            </button>
          )}
        </div>
      </div>

      {/* Right: Save Status + Export PDF (Primary) + Overflow Menu + User Avatar */}
      <div className="flex items-center gap-2 sm:gap-2.5 flex-shrink-0">
        {/* Save Status Indicator */}
        <div
          className="hidden md:flex items-center gap-1.5 text-xs mr-1"
          style={{ color: 'var(--color-text-muted, #78716C)' }}
        >
          {saveStatus === 'saving' ? (
            <>
              <Loader2
                size={12}
                strokeWidth={1.5}
                className="animate-spin text-accent"
                style={{ color: 'var(--color-accent, #0F766E)' }}
              />
              <span>Saving…</span>
            </>
          ) : isDirty ? (
            <>
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: 'var(--color-warning, #B45309)' }}
              />
              <span>Unsaved changes</span>
            </>
          ) : (
            <>
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: 'var(--color-success, #15803D)' }}
              />
              <span>Saved</span>
            </>
          )}
        </div>

        {/* ONE Primary Button: Export PDF */}
        <Button
          variant="primary"
          onClick={onCompilePdf}
          disabled={isCompiling}
          className="h-9 px-3 text-xs sm:text-sm font-medium"
        >
          {isCompiling ? (
            <>
              <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
              <span>Compiling…</span>
            </>
          ) : (
            <>
              <Download size={14} strokeWidth={1.5} />
              <span>Export PDF</span>
            </>
          )}
        </Button>

        {/* Overflow Export Menu (.tex, Overleaf, Import) */}
        <Popover
          isOpen={exportMenuOpen}
          onOpenChange={setExportMenuOpen}
          trigger={
            <IconButton
              title="More export actions"
              aria-label="Export actions menu"
              className="border border-border hover:border-border-strong bg-white"
            >
              <MoreHorizontal size={16} strokeWidth={1.5} />
            </IconButton>
          }
          align="end"
        >
          <div className="w-48 py-1 space-y-0.5">
            <MenuItem
              icon={<Download size={16} strokeWidth={1.5} />}
              onClick={() => {
                setExportMenuOpen(false);
                onDownloadTex?.();
              }}
            >
              Download .tex
            </MenuItem>

            <MenuItem
              icon={<ExternalLink size={16} strokeWidth={1.5} />}
              onClick={() => {
                setExportMenuOpen(false);
                onOpenOverleaf?.();
              }}
            >
              Open in Overleaf
            </MenuItem>

            <MenuDivider />

            <MenuItem
              icon={<FileUp size={16} strokeWidth={1.5} />}
              onClick={() => {
                setExportMenuOpen(false);
                onOpenImport?.();
              }}
            >
              Import resume
            </MenuItem>
          </div>
        </Popover>

        {/* User Account Popover */}
        <Popover
          isOpen={accountMenuOpen}
          onOpenChange={setAccountMenuOpen}
          trigger={
            <button
              type="button"
              className="w-8 h-8 rounded-full border flex items-center justify-center font-medium text-xs transition-colors hover:border-border-strong"
              style={{
                backgroundColor: 'var(--color-surface-subtle, #F5F2EC)',
                borderColor: 'var(--color-border, #E7E2DA)',
                color: 'var(--color-text-primary, #1C1917)',
              }}
              title={user?.email || 'Account menu'}
              aria-label="Account menu"
            >
              {(user?.email?.[0] || 'U').toUpperCase()}
            </button>
          }
          align="end"
        >
          <div className="w-56 py-1 space-y-0.5">
            <div className="px-3 py-1.5 border-b" style={{ borderColor: 'var(--color-border, #E7E2DA)' }}>
              <div className="text-[11px]" style={{ color: 'var(--color-text-muted, #78716C)' }}>
                Signed in as
              </div>
              <div className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary, #1C1917)' }}>
                {user?.email || 'Guest user'}
              </div>
            </div>

            <div className="px-1 py-1 max-h-36 overflow-y-auto space-y-0.5">
              <div className="px-2 py-1 text-[11px] font-medium" style={{ color: 'var(--color-text-muted, #78716C)' }}>
                Switch profile
              </div>
              {profiles.map((p) => (
                <button
                  key={p._id}
                  type="button"
                  onClick={() => {
                    onSelectProfile?.(p._id);
                    setAccountMenuOpen(false);
                  }}
                  className="w-full h-7 px-2 rounded text-left text-xs flex items-center justify-between hover:bg-surface-subtle transition-colors"
                  style={{
                    color: p._id === activeProfileId ? 'var(--color-accent, #0F766E)' : 'var(--color-text-primary, #1C1917)',
                    fontWeight: p._id === activeProfileId ? 500 : 400,
                  }}
                >
                  <span className="truncate">{p.profileName}</span>
                  {p._id === activeProfileId && <Check size={12} strokeWidth={1.5} />}
                </button>
              ))}
            </div>

            <MenuDivider />

            <MenuItem
              icon={<LogOut size={16} strokeWidth={1.5} />}
              onClick={() => {
                setAccountMenuOpen(false);
                onLogout?.();
              }}
            >
              Sign out
            </MenuItem>
          </div>
        </Popover>
      </div>
    </header>
  );
}
