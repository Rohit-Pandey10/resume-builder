import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { api } from './lib/api';
import { normalizeProfile, serializeProfile, sanitizeSectionOrder, DEFAULT_SECTION_ORDER } from './utils/bulletHelper';
import { generateLatex } from './utils/latexGenerator';
import Navbar from './components/Navbar';
import AuthModal from './components/AuthModal';
import Drawer from './components/Drawer';
import EditorSubbar from './components/EditorSubbar';
import ResumeDashboard from './components/ResumeDashboard';
import EditorStepper from './components/EditorStepper';
import EditorSectionCard from './components/EditorSectionCard';
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
import { completion } from './utils/completion';
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
  FilePdf,
  Code,
  Loader2,
  AlertTriangle,
  Check,
  Edit3,
  Eye,
  Info,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from './components/icons';

const Code2 = Code;

function parseHashRoute(hash = window.location.hash) {
  const parts = hash.replace(/^#\/?/, '').split('/').filter(Boolean);
  if (parts[0] === 'resumes') return { name: 'resumes' };
  if (parts[0] === 'edit' && parts[1]) return { name: 'edit', profileId: decodeURIComponent(parts[1]) };
  return { name: 'landing' };
}

function routeHash(route) {
  if (route.name === 'edit' && route.profileId) return `#/edit/${encodeURIComponent(route.profileId)}`;
  if (route.name === 'resumes') return '#/resumes';
  return '#/';
}

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
  const [guestStorageBlocked, setGuestStorageBlocked] = useState(false);
  const [guestConflict, setGuestConflict] = useState(false);
  const [migration, setMigration] = useState(null);
  const [route, setRoute] = useState(() => parseHashRoute());
  const [lastSavedAt, setLastSavedAt] = useState(null);
  const [signInTrigger, setSignInTrigger] = useState(0);
  const [showAuthPanel, setShowAuthPanel] = useState(false);

  const [profiles, setProfiles] = useState([]);
  const [profilesLoading, setProfilesLoading] = useState(true);
  const [profileLoadError, setProfileLoadError] = useState(null);
  const [activeProfileId, setActiveProfileId] = useState(null);
  const [activeProfile, setActiveProfile] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // 'idle' | 'saving' | 'saved' | 'error' | 'not-saved'
  const activeProfileIdRef = useRef(activeProfileId);
  const activeProfileRef = useRef(activeProfile);
  const navigateToRoute = useCallback((nextRoute, replace = false) => {
    const nextHash = routeHash(nextRoute);
    if (replace) {
      window.history.replaceState({}, '', nextHash);
      setRoute(nextRoute);
    } else if (window.location.hash !== nextHash) {
      window.location.hash = nextHash;
    }
  }, []);

  useEffect(() => {
    const handleHashChange = () => setRoute(parseHashRoute());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (!window.location.hash || window.location.hash === '#' || window.location.hash === '#/') {
      window.history.replaceState({}, '', '#/');
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    const hasAuth = Boolean(user || mode === 'guest');
    if (!hasAuth && route.name !== 'landing') {
      window.history.replaceState({}, '', '#/');
      setRoute({ name: 'landing' });
    }
  }, [authLoading, user, mode, route.name]);

  useEffect(() => {
    const timer = window.setTimeout(() => document.querySelector('h1')?.focus?.(), 150);
    return () => window.clearTimeout(timer);
  }, [route.name, route.profileId]);

  useEffect(() => {
    if (route.name === 'landing') {
      document.title = "JakeResume - Build a resume in the Jake's Resume format";
    } else if (route.name === 'resumes') {
      document.title = 'JakeResume - Your resumes';
    } else if (route.name === 'edit') {
      const titleName = activeProfile?.profileName?.trim() || 'Untitled resume';
      document.title = `JakeResume - ${titleName}`;
    }
  }, [route.name, activeProfile?.profileName]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const h1 = document.querySelector('h1');
      if (h1) {
        h1.focus();
      }
    }, 50);
    return () => clearTimeout(timer);
  }, [route.name]);
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

  const showUndoToast = useCallback((message, onUndo = handleUndo) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    const newToast = {
      id,
      message,
      duration: 8000,
      onUndo: () => { onUndo(); },
    };
    setUndoToasts((prev) => [newToast, ...prev].slice(0, 3));
  }, [handleUndo]);

  const [activeTab, setActiveTab] = useState('pdf'); // 'pdf' | 'latex'
  const [mobileTab, setMobileTab] = useState('editor'); // 'editor' | 'preview'
  const [activeSection, setActiveSection] = useState('basics'); // 'basics' | 'education' | 'experience' | 'projects' | 'skills' | 'customSections'
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
    setProfilesLoading(true);
    setProfileLoadError(null);
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
        setLastSavedAt(Date.now());
        setProfilesLoading(false);
        return list;
      } else {
        const createRes = await store.create({ profileName: 'Default Resume Profile' });
        if (createRes?.data) {
          setProfiles([createRes.data]);
          setActiveProfileId(createRes.data._id);
          setActiveProfile(normalizeProfile(createRes.data));
          setIsDirty(false);
          setSaveStatus('saved');
          setLastSavedAt(Date.now());
          setProfilesLoading(false);
          return [createRes.data];
        }
      }
    } catch (err) {
      if (store === localStore && err instanceof GuestStorageError) {
        setGuestStorageBlocked(true);
      } else if (err.status === 401 && store === remoteStore) {
        setModeState(null);
        clearWorkspaceState();
        navigateToRoute({ name: 'landing' }, true);
        showNotification('Session expired. Please sign in again.', 'info');
        return;
      } else {
        console.error('Failed to load profiles:', err);
      }
      setProfilesLoading(false);
      setProfileLoadError(err.message || 'Could not load your resumes.');
      throw err;
    }
  }, [navigateToRoute, showNotification]);

  // 1. Valid account session wins. Otherwise restore guest mode only when explicitly flagged.
  useEffect(() => {
    let isMounted = true;
    async function initSession() {
      const requested = parseHashRoute();
      let activeUser = null;
      try {
        const res = await api.auth.me();
        if (res.user && isMounted) {
          activeUser = res.user;
          setUser(res.user);
          setModeState('account');
          setMode('account');
        }
      } catch (_err) {
        // Missing or expired account session
      }

      const isGuestMode = !activeUser && getMode() === 'guest';
      if (isGuestMode && isMounted) {
        setModeState('guest');
      }

      const hasSession = Boolean(activeUser || isGuestMode);

      if (hasSession && isMounted) {
        const store = activeUser ? remoteStore : localStore;
        try {
          const list = await loadProfiles(store);
          if (requested.name === 'edit') {
            if (list.some((profile) => profile._id === requested.profileId)) {
              navigateToRoute(requested, true);
            } else {
              showNotification("That resume doesn't exist", 'error');
              navigateToRoute({ name: 'resumes' }, true);
            }
          } else if (requested.name === 'resumes') {
            navigateToRoute({ name: 'resumes' }, true);
          }
          // When requested.name === 'landing', do NOT redirect to dashboard or editor.
        } catch (_err) {
          // Handled in loadProfiles
        }
      } else if (!hasSession && isMounted) {
        setUser(null);
        setModeState(null);
        if (requested.name !== 'landing') {
          window.history.replaceState({}, '', '#/');
          setRoute({ name: 'landing' });
        }
      }

      if (isMounted) setAuthLoading(false);
    }

    initSession().finally(() => {
      if (isMounted) setAuthLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [loadProfiles, navigateToRoute, showNotification]);

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
      if (!confirmSwitch) return false;
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
      return true;
    }
    return false;
  };

  const handleSelectProfileAndRoute = async (profileId) => {
    const selected = await handleSelectProfile(profileId);
    if (selected) navigateToRoute({ name: 'edit', profileId });
  };

  useEffect(() => {
    if (authLoading || route.name !== 'edit' || profiles.length === 0) return;
    const found = profiles.find((profile) => profile._id === route.profileId);
    if (!found) {
      showNotification("That resume doesn't exist", 'error');
      navigateToRoute({ name: 'resumes' }, true);
      return;
    }
    if (activeProfileId !== found._id) {
      setActiveProfileId(found._id);
      setActiveProfile(normalizeProfile(found));
      setIsDirty(false);
      setSaveStatus('saved');
      setLastCompiledPdfUrl(null);
      setCompiledTexString(null);
    }
  }, [activeProfileId, authLoading, navigateToRoute, profiles, route.name, route.profileId, showNotification]);

  // 4. Create new profile
  const handleCreateProfile = async (profileName, cloneCurrent = false) => {
    try {
      setSaveStatus('saving');
      const existingNames = new Set((profiles || []).map((p) => (p.profileName || '').trim()));
      let effectiveName = profileName;
      if (!effectiveName || effectiveName === 'Untitled Resume') {
        if (!existingNames.has('Untitled Resume')) {
          effectiveName = 'Untitled Resume';
        } else {
          let count = 2;
          while (existingNames.has(`Untitled Resume ${count}`)) {
            count++;
          }
          effectiveName = `Untitled Resume ${count}`;
        }
      }

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
        profileName: effectiveName,
        ...baseData,
      });

      const newDoc = res.data;
      const updatedList = [newDoc, ...profiles];
      setProfiles(updatedList);
      setActiveProfileId(newDoc._id);
      setActiveProfile(normalizeProfile(newDoc));
      setIsDirty(false);
      setSaveStatus('saved');
      setLastSavedAt(Date.now());
      setLastCompiledPdfUrl(null);
      setCompiledTexString(null);
      historyManagerRef.current.clear();
      updateHistoryFlags();
      setUndoToasts([]);
      showNotification(`Created profile: "${effectiveName}"`);
      return newDoc._id;
    } catch (err) {
      setSaveStatus('error');
      showNotification(err.message || 'Failed to create profile', 'error');
      return null;
    }
  };

  const handleCreateProfileAndRoute = async (profileName, cloneCurrent = false) => {
    const profileId = await handleCreateProfile(profileName, cloneCurrent);
    if (profileId) navigateToRoute({ name: 'edit', profileId });
    return profileId;
  };

  const handleDuplicateProfile = async (profileId) => {
    const target = profiles.find((p) => p._id === profileId);
    if (!target) return;
    const duplicateName = `${target.profileName || 'Untitled Resume'} (Copy)`;
    try {
      setSaveStatus('saving');
      const baseData = {
        basics: target.basics,
        education: target.education,
        experience: target.experience,
        projects: target.projects,
        skills: target.skills,
        customSections: target.customSections,
        sectionOrder: target.sectionOrder,
      };
      const res = await profileStore.create({
        profileName: duplicateName,
        ...baseData,
      });
      const newDoc = res.data;
      setProfiles((prev) => [newDoc, ...prev]);
      showNotification(`Duplicated: "${duplicateName}"`);
    } catch (err) {
      showNotification(err.message || 'Failed to duplicate resume', 'error');
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
      setLastSavedAt(Date.now());
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

    if (mode !== 'guest') {
      const confirmed = window.confirm(
        `Are you sure you want to delete profile "${targetName}"? This action cannot be undone.`
      );
      if (!confirmed) return;
    }

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
      if (mode === 'guest' && target) {
        const deletedSnapshot = serializeProfile(target);
        showUndoToast(`Deleted resume "${targetName}".`, async () => {
          try {
            const restored = await profileStore.create(deletedSnapshot);
            setProfiles((prev) => [restored.data, ...prev]);
            showNotification(`Restored resume "${targetName}".`);
          } catch (restoreError) {
            showNotification(restoreError.message || 'Could not restore the resume.', 'error');
          }
        });
      } else {
        showNotification(`Deleted profile "${targetName}".`, 'success');
      }
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
        setLastSavedAt(Date.now());
        showNotification('Changes saved.');
      }
    } catch (err) {
      if (err.status === 401 && mode === 'account') {
        setModeState(null);
        clearWorkspaceState();
        navigateToRoute({ name: 'landing' }, true);
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

  // 6b. Reset section order handler
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

  const addSectionEntry = useCallback((sectionKey) => {
    const current = activeProfileRef.current;
    if (!current) return;
    const defaults = {
      education: { institution: '', degree: '', location: '', startDate: '', endDate: '', gpa: '', enabled: true },
      experience: { company: '', role: '', location: '', startDate: '', endDate: '', bullets: [{ text: '', enabled: true }], enabled: true },
      projects: { title: '', techStack: [], link: '', bullets: [{ text: '', enabled: true }], enabled: true },
      skills: { category: 'New category', items: [''], enabled: true },
      customSections: { sectionTitle: 'New section', items: [{ title: '', subtitle: '', date: '', bullets: [{ text: '', enabled: true }], enabled: true }], enabled: true },
    };
    if (!defaults[sectionKey]) return;
    updateSection(sectionKey, [...(current[sectionKey] || []), defaults[sectionKey]]);
  }, [updateSection]);

  const currentSectionOrder = useMemo(() => {
    return sanitizeSectionOrder(activeProfile?.sectionOrder);
  }, [activeProfile?.sectionOrder]);

  const editorSteps = useMemo(() => ['basics', ...currentSectionOrder], [currentSectionOrder]);
  const sectionLabels = {
    basics: 'Personal info',
    education: 'Education',
    experience: 'Experience',
    projects: 'Projects',
    skills: 'Skills',
    customSections: 'Custom',
  };
  const sectionDescriptions = {
    basics: 'Your name, contact information, and primary online profiles.',
    education: 'Degrees, schools, coursework, and graduation dates.',
    experience: 'Work history, internships, and key accomplishments.',
    projects: 'Selected projects, links, and the work behind them.',
    skills: 'Languages, frameworks, developer tools, and libraries.',
    customSections: 'Add a tailored section for anything else worth sharing.',
  };
  const addLabels = {
    education: 'Add education',
    experience: 'Add position',
    projects: 'Add project',
    skills: 'Add skill category',
    customSections: 'Add section',
  };
  const activeSectionIdx = editorSteps.indexOf(activeSection);
  const nextSectionKey = activeSectionIdx >= 0 ? editorSteps[activeSectionIdx + 1] : null;
  const nextStepLabel = nextSectionKey ? sectionLabels[nextSectionKey] : null;
  const completionSummary = useMemo(() => completion(activeProfile), [activeProfile]);

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
    const existingProfiles = await remoteStore.list();
    const hadProfiles = (existingProfiles.data || []).length > 0;
    const list = await loadProfiles(remoteStore);
    setUser(res.user);
    setModeState('account');
    setMode('account');
    setGuestConflict(false);
    navigateToRoute(hadProfiles ? { name: 'resumes' } : { name: 'edit', profileId: list[0]?._id });

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
    setGuestConflict(false);
    const existingProfiles = await localStore.list();
    const hadProfiles = (existingProfiles.data || []).length > 0;
    const list = await loadProfiles(localStore);
    navigateToRoute(hadProfiles ? { name: 'resumes' } : { name: 'edit', profileId: list[0]?._id });
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
    clearWorkspaceState();
    navigateToRoute({ name: 'landing' }, true);
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
    clearWorkspaceState();
    navigateToRoute({ name: 'landing' }, true);
  };

  const handleOpenAuth = () => {
    setShowAuthPanel(true);
    navigateToRoute({ name: 'landing' });
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
    clearWorkspaceState();
    navigateToRoute({ name: 'landing' }, true);
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
    if (window.innerWidth < 1024) {
      setMobileTab('preview');
    }

    try {
      const res = await compileLatexPdf(liveTexString, activeProfile?.profileName);
      if (res.url) {
        setLastCompiledPdfUrl(res.url);
        setCompiledTexString(liveTexString);
      }
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
  }, [isCompiling, liveTexString, activeProfile]);

  const isPdfOutOfDate = Boolean(lastCompiledPdfUrl && compiledTexString !== liveTexString);

  const handleEditorNext = useCallback(() => {
    if (nextSectionKey) {
      setActiveSection(nextSectionKey);
      return;
    }
    if (window.innerWidth < 1024) {
      setMobileTab('preview');
      return;
    }
    handleCompilePdf();
  }, [handleCompilePdf, nextSectionKey]);

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
  }, [handleSave, handleUndo, handleRedo, activeSection, currentSectionOrder]);


  // Deep links loading screen
  if (authLoading && route.name !== 'landing') {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center gap-3"
        style={{ background: 'var(--bg-app)', color: 'var(--ink-600)' }}
      >
        <Loader2 className="animate-spin" size={20} strokeWidth={1.5} />
        <p className="text-xs" style={{ color: 'var(--ink-500)' }}>
          Loading workspace…
        </p>
      </div>
    );
  }

  // Deep links unauthenticated guard (redirect in progress)
  if (!user && mode !== 'guest' && route.name !== 'landing') {
    return null;
  }

  return (
    <div
      className="jr-app-root h-screen h-[100dvh] w-full flex flex-col overflow-hidden"
      style={{
        background: 'var(--bg-app)',
        color: 'var(--ink-900)',
      }}
    >
      {/* Top Navigation Bar (64px) */}
      <Navbar
        route={route.name}
        user={user}
        profiles={profiles}
        activeProfileId={activeProfileId}
        onSelectProfile={handleSelectProfileAndRoute}
        onOpenImport={() => setShowImportModal(true)}
        onLogout={handleLogout}
        mode={mode}
        onOpenAuth={(source) => {
          if (route.name === 'landing') {
            setSignInTrigger((n) => n + 1);
          } else {
            handleOpenAuth(source);
          }
        }}
        onLeaveGuest={handleLeaveGuest}
        onDeleteGuestData={handleDeleteGuestData}
        onCompilePdf={handleCompilePdf}
        onDownloadTex={handleDownloadTex}
        onOpenOverleaf={handleOpenOverleaf}
        onDownloadPdf={handleDownloadPdf}
        hasCompiledPdf={Boolean(lastCompiledPdfUrl)}
        isCompiling={isCompiling}
        compileElapsedSeconds={compileElapsedSeconds}
        isPdfOutOfDate={isPdfOutOfDate}
        onOpenMobileMenu={() => setIsMobileDrawerOpen(true)}
        onGoDashboard={() => navigateToRoute({ name: 'resumes' })}
        activeTitle={activeProfile?.profileName || 'Untitled Resume'}
        saveStatus={saveStatus}
        isDirty={isDirty}
        lastSavedAt={lastSavedAt}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onRenameProfile={handleRenameProfile}
        onResetSectionOrder={handleResetSectionOrder}
      />

      {route.name === 'edit' && (
        <EditorSubbar
          activeTitle={activeProfile?.profileName || 'Untitled Resume'}
          activeProfileId={activeProfileId}
          onRenameProfile={handleRenameProfile}
          isGuest={mode === 'guest'}
          onOpenAuth={handleOpenAuth}
          onCreateProfile={handleCreateProfileAndRoute}
          onGoDashboard={() => navigateToRoute({ name: 'resumes' })}
          onResetSectionOrder={handleResetSectionOrder}
          canUndo={canUndo}
          canRedo={canRedo}
          onUndo={handleUndo}
          onRedo={handleRedo}
          saveStatus={saveStatus}
          isDirty={isDirty}
          lastSavedAt={lastSavedAt}
        />
      )}

      {/* Drawer (<1024px) */}
      <Drawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        route={route.name}
        activeProfileId={activeProfileId}
        onNavigate={(dest) => {
          if (dest === 'landing') navigateToRoute({ name: 'landing' });
          else if (dest === 'resumes') navigateToRoute({ name: 'resumes' });
          else if (dest === 'edit') activeProfileId && navigateToRoute({ name: 'edit', profileId: activeProfileId });
        }}
        onOpenImport={() => setShowImportModal(true)}
        mode={mode}
        user={user}
        onOpenAuth={handleOpenAuth}
        onLeaveGuest={handleLeaveGuest}
        onDeleteGuestData={handleDeleteGuestData}
        onLogout={handleLogout}
        profiles={profiles}
        onSelectProfile={handleSelectProfileAndRoute}
        onCreateProfile={handleCreateProfileAndRoute}
        onCompilePdf={handleCompilePdf}
        onDownloadPdf={handleDownloadPdf}
        onDownloadTex={handleDownloadTex}
        onOpenOverleaf={handleOpenOverleaf}
        hasCompiledPdf={Boolean(lastCompiledPdfUrl)}
        isCompiling={isCompiling}
      />

      {route.name === 'landing' ? (
        <div className="jr-landing-scroll flex-1 min-h-0 overflow-y-auto">
          <AuthModal
            authLoading={authLoading}
            mode={mode}
            user={user}
            showAuthPanel={showAuthPanel}
            onCloseAuthPanel={() => setShowAuthPanel(false)}
            onNavigateToResumes={() => navigateToRoute({ name: 'resumes' })}
            onGoogleSignIn={handleGoogleSignIn}
            onContinueAsGuest={handleContinueAsGuest}
            onOpenImport={async () => {
              if (!user && mode !== 'guest') {
                try {
                  await handleContinueAsGuest();
                } catch {
                  return;
                }
              }
              setShowImportModal(true);
            }}
            guestStorageBlocked={guestStorageBlocked}
            signInTrigger={signInTrigger}
          />
        </div>
      ) : (
        <div className="jr-app-body w-full flex-1 min-h-0 overflow-hidden">
          {route.name === 'resumes' ? (
            <ResumeDashboard
              profiles={profiles}
              mode={mode}
              activeProfileId={activeProfileId}
              onOpenProfile={(profileId) => navigateToRoute({ name: 'edit', profileId })}
              onCreateProfile={handleCreateProfileAndRoute}
              onOpenImport={() => setShowImportModal(true)}
              onOpenAuth={handleOpenAuth}
              onRenameProfile={handleRenameProfile}
              onDeleteProfile={handleDeleteProfile}
              onDuplicateProfile={handleDuplicateProfile}
              loading={profilesLoading}
              error={profileLoadError}
              onRetry={() => window.location.reload()}
            />
          ) : (
          <>
      {isCompiling && compileElapsedSeconds >= 10 && (
        <div
          className="sm:hidden flex items-center justify-center px-3 py-1.5 border-b text-[10px] leading-tight"
          style={{
            color: 'var(--ink-600)',
            backgroundColor: 'var(--bg-canvas)',
            borderColor: 'var(--border)',
          }}
          role="status"
          aria-live="polite"
        >
          Still generating your PDF… please wait a moment.
        </div>
      )}

      {guestConflict && mode === 'guest' && (
        <div
          className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-3 py-2 rounded border text-xs"
          style={{
            background: 'var(--bg-app)',
            borderColor: 'var(--warning)',
            boxShadow: 'var(--shadow-lg)',
            color: 'var(--ink-900)',
          }}
          role="status"
          aria-live="polite"
        >
          <span>This data changed in another tab</span>
          <Button size="sm" variant="primary" onClick={() => window.location.reload()}>Reload</Button>
          <button type="button" onClick={handleDismissGuestConflict} style={{ color: 'var(--ink-500)' }}>
            Dismiss
          </button>
        </div>
      )}

      {/* Notification Toast */}
      {bannerNotice && (
        <div
          className="jr-toast fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 rounded text-xs border"
          style={{
            background: 'var(--surface)',
            borderColor: 'var(--border)',
            boxShadow: 'var(--shadow-md)',
            color: bannerNotice.type === 'error' ? 'var(--danger)' : 'var(--ink-900)',
          }}
          role="status"
        >
          {bannerNotice.type === 'error' ? (
            <AlertTriangle size={16} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          ) : bannerNotice.type === 'info' ? (
            <Info size={16} style={{ color: 'var(--ink-600)', flexShrink: 0 }} />
          ) : (
            <Check size={16} style={{ color: 'var(--success)', flexShrink: 0 }} />
          )}
          <span>{bannerNotice.msg}</span>
        </div>
      )}

      {/* Main Workspace */}
      <ErrorBoundary>
        <CrashTrigger shouldCrash={testRenderError} />
        <main className="jr-editor-layout flex-1 w-full overflow-hidden min-h-0">
          {/* Tablet-Only View Toggle (768px - 1023px; mobile phones use ergonomic bottom nav) */}
          <div
            className="hidden md:flex lg:hidden items-center p-1.5 border-b flex-shrink-0"
            style={{
              borderColor: 'var(--border)',
              background: 'var(--bg-canvas)',
            }}
          >
            <button
              type="button"
              onClick={() => setMobileTab('editor')}
              className="flex-1 py-1.5 px-3 rounded text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
              style={{
                background: mobileTab === 'editor' ? 'var(--bg-app)' : 'transparent',
                color: mobileTab === 'editor' ? 'var(--ink-900)' : 'var(--ink-500)',
                boxShadow: mobileTab === 'editor' ? 'var(--shadow-sm)' : 'none',
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
                background: mobileTab === 'preview' ? 'var(--bg-app)' : 'transparent',
                color: mobileTab === 'preview' ? 'var(--ink-900)' : 'var(--ink-500)',
                boxShadow: mobileTab === 'preview' ? 'var(--shadow-sm)' : 'none',
              }}
            >
              <Eye size={14} strokeWidth={1.5} />
              <span>Preview</span>
            </button>
          </div>

          {/* EDITOR COLUMN */}
          <section
            className={`jr-editor-form-column ${
              mobileTab === 'editor' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <div className="jr-editor-form-inner">
              <div className="jr-editor-heading">
                <h1 id="editor-title" tabIndex="-1">Build your resume</h1>
                <span className="sr-only">{completionSummary.filled} of {completionSummary.total} sections complete.</span>
              </div>
              <EditorStepper
                order={currentSectionOrder}
                activeSection={activeSection}
                profile={activeProfile}
                onSelect={(section) => { setActiveSection(section); if (window.innerWidth < 1024) setMobileTab('editor'); }}
              />
              {activeSection === 'basics' && (
                <EditorSectionCard sectionKey="basics" title={sectionLabels.basics} caption={sectionDescriptions.basics} nextLabel={nextStepLabel} onNext={handleEditorNext} isLast={!nextSectionKey}>
                  <BasicsSection basics={activeProfile?.basics} onChange={(data) => updateSection('basics', data)} />
                </EditorSectionCard>
              )}
              {activeSection === 'education' && (
                <EditorSectionCard sectionKey="education" title={sectionLabels.education} caption={sectionDescriptions.education} enabled={activeProfile?.educationEnabled !== false} onToggle={() => handleToggleSectionEnabled('education')} onAdd={() => addSectionEntry('education')} addLabel={addLabels.education} nextLabel={nextStepLabel} onNext={handleEditorNext} isLast={!nextSectionKey}>
                  <EducationSection education={activeProfile?.education} onChange={(data) => updateSection('education', data)} onNotify={showNotification} onDeleteAction={showUndoToast} />
                </EditorSectionCard>
              )}
              {activeSection === 'experience' && (
                <EditorSectionCard sectionKey="experience" title={sectionLabels.experience} caption={sectionDescriptions.experience} enabled={activeProfile?.experienceEnabled !== false} onToggle={() => handleToggleSectionEnabled('experience')} onAdd={() => addSectionEntry('experience')} addLabel={addLabels.experience} nextLabel={nextStepLabel} onNext={handleEditorNext} isLast={!nextSectionKey}>
                  <ExperienceSection experience={activeProfile?.experience} onChange={(data) => updateSection('experience', data)} onNotify={showNotification} onDeleteAction={showUndoToast} />
                </EditorSectionCard>
              )}
              {activeSection === 'projects' && (
                <EditorSectionCard sectionKey="projects" title={sectionLabels.projects} caption={sectionDescriptions.projects} enabled={activeProfile?.projectsEnabled !== false} onToggle={() => handleToggleSectionEnabled('projects')} onAdd={() => addSectionEntry('projects')} addLabel={addLabels.projects} nextLabel={nextStepLabel} onNext={handleEditorNext} isLast={!nextSectionKey}>
                  <ProjectsSection projects={activeProfile?.projects} onChange={(data) => updateSection('projects', data)} onNotify={showNotification} onDeleteAction={showUndoToast} />
                </EditorSectionCard>
              )}
              {activeSection === 'skills' && (
                <EditorSectionCard sectionKey="skills" title={sectionLabels.skills} caption={sectionDescriptions.skills} enabled={activeProfile?.skillsEnabled !== false} onToggle={() => handleToggleSectionEnabled('skills')} onAdd={() => addSectionEntry('skills')} addLabel={addLabels.skills} nextLabel={nextStepLabel} onNext={handleEditorNext} isLast={!nextSectionKey}>
                  <SkillsSection skills={activeProfile?.skills} onChange={(data) => updateSection('skills', data)} onDeleteAction={showUndoToast} />
                </EditorSectionCard>
              )}
              {activeSection === 'customSections' && (
                <EditorSectionCard sectionKey="customSections" title={sectionLabels.customSections} caption={sectionDescriptions.customSections} enabled={activeProfile?.customSectionsEnabled !== false} onToggle={() => handleToggleSectionEnabled('customSections')} onAdd={() => addSectionEntry('customSections')} addLabel={addLabels.customSections} nextLabel={nextStepLabel} onNext={handleEditorNext} isLast={!nextSectionKey}>
                  <CustomSections customSections={activeProfile?.customSections} onChange={(data) => updateSection('customSections', data)} onNotify={showNotification} onDeleteAction={showUndoToast} />
                </EditorSectionCard>
              )}
            </div>
          </section>

          {/* PREVIEW PANE: PDF & LaTeX View with Unified Sticky Toolbar */}
          <section
            className={`preview-pane jr-builder-preview flex-1 min-w-0 h-full flex flex-col overflow-hidden ${
              mobileTab === 'preview' ? 'flex' : 'hidden lg:flex'
            }`}
            style={{ background: 'var(--bg-canvas)' }}
          >
            {/* Mobile-only Compile Button: full-width 44px button at the top of the Preview tab */}
            <div className="md:hidden p-2.5 border-b flex-shrink-0" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
              <Button
                variant={(!lastCompiledPdfUrl || isPdfOutOfDate) ? 'accent-outline' : 'secondary'}
                size="md"
                onClick={handleCompilePdf}
                disabled={isCompiling}
                aria-busy={isCompiling}
                className="w-full h-11 justify-center"
              >
                {isCompiling ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Compiling… {compileElapsedSeconds}s</span>
                  </>
                ) : (
                  <>
                    <FilePdf size={18} />
                    <span>{lastCompiledPdfUrl ? 'Recompile' : 'Compile PDF'}</span>
                  </>
                )}
              </Button>
            </div>

            {/* Unified Preview Toolbar */}
            <div
              className="jr-preview-toolbar relative flex items-center justify-between px-2.5 sm:px-4 py-2 border-b gap-2 sm:gap-3 flex-shrink-0"
              style={{
                borderColor: 'var(--border)',
                background: 'var(--bg-app)',
              }}
            >
              {/* PDF / LaTeX toggle */}
              <div className="jr-preview-mode-group flex items-center">
                <div
                  className="flex items-center p-0.5 rounded border flex-shrink-0"
                  style={{
                    borderColor: 'var(--border)',
                    backgroundColor: 'var(--surface-sunken)',
                  }}
                  role="tablist"
                  aria-label="Preview format"
                >
                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'pdf'}
                    onClick={() => setActiveTab('pdf')}
                    className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded text-xs transition-colors"
                    style={{
                      backgroundColor: activeTab === 'pdf' ? 'var(--surface)' : 'transparent',
                      borderColor: activeTab === 'pdf' ? 'var(--border)' : 'transparent',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      color: activeTab === 'pdf' ? 'var(--ink-900)' : 'var(--ink-600)',
                      fontWeight: activeTab === 'pdf' ? 500 : 400,
                    }}
                  >
                    <FileText size={14} strokeWidth={1.5} />
                    <span className="hidden xs:inline">PDF view</span>
                    <span className="xs:hidden">PDF</span>
                  </button>

                  <button
                    type="button"
                    role="tab"
                    aria-selected={activeTab === 'latex'}
                    onClick={() => setActiveTab('latex')}
                    className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded text-xs transition-colors"
                    style={{
                      backgroundColor: activeTab === 'latex' ? 'var(--surface)' : 'transparent',
                      borderColor: activeTab === 'latex' ? 'var(--border)' : 'transparent',
                      borderWidth: '1px',
                      borderStyle: 'solid',
                      color: activeTab === 'latex' ? 'var(--ink-900)' : 'var(--ink-600)',
                      fontWeight: activeTab === 'latex' ? 500 : 400,
                    }}
                  >
                    <Code2 size={14} strokeWidth={1.5} />
                    <span className="hidden xs:inline">LaTeX source</span>
                    <span className="xs:hidden">LaTeX</span>
                  </button>
                </div>
              </div>

              {/* Right Toolbar Controls: Zoom, Budget Indicator, Status, Compile Button */}
              <div className="jr-preview-right-controls flex items-center gap-1.5 sm:gap-3 flex-shrink-0">
                {/* Zoom Controls (hidden on mobile, native pinch-to-zoom supported) */}
                {activeTab === 'pdf' && lastCompiledPdfUrl && (
                  <div
                    className="hidden sm:flex items-center gap-0.5 pr-2 border-r"
                    style={{ borderColor: 'var(--border)' }}
                  >
                    <IconButton
                      onClick={() => setZoom((z) => Math.max(70, z - 10))}
                      title="Zoom out"
                    >
                      <ZoomOut size={14} strokeWidth={1.5} />
                    </IconButton>
                    <span
                      className="jr-zoom-percent text-xs px-1 font-medium select-none"
                      style={{ color: 'var(--ink-600)' }}
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

                {/* Status wrap: caption status (ink-500) + Out of Date badge + Page Budget gauge (wraps below 520px) */}
                <div className="jr-preview-status-wrap flex items-center gap-1.5 sm:gap-2">
                  <span className="jr-preview-status-caption text-xs" style={{ color: 'var(--ink-500)' }}>
                    {!lastCompiledPdfUrl
                      ? 'Not compiled yet'
                      : isPdfOutOfDate
                      ? 'Out of date: compile to refresh'
                      : 'Up to date'}
                  </span>
                  {isPdfOutOfDate && (
                    <span
                      className="jr-badge jr-badge-warning px-2 py-0.5 rounded border text-[10px] sm:text-[11px] font-medium whitespace-nowrap"
                    >
                      Out of date
                    </span>
                  )}
                  {activeProfile && <PageBudgetGauge profile={activeProfile} />}
                </div>
              </div>

              {/* Thin progress line under toolbar while compiling */}
              {isCompiling && (
                <div className="jr-preview-progress-line" role="progressbar" aria-label="Compiling PDF" />
              )}
            </div>

            {/* Preview Pane Content */}
            <div className="jr-preview-content flex-1 min-h-0 overflow-hidden">
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
                  <React.Suspense fallback={<div className="p-4 text-xs" style={{ color: 'var(--ink-500)' }}>Loading LaTeX source…</div>}>
                    <LatexPreview texCode={liveTexString} />
                  </React.Suspense>
                </div>
              )}
            </div>
          </section>
        </main>
      </ErrorBoundary>
          </>
        )}
      </div>
    )}

      {route.name === 'resumes' && bannerNotice && (
        <div className="jr-route-toast" role="status">
          {bannerNotice.type === 'error' ? (
            <AlertTriangle size={15} style={{ color: 'var(--danger)', flexShrink: 0 }} />
          ) : bannerNotice.type === 'info' ? (
            <Info size={15} style={{ color: 'var(--ink-600)', flexShrink: 0 }} />
          ) : (
            <Check size={15} style={{ color: 'var(--success)', flexShrink: 0 }} />
          )}
          <span>{bannerNotice.msg}</span>
        </div>
      )}

      {/* Undo Toasts (Bottom-Center, max 3 stacked, 8s, pause on hover) */}
      <UndoToastContainer toasts={undoToasts} onDismiss={dismissUndoToast} />

      {/* Sticky Bottom Navigation on Mobile (< 768px) */}
      {route.name === 'edit' && (
        <nav
          className="md:hidden jr-mobile-bottom-nav flex items-center justify-around border-t px-2 flex-shrink-0 z-20"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--surface)',
            paddingBottom: 'env(safe-area-inset-bottom, 0px)',
          }}
          aria-label="Mobile navigation"
        >
          {/* Tab 1: Form Editor */}
          <button
            type="button"
            onClick={() => setMobileTab('editor')}
            className={`jr-mobile-tab-btn flex-1 flex flex-col items-center justify-center gap-1 min-h-[48px] py-1 text-xs font-medium transition-colors ${
              mobileTab === 'editor' ? 'is-active' : ''
            }`}
            style={{
              color: mobileTab === 'editor' ? 'var(--accent-ink)' : 'var(--ink-500)',
            }}
          >
            <div
              className="p-1 rounded-full transition-colors"
              style={{
                backgroundColor: mobileTab === 'editor' ? 'var(--accent-tint)' : 'transparent',
              }}
            >
              <Edit3 size={18} strokeWidth={mobileTab === 'editor' ? 2 : 1.5} />
            </div>
            <span>Editor</span>
          </button>

          {/* Quick Action: Compile / Recompile */}
          <button
            type="button"
            onClick={handleCompilePdf}
            disabled={isCompiling}
            className="jr-mobile-compile-btn relative -top-2 flex flex-col items-center justify-center gap-0.5 px-3 py-1.5 rounded-full border shadow-md transition-all active:scale-95"
            style={{
              background: (!lastCompiledPdfUrl || isPdfOutOfDate) ? 'var(--ink-900)' : 'var(--surface)',
              color: (!lastCompiledPdfUrl || isPdfOutOfDate) ? 'var(--paper-50)' : 'var(--ink-900)',
              borderColor: 'var(--border)',
            }}
            title={isCompiling ? `Compiling… ${compileElapsedSeconds}s` : (lastCompiledPdfUrl ? 'Recompile PDF' : 'Compile PDF')}
            aria-label={isCompiling ? `Compiling… ${compileElapsedSeconds}s` : (lastCompiledPdfUrl ? 'Recompile PDF' : 'Compile PDF')}
          >
            {isCompiling ? (
              <Loader2 size={18} className="animate-spin text-accent" />
            ) : (
              <FilePdf size={18} />
            )}
            <span className="text-[10px] font-medium leading-none">
              {isCompiling ? `${compileElapsedSeconds}s` : lastCompiledPdfUrl ? 'Recompile' : 'Compile'}
            </span>
            {isPdfOutOfDate && !isCompiling && (
              <span
                className="absolute top-0 right-0 w-2.5 h-2.5 rounded-full bg-amber-500 ring-2 ring-white"
                title="Resume updated since last compile"
              />
            )}
          </button>

          {/* Tab 2: Preview PDF & LaTeX */}
          <button
            type="button"
            onClick={() => setMobileTab('preview')}
            className={`jr-mobile-tab-btn flex-1 flex flex-col items-center justify-center gap-1 min-h-[48px] py-1 text-xs font-medium transition-colors ${
              mobileTab === 'preview' ? 'is-active' : ''
            }`}
            style={{
              color: mobileTab === 'preview' ? 'var(--accent-ink)' : 'var(--ink-500)',
            }}
          >
            <div className="relative">
              <div
                className="p-1 rounded-full transition-colors"
                style={{
                  backgroundColor: mobileTab === 'preview' ? 'var(--accent-tint)' : 'transparent',
                }}
              >
                <Eye size={18} strokeWidth={mobileTab === 'preview' ? 2 : 1.5} />
              </div>
              {isPdfOutOfDate && !isCompiling && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-amber-500" />
              )}
            </div>
            <span>Preview</span>
          </button>
        </nav>
      )}

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
