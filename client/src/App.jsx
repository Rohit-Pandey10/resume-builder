import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from './lib/api';
import { normalizeProfile, serializeProfile, sanitizeSectionOrder } from './utils/bulletHelper';
import { generateLatex } from './utils/latexGenerator';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import AuthModal from './components/AuthModal';
import BasicsSection from './components/LeftPanel/BasicsSection';
import EducationSection from './components/LeftPanel/EducationSection';
import ExperienceSection from './components/LeftPanel/ExperienceSection';
import ProjectsSection from './components/LeftPanel/ProjectsSection';
import SkillsSection from './components/LeftPanel/SkillsSection';
import CustomSections from './components/LeftPanel/CustomSections';
import LatexPreview from './components/RightPanel/LatexPreview';
import PdfPreviewPlaceholder from './components/RightPanel/PdfPreviewPlaceholder';
import PageBudgetGauge from './components/RightPanel/PageBudgetGauge';
import CompilationErrorModal from './components/CompilationErrorModal';
import ImportResumeModal from './components/ImportResumeModal';
import ErrorBoundary from './components/ErrorBoundary';
import { compileLatexPdf, downloadTexFile, openInOverleaf } from './utils/compilerEngine';
import { Button, IconButton } from './components/primitives';
import {
  FileText,
  Code2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Eye,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [activeProfile, setActiveProfile] = useState(null);

  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [activeTab, setActiveTab] = useState('pdf'); // 'pdf' | 'latex'
  const [mobileTab, setMobileTab] = useState('editor'); // 'editor' | 'preview'
  const [activeSection, setActiveSection] = useState('basics'); // 'basics' | 'education' | 'experience' | 'projects' | 'skills' | 'customSections'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [bannerNotice, setBannerNotice] = useState(null);

  // Compilation state
  const [isCompiling, setIsCompiling] = useState(false);
  const [lastCompiledPdfUrl, setLastCompiledPdfUrl] = useState(null);
  const [compilationError, setCompilationError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const showNotification = useCallback((msg, type = 'success') => {
    setBannerNotice({ msg, type });
    setTimeout(() => setBannerNotice(null), 3500);
  }, []);

  useEffect(() => {
    window.__showErrorModalForScreenshot = (err) => {
      setCompilationError(
        err || {
          message: 'LaTeX compilation encountered an error.',
          log: '! Undefined control sequence.\nl.15 \\invalidCommand\n',
          isTimeout: false,
        }
      );
      setShowErrorModal(true);
    };
    window.__setCompiledPdfUrlForScreenshot = (url) => {
      setLastCompiledPdfUrl(url || 'about:blank');
    };
    return () => {
      delete window.__showErrorModalForScreenshot;
      delete window.__setCompiledPdfUrlForScreenshot;
    };
  }, []);

  // 1. Check current session on mount
  useEffect(() => {
    let isMounted = true;
    async function initSession() {
      try {
        const res = await api.auth.me();
        if (res.user && isMounted) {
          setUser(res.user);
          const listRes = await api.resumes.list();
          const list = listRes.data || [];
          if (isMounted) {
            setProfiles(list);
            if (list.length > 0) {
              const first = list[0];
              setActiveProfileId(first._id);
              setActiveProfile(normalizeProfile(first));
              setIsDirty(false);
            } else {
              const createRes = await api.resumes.create({ profileName: 'Default Resume Profile' });
              if (isMounted && createRes?.data) {
                setProfiles([createRes.data]);
                setActiveProfileId(createRes.data._id);
                setActiveProfile(normalizeProfile(createRes.data));
              }
            }
          }
        }
      } catch (_err) {
        if (isMounted) setUser(null);
      } finally {
        if (isMounted) setAuthLoading(false);
      }
    }
    initSession();
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Load all profiles for user
  const loadProfiles = useCallback(async () => {
    try {
      const res = await api.resumes.list();
      const list = res.data || [];
      setProfiles(list);

      if (list.length > 0) {
        const first = list[0];
        setActiveProfileId(first._id);
        setActiveProfile(normalizeProfile(first));
        setIsDirty(false);
      } else {
        const createRes = await api.resumes.create({ profileName: 'Default Resume Profile' });
        if (createRes?.data) {
          setProfiles([createRes.data]);
          setActiveProfileId(createRes.data._id);
          setActiveProfile(normalizeProfile(createRes.data));
        }
      }
    } catch (err) {
      console.error('Failed to load profiles:', err);
    }
  }, []);

  // 3. Switch active profile
  const handleSelectProfile = (profileId) => {
    if (isDirty) {
      const confirmSwitch = window.confirm(
        'You have unsaved changes on the current profile. Switch anyway?'
      );
      if (!confirmSwitch) return;
    }

    const found = profiles.find((p) => p._id === profileId);
    if (found) {
      setActiveProfileId(found._id);
      setActiveProfile(normalizeProfile(found));
      setIsDirty(false);
      setSaveStatus('idle');
      setLastCompiledPdfUrl(null);
    }
  };

  // 4. Create new profile
  const handleCreateProfile = async (profileName, cloneCurrent = false) => {
    try {
      setSaveStatus('saving');
      let baseData = {};
      if (cloneCurrent && activeProfile) {
        baseData = {
          basics: activeProfile.basics,
          education: activeProfile.education,
          experience: activeProfile.experience,
          projects: activeProfile.projects,
          skills: activeProfile.skills,
          customSections: activeProfile.customSections,
          sectionOrder: activeProfile.sectionOrder,
        };
      }

      const res = await api.resumes.create({
        profileName,
        ...baseData,
      });

      const newDoc = res.data;
      const updatedList = [newDoc, ...profiles];
      setProfiles(updatedList);
      setActiveProfileId(newDoc._id);
      setActiveProfile(normalizeProfile(newDoc));
      setIsDirty(false);
      setSaveStatus('saved');
      setLastCompiledPdfUrl(null);
      showNotification(`Created profile: "${profileName}"`);
    } catch (err) {
      setSaveStatus('error');
      showNotification(err.message || 'Failed to create profile', 'error');
    }
  };

  // 4b. Import resume from AI-extracted JSON
  const handleImportResume = async (parsedProfile) => {
    try {
      setSaveStatus('saving');
      const payload = serializeProfile(parsedProfile);
      const res = await api.resumes.create(payload);
      const newDoc = res.data;

      const updatedList = [newDoc, ...profiles];
      setProfiles(updatedList);
      setActiveProfileId(newDoc._id);
      setActiveProfile(normalizeProfile(newDoc));
      setIsDirty(false);
      setSaveStatus('saved');
      setLastCompiledPdfUrl(null);
      showNotification(`Imported resume: "${newDoc.profileName}" successfully!`, 'success');
    } catch (err) {
      setSaveStatus('error');
      showNotification(err.message || 'Failed to save imported resume', 'error');
      throw err;
    }
  };

  // 4c. Delete profile
  const handleDeleteProfile = async (profileId) => {
    if (profiles.length <= 1) {
      showNotification('Cannot delete your only resume profile.', 'error');
      return;
    }

    const target = profiles.find((p) => p._id === profileId);
    const targetName = target ? target.profileName : 'this profile';

    const confirmed = window.confirm(
      `Are you sure you want to delete profile "${targetName}"? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      setSaveStatus('saving');
      await api.resumes.delete(profileId);

      const remaining = profiles.filter((p) => p._id !== profileId);
      setProfiles(remaining);

      if (activeProfileId === profileId) {
        if (remaining.length > 0) {
          const nextActive = remaining[0];
          setActiveProfileId(nextActive._id);
          setActiveProfile(normalizeProfile(nextActive));
          setIsDirty(false);
        } else {
          setActiveProfileId(null);
          setActiveProfile(null);
        }
      }

      setSaveStatus('idle');
      showNotification(`Deleted profile "${targetName}".`, 'success');
    } catch (err) {
      setSaveStatus('error');
      showNotification(err.message || 'Failed to delete profile', 'error');
    }
  };

  // 4d. Rename profile
  const handleRenameProfile = async (profileId, newName) => {
    const trimmed = (newName || '').trim();
    if (!trimmed) return;

    const target = profiles.find((p) => p._id === profileId);
    if (target && target.profileName === trimmed) return;

    try {
      const payload =
        activeProfile && activeProfileId === profileId
          ? { ...serializeProfile(activeProfile), profileName: trimmed }
          : { profileName: trimmed };

      await api.resumes.update(profileId, payload);

      setProfiles((prev) =>
        prev.map((p) => (p._id === profileId ? { ...p, profileName: trimmed } : p))
      );

      if (activeProfileId === profileId) {
        setActiveProfile((prev) => (prev ? { ...prev, profileName: trimmed } : prev));
      }

      showNotification(`Renamed profile to "${trimmed}"`, 'success');
    } catch (err) {
      showNotification(err.message || 'Failed to rename profile', 'error');
    }
  };

  // 5. Save changes to active profile
  const handleSave = useCallback(async () => {
    if (!activeProfile || !activeProfileId) return;
    if (saveStatus === 'saving' || !isDirty) return;

    setSaveStatus('saving');
    try {
      const payload = serializeProfile(activeProfile);
      const res = await api.resumes.update(activeProfileId, payload);
      const updatedDoc = res.data;

      setProfiles((prev) =>
        prev.map((p) => (p._id === updatedDoc._id ? updatedDoc : p))
      );

      setActiveProfile(normalizeProfile(updatedDoc));
      setIsDirty(false);
      setSaveStatus('saved');
      showNotification('Changes saved.');
    } catch (err) {
      setSaveStatus('error');
      showNotification(err.message || 'Error saving profile', 'error');
    }
  }, [activeProfile, activeProfileId, saveStatus, isDirty, showNotification]);

  // 6. Section change handlers
  const updateSection = useCallback((sectionKey, updatedData) => {
    setActiveProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [sectionKey]: updatedData,
      };
    });
    setIsDirty(true);
    setSaveStatus('idle');
  }, []);

  // 6b. Section reordering handler (Alt+Up / Alt+Down)
  const handleMoveSection = useCallback((sectionKey, direction) => {
    setActiveProfile((prev) => {
      if (!prev) return prev;
      const currentOrder = sanitizeSectionOrder(prev.sectionOrder);
      const index = currentOrder.indexOf(sectionKey);
      if (index === -1) return prev;

      const newOrder = [...currentOrder];
      if (direction === 'up' && index > 0) {
        const temp = newOrder[index - 1];
        newOrder[index - 1] = newOrder[index];
        newOrder[index] = temp;
      } else if (direction === 'down' && index < newOrder.length - 1) {
        const temp = newOrder[index + 1];
        newOrder[index + 1] = newOrder[index];
        newOrder[index] = temp;
      } else {
        return prev;
      }

      return {
        ...prev,
        sectionOrder: newOrder,
      };
    });
    setIsDirty(true);
    setSaveStatus('idle');
  }, []);

  // 6c. Section visibility toggle handler
  const handleToggleSectionEnabled = useCallback((sectionKey) => {
    setActiveProfile((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      if (sectionKey === 'education') {
        const anyEnabled = (prev.education || []).some((e) => e.enabled !== false);
        updated.education = (prev.education || []).map((e) => ({ ...e, enabled: !anyEnabled }));
        updated.educationEnabled = !anyEnabled;
      } else if (sectionKey === 'experience') {
        const anyEnabled = (prev.experience || []).some((e) => e.enabled !== false);
        updated.experience = (prev.experience || []).map((e) => ({ ...e, enabled: !anyEnabled }));
        updated.experienceEnabled = !anyEnabled;
      } else if (sectionKey === 'projects') {
        const anyEnabled = (prev.projects || []).some((p) => p.enabled !== false);
        updated.projects = (prev.projects || []).map((p) => ({ ...p, enabled: !anyEnabled }));
        updated.projectsEnabled = !anyEnabled;
      } else if (sectionKey === 'skills') {
        if (Array.isArray(prev.skills)) {
          const anyEnabled = prev.skills.some((s) => s.enabled !== false);
          updated.skills = prev.skills.map((s) => ({ ...s, enabled: !anyEnabled }));
        }
        updated.skillsEnabled = prev.skillsEnabled === false;
      } else if (sectionKey === 'customSections') {
        const anyEnabled = (prev.customSections || []).some((s) => s.enabled !== false);
        updated.customSections = (prev.customSections || []).map((s) => ({ ...s, enabled: !anyEnabled }));
        updated.customSectionsEnabled = !anyEnabled;
      }
      return updated;
    });
    setIsDirty(true);
    setSaveStatus('idle');
  }, []);

  const currentSectionOrder = useMemo(() => {
    return sanitizeSectionOrder(activeProfile?.sectionOrder);
  }, [activeProfile?.sectionOrder]);

  // 7. Auth handlers
  const handleLogin = async (email, password) => {
    const res = await api.auth.login(email, password);
    setUser(res.user);
    await loadProfiles();
  };

  const handleRegister = async (email, password) => {
    const res = await api.auth.register(email, password);
    setUser(res.user);
    await loadProfiles();
  };

  const handleLogout = async () => {
    await api.auth.logout();
    setUser(null);
    setProfiles([]);
    setActiveProfile(null);
    setActiveProfileId(null);
    setLastCompiledPdfUrl(null);
  };

  // 8. Reactive LaTeX string generation
  const liveTexString = useMemo(() => {
    return generateLatex(activeProfile);
  }, [activeProfile]);

  // 9. Compilation Handlers
  const handleDownloadTex = () => {
    downloadTexFile(liveTexString, activeProfile?.profileName);
    showNotification('Downloaded resume.tex source.');
  };

  const handleOpenOverleaf = () => {
    openInOverleaf(liveTexString);
    showNotification('Dispatched to Overleaf.');
  };

  const handleCompilePdf = useCallback(async () => {
    if (isCompiling) return;
    setIsCompiling(true);
    showNotification('Compiling resume…', 'info');

    try {
      const res = await compileLatexPdf(liveTexString, activeProfile?.profileName);
      if (res.url) {
        setLastCompiledPdfUrl(res.url);
      }
      showNotification('PDF compiled successfully.', 'success');
      setActiveTab('pdf');
    } catch (err) {
      console.error('Compilation error:', err);
      setCompilationError({
        message: err.message,
        log: err.log || 'Compiler did not return detailed error logs.',
        isTimeout: Boolean(err.isTimeout),
      });
      setShowErrorModal(true);
      showNotification(
        err.isTimeout
          ? 'Cloud compilation timed out (>7s). Check fallback options.'
          : 'Compilation error. Check fallback options.',
        'error'
      );
    } finally {
      setIsCompiling(false);
    }
  }, [isCompiling, liveTexString, activeProfile, showNotification]);

  // Keyboard Shortcuts: ⌘S (Save), ⌘E (Export), ⌘↓ / ⌘↑ (Section navigation)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      if (cmdKey && e.key.toLowerCase() === 's') {
        e.preventDefault();
        handleSave();
      } else if (cmdKey && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        handleCompilePdf();
      } else if (cmdKey && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        e.preventDefault();
        const allSections = ['basics', ...currentSectionOrder];
        const currentIndex = allSections.indexOf(activeSection);
        if (e.key === 'ArrowDown') {
          const nextIndex = (currentIndex + 1) % allSections.length;
          setActiveSection(allSections[nextIndex]);
        } else {
          const prevIndex = (currentIndex - 1 + allSections.length) % allSections.length;
          setActiveSection(allSections[prevIndex]);
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleCompilePdf, activeSection, currentSectionOrder]);

  // Loading Screen
  if (authLoading) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3"
        style={{ background: 'var(--color-bg-base)', color: 'var(--color-text-2)' }}
      >
        <Loader2 className="animate-spin" size={20} strokeWidth={1.5} />
        <p className="text-xs" style={{ color: 'var(--color-text-3)' }}>
          Loading workspace…
        </p>
      </div>
    );
  }

  // Auth Screen if not logged in
  if (!user) {
    return <AuthModal onLogin={handleLogin} onRegister={handleRegister} />;
  }

  return (
    <div
      className="h-screen w-full flex flex-col overflow-hidden"
      style={{
        background: 'var(--color-bg-base)',
        color: 'var(--color-text-1)',
      }}
    >
      {/* Top Navigation Bar (52px) */}
      <Navbar
        user={user}
        profiles={profiles}
        activeProfileId={activeProfileId}
        activeProfile={activeProfile}
        onSelectProfile={handleSelectProfile}
        onCreateProfile={handleCreateProfile}
        onDeleteProfile={handleDeleteProfile}
        onRenameProfile={handleRenameProfile}
        onOpenImport={() => setShowImportModal(true)}
        onSave={handleSave}
        saveStatus={saveStatus}
        isDirty={isDirty}
        onLogout={handleLogout}
        onCompilePdf={handleCompilePdf}
        onDownloadTex={handleDownloadTex}
        onOpenOverleaf={handleOpenOverleaf}
        isCompiling={isCompiling}
        onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
      />

      {/* Notification Toast */}
      {bannerNotice && (
        <div
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded text-xs border"
          style={{
            background: 'var(--color-bg-base)',
            borderColor: 'var(--color-border)',
            boxShadow: 'var(--shadow-popover)',
            color: bannerNotice.type === 'error' ? 'var(--color-danger)' : 'var(--color-text-1)',
          }}
          role="status"
        >
          {bannerNotice.type === 'error' ? (
            <AlertCircle size={14} strokeWidth={1.5} style={{ color: 'var(--color-danger)' }} />
          ) : (
            <CheckCircle2 size={14} strokeWidth={1.5} style={{ color: 'var(--color-success)' }} />
          )}
          <span>{bannerNotice.msg}</span>
        </div>
      )}

      {/* Main Workspace */}
      <ErrorBoundary>
        <main className="flex-1 w-full flex flex-col lg:flex-row overflow-hidden min-h-0">
          {/* Tablet & Mobile View Toggle (< 1024px) */}
          <div
            className="flex lg:hidden items-center p-1.5 border-b flex-shrink-0"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-bg-subtle)',
            }}
          >
            <button
              type="button"
              onClick={() => setMobileTab('editor')}
              className="flex-1 py-1.5 px-3 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              style={{
                background: mobileTab === 'editor' ? 'var(--color-bg-base)' : 'transparent',
                color: mobileTab === 'editor' ? 'var(--color-text-1)' : 'var(--color-text-3)',
                boxShadow: mobileTab === 'editor' ? 'var(--shadow-card)' : 'none',
              }}
            >
              <Edit3 size={14} strokeWidth={1.5} />
              <span>Editor</span>
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('preview')}
              className="flex-1 py-1.5 px-3 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              style={{
                background: mobileTab === 'preview' ? 'var(--color-bg-base)' : 'transparent',
                color: mobileTab === 'preview' ? 'var(--color-text-1)' : 'var(--color-text-3)',
                boxShadow: mobileTab === 'preview' ? 'var(--shadow-card)' : 'none',
              }}
            >
              <Eye size={14} strokeWidth={1.5} />
              <span>Preview</span>
            </button>
          </div>

          {/* SIDEBAR: Sections Navigation, Reordering, Visibility, Profile Switcher */}
          <Sidebar
            activeSection={activeSection}
            onSelectSection={(sec) => {
              setActiveSection(sec);
              if (window.innerWidth < 1024) {
                setMobileTab('editor');
              }
            }}
            sectionOrder={currentSectionOrder}
            onMoveSection={handleMoveSection}
            profile={activeProfile}
            onToggleSectionEnabled={handleToggleSectionEnabled}
            profiles={profiles}
            activeProfileId={activeProfileId}
            onSelectProfile={handleSelectProfile}
            onCreateProfile={handleCreateProfile}
            onOpenImport={() => setShowImportModal(true)}
            isCollapsed={isSidebarCollapsed}
            onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            isMobileOpen={isMobileDrawerOpen}
            onCloseMobile={() => setIsMobileDrawerOpen(false)}
          />

          {/* EDITOR COLUMN: Swapping active section (520-560px on >=1440px) */}
          <section
            className={`w-full lg:w-[480px] xl:w-[520px] 2xl:w-[540px] flex-shrink-0 flex flex-col h-full overflow-hidden border-r ${
              mobileTab === 'editor' ? 'flex' : 'hidden lg:flex'
            }`}
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-bg-base)',
            }}
          >
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 flex justify-center">
              <div className="w-full max-w-[560px] pb-12">
                {activeSection === 'basics' && (
                  <BasicsSection
                    basics={activeProfile?.basics}
                    onChange={(data) => updateSection('basics', data)}
                  />
                )}

                {activeSection === 'education' && (
                  <EducationSection
                    education={activeProfile?.education}
                    onChange={(data) => updateSection('education', data)}
                    onNotify={showNotification}
                  />
                )}

                {activeSection === 'experience' && (
                  <ExperienceSection
                    experience={activeProfile?.experience}
                    onChange={(data) => updateSection('experience', data)}
                    onNotify={showNotification}
                  />
                )}

                {activeSection === 'projects' && (
                  <ProjectsSection
                    projects={activeProfile?.projects}
                    onChange={(data) => updateSection('projects', data)}
                    onNotify={showNotification}
                  />
                )}

                {activeSection === 'skills' && (
                  <SkillsSection
                    skills={activeProfile?.skills}
                    onChange={(data) => updateSection('skills', data)}
                  />
                )}

                {activeSection === 'customSections' && (
                  <CustomSections
                    customSections={activeProfile?.customSections}
                    onChange={(data) => updateSection('customSections', data)}
                    onNotify={showNotification}
                  />
                )}
              </div>
            </div>
          </section>

          {/* PREVIEW PANE: Live PDF & LaTeX View with Unified Sticky Toolbar */}
          <section
            className={`flex-1 min-w-0 h-full flex flex-col overflow-hidden ${
              mobileTab === 'preview' ? 'flex' : 'hidden lg:flex'
            }`}
            style={{ background: 'var(--color-bg-subtle)' }}
          >
            {/* Unified Preview Toolbar */}
            <div
              className="flex items-center justify-between px-3 sm:px-4 py-2 border-b gap-3 flex-shrink-0"
              style={{
                borderColor: 'var(--color-border)',
                background: 'var(--color-bg-base)',
              }}
            >
              {/* PDF / LaTeX toggle */}
              <div
                className="flex items-center p-0.5 rounded border"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg-subtle)',
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveTab('pdf')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors"
                  style={{
                    background: activeTab === 'pdf' ? 'var(--color-bg-base)' : 'transparent',
                    color: activeTab === 'pdf' ? 'var(--color-text-1)' : 'var(--color-text-3)',
                    boxShadow: activeTab === 'pdf' ? 'var(--shadow-card)' : 'none',
                  }}
                >
                  <FileText size={14} strokeWidth={1.5} />
                  <span>PDF view</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('latex')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors"
                  style={{
                    background: activeTab === 'latex' ? 'var(--color-bg-base)' : 'transparent',
                    color: activeTab === 'latex' ? 'var(--color-text-1)' : 'var(--color-text-3)',
                    boxShadow: activeTab === 'latex' ? 'var(--shadow-card)' : 'none',
                  }}
                >
                  <Code2 size={14} strokeWidth={1.5} />
                  <span>LaTeX source</span>
                </button>
              </div>

              {/* Right Toolbar Controls: Zoom, Budget Indicator, Status, Compile Button */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {/* Zoom Controls (visible when viewing compiled PDF) */}
                {activeTab === 'pdf' && lastCompiledPdfUrl && (
                  <div
                    className="flex items-center gap-0.5 pr-2 border-r"
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <IconButton
                      onClick={() => setZoom((z) => Math.max(70, z - 10))}
                      title="Zoom out"
                    >
                      <ZoomOut size={14} strokeWidth={1.5} />
                    </IconButton>
                    <span
                      className="text-xs px-1 font-medium select-none"
                      style={{ color: 'var(--color-text-2)' }}
                    >
                      {zoom}%
                    </span>
                    <IconButton
                      onClick={() => setZoom((z) => Math.min(150, z + 10))}
                      title="Zoom in"
                    >
                      <ZoomIn size={14} strokeWidth={1.5} />
                    </IconButton>
                    <IconButton onClick={() => setZoom(100)} title="Reset zoom">
                      <RotateCcw size={13} strokeWidth={1.5} />
                    </IconButton>
                  </div>
                )}

                {/* Page Budget Gauge */}
                {activeProfile && <PageBudgetGauge profile={activeProfile} />}

                {/* Compile Status / Compile button when not compiled */}
                {activeTab === 'pdf' && !lastCompiledPdfUrl && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleCompilePdf}
                    disabled={isCompiling}
                  >
                    {isCompiling ? (
                      <>
                        <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
                        <span>Compiling…</span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} strokeWidth={1.5} />
                        <span>Compile PDF</span>
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>

            {/* Preview Pane Content */}
            <div className="flex-1 min-h-0 overflow-hidden">
              {activeTab === 'pdf' ? (
                <PdfPreviewPlaceholder
                  profile={activeProfile}
                  onCompilePdf={handleCompilePdf}
                  isCompiling={isCompiling}
                  lastCompiledPdfUrl={lastCompiledPdfUrl}
                  zoom={zoom}
                />
              ) : (
                <div className="h-full p-2 sm:p-3">
                  <LatexPreview texCode={liveTexString} />
                </div>
              )}
            </div>
          </section>
        </main>
      </ErrorBoundary>

      {/* Sticky Bottom Segmented Switch on Mobile (< 768px) */}
      <div
        className="md:hidden flex items-center justify-around h-12 border-t px-4 flex-shrink-0 z-20"
        style={{
          borderColor: 'var(--color-border)',
          background: 'var(--color-bg-base)',
        }}
      >
        <button
          type="button"
          onClick={() => setMobileTab('editor')}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium"
          style={{
            color: mobileTab === 'editor' ? 'var(--color-brand)' : 'var(--color-text-3)',
            background: mobileTab === 'editor' ? 'var(--color-bg-subtle)' : 'transparent',
          }}
        >
          <Edit3 size={15} strokeWidth={1.5} />
          <span>Edit</span>
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('preview')}
          className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded text-xs font-medium"
          style={{
            color: mobileTab === 'preview' ? 'var(--color-brand)' : 'var(--color-text-3)',
            background: mobileTab === 'preview' ? 'var(--color-bg-subtle)' : 'transparent',
          }}
        >
          <Eye size={15} strokeWidth={1.5} />
          <span>Preview</span>
        </button>
      </div>

      {/* Modals */}
      <CompilationErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errorInfo={compilationError}
        onDownloadTex={handleDownloadTex}
        onOpenOverleaf={handleOpenOverleaf}
      />

      <ImportResumeModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportResume}
      />
    </div>
  );
}
