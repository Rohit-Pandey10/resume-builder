/**
 * historyHelper.js
 * Snapshot history management for resume profile state.
 * Supports up to 100 steps per profile, 800ms typing debounced grouping,
 * and single-step discrete operations (add, delete, toggle, reset).
 */

export const MAX_HISTORY_STEPS = 100;

export function cloneSnapshot(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(obj);
    } catch {
      // Fallback
    }
  }
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Checks if a section data change represents a discrete operation
 * (entry added/deleted, bullet added/deleted, or enabled toggle) vs continuous text typing.
 */
export function isDiscreteChange(prevSection, nextSection) {
  if (prevSection === nextSection) return false;
  if (!prevSection || !nextSection) return true;

  // If both are arrays (education, experience, projects, skills, customSections)
  if (Array.isArray(prevSection) && Array.isArray(nextSection)) {
    if (prevSection.length !== nextSection.length) return true;

    for (let i = 0; i < prevSection.length; i++) {
      const a = prevSection[i];
      const b = nextSection[i];
      if (!a || !b) return true;
      if (Boolean(a.enabled !== false) !== Boolean(b.enabled !== false)) return true;

      // Check bullets if present (experience, projects)
      if (Array.isArray(a.bullets) && Array.isArray(b.bullets)) {
        if (a.bullets.length !== b.bullets.length) return true;
        for (let j = 0; j < a.bullets.length; j++) {
          const ab = a.bullets[j];
          const bb = b.bullets[j];
          const aEn = typeof ab === 'object' ? ab.enabled !== false : true;
          const bEn = typeof bb === 'object' ? bb.enabled !== false : true;
          if (aEn !== bEn) return true;
        }
      }

      // Check skill items array if present
      if (Array.isArray(a.items) && Array.isArray(b.items)) {
        if (a.items.length !== b.items.length) return true;
      }

      // Check custom section items if present
      if (Array.isArray(a.items) && Array.isArray(b.items) && a.sectionTitle !== undefined) {
        if (a.items.length !== b.items.length) return true;
        for (let j = 0; j < a.items.length; j++) {
          const ai = a.items[j];
          const bi = b.items[j];
          if (!ai || !bi) return true;
          if (Boolean(ai.enabled !== false) !== Boolean(bi.enabled !== false)) return true;
          if (Array.isArray(ai.bullets) && Array.isArray(bi.bullets)) {
            if (ai.bullets.length !== bi.bullets.length) return true;
            for (let k = 0; k < ai.bullets.length; k++) {
              const aib = ai.bullets[k];
              const bib = bi.bullets[k];
              const aEn = typeof aib === 'object' ? aib.enabled !== false : true;
              const bEn = typeof bib === 'object' ? bib.enabled !== false : true;
              if (aEn !== bEn) return true;
            }
          }
        }
      }
    }
  }

  return false;
}

/**
 * Pure Snapshot History Manager
 */
export class ProfileHistoryManager {
  constructor(maxSteps = MAX_HISTORY_STEPS) {
    this.maxSteps = maxSteps;
    this.past = [];
    this.future = [];
    this.typingSnapshot = null;
    this.typingTimer = null;
  }

  clear() {
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
      this.typingTimer = null;
    }
    this.past = [];
    this.future = [];
    this.typingSnapshot = null;
  }

  canUndo() {
    return this.past.length > 0;
  }

  canRedo() {
    return this.future.length > 0;
  }

  /**
   * Called before applying a discrete action (add, delete, toggle, reset, reorder)
   */
  pushDiscrete(currentProfile) {
    if (!currentProfile) return;
    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
      this.typingTimer = null;
    }
    this.typingSnapshot = null;

    if (this.past.length >= this.maxSteps) {
      this.past.shift();
    }
    this.past.push(cloneSnapshot(currentProfile));
    this.future = [];
  }

  /**
   * Called when user is typing in a field (groups changes within 800ms)
   */
  recordTyping(currentProfile, onTypingExpired = null) {
    if (!currentProfile) return;

    if (this.typingSnapshot === null) {
      this.typingSnapshot = cloneSnapshot(currentProfile);
      if (this.past.length >= this.maxSteps) {
        this.past.shift();
      }
      this.past.push(this.typingSnapshot);
      this.future = [];
    }

    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
    }

    this.typingTimer = setTimeout(() => {
      this.typingSnapshot = null;
      this.typingTimer = null;
      if (onTypingExpired) onTypingExpired();
    }, 800);
  }

  undo(currentProfile) {
    if (this.past.length === 0 || !currentProfile) return null;

    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
      this.typingTimer = null;
    }
    this.typingSnapshot = null;

    const previousState = this.past.pop();
    if (this.future.length >= this.maxSteps) {
      this.future.shift();
    }
    this.future.push(cloneSnapshot(currentProfile));
    return previousState;
  }

  redo(currentProfile) {
    if (this.future.length === 0 || !currentProfile) return null;

    if (this.typingTimer) {
      clearTimeout(this.typingTimer);
      this.typingTimer = null;
    }
    this.typingSnapshot = null;

    const nextState = this.future.pop();
    if (this.past.length >= this.maxSteps) {
      this.past.shift();
    }
    this.past.push(cloneSnapshot(currentProfile));
    return nextState;
  }
}
