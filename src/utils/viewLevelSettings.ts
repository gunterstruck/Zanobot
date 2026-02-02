/**
 * ZANOBOT - View Level Settings
 *
 * Manages the User Experience View Level system:
 * - basic: Simple "traffic light" interface for operators
 * - advanced: Additional details for supervisors/maintenance staff
 * - expert: Full technical details for engineers
 *
 * Follows the same pattern as visualizerSettings.ts
 */

import { t } from '../i18n/index.js';

export type ViewLevel = 'basic' | 'advanced' | 'expert';

export const VIEW_LEVEL_EVENT = 'zanobot:view-level-change';

const STORAGE_KEY = 'zanobot.view-level';

const defaultLevel: ViewLevel = 'basic';

/**
 * Valid view levels for validation
 */
const validLevels: ViewLevel[] = ['basic', 'advanced', 'expert'];

/**
 * Display names for each view level (German)
 */
export const viewLevelDisplayNames: Record<ViewLevel, string> = {
  basic: t('viewLevels.basicLabel'),
  advanced: t('viewLevels.advancedLabel'),
  expert: t('viewLevels.expertLabel'),
};

/**
 * Descriptions for each view level (German)
 */
export const viewLevelDescriptions: Record<ViewLevel, string> = {
  basic: t('viewLevels.basic'),
  advanced: t('viewLevels.advanced'),
  expert: t('viewLevels.expert'),
};

/**
 * Read view level from localStorage
 */
const readFromStorage = (): ViewLevel => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return defaultLevel;
    }
    // Validate the stored value
    if (validLevels.includes(raw as ViewLevel)) {
      return raw as ViewLevel;
    }
    return defaultLevel;
  } catch {
    return defaultLevel;
  }
};

/**
 * Get the current view level
 */
export const getViewLevel = (): ViewLevel => readFromStorage();

/**
 * Set the view level and persist to localStorage
 * Also updates the data attribute on the HTML element
 */
export const setViewLevel = (level: ViewLevel): ViewLevel => {
  // Validate the level
  if (!validLevels.includes(level)) {
    level = defaultLevel;
  }

  // Persist to localStorage
  try {
    localStorage.setItem(STORAGE_KEY, level);
  } catch {
    // Ignore storage errors (e.g., private mode)
  }

  // Update the data attribute on the HTML element
  document.documentElement.setAttribute('data-view-level', level);

  // Dispatch custom event for reactive updates
  window.dispatchEvent(
    new CustomEvent<ViewLevel>(VIEW_LEVEL_EVENT, { detail: level })
  );

  return level;
};

/**
 * Apply the saved view level to the document
 * Should be called on app initialization
 */
export const applyViewLevel = (): ViewLevel => {
  const level = readFromStorage();
  document.documentElement.setAttribute('data-view-level', level);
  return level;
};

/**
 * Get all available view levels
 */
export const getAvailableViewLevels = (): ViewLevel[] => [...validLevels];

/**
 * Set the view level temporarily WITHOUT persisting to localStorage.
 * Used for NFC onboarding to force "basic" mode without overwriting user preference.
 *
 * @param level - The view level to apply temporarily
 * @param reason - Optional reason for logging (e.g., 'nfc_onboarding')
 * @returns The applied level
 */
export const setViewLevelTemporary = (level: ViewLevel, reason?: string): ViewLevel => {
  // Validate the level
  if (!validLevels.includes(level)) {
    level = defaultLevel;
  }

  // Update the data attribute on the HTML element (but DO NOT persist to localStorage)
  document.documentElement.setAttribute('data-view-level', level);

  // Dispatch custom event for reactive updates
  window.dispatchEvent(
    new CustomEvent<ViewLevel>(VIEW_LEVEL_EVENT, { detail: level })
  );

  // Log for debugging
  if (reason) {
    console.debug(`[ViewLevel] Temporary set to "${level}" (reason: ${reason})`);
  }

  return level;
};

/**
 * Restore the view level from localStorage (undo temporary override).
 * Called after NFC onboarding completes to restore user's preferred setting.
 *
 * @returns The restored level from localStorage
 */
export const restoreViewLevel = (): ViewLevel => {
  const savedLevel = readFromStorage();

  // Re-apply the saved level
  document.documentElement.setAttribute('data-view-level', savedLevel);

  // Dispatch custom event for reactive updates
  window.dispatchEvent(
    new CustomEvent<ViewLevel>(VIEW_LEVEL_EVENT, { detail: savedLevel })
  );

  console.debug(`[ViewLevel] Restored to saved preference: "${savedLevel}"`);

  return savedLevel;
};
