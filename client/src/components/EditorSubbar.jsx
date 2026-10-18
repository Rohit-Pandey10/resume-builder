import React, { useState, useEffect, useRef } from 'react';
import {
  CaretDown,
  Check,
  FileText,
  PencilSimpleLine,
  Redo2,
  RotateCcw,
  Undo2,
} from './icons';
import { IconButton, MenuDivider, MenuItem, Popover } from './primitives';

export default function EditorSubbar({
  activeTitle = 'Untitled Resume',
  onRenameProfile,
  activeProfileId,
  isGuest,
  onOpenAuth,
  onCreateProfile,
  onGoDashboard,
  onResetSectionOrder,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  saveStatus = 'saved',
  isDirty = false,
  lastSavedAt,
}) {
  const [titleEditing, setTitleEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [resumeMenuOpen, setResumeMenuOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const inputRef = useRef(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (titleEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [titleEditing]);

  const beginRename = () => {
    setTitle(activeTitle);
    setTitleEditing(true);
  };

  const commitRename = () => {
    const next = title.trim();
    setTitleEditing(false);
    if (next && next !== activeTitle) {
      onRenameProfile?.(activeProfileId, next);
    }
  };

  function relativeSavedTime(timestamp, currentNow) {
    if (!timestamp) return 'just now';
    const minutes = Math.max(0, Math.floor((currentNow - timestamp) / 60000));
    return minutes < 1 ? 'just now' : `${minutes} min ago`;
  }

  const status = saveStatus === 'saving'
    ? { label: 'Saving…', tone: 'saving' }
    : saveStatus === 'not-saved'
      ? { label: 'Not saved', tone: 'danger' }
      : isDirty
        ? { label: 'Unsaved changes', tone: 'warning' }
        : { label: isGuest ? 'Saved on this device' : `Saved · ${relativeSavedTime(lastSavedAt, now)}`, tone: 'saved' };

  return (
    <div className="jr-editor-subbar" role="region" aria-label="Resume toolbar">
      {/* Left: Breadcrumb "Resumes › {title}" */}
      <div className="jr-editor-subbar-left">
        <a
          href="#/resumes"
          className="jr-subbar-breadcrumb-link"
          onClick={(e) => {
            e.preventDefault();
            onGoDashboard?.();
          }}
        >
          Resumes
        </a>
        <span className="jr-subbar-breadcrumb-sep" aria-hidden="true">›</span>

        {titleEditing ? (
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') setTitleEditing(false);
            }}
            aria-label="Resume title"
            className="jr-subbar-title-input"
          />
        ) : (
          <div className="jr-subbar-title-group">
            <button
              type="button"
              className="jr-subbar-title-btn"
              onClick={beginRename}
              title={`Click to rename: ${activeTitle}`}
              aria-label={`Resume title: ${activeTitle}. Click to rename`}
            >
              <span className="jr-subbar-title-text">{activeTitle}</span>
            </button>
            <Popover
              align="right"
              width={240}
              open={resumeMenuOpen}
              onOpenChange={setResumeMenuOpen}
              trigger={
                <button
                  type="button"
                  className="jr-subbar-caret-btn"
                  title="Resume menu"
                  aria-label={`Resume menu: ${activeTitle}`}
                >
                  <CaretDown size={16} />
                </button>
              }
            >
              <div className="jr-topbar-profile-menu">
                <MenuItem
                  icon={<PencilSimpleLine size={16} />}
                  onClick={() => {
                    setResumeMenuOpen(false);
                    beginRename();
                  }}
                >
                  Rename
                </MenuItem>
                <MenuItem
                  icon={<FileText size={16} />}
                  onClick={() => {
                    setResumeMenuOpen(false);
                    if (isGuest) {
                      onOpenAuth?.('Sign in to switch resumes');
                    } else {
                      onGoDashboard?.();
                    }
                  }}
                >
                  Switch resume
                </MenuItem>
                <MenuItem
                  icon={<FileText size={16} />}
                  onClick={() => {
                    setResumeMenuOpen(false);
                    if (isGuest) {
                      onOpenAuth?.('Sign in to create multiple resumes');
                    } else {
                      onCreateProfile?.('Untitled Resume');
                    }
                  }}
                >
                  New resume
                </MenuItem>
                <MenuDivider />
                <MenuItem
                  icon={<RotateCcw size={16} />}
                  onClick={() => {
                    setResumeMenuOpen(false);
                    onResetSectionOrder?.();
                  }}
                >
                  Reset section order
                </MenuItem>
              </div>
            </Popover>
          </div>
        )}
      </div>

      {/* Right: Undo, Redo, Save status */}
      <div className="jr-editor-subbar-right">
        <div className="jr-subbar-history">
          <IconButton
            title="Undo"
            aria-label="Undo"
            onClick={onUndo}
            disabled={!canUndo}
            className="jr-subbar-history-btn"
          >
            <Undo2 size={18} />
          </IconButton>
          <IconButton
            title="Redo"
            aria-label="Redo"
            onClick={onRedo}
            disabled={!canRedo}
            className="jr-subbar-history-btn"
          >
            <Redo2 size={18} />
          </IconButton>
        </div>

        <div
          className={`jr-save-status is-${status.tone}`}
          aria-live="polite"
          title={status.label}
        >
          {status.tone === 'saving' ? (
            <span className="jr-save-pulsing-dot" aria-hidden="true" />
          ) : (
            <span className="jr-save-dot">
              <Check size={11} />
            </span>
          )}
          <span className="jr-save-status-text">{status.label}</span>
          <span className="sr-only">{status.label}</span>
        </div>
      </div>
    </div>
  );
}
