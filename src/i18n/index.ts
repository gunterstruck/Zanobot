/**
 * ZANOBOT - INTERNATIONALIZATION (i18n) MODULE
 *
 * Provides multi-language support for the PWA.
 * Detects browser language and loads appropriate translations.
 *
 * Supported languages:
 * - de: German (default)
 * - en: English
 * - fr: French
 * - es: Spanish
 * - zh: Chinese
 *
 * Fallback: English for unsupported languages
 */

import { de } from './locales/de.js';
import { en } from './locales/en.js';
import { fr } from './locales/fr.js';
import { es } from './locales/es.js';
import { zh } from './locales/zh.js';

/**
 * Supported language codes
 */
export type SupportedLanguage = 'de' | 'en' | 'fr' | 'es' | 'zh';

/**
 * Translation dictionary type (recursive for nested keys)
 */
export type TranslationDict = {
  [key: string]: string | TranslationDict;
};

/**
 * All available translations
 */
const translations: Record<SupportedLanguage, TranslationDict> = {
  de,
  en,
  fr,
  es,
  zh,
};

/**
 * Current active language
 */
let currentLanguage: SupportedLanguage = 'en';

/**
 * Detect browser language and set appropriate app language
 *
 * @returns Detected/selected language code
 */
export function detectLanguage(): SupportedLanguage {
  // Get browser language (e.g., "de-DE", "en-US", "zh-CN")
  const browserLang = navigator.language || (navigator as Navigator & { userLanguage?: string }).userLanguage || 'en';

  // Extract primary language code (e.g., "de" from "de-DE")
  const primaryLang = browserLang.split('-')[0].toLowerCase();

  // Check if language is supported
  const supportedLangs: SupportedLanguage[] = ['de', 'en', 'fr', 'es', 'zh'];

  if (supportedLangs.includes(primaryLang as SupportedLanguage)) {
    return primaryLang as SupportedLanguage;
  }

  // Fallback to English for unsupported languages
  return 'en';
}

/**
 * Initialize i18n system
 * Call this once at app startup
 */
export function initI18n(): SupportedLanguage {
  currentLanguage = detectLanguage();

  // Update HTML lang attribute
  document.documentElement.lang = currentLanguage;

  console.log(`🌐 Language initialized: ${currentLanguage}`);

  return currentLanguage;
}

/**
 * Get current language
 */
export function getLanguage(): SupportedLanguage {
  return currentLanguage;
}

/**
 * Set language manually (for testing or user preference)
 */
export function setLanguage(lang: SupportedLanguage): void {
  currentLanguage = lang;
  document.documentElement.lang = lang;
}

/**
 * Get nested value from object using dot notation
 *
 * @param obj - Object to traverse
 * @param path - Dot-separated path (e.g., "buttons.save")
 * @returns Value at path or undefined
 */
function getNestedValue(obj: TranslationDict, path: string): string | undefined {
  const keys = path.split('.');
  let current: TranslationDict | string = obj;

  for (const key of keys) {
    if (typeof current !== 'object' || current === null) {
      return undefined;
    }
    current = current[key];
    if (current === undefined) {
      return undefined;
    }
  }

  return typeof current === 'string' ? current : undefined;
}

/**
 * Translate a key to the current language
 *
 * Supports:
 * - Simple keys: t('buttons.save')
 * - Nested keys: t('errors.camera.denied')
 * - Parameter interpolation: t('messages.machineLoaded', { name: 'Motor 1' })
 *
 * @param key - Translation key (dot notation for nested)
 * @param params - Optional parameters for interpolation
 * @returns Translated string or key if not found
 */
export function t(key: string, params?: Record<string, string | number>): string {
  // Get translation from current language
  let translation = getNestedValue(translations[currentLanguage], key);

  // Fallback to English if not found in current language
  if (translation === undefined && currentLanguage !== 'en') {
    translation = getNestedValue(translations.en, key);
  }

  // Fallback to German (original) if not found in English
  if (translation === undefined && currentLanguage !== 'de') {
    translation = getNestedValue(translations.de, key);
  }

  // Return key if translation not found
  if (translation === undefined) {
    console.warn(`⚠️ Translation missing: ${key}`);
    return key;
  }

  // Interpolate parameters: {{name}} -> value
  if (params) {
    translation = translation.replace(/\{\{(\w+)\}\}/g, (_, paramKey) => {
      const value = params[paramKey];
      return value !== undefined ? String(value) : `{{${paramKey}}}`;
    });
  }

  return translation;
}

/**
 * Get locale string for Intl/toLocaleString APIs
 * Maps our language codes to full locale strings
 */
export function getLocale(): string {
  const localeMap: Record<SupportedLanguage, string> = {
    de: 'de-DE',
    en: 'en-US',
    fr: 'fr-FR',
    es: 'es-ES',
    zh: 'zh-CN',
  };
  return localeMap[currentLanguage] || 'en-US';
}

/**
 * Translate all DOM elements with data-i18n attributes
 *
 * Usage in HTML:
 * - Text content:      <h3 data-i18n="identify.selectMachine">Maschine auswählen</h3>
 * - Placeholder:       <input data-i18n-placeholder="identify.machineName" placeholder="Maschinenname">
 * - Aria label:        <button data-i18n-aria="buttons.close" aria-label="Schließen">
 *
 * Call after DOM is ready and i18n is initialized.
 */
export function translateDOM(): void {
  // Translate text content
  document.querySelectorAll<HTMLElement>('[data-i18n]').forEach((el) => {
    const key = el.getAttribute('data-i18n');
    if (key) {
      el.textContent = t(key);
    }
  });

  // Translate placeholders
  document.querySelectorAll<HTMLElement>('[data-i18n-placeholder]').forEach((el) => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (key) {
      (el as HTMLInputElement).placeholder = t(key);
    }
  });

  // Translate aria-labels
  document.querySelectorAll<HTMLElement>('[data-i18n-aria]').forEach((el) => {
    const key = el.getAttribute('data-i18n-aria');
    if (key) {
      el.setAttribute('aria-label', t(key));
    }
  });
}

/**
 * Shorthand for t() function - can be imported as default
 */
export default t;
