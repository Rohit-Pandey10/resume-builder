import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { api } from './lib/api';
import { normalizeProfile, serializeProfile, sanitizeSectionOrder, DEFAULT_SECTION_ORDER } from './utils/bulletHelper';
import { generateLatex } from './utils/latexGenerator';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import Accordion from './components/LeftPanel/Accordion';
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
import { compileLatexPdf, downloadTexFile, openInOverleaf } from './utils/compilerEngine';
import {
  User,
  GraduationCap,
  Briefcase,
  FolderGit2,
  Wrench,
  Sparkles,
  Code2,
  FileCheck2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Edit3,
  Eye,
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [activeProfile, setActiveProfile] = useState(null);

  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error'
  const [activeTab, setActiveTab] = useState('latex'); // 'latex' | 'pdf'
  const [mobileTab, setMobileTab] = useState('editor'); // 'editor' | 'preview'
  const [bannerNotice, setBannerNotice] = useState(null);

  // Compilation state
  const [isCompiling, setIsCompiling] = useState(false);
  const [lastCompiledPdfUrl, setLastCompiledPdfUrl] = useState(null);
  const [compilationError, setCompilationError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  const showNotification = (msg, type = 'success') => {
    setBannerNotice({ msg, type });
    setTimeout(() => setBannerNotice(null), 3500);
  };

  // 1. Check current session on mount
  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await api.auth.me();
      if (res.user) {
        setUser(res.user);
        await loadProfiles();
      }
    } catch (err) {
      setUser(null);
    } finally {
      setAuthLoading(false);
    }
  };

  // 2. Load all profiles for user
  const loadProfiles = async () => {
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
        // Create an initial profile if none exist
        await handleCreateProfile('Default Resume Profile', false);
      }
    } catch (err) {
      console.error('Failed to load profiles:', err);
    }
  };

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
    }
  };

  // 4. Create new profile
  const handleCreateProfile = async (profileName, cloneCurrent) => {
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

      // If active profile was deleted, automatically switch to the first remaining profile
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

      const res = await api.resumes.update(profileId, payload);
      const updatedDoc = res.data;

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
  const handleSave = async () => {
    if (!activeProfile || !activeProfileId) return;
    if (saveStatus === 'saving' || !isDirty) return;

    setSaveStatus('saving');
    try {
      const payload = serializeProfile(activeProfile);
      const res = await api.resumes.update(activeProfileId, payload);
      const updatedDoc = res.data;

      // Update in profiles list
      setProfiles((prev) =>
        prev.map((p) => (p._id === updatedDoc._id ? updatedDoc : p))
      );

      setActiveProfile(normalizeProfile(updatedDoc));
      setIsDirty(false);
      setSaveStatus('saved');
      showNotification('Changes saved successfully to database.');
    } catch (err) {
      setSaveStatus('error');
      showNotification(err.message || 'Error saving profile', 'error');
    }
  };

  // 6. Section change handlers (Instant reactive in-memory state updates)
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

  // 6b. Section reordering handler (Up / Down)
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
  };

  // 8. Reactive LaTeX string generation
  const liveTexString = useMemo(() => {
    return generateLatex(activeProfile);
  }, [activeProfile]);

  // 9. 3-Tier Compilation Engine Handlers
  const handleDownloadTex = () => {
    downloadTexFile(liveTexString, activeProfile?.profileName);
    showNotification('Downloaded resume.tex source code!');
  };

  const handleOpenOverleaf = () => {
    openInOverleaf(liveTexString);
    showNotification('Dispatched to Overleaf in new tab!');
  };

  const handleCompilePdf = async () => {
    if (isCompiling) return;
    setIsCompiling(true);
    showNotification('Compiling resume via primary cloud engine...', 'info');

    try {
      const res = await compileLatexPdf(liveTexString, activeProfile?.profileName);
      if (res.url) {
        setLastCompiledPdfUrl(res.url);
      }
      showNotification('Compiled and downloaded PDF successfully!', 'success');
      setActiveTab('pdf');
    } catch (err) {
      console.error('Compilation failed or timed out:', err);
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
  };

  // Loading Screen
  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-6 h-6 text-zinc-400 animate-spin" />
        <p className="text-xs text-zinc-500 font-mono">Initializing JakeResume platform...</p>
      </div>
    );
  }

  // Auth Screen if not logged in
  if (!user) {
    return <AuthModal onLogin={handleLogin} onRegister={handleRegister} />;
  }

  // Active section counts for badges
  const activeEduCount = (activeProfile?.education || []).filter((e) => e.enabled).length;
  const activeExpCount = (activeProfile?.experience || []).filter((e) => e.enabled).length;
  const activeProjCount = (activeProfile?.projects || []).filter((p) => p.enabled).length;

  return (
    <div className="h-screen w-full flex flex-col bg-zinc-950 text-zinc-100 overflow-hidden">
      {/* Top Navigation */}
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
      />

      {/* Notification Toast */}
      {bannerNotice && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div
            className={`px-3.5 py-2 rounded-md shadow-lg border text-xs flex items-center gap-2 ${
              bannerNotice.type === 'error'
                ? 'bg-zinc-900 text-rose-300 border-rose-900/60'
                : bannerNotice.type === 'info'
                ? 'bg-zinc-900 text-zinc-200 border-zinc-700'
                : 'bg-zinc-900 text-zinc-200 border-zinc-700'
            }`}
          >
            {bannerNotice.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{bannerNotice.msg}</span>
          </div>
        </div>
      )}

      {/* Main Full-Width Two-Panel Layout */}
      <main className="flex-1 w-full px-3 sm:px-4 lg:px-6 py-2.5 sm:py-3.5 flex flex-col lg:flex-row gap-3 lg:gap-5 overflow-hidden h-[calc(100vh-3.75rem)]">
        {/* Responsive View Toggle for Narrow Screens (< 1024px) */}
        <div className="flex lg:hidden items-center p-1 bg-zinc-900 border border-zinc-800 rounded-lg flex-shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab('editor')}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-all ${
              mobileTab === 'editor'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Form</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`flex-1 py-1.5 px-3 rounded-md text-xs font-medium flex items-center justify-center gap-2 transition-all ${
              mobileTab === 'preview'
                ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Preview & LaTeX</span>
          </button>
        </div>

        {/* LEFT PANEL: Input Workspace (Independent Scroll) */}
        <section
          className={`w-full lg:w-[48%] xl:w-[45%] flex-1 lg:flex-initial lg:h-full min-h-0 flex flex-col overflow-hidden ${
            mobileTab === 'editor' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          <div className="flex items-center justify-between px-1 pb-2 flex-shrink-0">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Resume Sections & Items
            </h2>
            <span className="text-[11px] text-zinc-500">
              Checkbox controls inclusion in LaTeX
            </span>
          </div>

          <div className="flex-1 overflow-y-auto pr-3 space-y-3.5">
            {/* 1. Basics */}
            <Accordion
              title="Personal & Contact Info"
              icon={User}
              defaultOpen={true}
            >
              <BasicsSection
                basics={activeProfile?.basics}
                onChange={(data) => updateSection('basics', data)}
              />
            </Accordion>

            {/* Dynamic Section Accordions ordered by activeProfile.sectionOrder */}
            {currentSectionOrder.map((sectionKey, index) => {
              const canMoveUp = index > 0;
              const canMoveDown = index < currentSectionOrder.length - 1;
              const onMoveUp = () => handleMoveSection(sectionKey, 'up');
              const onMoveDown = () => handleMoveSection(sectionKey, 'down');

              if (sectionKey === 'education') {
                return (
                  <Accordion
                    key="education"
                    title="Education"
                    icon={GraduationCap}
                    badge={`${activeEduCount} active`}
                    defaultOpen={true}
                    onMoveUp={onMoveUp}
                    onMoveDown={onMoveDown}
                    canMoveUp={canMoveUp}
                    canMoveDown={canMoveDown}
                  >
                    <EducationSection
                      education={activeProfile?.education}
                      onChange={(data) => updateSection('education', data)}
                      onNotify={showNotification}
                    />
                  </Accordion>
                );
              }

              if (sectionKey === 'experience') {
                return (
                  <Accordion
                    key="experience"
                    title="Work Experience"
                    icon={Briefcase}
                    badge={`${activeExpCount} active`}
                    defaultOpen={true}
                    onMoveUp={onMoveUp}
                    onMoveDown={onMoveDown}
                    canMoveUp={canMoveUp}
                    canMoveDown={canMoveDown}
                  >
                    <ExperienceSection
                      experience={activeProfile?.experience}
                      onChange={(data) => updateSection('experience', data)}
                      onNotify={showNotification}
                    />
                  </Accordion>
                );
              }

              if (sectionKey === 'projects') {
                return (
                  <Accordion
                    key="projects"
                    title="Projects"
                    icon={FolderGit2}
                    badge={`${activeProjCount} active`}
                    defaultOpen={true}
                    onMoveUp={onMoveUp}
                    onMoveDown={onMoveDown}
                    canMoveUp={canMoveUp}
                    canMoveDown={canMoveDown}
                  >
                    <ProjectsSection
                      projects={activeProfile?.projects}
                      onChange={(data) => updateSection('projects', data)}
                      onNotify={showNotification}
                    />
                  </Accordion>
                );
              }

              if (sectionKey === 'skills') {
                return (
                  <Accordion
                    key="skills"
                    title="Technical Skills"
                    icon={Wrench}
                    defaultOpen={true}
                    onMoveUp={onMoveUp}
                    onMoveDown={onMoveDown}
                    canMoveUp={canMoveUp}
                    canMoveDown={canMoveDown}
                  >
                    <SkillsSection
                      skills={activeProfile?.skills}
                      onChange={(data) => updateSection('skills', data)}
                    />
                  </Accordion>
                );
              }

              if (sectionKey === 'customSections') {
                return (
                  <Accordion
                    key="customSections"
                    title="Custom Sections"
                    icon={Sparkles}
                    badge={`${activeProfile?.customSections?.length || 0}`}
                    defaultOpen={false}
                    onMoveUp={onMoveUp}
                    onMoveDown={onMoveDown}
                    canMoveUp={canMoveUp}
                    canMoveDown={canMoveDown}
                  >
                    <CustomSections
                      customSections={activeProfile?.customSections}
                      onChange={(data) => updateSection('customSections', data)}
                      onNotify={showNotification}
                    />
                  </Accordion>
                );
              }

              return null;
            })}
          </div>
        </section>

        {/* RIGHT PANEL: Live View Tabs (Anchored & Independent Scroll) */}
        <section
          className={`w-full lg:w-[52%] xl:w-[55%] flex-1 lg:h-full min-h-0 flex flex-col overflow-hidden ${
            mobileTab === 'preview' ? 'flex' : 'hidden lg:flex'
          }`}
        >
          {/* Tab Headers */}
          <div className="flex items-center justify-between bg-zinc-900/60 p-1 rounded-lg border border-zinc-800 mb-3 flex-shrink-0 gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setActiveTab('latex')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'latex'
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Live LaTeX Preview</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('pdf')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'pdf'
                    ? 'bg-zinc-800 text-zinc-100 shadow-sm'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/40'
                }`}
              >
                <FileCheck2 className="w-3.5 h-3.5" />
                <span>PDF Preview / Status</span>
              </button>
            </div>

            {/* Visual Single-Page Budget Gauge in Tab Header */}
            {activeProfile && (
              <div className="pr-1 flex-shrink-0">
                <PageBudgetGauge profile={activeProfile} />
              </div>
            )}
          </div>

          {/* Tab Content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {activeTab === 'latex' ? (
              <LatexPreview texCode={liveTexString} profile={activeProfile} />
            ) : (
              <PdfPreviewPlaceholder
                profile={activeProfile}
                onCompilePdf={handleCompilePdf}
                onDownloadTex={handleDownloadTex}
                onOpenOverleaf={handleOpenOverleaf}
                isCompiling={isCompiling}
                lastCompiledPdfUrl={lastCompiledPdfUrl}
              />
            )}
          </div>
        </section>
      </main>

      {/* 3-Tier Compilation Error & Fallback Modal */}
      <CompilationErrorModal
        isOpen={showErrorModal}
        onClose={() => setShowErrorModal(false)}
        errorInfo={compilationError}
        onDownloadTex={handleDownloadTex}
        onOpenOverleaf={handleOpenOverleaf}
      />

      {/* AI Resume Importer Modal */}
      <ImportResumeModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImportResume}
      />
    </div>
  );
}
