/**
 * ZANOBOT - MAIN APPLICATION ENTRY POINT
 *
 * Initializes the entire app:
 * - Database
 * - Router (3-phase flow)
 * - UI interactions
 * - PWA service worker
 */

import { initDB, getDBStats } from '@data/db.js';
import { Router } from '@ui/router.js';
import { notify } from '@utils/notifications.js';
import { logger } from '@utils/logger.js';
import { initErrorBoundary } from '@utils/errorBoundary.js';

/**
 * Global type declarations for theme-bootstrap.js API
 */
declare global {
  interface Window {
    ZanobotTheme?: {
      setTheme: (theme: string) => void;
      getTheme: () => string;
      toggleTheme: () => string;
      getAvailableThemes: () => string[];
      getThemeDisplayName: (theme: string) => string;
      getThemeDescription: (theme: string) => string;
      applyCustomColors: (colors: Record<string, string>) => void;
      reset: () => void;
    };
    ZANOBOT_CONFIG?: Record<string, unknown>;
  }
}

class ZanobotApp {
  private router: Router | null = null;

  constructor() {
    this.init();
  }

  /**
   * Initialize application
   */
  private async init(): Promise<void> {
    // Initialize error boundary first to catch any errors during initialization
    initErrorBoundary({
      showDetails: import.meta.env.DEV || import.meta.env.MODE === 'development',
    });

    logger.info('🤖 Zanobot AI Assistant starting...');
    logger.info('   Version: 2.0.0 (GMIA Algorithm)');

    // CRITICAL FIX: Wait for DOM with enhanced race condition protection
    // Double-check pattern prevents edge case where event fires between check and listener registration
    if (document.readyState === 'loading') {
      await new Promise<void>((resolve) => {
        let resolved = false;

        // Handler to resolve promise (with guard against multiple calls)
        const handler = () => {
          if (!resolved) {
            resolved = true;
            resolve();
          }
        };

        // Set up listener with once: true to ensure it only fires once
        document.addEventListener('DOMContentLoaded', handler, { once: true });

        // RACE CONDITION FIX: Re-check state after adding listener
        // If DOM loaded between initial check and listener registration, manually resolve
        if (document.readyState !== 'loading') {
          document.removeEventListener('DOMContentLoaded', handler);
          handler();
        }

        // SAFETY NET: Timeout to ensure promise resolves even in edge cases
        // If DOM is ready but event somehow didn't fire, resolve after 100ms
        setTimeout(() => {
          if (!resolved && document.readyState !== 'loading') {
            logger.warn('⚠️ DOM ready but DOMContentLoaded did not fire, proceeding anyway');
            handler();
          }
        }, 100);
      });
    }

    // Always call setup after DOM is ready
    await this.setup();
  }

  /**
   * Check browser compatibility before app initialization
   *
   * CRITICAL FIX: Check all required features upfront instead of discovering
   * incompatibility when user tries to use them
   *
   * @returns Compatibility check result with missing features list
   */
  private checkBrowserCompatibility(): { isCompatible: boolean; missing: string[] } {
    const missing: string[] = [];

    // Check Web Audio API
    const hasAudioContext = typeof AudioContext !== 'undefined' ||
      typeof (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext !== 'undefined';
    if (!hasAudioContext) {
      missing.push('- Web Audio API (required for audio processing)');
    }

    // Check MediaRecorder API
    if (typeof MediaRecorder === 'undefined') {
      missing.push('- MediaRecorder API (required for audio recording)');
    }

    // Check IndexedDB
    if (typeof indexedDB === 'undefined') {
      missing.push('- IndexedDB (required for data storage)');
    }

    // Check AudioWorklet support (needed for real-time diagnosis)
    try {
      if (typeof AudioContext !== 'undefined' && !('audioWorklet' in AudioContext.prototype)) {
        missing.push('- AudioWorklet (required for real-time diagnosis)');
      }
    } catch (e) {
      // AudioContext might not be available, already caught above
    }

    return {
      isCompatible: missing.length === 0,
      missing
    };
  }

  /**
   * Setup application after DOM is ready
   *
   * CRITICAL FIX: Graceful degradation - UI initializes even if database fails
   * This ensures buttons and event listeners are set up regardless of DB status
   */
  private async setup(): Promise<void> {
    // CRITICAL FIX: Check browser compatibility FIRST before any initialization
    const compatibility = this.checkBrowserCompatibility();

    if (!compatibility.isCompatible) {
      logger.error('❌ Browser compatibility check failed');
      logger.error('   Missing features:');
      compatibility.missing.forEach(feature => logger.error(`   ${feature}`));

      notify.error(
        'Ihr Browser ist nicht kompatibel mit Zanobot.\n\n' +
        'Fehlende Features:\n' +
        compatibility.missing.join('\n') +
        '\n\nBitte verwenden Sie einen modernen Browser wie Chrome, Edge, Firefox oder Safari.',
        new Error('Browser incompatible'),
        { title: 'Browser nicht unterstützt', duration: 0 }
      );

      // Don't initialize app if incompatible
      return;
    }

    logger.info('✅ Browser compatibility check passed');

    let dbAvailable = false;

    // Initialize database (with graceful degradation)
    try {
      logger.info('📦 Initializing database...');
      await initDB();

      const stats = await getDBStats();
      logger.info(`   Machines: ${stats.machines}`);
      logger.info(`   Recordings: ${stats.recordings}`);
      logger.info(`   Diagnoses: ${stats.diagnoses}`);
      dbAvailable = true;
    } catch (error) {
      logger.error('❌ Database initialization failed:', error);
      logger.warn('⚠️ Continuing without database - functionality will be limited');
      notify.error(
        'Datenbank nicht verfügbar. Bitte erlauben Sie IndexedDB in Ihren Browser-Einstellungen oder deaktivieren Sie den strikten Privacy-Modus.',
        error as Error,
        {
          title: 'Datenbank-Fehler',
          duration: 0,
        }
      );
    }

    // CRITICAL FIX: Always initialize UI components (even without database)
    // This ensures buttons have event listeners and the app is interactive
    try {
      // Initialize router (3-phase flow)
      logger.info('🔀 Initializing router...');
      this.router = new Router();

      // Setup UI interactions
      this.setupCollapsibleSections();
      this.setupThemeSwitcher();
      this.setupQuickThemeToggle();
      this.setupFooterLinks();

      // Note: Service Worker is automatically registered by VitePWA plugin
      // See vite.config.ts and the auto-generated registerSW.js script

      if (dbAvailable) {
        logger.info('✅ Zanobot initialized successfully!');
      } else {
        logger.warn('⚠️ Zanobot initialized with limited functionality (no database)');
        logger.warn('   Some features may not work correctly without database access');
      }
    } catch (error) {
      logger.error('❌ UI initialization failed:', error);
      notify.error('Benutzeroberfläche konnte nicht geladen werden', error as Error, {
        title: 'Schwerwiegender Fehler',
        duration: 0,
      });
    }
  }

  /**
   * Setup collapsible sections
   *
   * CRITICAL FIX: Preserve original display mode (flex, grid, etc.)
   * instead of hardcoding 'block'. Also check computed style instead
   * of only inline style to handle CSS-defined visibility.
   *
   * CRITICAL FIX: Added debouncing to prevent issues from rapid clicks
   */
  private setupCollapsibleSections(): void {
    const headers = document.querySelectorAll('.section-header');
    let isAnimating = false;
    const updateCompactExpandedState = () => {
      const contents = Array.from(
        document.querySelectorAll<HTMLElement>('.collapsible-content')
      );
      const hasOpenSection = contents.some(
        (content) => window.getComputedStyle(content).display !== 'none'
      );
      document.body.classList.toggle('compact-expanded', hasOpenSection);
    };

    headers.forEach((header) => {
      header.addEventListener('click', () => {
        // CRITICAL FIX: Debounce to prevent double-clicks causing UI issues
        if (isAnimating) {
          return;
        }
        isAnimating = true;

        const target = header.getAttribute('data-target');
        if (!target) {
          isAnimating = false;
          return;
        }

        const content = document.getElementById(target);
        if (!content) {
          isAnimating = false;
          return;
        }

        // CRITICAL FIX: Store original display mode on first interaction
        // This preserves flex, grid, or any other display value
        if (!content.dataset.originalDisplay) {
          const computedStyle = window.getComputedStyle(content);
          content.dataset.originalDisplay = computedStyle.display;
        }

        // CRITICAL FIX: Check computed style instead of inline style
        // This correctly handles CSS-defined visibility
        const computedDisplay = window.getComputedStyle(content).display;
        const isVisible = computedDisplay !== 'none';

        // Toggle visibility while preserving original display mode
        if (isVisible) {
          content.style.display = 'none';
        } else {
          // CRITICAL FIX: Restore original display mode instead of hardcoding 'block'
          const originalDisplay = content.dataset.originalDisplay;
          content.style.display =
            originalDisplay && originalDisplay !== 'none' ? originalDisplay : '';
        }

        // Rotate icon
        const icon = header.querySelector('.collapse-icon');
        if (icon) {
          icon.classList.toggle('rotated');
        }

        updateCompactExpandedState();

        // Reset debounce flag after animation completes (300ms matches CSS transition)
        setTimeout(() => {
          isAnimating = false;
        }, 300);
      });
    });

    updateCompactExpandedState();
  }

  /**
   * Setup theme switcher
   */
  private setupThemeSwitcher(): void {
    const themeBtns = document.querySelectorAll('.theme-card');

    themeBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        const theme = btn.getAttribute('data-theme');
        if (!theme) return;

        // Apply theme
        document.documentElement.setAttribute('data-theme', theme);

        // Save to localStorage
        localStorage.setItem('zanobot-theme', theme);

        // Update active state
        themeBtns.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Load saved theme
    const savedTheme = localStorage.getItem('zanobot-theme') || 'brand';
    document.documentElement.setAttribute('data-theme', savedTheme);

    themeBtns.forEach((btn) => {
      if (btn.getAttribute('data-theme') === savedTheme) {
        btn.classList.add('active');
      }
    });
  }

  /**
   * Setup quick theme toggle button (header)
   */
  private setupQuickThemeToggle(): void {
    const quickToggleBtns = Array.from(
      document.querySelectorAll<HTMLElement>('.quick-theme-toggle')
    );
    const legacyToggleBtn = document.getElementById('quick-theme-toggle');
    if (legacyToggleBtn && !quickToggleBtns.includes(legacyToggleBtn)) {
      quickToggleBtns.push(legacyToggleBtn);
    }

    quickToggleBtns.forEach((btn) => {
      btn.addEventListener('click', () => {
        // Use the global ZanobotTheme API from theme-bootstrap.js
        if (window.ZanobotTheme?.toggleTheme) {
          window.ZanobotTheme.toggleTheme();
          logger.debug('🎨 Theme toggled via quick toggle button');
        }
      });
    });
  }

  /**
   * Setup footer links (Impressum, Datenschutz, Über Zanobot)
   */
  private setupFooterLinks(): void {
    // Helper function to close a modal
    const closeModal = (modal: HTMLElement) => {
      modal.style.display = 'none';
    };

    // Helper function to open a modal
    const openModal = (modal: HTMLElement) => {
      modal.style.display = 'flex';
    };

    // Impressum modal
    const impressumBtn = document.getElementById('impressum-btn');
    const impressumModal = document.getElementById('impressum-modal');
    const closeImpressumModal = document.getElementById('close-impressum-modal');
    const closeImpressumBtn = document.getElementById('close-impressum-btn');

    if (impressumBtn && impressumModal) {
      impressumBtn.addEventListener('click', () => openModal(impressumModal));
    }

    if (closeImpressumModal && impressumModal) {
      closeImpressumModal.addEventListener('click', () => closeModal(impressumModal));
    }

    if (closeImpressumBtn && impressumModal) {
      closeImpressumBtn.addEventListener('click', () => closeModal(impressumModal));
    }

    // Datenschutz modal
    const datenschutzBtn = document.getElementById('datenschutz-btn');
    const datenschutzModal = document.getElementById('datenschutz-modal');
    const closeDatenschutzModal = document.getElementById('close-datenschutz-modal');
    const closeDatenschutzBtn = document.getElementById('close-datenschutz-btn');

    if (datenschutzBtn && datenschutzModal) {
      datenschutzBtn.addEventListener('click', () => openModal(datenschutzModal));
    }

    if (closeDatenschutzModal && datenschutzModal) {
      closeDatenschutzModal.addEventListener('click', () => closeModal(datenschutzModal));
    }

    if (closeDatenschutzBtn && datenschutzModal) {
      closeDatenschutzBtn.addEventListener('click', () => closeModal(datenschutzModal));
    }

    // Über Zanobot modal
    const aboutBtn = document.getElementById('about-btn');
    const aboutModal = document.getElementById('about-modal');
    const closeAboutModal = document.getElementById('close-about-modal');
    const closeAboutBtn = document.getElementById('close-about-btn');

    if (aboutBtn && aboutModal) {
      aboutBtn.addEventListener('click', () => openModal(aboutModal));
    }

    if (closeAboutModal && aboutModal) {
      closeAboutModal.addEventListener('click', () => closeModal(aboutModal));
    }

    if (closeAboutBtn && aboutModal) {
      closeAboutBtn.addEventListener('click', () => closeModal(aboutModal));
    }

    // Close modals on background click
    [impressumModal, datenschutzModal, aboutModal].forEach((modal) => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            closeModal(modal);
          }
        });
      }
    });

    // Close modals with Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        [impressumModal, datenschutzModal, aboutModal].forEach((modal) => {
          if (modal && window.getComputedStyle(modal).display !== 'none') {
            closeModal(modal);
          }
        });
      }
    });
  }

  /**
   * Note: Service Worker registration is handled automatically by VitePWA plugin
   *
   * The VitePWA plugin (vite.config.ts) automatically:
   * - Generates service-worker.js with Workbox
   * - Creates registerSW.js registration script
   * - Injects the script tag into index.html
   * - Handles correct base path (/Zanobot/) and scope
   *
   * No manual registration needed here to avoid conflicts.
   */
}

// Start the app
new ZanobotApp();
