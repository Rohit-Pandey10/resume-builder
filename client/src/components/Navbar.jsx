import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  LogOut,
  Edit2,
  MoreHorizontal,
  FileUp,
  RotateCcw,
  Menu,
  Check,
  Loader2,
  Undo2,
  Redo2,
  UserRound,
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
  onResetSectionOrder,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  saveStatus = 'saved',
  isDirty = false,
  onLogout,
  mode = 'account',
  onOpenAuth,
  onLeaveGuest,
  onDeleteGuestData,
  onCompilePdf,
  onDownloadTex,
  onOpenOverleaf,
  onDownloadPdf,
  hasCompiledPdf = false,
  isCompiling = false,
  compileElapsedSeconds = 0,
  onOpenMobileMenu,
}) {
  const isGuest = mode === 'guest';
  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
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
      className="h-[52px] w-full px-2 sm:px-4 flex sm:grid sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center justify-between z-30 select-none border-b flex-shrink-0 sticky top-0"
      style={{
        backgroundColor: 'var(--color-bg-base)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Left (Column 1): Mobile Menu Trigger + Brand Logo */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 justify-self-start">
        {/* Hamburger for mobile / tablet drawer */}
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="lg:hidden p-1.5 rounded hover:bg-surface-subtle transition-colors flex-shrink-0"
          style={{ color: 'var(--color-text-secondary, #57534E)' }}
          aria-label="Open navigation drawer"
        >
          <Menu size={18} strokeWidth={1.5} />
        </button>

        {/* Brand */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          <div
            className="w-6 h-6 rounded flex items-center justify-center font-bold text-xs"
            style={{
              backgroundColor: 'var(--color-accent-tint-bg, #F0FDFA)',
              color: 'var(--color-accent, #0F766E)',
              border: '1px solid var(--color-border)',
            }}
          >
            <FileText size={14} strokeWidth={1.5} />
          </div>
          <span
            className="text-sm font-semibold tracking-tight hidden sm:inline"
            style={{ color: 'var(--color-text-1)' }}
          >
            JakeResume
          </span>
        </div>

        {/* Divider */}
        <div
          className="h-4 w-[1px] hidden sm:block mx-1"
          style={{ backgroundColor: 'var(--color-border)' }}
        />

        {/* Center-Left: Inline-Editable Profile Title */}
        <div className="min-w-0 flex-1 max-w-[110px] xs:max-w-[150px] sm:max-w-[240px] md:max-w-[360px]">
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
                backgroundColor: 'var(--color-bg-base)',
                borderColor: 'var(--color-accent, #0F766E)',
                color: 'var(--color-text-1)',
                boxShadow: '0 0 0 2px rgba(15, 118, 110, 0.20)',
              }}
              aria-label="Profile title"
            />
          ) : (
            <button
              type="button"
              onClick={handleStartRename}
              className="group flex items-center gap-1 px-1.5 py-1 rounded text-xs font-medium text-left truncate transition-colors hover:bg-surface-subtle"
              style={{ color: 'var(--color-text-1)' }}
              title={activeTitle}
              aria-label={`Rename ${activeTitle}`}
            >
              <span className="truncate">{activeTitle}</span>
              <Edit2
                size={12}
                strokeWidth={1.5}
                className="opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity"
                style={{ color: 'var(--color-text-3)' }}
              />
            </button>
          )}
        </div>
      </div>

      {/* Center (Column 2): Import resume button (Visible on tablet/desktop, hidden on mobile) */}
      <div className="hidden sm:flex items-center justify-center justify-self-center px-2">
        <button
          type="button"
          onClick={onOpenImport}
          className="h-9 px-3 rounded text-xs border flex items-center gap-1.5 sm:gap-2 transition-colors"
          style={{
            backgroundColor: 'var(--color-accent-tint-bg, #F0FDFA)',
            borderColor: 'var(--color-accent, #0F766E)',
            color: 'var(--color-accent, #0F766E)',
            fontWeight: 500,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#CCFBF1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-accent-tint-bg, #F0FDFA)';
          }}
          title="Import resume"
          aria-label="Import resume"
        >
          <FileUp size={15} strokeWidth={1.5} style={{ color: 'var(--color-accent, #0F766E)' }} />
          <span className="hidden min-[1100px]:inline">Import resume</span>
        </button>
      </div>

      {/* Right (Column 3): Save Status + Export PDF (Primary) + Overflow Menu + User Avatar */}
      <div className="min-w-0 flex items-center gap-1.5 sm:gap-2.5 justify-self-end flex-shrink-0">
        {/* Undo and Redo buttons (hidden on xs screens, available in more menu) */}
        <div className="hidden xs:flex items-center gap-0.5">
          <button
            type="button"
            onClick={onUndo}
            disabled={!canUndo}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-subtle transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
            style={{ color: 'var(--color-text-secondary, #57534E)' }}
            title={isMac ? "Undo (⌘Z)" : "Undo (Ctrl+Z)"}
            aria-label={isMac ? "Undo (⌘Z)" : "Undo (Ctrl+Z)"}
          >
            <Undo2 size={15} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={onRedo}
            disabled={!canRedo}
            className="w-7 h-7 flex items-center justify-center rounded hover:bg-surface-subtle transition-colors disabled:opacity-25 disabled:cursor-not-allowed"
            style={{ color: 'var(--color-text-secondary, #57534E)' }}
            title={isMac ? "Redo (⇧⌘Z)" : "Redo (Ctrl+Y)"}
            aria-label={isMac ? "Redo (⇧⌘Z)" : "Redo (Ctrl+Y)"}
          >
            <Redo2 size={15} strokeWidth={1.5} />
          </button>
        </div>

        {/* Save Status Indicator */}
        <div
          className="hidden md:flex items-center gap-1.5 text-xs mr-1"
          style={{ color: 'var(--color-text-3)' }}
        >
          {saveStatus === 'saving' ? (
            <>
              <Loader2
                size={12}
                strokeWidth={1.5}
                className="animate-spin text-accent"
                style={{ color: 'var(--color-brand)' }}
              />
              <span>Saving…</span>
            </>
          ) : isDirty ? (
            <>
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: 'var(--color-warning)' }}
              />
              <span>Unsaved changes</span>
            </>
          ) : (
            <>
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: saveStatus === 'not-saved' ? 'var(--color-danger)' : 'var(--color-success)' }}
              />
              <span style={{ color: saveStatus === 'not-saved' ? 'var(--color-danger)' : undefined }}>
                {saveStatus === 'not-saved' ? 'Not saved' : isGuest ? 'Saved on this device' : 'Saved'}
              </span>
            </>
          )}
        </div>

        {/* ONE Primary Button: Export PDF */}
        <Button
          variant="primary"
          onClick={onCompilePdf}
          disabled={isCompiling}
          aria-busy={isCompiling}
          title="Export resume as PDF"
          className="h-8 sm:h-9 px-2.5 sm:px-3 text-xs font-medium"
        >
          {isCompiling ? (
            <>
              <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
              <span>
                <span className="hidden xs:inline">Compiling… {compileElapsedSeconds}s</span>
                {compileElapsedSeconds >= 10 && (
                  <span className="hidden min-[640px]:block text-[10px] font-normal">Still generating… please wait.</span>
                )}
              </span>
            </>
          ) : (
            <>
              <Download size={13} strokeWidth={1.5} />
              <span className="hidden xs:inline">Export PDF</span>
              <span className="xs:hidden">Export</span>
            </>
          )}
        </Button>

        {/* Overflow Export Menu (.tex, Overleaf, Import, Reset section order) */}
        <Popover
          isOpen={exportMenuOpen}
          onOpenChange={setExportMenuOpen}
          trigger={
            <IconButton
              title="More actions"
              aria-label="Actions menu"
              className="border border-border hover:border-border-strong bg-white"
            >
              <MoreHorizontal size={16} strokeWidth={1.5} />
            </IconButton>
          }
          align="end"
        >
          <div className="w-48 py-1 space-y-0.5">
            <div className="xs:hidden">
              <MenuItem
                icon={<Undo2 size={16} strokeWidth={1.5} />}
                disabled={!canUndo}
                onClick={() => {
                  setExportMenuOpen(false);
                  onUndo?.();
                }}
              >
                Undo
              </MenuItem>
              <MenuItem
                icon={<Redo2 size={16} strokeWidth={1.5} />}
                disabled={!canRedo}
                onClick={() => {
                  setExportMenuOpen(false);
                  onRedo?.();
                }}
              >
                Redo
              </MenuItem>
              <MenuDivider />
            </div>

            <MenuItem
              icon={<Download size={16} strokeWidth={1.5} />}
              onClick={() => {
                setExportMenuOpen(false);
                onDownloadTex?.();
              }}
            >
              Download .tex
            </MenuItem>

            {hasCompiledPdf && (
              <MenuItem
                icon={<Download size={16} strokeWidth={1.5} />}
                onClick={() => {
                  setExportMenuOpen(false);
                  onDownloadPdf?.();
                }}
              >
                Download PDF
              </MenuItem>
            )}

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
              icon={<RotateCcw size={16} strokeWidth={1.5} />}
              onClick={() => {
                setExportMenuOpen(false);
                onResetSectionOrder?.();
              }}
            >
              Reset section order
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
          trigger={(
            <div className="flex items-center gap-1.5">
              {isGuest && (
                <span
                  className="px-1.5 py-0.5 rounded border text-[12px]"
                  style={{
                    color: 'var(--color-text-3)',
                    borderColor: 'var(--color-border)',
                    backgroundColor: 'var(--color-bg-subtle)',
                  }}
                >
                  Guest
                </span>
              )}
              <button
                type="button"
                className="w-8 h-8 rounded-full border flex items-center justify-center font-medium text-xs transition-colors hover:border-border-strong"
                style={{
                  backgroundColor: 'var(--color-surface-subtle, #F5F2EC)',
                  borderColor: 'var(--color-border, #E7E2DA)',
                  color: 'var(--color-text-primary, #1C1917)',
                }}
                title={isGuest ? 'Guest menu' : (user?.email || 'Account menu')}
                aria-label={isGuest ? 'Guest menu' : 'Account menu'}
              >
                {isGuest ? <UserRound size={16} strokeWidth={1.5} /> : (user?.email?.[0] || 'U').toUpperCase()}
              </button>
            </div>
          )}
          align="end"
        >
          <div className="w-56 py-1 space-y-0.5">
            <div className="px-3 py-1.5 border-b" style={{ borderColor: 'var(--color-border, #E7E2DA)' }}>
              <div className="text-[11px]" style={{ color: 'var(--color-text-muted, #78716C)' }}>
                {isGuest ? 'Guest' : 'Signed in as'}
              </div>
              <div className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary, #1C1917)' }}>
                {isGuest ? 'Saved in this browser only' : user?.email}
              </div>
            </div>

            {!isGuest && <div className="px-1 py-1 max-h-36 overflow-y-auto space-y-0.5">
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
            </div>}

            <MenuDivider />

            {isGuest ? (
              <>
                <MenuItem
                  icon={<UserRound size={16} strokeWidth={1.5} />}
                  onClick={() => {
                    setAccountMenuOpen(false);
                    onOpenAuth?.();
                  }}
                >
                  Sign in with Google
                </MenuItem>
                <MenuItem
                  icon={<LogOut size={16} strokeWidth={1.5} />}
                  onClick={() => {
                    setAccountMenuOpen(false);
                    onLeaveGuest?.();
                  }}
                >
                  Leave guest mode
                </MenuItem>
                <MenuItem
                  icon={<RotateCcw size={16} strokeWidth={1.5} />}
                  danger
                  onClick={() => {
                    setAccountMenuOpen(false);
                    onDeleteGuestData?.();
                  }}
                >
                  Delete data on this device
                </MenuItem>
              </>
            ) : (
              <MenuItem
                icon={<LogOut size={16} strokeWidth={1.5} />}
                onClick={() => {
                  setAccountMenuOpen(false);
                  onLogout?.();
                }}
              >
                Sign out
              </MenuItem>
            )}
          </div>
        </Popover>
      </div>
    </header>
  );
}
