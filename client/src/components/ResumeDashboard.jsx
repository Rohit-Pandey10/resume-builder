import React, { useMemo, useState, useEffect } from 'react';
import { clsx } from 'clsx';
import {
  FileText,
  MoreHorizontal,
  Plus,
  UploadSimple,
  Info,
  Trash,
  PencilSimpleLine,
} from './icons';
import { Button, Card, IconButton, MenuItem } from './primitives';
import { completion } from '../utils/completion';

function relativeUpdatedAt(value) {
  if (!value) return null;
  const timestamp = new Date(value).getTime();
  if (!Number.isFinite(timestamp)) return null;
  const seconds = Math.round((timestamp - Date.now()) / 1000);
  const formatter = new Intl.RelativeTimeFormat(undefined, { numeric: 'auto' });
  const ranges = [[31536000, 'year'], [2592000, 'month'], [604800, 'week'], [86400, 'day'], [3600, 'hour'], [60, 'minute']];
  const match = ranges.find(([unit]) => Math.abs(seconds) >= unit);
  if (!match) return formatter.format(0, 'second');
  return formatter.format(Math.round(seconds / match[0]), match[1]);
}

/**
 * Live miniature Jake's Resume preview showing the actual candidate data till this point.
 */
function ResumeMiniPreview({ profile }) {
  const basics = profile.basics || {};
  const name = basics.name?.trim() || profile.profileName || 'Untitled Resume';
  const email = basics.email?.trim();
  const location = basics.location?.trim();
  const contactParts = [location, email].filter(Boolean);
  const contactText = contactParts.length > 0 ? contactParts.join(' · ') : null;

  // Extract first populated section safely
  const firstExp = Array.isArray(profile.experience) ? profile.experience.find((e) => e && (e.company || e.role)) : null;
  const firstEdu = Array.isArray(profile.education) ? profile.education.find((e) => e && (e.school || e.degree)) : null;
  const firstProj = Array.isArray(profile.projects) ? profile.projects.find((p) => p && p.name) : null;
  const firstSkill = Array.isArray(profile.skills) ? profile.skills.find((s) => s && (s.category || s.items)) : null;

  return (
    <div className="jr-resume-mini-preview" aria-hidden="true">
      <div className="jr-mini-paper">
        {/* Name & Contact Header */}
        <div className="jr-mini-header">
          <div className="jr-mini-name">{name.toUpperCase()}</div>
          {contactText ? (
            <div className="jr-mini-contact">{contactText}</div>
          ) : (
            <div className="jr-mini-contact-bar">
              <span style={{ width: '45%' }} />
            </div>
          )}
        </div>

        {/* Section 1 */}
        {firstExp ? (
          <div className="jr-mini-section">
            <div className="jr-mini-section-title">EXPERIENCE</div>
            <div className="jr-mini-rule" />
            <div className="jr-mini-entry-head">
              <span className="jr-mini-bold">{firstExp.role || firstExp.company}</span>
              <span className="jr-mini-dim">{firstExp.company && firstExp.role ? `| ${firstExp.company}` : ''}</span>
            </div>
            {firstExp.bullets?.[0]?.text ? (
              <div className="jr-mini-bullet">
                <span className="jr-mini-bullet-dot">•</span>
                <span className="jr-mini-bullet-text">{firstExp.bullets[0].text}</span>
              </div>
            ) : (
              <div className="jr-mini-lines">
                <span style={{ width: '92%' }} />
                <span style={{ width: '68%' }} />
              </div>
            )}
          </div>
        ) : firstEdu ? (
          <div className="jr-mini-section">
            <div className="jr-mini-section-title">EDUCATION</div>
            <div className="jr-mini-rule" />
            <div className="jr-mini-entry-head">
              <span className="jr-mini-bold">{firstEdu.school}</span>
              <span className="jr-mini-dim">{firstEdu.degree ? `| ${firstEdu.degree}` : ''}</span>
            </div>
            <div className="jr-mini-lines">
              <span style={{ width: '75%' }} />
              <span style={{ width: '50%' }} />
            </div>
          </div>
        ) : firstProj ? (
          <div className="jr-mini-section">
            <div className="jr-mini-section-title">PROJECTS</div>
            <div className="jr-mini-rule" />
            <div className="jr-mini-entry-head">
              <span className="jr-mini-bold">{firstProj.name}</span>
            </div>
            <div className="jr-mini-lines">
              <span style={{ width: '80%' }} />
              <span style={{ width: '60%' }} />
            </div>
          </div>
        ) : (
          <div className="jr-mini-section">
            <div className="jr-mini-section-title">EXPERIENCE</div>
            <div className="jr-mini-rule" />
            <div className="jr-mini-lines">
              <span style={{ width: '88%' }} />
              <span style={{ width: '65%' }} />
              <span style={{ width: '80%' }} />
            </div>
          </div>
        )}

        {/* Section 2 (Quiet secondary section) */}
        <div className="jr-mini-section jr-mini-section-secondary">
          <div className="jr-mini-section-title">
            {firstEdu && firstExp ? 'EDUCATION' : firstSkill ? 'TECHNICAL SKILLS' : 'EDUCATION'}
          </div>
          <div className="jr-mini-rule" />
          <div className="jr-mini-lines">
            <span style={{ width: '80%' }} />
            <span style={{ width: '55%' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ResumeCard({
  profile,
  index: _index,
  isMenuOpen,
  onToggleMenu,
  disableDelete,
  onOpenProfile,
  onRenameProfile,
  onRequestDelete,
}) {
  const [renaming, setRenaming] = useState(false);
  const [name, setName] = useState(profile.profileName || 'Untitled Resume');
  const summary = completion(profile);
  const updated = relativeUpdatedAt(profile.updatedAt || profile.createdAt);

  const open = () => onOpenProfile?.(profile._id);
  const submitRename = () => {
    const trimmed = name.trim();
    if (trimmed) onRenameProfile?.(profile._id, trimmed);
    setRenaming(false);
    onToggleMenu?.(false);
  };
  const handleDelete = (event) => {
    event?.stopPropagation?.();
    event?.preventDefault?.();
    if (disableDelete) return;
    onToggleMenu?.(false);
    onRequestDelete?.(profile);
  };

  return (
    <Card
      interactive
      className={clsx('jr-resume-card', isMenuOpen && 'is-menu-open')}
      role="group"
      tabIndex="0"
      onClick={(e) => {
        if (e.target.closest('.jr-resume-card-actions, .jr-resume-card-menu, .jr-resume-menu-wrap, input')) {
          return;
        }
        open();
      }}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          if (event.target.closest('.jr-resume-card-actions, .jr-resume-card-menu, .jr-resume-menu-wrap, input')) {
            return;
          }
          event.preventDefault();
          open();
        }
      }}
    >
      {/* Top: Actual Resume Miniature Document Preview */}
      <div className="jr-resume-preview-container">
        <ResumeMiniPreview profile={profile} />
        <div className="jr-resume-preview-tag">
          <span>LaTeX ATS 1.0</span>
        </div>
      </div>

      {/* Bottom: Meta and Actions */}
      <div className="jr-resume-card-body">
        <div className="jr-resume-card-main-info">
          <div className="jr-resume-card-title-row">
            {renaming ? (
              <input
                className="jr-resume-rename-input"
                value={name}
                autoFocus
                aria-label="Resume name"
                onChange={(event) => setName(event.target.value)}
                onClick={(event) => event.stopPropagation()}
                onKeyDown={(event) => {
                  event.stopPropagation();
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    submitRename();
                  }
                  if (event.key === 'Escape') {
                    event.preventDefault();
                    setRenaming(false);
                    onToggleMenu?.(false);
                  }
                }}
                onBlur={submitRename}
              />
            ) : (
              <h2 title={profile.profileName || 'Untitled Resume'}>
                {profile.profileName || 'Untitled Resume'}
              </h2>
            )}
          </div>

          <div className="jr-resume-meta-row">
            <span className="jr-resume-updated">
              {updated ? `Updated ${updated}` : 'Recently updated'}
            </span>
            <span className="jr-resume-badge-completion">
              <span
                className="jr-completion-dot"
                style={{ background: summary.percent >= 80 ? 'var(--success)' : 'var(--accent)' }}
              />
              {summary.filled}/{summary.total} sections
            </span>
          </div>

          {/* Progress bar */}
          <div className="jr-resume-progress-bar" aria-hidden="true">
            <span style={{ width: `${summary.percent}%`, background: 'var(--accent)' }} />
          </div>
        </div>

        <div className="jr-resume-card-actions">
          <Button
            variant="secondary"
            size="sm"
            onClick={(event) => {
              event.stopPropagation();
              open();
            }}
          >
            Edit
          </Button>
          <div className="jr-resume-menu-wrap">
            <IconButton
              title="More actions"
              aria-label={`More actions for ${profile.profileName || 'resume'}`}
              onClick={(event) => {
                event.stopPropagation();
                onToggleMenu?.(!isMenuOpen);
              }}
            >
              <MoreHorizontal size={18} />
            </IconButton>
            {isMenuOpen && (
              <div className="jr-resume-card-menu" role="menu" onClick={(event) => event.stopPropagation()}>
                <MenuItem
                  icon={<PencilSimpleLine size={16} />}
                  onClick={(event) => {
                    event.stopPropagation();
                    setRenaming(true);
                    onToggleMenu?.(false);
                  }}
                >
                  Rename
                </MenuItem>
                <MenuItem
                  icon={<Trash size={16} />}
                  danger={!disableDelete}
                  disabled={disableDelete}
                  title={disableDelete ? 'Cannot delete your only resume' : undefined}
                  onClick={handleDelete}
                >
                  Delete
                </MenuItem>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

export default function ResumeDashboard({
  profiles = [],
  mode,
  _activeProfileId,
  onOpenProfile,
  onCreateProfile,
  onOpenImport,
  onOpenAuth,
  onRenameProfile,
  onDeleteProfile,
  _onDuplicateProfile,
  loading = false,
  error = null,
  onRetry,
}) {
  const sortedProfiles = useMemo(
    () => profiles.map((profile, index) => ({
      profile,
      index,
      timestamp: new Date(profile.updatedAt || profile.createdAt || 0).getTime() || 0,
    })).sort((a, b) => (b.timestamp - a.timestamp) || (a.index - b.index)),
    [profiles],
  );

  function getNextDefaultResumeName(existingProfiles) {
    const existingNames = new Set((existingProfiles || []).map((p) => (p.profileName || '').trim()));
    if (!existingNames.has('Untitled Resume')) {
      return 'Untitled Resume';
    }
    let counter = 2;
    while (existingNames.has(`Untitled Resume ${counter}`)) {
      counter++;
    }
    return `Untitled Resume ${counter}`;
  }

  const [profileToDelete, setProfileToDelete] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);

  useEffect(() => {
    if (!activeMenuId) return;

    const handlePointerDown = (event) => {
      if (event.target.closest('.jr-resume-menu-wrap, .jr-resume-card-menu')) {
        return;
      }
      setActiveMenuId(null);
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setActiveMenuId(null);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeMenuId]);

  const canCreate = mode !== 'guest' || profiles.length < 5;
  const create = () => { if (canCreate) onCreateProfile?.(getNextDefaultResumeName(profiles)); };

  return (
    <main className="jr-dashboard-page" aria-labelledby="dashboard-title" tabIndex="-1">
      <div className="jr-dashboard-inner">
        <div className="jr-dashboard-heading">
          <div>
            <h1 id="dashboard-title" tabIndex="-1">Your resumes</h1>
          </div>
          <div className="jr-dashboard-actions">
            <Button variant="secondary" size="md" onClick={onOpenImport}>
              <UploadSimple size={16} />
              <span>Import resume</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              disabled={!canCreate}
              title={!canCreate ? 'Resume limit reached' : undefined}
              onClick={create}
            >
              <Plus size={16} />
              <span>Create new resume</span>
            </Button>
          </div>
        </div>

        {mode === 'guest' && (
          <div className="jr-dashboard-guest-notice" role="status">
            <div className="jr-dashboard-guest-notice-text">
              <Info size={18} weight="fill" />
              <span>Guest mode: resumes are saved in this browser only.</span>
            </div>
            <button type="button" className="jr-guest-notice-signin" onClick={onOpenAuth}>
              Sign in with Google
            </button>
          </div>
        )}

      {error && (
        <div className="jr-dashboard-error" role="alert">
          <span>{error}</span>
          <Button variant="ghost" size="sm" onClick={onRetry}>Retry</Button>
        </div>
      )}

      {loading ? (
        <section className="jr-dashboard-list" aria-label="Loading resumes">
          {[0, 1, 2].map((item) => (
            <div className="jr-resume-card jr-resume-card-skeleton" key={item} aria-hidden="true">
              <div className="jr-resume-thumbnail" />
              <div><span /><span /><span /></div>
            </div>
          ))}
        </section>
      ) : profiles.length === 0 ? (
        <div className="jr-dashboard-empty">
          <div className="jr-dashboard-empty-icon">
            <FileText size={32} weight="duotone" />
          </div>
          <h2>No resumes yet</h2>
          <p>Create your first resume to get started with the Jake's Resume format.</p>
          <Button variant="dark" size="lg" disabled={!canCreate} onClick={create}>
            <Plus size={16} />
            <span>Create your resume</span>
          </Button>
        </div>
      ) : (
        <>
          <section className="jr-dashboard-list" aria-label="Saved resumes">
            {sortedProfiles.map(({ profile, index }) => (
              <ResumeCard
                key={profile._id}
                profile={profile}
                index={index}
                isMenuOpen={activeMenuId === profile._id}
                onToggleMenu={(open) => setActiveMenuId(open ? profile._id : null)}
                disableDelete={profiles.length <= 1}
                onOpenProfile={onOpenProfile}
                onRenameProfile={onRenameProfile}
                onRequestDelete={(targetProfile) => {
                  setActiveMenuId(null);
                  setProfileToDelete(targetProfile);
                }}
              />
            ))}
          </section>
          <CreateCard onCreate={create} disabled={!canCreate} />
        </>
      )}

      </div>
      {profileToDelete && (
        <div
          className="jr-modal-backdrop"
          role="presentation"
          onClick={() => setProfileToDelete(null)}
        >
          <div
            className="jr-modal p-6 space-y-4"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="delete-confirm-title" className="text-base font-semibold" style={{ color: 'var(--ink-900)' }}>
              Delete resume
            </h3>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--ink-600)' }}>
              Are you sure you want to delete &ldquo;{profileToDelete.profileName}&rdquo;? This action cannot be undone.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => setProfileToDelete(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="md"
                onClick={() => {
                  onDeleteProfile?.(profileToDelete._id);
                  setProfileToDelete(null);
                }}
              >
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function CreateCard({ onCreate, disabled }) {
  return (
    <Card className="jr-dashboard-create-card">
      <svg className="jr-create-card-sparkles" viewBox="0 0 24 24" fill="none" stroke="var(--coral-500)" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M12 3v3M18.5 5.5l-2.2 2.2M21 12h-3" />
      </svg>
      <span className="jr-dashboard-create-icon"><Plus size={24} /></span>
      <h2>Create your next opportunity</h2>
      <p>Start a new resume for a different role or industry.</p>
      <Button variant="dark" size="lg" disabled={disabled} onClick={onCreate}>
        <Plus size={16} />
        <span>Create your resume</span>
      </Button>
    </Card>
  );
}
