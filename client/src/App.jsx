import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { api } from './lib/api';
import { normalizeProfile, serializeProfile, sanitizeSectionOrder, DEFAULT_SECTION_ORDER } from './utils/bulletHelper';
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
import PdfPreviewPlaceholder from './components/RightPanel/PdfPreviewPlaceholder';
import PageBudgetGauge from './components/RightPanel/PageBudgetGauge';
import GuestMigrationModal from './components/GuestMigrationModal';
import ErrorBoundary from './components/ErrorBoundary';

const LatexPreview = React.lazy(() => import('./components/RightPanel/LatexPreview'));
const CompilationErrorModal = React.lazy(() => import('./components/CompilationErrorModal'));
const ImportResumeModal = React.lazy(() => import('./components/ImportResumeModal'));
import UndoToastContainer from './components/UndoToast';
import { ProfileHistoryManager, isDiscreteChange } from './utils/historyHelper';
import { compileLatexPdf, downloadPdfFile, downloadTexFile, openInOverleaf } from './utils/compilerEngine';
import { clearCompileCache } from './utils/compileCache';
import {
  GuestStorageError,
  getMode,
  localStore,
  remoteStore,
  setMode,
} from './stores/profileStore';
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
function CrashTrigger({ shouldCrash }) {
  if (shouldCrash) {
    throw new Error('Simulated render error');
  }
  return null;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [mode, setModeState] = useState(null); // 'account' | 'guest' | null
  const [authLoading, setAuthLoading] = useState(true);
  const [showAuthScreen, setShowAuthScreen] = useState(false);
  const [guestStorageBlocked, setGuestStorageBlocked] = useState(false);
  const [guestConflict, setGuestConflict] = useState(false);
  const [migration, setMigration] = useState(null);

  useEffect(() => {
    document.title = showAuthScreen ? 'Sign in - JakeResume' : 'JakeResume Builder | LaTeX Resumes';
  }, [showAuthScreen]);

  const [profiles, setProfiles] = useState([]);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [activeProfile, setActiveProfile] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error' | 'not-saved'
  const activeProfileIdRef = useRef(activeProfileId);
  const activeProfileRef = useRef(activeProfile);
  useEffect(() => {
    activeProfileIdRef.current = activeProfileId;
  }, [activeProfileId]);
  useEffect(() => {
    activeProfileRef.current = activeProfile;
  }, [activeProfile]);

  // History & Undo/Redo State
  const historyManagerRef = useRef(new ProfileHistoryManager(100));
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [undoToasts, setUndoToasts] = useState([]);

  const updateHistoryFlags = useCallback(() => {
    setCanUndo(historyManagerRef.current.canUndo());
    setCanRedo(historyManagerRef.current.canRedo());
  }, []);

  const dismissUndoToast = useCallback((id) => {
    setUndoToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const handleUndo = useCallback(() => {
    const current = activeProfileRef.current;
    if (!current) return;
    const prevSnapshot = historyManagerRef.current.undo(current);
    if (prevSnapshot) {
      setActiveProfile(prevSnapshot);
      setIsDirty(true);
      setSaveStatus('idle');
      updateHistoryFlags();
    }
  }, [updateHistoryFlags]);

  const handleRedo = useCallback(() => {
    const current = activeProfileRef.current;
    if (!current) return;
    const nextSnapshot = historyManagerRef.current.redo(current);
    if (nextSnapshot) {
      setActiveProfile(nextSnapshot);
      setIsDirty(true);
      setSaveStatus('idle');
      updateHistoryFlags();
    }
  }, [updateHistoryFlags]);

  const showUndoToast = useCallback((message) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    const newToast = {
      id,
      message,
      duration: 8000,
      onUndo: () => {
        handleUndo();
      },
    };
    setUndoToasts((prev) => [newToast, ...prev].slice(0, 3));
  }, [handleUndo]);

  const [activeTab, setActiveTab] = useState('pdf'); // 'pdf' | 'latex'
  const [mobileTab, setMobileTab] = useState('editor'); // 'editor' | 'preview'
  const [activeSection, setActiveSection] = useState('basics'); // 'basics' | 'education' | 'experience' | 'projects' | 'skills' | 'customSections'
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [bannerNotice, setBannerNotice] = useState(null);

  // Compilation state
  const [isCompiling, setIsCompiling] = useState(false);
  const [compileElapsedSeconds, setCompileElapsedSeconds] = useState(0);
  const [lastCompiledPdfUrl, setLastCompiledPdfUrl] = useState(null);
  const [compiledTexString, setCompiledTexString] = useState(null);
  const [compilationError, setCompilationError] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [testRenderError, setTestRenderError] = useState(false);

  const showNotification = useCallback((msg, type = 'success') => {
    // Suppress error toast when compilation error modal is open (Item 6)
    if (showErrorModal && type === 'error') return;
    setBannerNotice({ msg, type });
    setTimeout(() => setBannerNotice(null), 3500);
  }, [showErrorModal]);

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
    window.__triggerRenderError = () => {
      setTestRenderError(true);
    };
    return () => {
      delete window.__showErrorModalForScreenshot;
      delete window.__setCompiledPdfUrlForScreenshot;
      delete window.__triggerRenderError;
    };
  }, []);

  const profileStore = mode === 'guest' ? localStore : remoteStore;

  // Load profile data through the selected adapter. Components receive callbacks only;
  // they never need to know whether the data is local or remote.
  const loadProfiles = useCallback(async (store) => {
    try {
      const res = await store.list();
      const list = res.data || [];
      setProfiles(list);

      if (list.length > 0) {
        const selectedId = res.activeProfileId && list.some((profile) => profile._id === res.activeProfileId)
          ? res.activeProfileId
          : list[0]._id;
        const selected = list.find((profile) => profile._id === selectedId) || list[0];
        setActiveProfileId(selected._id);
        setActiveProfile(normalizeProfile(selected));
        setIsDirty(false);
        setSaveStatus('saved');
      } else {
        const createRes = await store.create({ profileName: 'Default Resume Profile' });
        if (createRes?.data) {
          setProfiles([createRes.data]);
          setActiveProfileId(createRes.data._id);
          setActiveProfile(normalizeProfile(createRes.data));
          setIsDirty(false);
          setSaveStatus('saved');
        }
      }
    } catch (err) {
      if (store === localStore && err instanceof GuestStorageError) {
        setGuestStorageBlocked(true);
      } else if (err.status === 401 && store === remoteStore) {
        setModeState(null);
        setShowAuthScreen(true);
        clearWorkspaceState();
        showNotification('Session expired. Please sign in again.', 'info');
        return;
      } else {
        console.error('Failed to load profiles:', err);
      }
      throw err;
    }
  }, []);

  // 1. Valid account session wins. Otherwise restore guest mode only when explicitly flagged.
  useEffect(() => {
    let isMounted = true;
    async function initSession() {
      try {
        const res = await api.auth.me();
        if (res.user && isMounted) {
          setUser(res.user);
          setModeState('account');
          setMode('account');
          setShowAuthScreen(false);
          await loadProfiles(remoteStore);
          return;
        }
      } catch (_err) {
        // A missing or expired account session falls through to the explicit guest flag.
      }

      if (!isMounted) return;
      if (getMode() === 'guest') {
        try {
          setModeState('guest');
          await loadProfiles(localStore);
          if (isMounted) setShowAuthScreen(false);
        } catch (_err) {
          if (isMounted) setShowAuthScreen(true);
        }
      } else {
        setModeState(null);
        setShowAuthScreen(true);
      }
      if (isMounted) setAuthLoading(false);
    }
    initSession().finally(() => {
      if (isMounted) setAuthLoading(false);
    });
    return () => {
      isMounted = false;
    };
  }, [loadProfiles]);

  // Guest multi-tab conflicts pause autosave until the user reloads or dismisses the warning.
  useEffect(() => {
    if (mode !== 'guest') return undefined;
    return localStore.subscribeExternalChanges(() => setGuestConflict(true));
  }, [mode]);

  // 3. Switch active profile
  const handleSelectProfile = async (profileId) => {
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
      setCompiledTexString(null);
      historyManagerRef.current.clear();
      updateHistoryFlags();
      setUndoToasts([]);
      try {
        await profileStore.setActiveProfile(profileId);
      } catch (err) {
        if (mode === 'guest') {
          setSaveStatus('not-saved');
          showNotification("Couldn't save on this device", 'error');
        } else {
          throw err;
        }
      }
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

      const res = await profileStore.create({
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
      setCompiledTexString(null);
      historyManagerRef.current.clear();
      updateHistoryFlags();
      setUndoToasts([]);
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
      const res = await profileStore.create(payload);
      const newDoc = res.data;

      const updatedList = [newDoc, ...profiles];
      setProfiles(updatedList);
      setActiveProfileId(newDoc._id);
      setActiveProfile(normalizeProfile(newDoc));
      setIsDirty(false);
      setSaveStatus('saved');
      setLastCompiledPdfUrl(null);
      setCompiledTexString(null);
      historyManagerRef.current.clear();
      updateHistoryFlags();
      setUndoToasts([]);
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
      await profileStore.remove(profileId);

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
      historyManagerRef.current.clear();
      updateHistoryFlags();
      setUndoToasts([]);
      showNotification(`Deleted profile "${targetName}".`, 'success');
    } catch (err) {
      setSaveStatus('error');
      showNotification(err.message || 'Failed to delete profile', 'error');
    }
  };

  // 4d. Rename profile
  const handleRenameProfile = (profileId, newName) => {
    const trimmed = (newName || '').trim();
    if (!trimmed) return;

    const target = profiles.find((p) => p._id === profileId);
    if (target && target.profileName === trimmed) return;

    setProfiles((prev) => prev.map((p) => (p._id === profileId ? { ...p, profileName: trimmed } : p)));
    if (activeProfileId === profileId) {
      setActiveProfile((prev) => (prev ? { ...prev, profileName: trimmed } : prev));
      setIsDirty(true);
      setSaveStatus('idle');
    }
  };

  // 5. Save changes to active profile
  const handleSave = useCallback(async () => {
    if (!activeProfile || !activeProfileId || (mode === 'guest' && guestConflict)) return;
    if (saveStatus === 'saving' || !isDirty) return;

    const targetId = activeProfileId;
    setSaveStatus('saving');
    try {
      const payload = serializeProfile(activeProfile);
      const res = await profileStore.update(targetId, payload);
      const updatedDoc = res.data;

      setProfiles((prev) =>
        prev.map((p) => (p._id === updatedDoc._id ? updatedDoc : p))
      );

      // Only update activeProfile if user is still on this profile (prevent race condition overwrite)
      if (activeProfileIdRef.current === targetId) {
        setActiveProfile(normalizeProfile(updatedDoc));
        setIsDirty(false);
        setSaveStatus('saved');
        showNotification('Changes saved.');
      }
    } catch (err) {
      if (err.status === 401 && mode === 'account') {
        setModeState(null);
        setShowAuthScreen(true);
        clearWorkspaceState();
        showNotification('Session expired. Please sign in again.', 'info');
        return;
      }
      if (activeProfileIdRef.current === targetId) {
        setSaveStatus('error');
      }
      if (mode === 'guest' && (err instanceof GuestStorageError || err.code === 'GUEST_STORAGE_UNAVAILABLE')) {
        setSaveStatus('not-saved');
        showNotification("Couldn't save on this device", 'error');
      } else {
        showNotification(err.message || 'Error saving profile', 'error');
      }
    }
  }, [activeProfile, activeProfileId, saveStatus, isDirty, mode, guestConflict, profileStore, showNotification]);

  // 5b. Debounced Autosave Effect: transition from Unsaved -> Saving… -> Saved
  useEffect(() => {
    if (!isDirty || !activeProfile || !activeProfileId || saveStatus === 'saving' || guestConflict) {
      return;
    }

    const timer = setTimeout(() => {
      handleSave();
    }, 1200);

    return () => clearTimeout(timer);
  }, [isDirty, activeProfile, activeProfileId, saveStatus, guestConflict, handleSave]);

  // 6. Section change handlers
  const updateSection = useCallback((sectionKey, updatedData) => {
    const current = activeProfileRef.current;
    if (current) {
      const isDiscrete = isDiscreteChange(current[sectionKey], updatedData);
      if (isDiscrete) {
        historyManagerRef.current.pushDiscrete(current);
      } else {
        historyManagerRef.current.recordTyping(current, () => {
          updateHistoryFlags();
        });
      }
      updateHistoryFlags();
    }

    setActiveProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [sectionKey]: updatedData,
      };
    });
    setIsDirty(true);
    setSaveStatus('idle');
  }, [updateHistoryFlags]);

  // 6b. Section reordering handler (Alt+Up / Alt+Down)
  const handleMoveSection = useCallback((sectionKey, direction) => {
    const current = activeProfileRef.current;
    if (current) {
      historyManagerRef.current.pushDiscrete(current);
      updateHistoryFlags();
    }

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
  }, [updateHistoryFlags]);

  // 6c. Reset section order handler
  const handleResetSectionOrder = useCallback(() => {
    const current = activeProfileRef.current;
    if (current) {
      historyManagerRef.current.pushDiscrete(current);
      updateHistoryFlags();
    }

    setActiveProfile((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        sectionOrder: [...DEFAULT_SECTION_ORDER],
      };
    });
    setIsDirty(true);
    setSaveStatus('idle');
    showUndoToast('Section order reset');
  }, [updateHistoryFlags, showUndoToast]);

  // 6d. Section visibility toggle handler
  const handleToggleSectionEnabled = useCallback((sectionKey) => {
    const current = activeProfileRef.current;
    if (current) {
      historyManagerRef.current.pushDiscrete(current);
      updateHistoryFlags();
    }

    setActiveProfile((prev) => {
      if (!prev) return prev;
      const updated = { ...prev };
      if (sectionKey === 'education') {
        const nextState = prev.educationEnabled === false;
        updated.education = (prev.education || []).map((e) => ({ ...e, enabled: nextState }));
        updated.educationEnabled = nextState;
      } else if (sectionKey === 'experience') {
        const nextState = prev.experienceEnabled === false;
        updated.experience = (prev.experience || []).map((e) => ({ ...e, enabled: nextState }));
        updated.experienceEnabled = nextState;
      } else if (sectionKey === 'projects') {
        const nextState = prev.projectsEnabled === false;
        updated.projects = (prev.projects || []).map((p) => ({ ...p, enabled: nextState }));
        updated.projectsEnabled = nextState;
      } else if (sectionKey === 'skills') {
        const nextState = prev.skillsEnabled === false;
        if (Array.isArray(prev.skills)) {
          updated.skills = prev.skills.map((s) => ({ ...s, enabled: nextState }));
        }
        updated.skillsEnabled = nextState;
      } else if (sectionKey === 'customSections') {
        const nextState = prev.customSectionsEnabled === false;
        updated.customSections = (prev.customSections || []).map((s) => ({ ...s, enabled: nextState }));
        updated.customSectionsEnabled = nextState;
      }
      return updated;
    });
    setIsDirty(true);
    setSaveStatus('idle');
  }, [updateHistoryFlags]);

  const currentSectionOrder = useMemo(() => {
    return sanitizeSectionOrder(activeProfile?.sectionOrder);
  }, [activeProfile?.sectionOrder]);

  // 7. Auth and guest-mode handlers
  const handleGoogleSignIn = async (credential) => {
    let guestSnapshot = null;
    if (mode === 'guest') {
      try {
        guestSnapshot = await localStore.getMigrationSnapshot();
      } catch (_error) {
        guestSnapshot = null;
      }
    }

    const res = await api.auth.google(credential);
    await loadProfiles(remoteStore);
    setUser(res.user);
    setModeState('account');
    setMode('account');
    setShowAuthScreen(false);
    setGuestConflict(false);

    if (guestSnapshot?.dirty && guestSnapshot.profiles.length > 0) {
      setMigration({
        profiles: guestSnapshot.profiles,
        progress: 0,
        inProgress: false,
        error: '',
      });
    }
  };

  const handleContinueAsGuest = async () => {
    try {
      await localStore.probeStorage();
    } catch (error) {
      if (error instanceof GuestStorageError || error.code === 'GUEST_STORAGE_UNAVAILABLE') {
        setGuestStorageBlocked(true);
      }
      throw error;
    }
    setGuestStorageBlocked(false);
    setModeState('guest');
    setMode('guest');
    setUser(null);
    setShowAuthScreen(false);
    setGuestConflict(false);
    await loadProfiles(localStore);
  };

  const clearWorkspaceState = () => {
    setUser(null);
    setProfiles([]);
    setActiveProfile(null);
    setActiveProfileId(null);
    setIsDirty(false);
    setSaveStatus('idle');
    setLastCompiledPdfUrl(null);
    setCompiledTexString(null);
    clearCompileCache();
    historyManagerRef.current.clear();
    updateHistoryFlags();
    setUndoToasts([]);
  };

  const handleLeaveGuest = () => {
    setMode(null);
    setModeState(null);
    setGuestConflict(false);
    setShowAuthScreen(true);
    clearWorkspaceState();
  };

  const handleDeleteGuestData = async () => {
    const guestRes = await localStore.list();
    const count = guestRes.data.length;
    const confirmed = window.confirm(
      `Delete data on this device? This will remove ${count} resume${count === 1 ? '' : 's'} saved in this browser.`
    );
    if (!confirmed) return;

    await localStore.clear();
    setMode(null);
    setModeState(null);
    setGuestConflict(false);
    setShowAuthScreen(true);
    clearWorkspaceState();
  };

  const handleOpenAuth = () => {
    setShowAuthScreen(true);
  };

  const handleDismissGuestConflict = () => {
    setGuestConflict(false);
  };

  const handleMigrateGuests = async () => {
    if (!migration || migration.inProgress) return;
    const candidates = [...migration.profiles];
    setMigration((current) => ({ ...current, inProgress: true, error: '' }));

    for (let index = 0; index < candidates.length; index += 1) {
      const guestProfile = candidates[index];
      try {
        const profile = { ...guestProfile };
        const guestId = profile._id;
        delete profile._id;
        delete profile.createdAt;
        delete profile.updatedAt;
        delete profile.userId;
        delete profile.__v;
        await remoteStore.create(serializeProfile(profile));
        await localStore.remove(guestId);
        setMigration((current) => ({
          ...current,
          progress: current.progress + 1,
          profiles: current.profiles.filter((candidate) => candidate._id !== guestId),
        }));
      } catch (err) {
        setMigration((current) => ({
          ...current,
          inProgress: false,
          error: err.message || 'Could not add all guest resumes. Try again.',
        }));
        return;
      }
    }

    const added = candidates.length;
    setMigration(null);
    showNotification(`Added ${added} resume${added === 1 ? '' : 's'}`);
  };

  const handleLogout = async () => {
    await api.auth.logout();
    window.google?.accounts?.id?.disableAutoSelect?.();
    setMode(null);
    setModeState(null);
    setShowAuthScreen(true);
    clearWorkspaceState();
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

  const handleDownloadPdf = () => {
    if (!lastCompiledPdfUrl) return;
    downloadPdfFile(lastCompiledPdfUrl, activeProfile?.profileName);
  };

  const handleCompilePdf = useCallback(async () => {
    if (isCompiling) return;
    setCompileElapsedSeconds(0);
    setIsCompiling(true);
    showNotification('Compiling resume…', 'info');

    try {
      const res = await compileLatexPdf(liveTexString, activeProfile?.profileName);
      if (res.url) {
        setLastCompiledPdfUrl(res.url);
        setCompiledTexString(liveTexString);
      }
      showNotification('PDF compiled successfully.', 'success');
      setActiveTab('pdf');
    } catch (err) {
      console.error('Compilation error:', err);
      setCompilationError({
        message: err.message,
        log: err.log || 'Compiler did not return detailed error logs.',
        isTimeout: Boolean(err.isTimeout || err.status === 504),
      });
      setShowErrorModal(true);
      // Suppress error toast: modal already displays full error and options
    } finally {
      setIsCompiling(false);
    }
  }, [isCompiling, liveTexString, activeProfile, showNotification]);

  const isPdfOutOfDate = Boolean(lastCompiledPdfUrl && compiledTexString !== liveTexString);

  useEffect(() => {
    if (!isCompiling) return undefined;
    const timer = setInterval(() => {
      setCompileElapsedSeconds((seconds) => seconds + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [isCompiling]);

  // Keyboard Shortcuts: ⌘S (Save), ⌘E (Export), ⌘↓ / ⌘↑ (Section navigation), ⌘Z / ⇧⌘Z / Ctrl+Y (Undo/Redo)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const cmdKey = isMac ? e.metaKey : e.ctrlKey;

      const target = e.target;
      const tagName = target?.tagName?.toLowerCase();
      const isTextInput =
        tagName === 'input' ||
        tagName === 'textarea' ||
        Boolean(target?.isContentEditable);

      // Undo/Redo shortcuts (ignore when focus is inside text input to leave native text undo alone)
      if (!isTextInput) {
        const isUndo = cmdKey && e.key.toLowerCase() === 'z' && !e.shiftKey;
        const isRedo =
          (cmdKey && e.shiftKey && e.key.toLowerCase() === 'z') ||
          (e.ctrlKey && e.key.toLowerCase() === 'y');

        if (isUndo) {
          e.preventDefault();
          handleUndo();
          return;
        }
        if (isRedo) {
          e.preventDefault();
          handleRedo();
          return;
        }
      }

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
  }, [handleSave, handleCompilePdf, handleUndo, handleRedo, activeSection, currentSectionOrder]);


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

  // Auth Screen if no account or guest workspace is active yet.
  if (showAuthScreen || (!user && mode !== 'guest')) {
    return (
      <AuthModal
        onGoogleSignIn={handleGoogleSignIn}
        onContinueAsGuest={handleContinueAsGuest}
        guestStorageBlocked={guestStorageBlocked}
      />
    );
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
        onResetSectionOrder={handleResetSectionOrder}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onSave={handleSave}
        saveStatus={saveStatus}
        isDirty={isDirty}
        onLogout={handleLogout}
        mode={mode}
        onOpenAuth={handleOpenAuth}
        onLeaveGuest={handleLeaveGuest}
        onDeleteGuestData={handleDeleteGuestData}
        onCompilePdf={handleCompilePdf}
        onDownloadTex={handleDownloadTex}
        onOpenOverleaf={handleOpenOverleaf}
        onDownloadPdf={handleDownloadPdf}
        hasCompiledPdf={Boolean(lastCompiledPdfUrl)}
        isCompiling={isCompiling}
        compileElapsedSeconds={compileElapsedSeconds}
        onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
      />

      {isCompiling && compileElapsedSeconds >= 10 && (
        <div
          className="sm:hidden flex items-center justify-center px-3 py-1.5 border-b text-[10px] leading-tight"
          style={{
            color: 'var(--color-text-2)',
            backgroundColor: 'var(--color-bg-subtle)',
            borderColor: 'var(--color-border)',
          }}
          role="status"
          aria-live="polite"
        >
          Still working. The compiler can take up to 30 seconds.
        </div>
      )}

      {/* Undo Toasts (Bottom-Center, max 3 stacked, 8s, pause on hover) */}
      <UndoToastContainer toasts={undoToasts} onDismiss={dismissUndoToast} />

      {guestConflict && mode === 'guest' && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-3 py-2 rounded border text-xs"
          style={{
            background: 'var(--color-bg-base)',
            borderColor: 'var(--color-warning)',
            boxShadow: 'var(--shadow-popover)',
            color: 'var(--color-text-1)',
          }}
          role="status"
          aria-live="polite"
        >
          <span>This data changed in another tab</span>
          <Button size="sm" variant="primary" onClick={() => window.location.reload()}>Reload</Button>
          <button type="button" onClick={handleDismissGuestConflict} style={{ color: 'var(--color-text-3)' }}>
            Dismiss
          </button>
        </div>
      )}

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
        <CrashTrigger shouldCrash={testRenderError} />
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
            mode={mode}
            onOpenAuth={handleOpenAuth}
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
                    onDeleteAction={showUndoToast}
                  />
                )}

                {activeSection === 'experience' && (
                  <ExperienceSection
                    experience={activeProfile?.experience}
                    onChange={(data) => updateSection('experience', data)}
                    onNotify={showNotification}
                    onDeleteAction={showUndoToast}
                  />
                )}

                {activeSection === 'projects' && (
                  <ProjectsSection
                    projects={activeProfile?.projects}
                    onChange={(data) => updateSection('projects', data)}
                    onNotify={showNotification}
                    onDeleteAction={showUndoToast}
                  />
                )}

                {activeSection === 'skills' && (
                  <SkillsSection
                    skills={activeProfile?.skills}
                    onChange={(data) => updateSection('skills', data)}
                    onDeleteAction={showUndoToast}
                  />
                )}

                {activeSection === 'customSections' && (
                  <CustomSections
                    customSections={activeProfile?.customSections}
                    onChange={(data) => updateSection('customSections', data)}
                    onNotify={showNotification}
                    onDeleteAction={showUndoToast}
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
                  backgroundColor: 'var(--color-surface-subtle, #F5F2EC)',
                }}
                role="tablist"
                aria-label="Preview format"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'pdf'}
                  onClick={() => setActiveTab('pdf')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors"
                  style={{
                    backgroundColor: activeTab === 'pdf' ? '#FFFFFF' : 'transparent',
                    borderColor: activeTab === 'pdf' ? 'var(--color-border)' : 'transparent',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    color: activeTab === 'pdf' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    fontWeight: activeTab === 'pdf' ? 500 : 400,
                  }}
                >
                  <FileText size={14} strokeWidth={1.5} />
                  <span>PDF view</span>
                </button>

                <button
                  type="button"
                  role="tab"
                  aria-selected={activeTab === 'latex'}
                  onClick={() => setActiveTab('latex')}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded text-xs transition-colors"
                  style={{
                    backgroundColor: activeTab === 'latex' ? '#FFFFFF' : 'transparent',
                    borderColor: activeTab === 'latex' ? 'var(--color-border)' : 'transparent',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    color: activeTab === 'latex' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    fontWeight: activeTab === 'latex' ? 500 : 400,
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
                {isPdfOutOfDate && (
                  <span
                    className="px-2 py-1 rounded border text-[11px] font-medium"
                    style={{
                      color: 'var(--color-warning-text)',
                      backgroundColor: 'var(--color-warning-bg)',
                      borderColor: 'var(--color-warning)',
                    }}
                  >
                    Out of date
                  </span>
                )}

                {/* Page Budget Gauge */}
                {activeProfile && <PageBudgetGauge profile={activeProfile} />}

                {/* Toolbar compile button: hidden when empty, outline Recompile button when PDF exists */}
                {activeTab === 'pdf' && lastCompiledPdfUrl && (
                  <Button
                    variant={isPdfOutOfDate ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={handleCompilePdf}
                    disabled={isCompiling}
                    aria-busy={isCompiling}
                  >
                    {isCompiling ? (
                      <>
                        <Loader2 size={13} strokeWidth={1.5} className="animate-spin" />
                        <span>
                          <span className="block">Recompiling… {compileElapsedSeconds}s</span>
                          {compileElapsedSeconds >= 10 && (
                            <span className="block text-[10px] font-normal">Still working. The compiler can take up to 30 seconds.</span>
                          )}
                        </span>
                      </>
                    ) : (
                      <>
                        <Sparkles size={13} strokeWidth={1.5} />
                        <span>Recompile</span>
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
                  compileElapsedSeconds={compileElapsedSeconds}
                  lastCompiledPdfUrl={lastCompiledPdfUrl}
                  zoom={zoom}
                  isPdfOutOfDate={isPdfOutOfDate}
                />
              ) : (
                <div className="h-full p-2 sm:p-3">
                  <React.Suspense fallback={<div className="p-4 text-xs" style={{ color: 'var(--color-text-3)' }}>Loading LaTeX source…</div>}>
                    <LatexPreview texCode={liveTexString} />
                  </React.Suspense>
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

      {/* Modals (lazy-loaded on demand) */}
      {showErrorModal && (
        <React.Suspense fallback={null}>
          <CompilationErrorModal
            isOpen={showErrorModal}
            onClose={() => setShowErrorModal(false)}
            errorInfo={compilationError}
            onDownloadTex={handleDownloadTex}
            onOpenOverleaf={handleOpenOverleaf}
            onRetry={handleCompilePdf}
          />
        </React.Suspense>
      )}

      {showImportModal && (
        <React.Suspense fallback={null}>
          <ImportResumeModal
            isOpen={showImportModal}
            onClose={() => setShowImportModal(false)}
            onImport={handleImportResume}
          />
        </React.Suspense>
      )}

      {migration && (
        <GuestMigrationModal
          profiles={migration.profiles}
          progress={migration.progress}
          inProgress={migration.inProgress}
          error={migration.error}
          onAdd={handleMigrateGuests}
          onNotNow={async () => {
            await localStore.markMigrationDismissed();
            setMigration(null);
          }}
        />
      )}
    </div>
  );
}
