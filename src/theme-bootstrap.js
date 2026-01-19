/**
 * ZANOBOT THEME BOOTSTRAP
 * Loads and applies theme configuration before page render
 * This script runs synchronously in <head> to prevent FOUC (Flash of Unstyled Content)
 */

(function() {
    'use strict';

    // Configuration
    // Use relative path that works both locally and on GitHub Pages
    const CONFIG_PATH = './config.json';
    const THEME_STORAGE_KEY = 'zanobot-theme';
    const DEFAULT_THEME = 'neon'; // Neon Industrial is the default (as per UX requirements)
    const AVAILABLE_THEMES = ['neon', 'light', 'brand'];

    /**
     * Get stored theme preference or default
     */
    function getStoredTheme() {
        try {
            return localStorage.getItem(THEME_STORAGE_KEY) || DEFAULT_THEME;
        } catch (e) {
            console.warn('localStorage not available:', e);
            return DEFAULT_THEME;
        }
    }

    /**
     * Apply theme to document
     */
    function applyTheme(theme) {
        document.documentElement.setAttribute('data-theme', theme);
    }

    /**
     * Load configuration and apply custom CSS variables
     */
    async function loadConfig() {
        try {
            const response = await fetch(CONFIG_PATH);
            if (!response.ok) {
                throw new Error(`Failed to load config: ${response.status}`);
            }

            const config = await response.json();

            // Apply brand colors if in brand theme
            const currentTheme = getStoredTheme();
            if (currentTheme === 'brand' && config.branding && config.branding.colors) {
                appleBrandColors(config.branding.colors);
            }

            // Store config globally for app use
            window.ZANOBOT_CONFIG = config;

        } catch (error) {
            console.warn('Could not load config.json, using defaults:', error);
        }
    }

    /**
     * Apply brand colors to CSS variables
     */
    function appleBrandColors(colors) {
        const root = document.documentElement;

        if (colors.primary) {
            root.style.setProperty('--primary-color', colors.primary);
        }
        if (colors.primaryHover) {
            root.style.setProperty('--primary-hover', colors.primaryHover);
        }
        if (colors.secondary) {
            root.style.setProperty('--secondary-color', colors.secondary);
        }
        if (colors.accent) {
            root.style.setProperty('--accent-color', colors.accent);
        }
        if (colors.background) {
            root.style.setProperty('--bg-primary', colors.background);
        }
        if (colors.backgroundSecondary) {
            root.style.setProperty('--bg-secondary', colors.backgroundSecondary);
        }
    }

    /**
     * Detect system theme preference (maps to our themes)
     */
    function getSystemTheme() {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'neon'; // Dark mode → Neon Industrial
        }
        return 'light'; // Light mode → Daylight
    }

    /**
     * Initialize theme system
     */
    function initTheme() {
        // Apply stored theme immediately (before config loads)
        const theme = getStoredTheme();
        applyTheme(theme);

        // Load config and apply brand colors
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', loadConfig);
        } else {
            loadConfig();
        }

        // Listen for system theme changes
        if (window.matchMedia) {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            mediaQuery.addEventListener('change', (e) => {
                // Only auto-switch if user hasn't manually selected a theme
                if (!localStorage.getItem(THEME_STORAGE_KEY)) {
                    applyTheme(e.matches ? 'neon' : 'light');
                }
            });
        }
    }

    /**
     * Public API for theme management
     */
    window.ZanobotTheme = {
        /**
         * Set theme
         * @param {string} theme - 'neon', 'light', or 'brand'
         */
        setTheme: function(theme) {
            if (!AVAILABLE_THEMES.includes(theme)) {
                console.warn('Invalid theme:', theme, '- Available:', AVAILABLE_THEMES);
                return;
            }

            try {
                localStorage.setItem(THEME_STORAGE_KEY, theme);
            } catch (e) {
                console.warn('Could not save theme preference:', e);
            }

            applyTheme(theme);

            // Reapply brand colors if switching to brand theme
            if (theme === 'brand' && window.ZANOBOT_CONFIG?.branding?.colors) {
                appleBrandColors(window.ZANOBOT_CONFIG.branding.colors);
            }

            // Dispatch event for listeners
            window.dispatchEvent(new CustomEvent('themechange', {
                detail: { theme }
            }));
        },

        /**
         * Get current theme
         * @returns {string}
         */
        getTheme: function() {
            return getStoredTheme();
        },

        /**
         * Toggle between themes (cycles through neon → light → brand)
         */
        toggleTheme: function() {
            const currentTheme = getStoredTheme();
            const currentIndex = AVAILABLE_THEMES.indexOf(currentTheme);
            const nextIndex = (currentIndex + 1) % AVAILABLE_THEMES.length;
            this.setTheme(AVAILABLE_THEMES[nextIndex]);
            return AVAILABLE_THEMES[nextIndex];
        },

        /**
         * Get available themes
         * @returns {string[]}
         */
        getAvailableThemes: function() {
            return [...AVAILABLE_THEMES];
        },

        /**
         * Get theme display name
         * @param {string} theme - Theme key
         * @returns {string} Display name
         */
        getThemeDisplayName: function(theme) {
            const names = {
                'neon': 'Neon Industrial',
                'light': 'Daylight',
                'brand': 'Zanobot'
            };
            return names[theme] || theme;
        },

        /**
         * Get theme description
         * @param {string} theme - Theme key
         * @returns {string} Description
         */
        getThemeDescription: function(theme) {
            const descriptions = {
                'neon': 'Cyberpunk-Style mit Neon Cyan & Orange. Perfekt für dunkle Umgebungen.',
                'light': 'Heller High-Contrast-Modus. Optimal für Sonnenlicht & Outdoor.',
                'brand': 'Original Zanobot Design. Ausgewogen & professionell.'
            };
            return descriptions[theme] || '';
        },

        /**
         * Apply custom colors (for runtime customization)
         * @param {Object} colors - Color object with primary, secondary, etc.
         */
        applyCustomColors: function(colors) {
            appleBrandColors(colors);
        },

        /**
         * Reset to default theme
         */
        reset: function() {
            try {
                localStorage.removeItem(THEME_STORAGE_KEY);
            } catch (e) {
                console.warn('Could not reset theme:', e);
            }
            applyTheme(DEFAULT_THEME);
        }
    };

    // Initialize theme immediately
    initTheme();
})();
