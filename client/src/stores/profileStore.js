import { api } from '../lib/api.js';
import { normalizeProfile, serializeProfile } from '../utils/bulletHelper.js';
import { createStarterProfile } from '../utils/starterProfile.js';

export const GUEST_STORAGE_KEY = 'jakeresume:guest:v1';
export const GUEST_MODE_KEY = 'jakeresume:mode';
export const GUEST_MAX_PROFILES = 5;

export class GuestStorageError extends Error {
  constructor(message = "Couldn't save on this device") {
    super(message);
    this.name = 'GuestStorageError';
    this.code = 'GUEST_STORAGE_UNAVAILABLE';
  }
}

function storage() {
  if (typeof window === 'undefined' || !window.localStorage) {
    throw new GuestStorageError('Guest mode needs browser storage, which is blocked in this browser.');
  }
  return window.localStorage;
}

function createId() {
  if (globalThis.crypto?.randomUUID) return `guest-${globalThis.crypto.randomUUID()}`;
  return `guest-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function emptyState(email = '') {
  const starter = createStarterProfile(email, createId());
  return {
    version: 1,
    profiles: [starter],
    activeProfileId: starter._id,
    dirty: false,
    updatedAt: new Date().toISOString(),
  };
}

function normalizeState(value) {
  if (!value || value.version !== 1 || !Array.isArray(value.profiles)) {
    throw new Error('Invalid guest storage shape');
  }

  const profiles = value.profiles
    .filter((profile) => profile && typeof profile === 'object' && profile._id)
    .map((profile) => normalizeProfile(profile));

  if (profiles.length === 0) throw new Error('Guest storage has no profiles');

  const activeProfileId = profiles.some((profile) => profile._id === value.activeProfileId)
    ? value.activeProfileId
    : profiles[0]._id;

  return {
    version: 1,
    profiles,
    activeProfileId,
    dirty: value.dirty === true,
    updatedAt: value.updatedAt || new Date().toISOString(),
  };
}

function writeState(state) {
  const normalized = normalizeState(state);
  const value = {
    ...normalized,
    profiles: normalized.profiles.map((profile) => serializeProfile(normalizeProfile(profile))),
    updatedAt: new Date().toISOString(),
  };

  try {
    storage().setItem(GUEST_STORAGE_KEY, JSON.stringify(value));
    return normalizeState(value);
  } catch (error) {
    if (error instanceof GuestStorageError) throw error;
    throw new GuestStorageError();
  }
}

function readRaw() {
  try {
    return storage().getItem(GUEST_STORAGE_KEY);
  } catch (error) {
    if (error instanceof GuestStorageError) throw error;
    throw new GuestStorageError('Guest mode needs browser storage, which is blocked in this browser.');
  }
}

function readState({ createIfMissing = true } = {}) {
  const raw = readRaw();
  if (raw === null) {
    if (!createIfMissing) return null;
    return writeState(emptyState());
  }

  try {
    return normalizeState(JSON.parse(raw));
  } catch (_error) {
    try {
      storage().setItem(`jakeresume:guest:corrupt-${Date.now()}`, raw);
    } catch (_backupError) {
      // Storage is still allowed to recover below if only the backup write failed.
    }
    return writeState(emptyState());
  }
}

export const localStore = {
  async probeStorage() {
    const key = `jakeresume:guest:probe-${Date.now()}`;
    try {
      storage().setItem(key, 'ok');
      storage().removeItem(key);
      return true;
    } catch (_error) {
      try {
        storage().removeItem(key);
      } catch (_removeError) {
        // Nothing else can be done when storage is blocked.
      }
      throw new GuestStorageError('Guest mode needs browser storage, which is blocked in this browser.');
    }
  },

  async list() {
    const state = readState();
    return {
      success: true,
      count: state.profiles.length,
      data: state.profiles,
      activeProfileId: state.activeProfileId,
      dirty: state.dirty,
    };
  },

  async create(profile = {}) {
    const state = readState();
    if (state.profiles.length >= GUEST_MAX_PROFILES) {
      const error = new Error('Profile limit reached (maximum 5 profiles). Please delete an existing profile first.');
      error.status = 400;
      throw error;
    }

    const next = normalizeProfile({
      ...profile,
      _id: createId(),
      profileName: profile.profileName || 'New Resume Profile',
    });
    const nextState = writeState({
      ...state,
      profiles: [next, ...state.profiles],
      activeProfileId: next._id,
      dirty: true,
    });
    return { success: true, data: next, activeProfileId: nextState.activeProfileId, dirty: nextState.dirty };
  },

  async update(id, patch) {
    const state = readState();
    const index = state.profiles.findIndex((profile) => profile._id === id);
    if (index === -1) {
      const error = new Error('Resume profile not found');
      error.status = 404;
      throw error;
    }

    const updated = normalizeProfile({ ...state.profiles[index], ...patch, _id: id });
    const profiles = [...state.profiles];
    profiles[index] = updated;
    writeState({ ...state, profiles, dirty: true });
    return { success: true, data: updated };
  },

  async remove(id) {
    const state = readState();
    const profiles = state.profiles.filter((profile) => profile._id !== id);
    if (profiles.length === state.profiles.length) {
      const error = new Error('Resume profile not found');
      error.status = 404;
      throw error;
    }

    if (profiles.length === 0) {
      try {
        storage().removeItem(GUEST_STORAGE_KEY);
      } catch (_error) {
        throw new GuestStorageError();
      }
      return { success: true, data: null };
    }

    const activeProfileId = state.activeProfileId === id ? profiles[0]._id : state.activeProfileId;
    const nextState = writeState({ ...state, profiles, activeProfileId, dirty: true });
    return { success: true, data: null, activeProfileId: nextState.activeProfileId };
  },

  async setActiveProfile(id) {
    const state = readState();
    if (!state.profiles.some((profile) => profile._id === id)) return;
    writeState({ ...state, activeProfileId: id });
  },

  async getMigrationSnapshot() {
    const state = readState({ createIfMissing: false });
    if (!state || !state.dirty || state.profiles.length === 0) return null;
    return {
      profiles: state.profiles.map((profile) => normalizeProfile(profile)),
      dirty: state.dirty,
    };
  },

  async markMigrationDismissed() {
    const state = readState({ createIfMissing: false });
    if (state) writeState({ ...state, dirty: false });
  },

  async clear() {
    try {
      storage().removeItem(GUEST_STORAGE_KEY);
    } catch (_error) {
      throw new GuestStorageError();
    }
  },

  subscribeExternalChanges(callback) {
    if (typeof window === 'undefined') return () => {};
    const handleStorage = (event) => {
      if (event.key === GUEST_STORAGE_KEY) {
        callback();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  },
};

export const remoteStore = {
  list: () => api.resumes.list(),
  create: (profile) => api.resumes.create(profile),
  update: (id, patch) => api.resumes.update(id, patch),
  remove: (id) => api.resumes.delete(id),
  setActiveProfile: async () => {},
  getMigrationSnapshot: async () => null,
};

export function getMode() {
  try {
    return window.localStorage.getItem(GUEST_MODE_KEY);
  } catch (_error) {
    return null;
  }
}

export function setMode(mode) {
  try {
    if (mode) window.localStorage.setItem(GUEST_MODE_KEY, mode);
    else window.localStorage.removeItem(GUEST_MODE_KEY);
  } catch (_error) {
    // Session mode is a convenience flag; auth state remains authoritative.
  }
}
