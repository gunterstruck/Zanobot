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
    ZANOBOT_CONFIG?: any;
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
    logger.info('🤖 Zanobot AI Assistant starting...');
    logger.info('   Version: 2.0.0 (GMIA Algorithm)');

    // CRITICAL FIX: Wait for DOM with enhanced race condition protection
    // Double-check pattern prevents edge case where event fires between check and listener registration
    if (document.readyState === 'loading') {
      await new Promise<void>((resolve) => {
        // Set up listener with once: true to ensure it only fires once
        const handler = () => resolve();
        document.addEventListener('DOMContentLoaded', handler, { once: true });

        // RACE CONDITION FIX: Re-check state after adding listener
        // If DOM loaded between initial check and listener registration, manually resolve
        if (document.readyState !== 'loading') {
          document.removeEventListener('DOMContentLoaded', handler);
          resolve();
        }
      });
    }

    // Always call setup after DOM is ready
    await this.setup();
  }

  /**
   * Setup application after DOM is ready
   *
   * CRITICAL FIX: Graceful degradation - UI initializes even if database fails
   * This ensures buttons and event listeners are set up regardless of DB status
   */
  private async setup(): Promise<void> {
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
   */
  private setupCollapsibleSections(): void {
    const headers = document.querySelectorAll('.section-header');

    headers.forEach((header) => {
      header.addEventListener('click', () => {
        const target = header.getAttribute('data-target');
        if (!target) return;

        const content = document.getElementById(target);
        if (!content) return;

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
      });
    });
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
    const quickToggleBtn = document.getElementById('quick-theme-toggle');
    if (quickToggleBtn) {
      quickToggleBtn.addEventListener('click', () => {
        // Use the global ZanobotTheme API from theme-bootstrap.js
        if (window.ZanobotTheme?.toggleTheme) {
          window.ZanobotTheme.toggleTheme();
          logger.debug('🎨 Theme toggled via quick toggle button');
        }
      });
    }
  }

  /**
   * Setup footer links (Impressum, Datenschutz, Über Zanobot)
   */
  private setupFooterLinks(): void {
    // Impressum modal
    const impressumBtn = document.getElementById('impressum-btn');
    const impressumModal = document.getElementById('impressum-modal');
    const closeImpressumModal = document.getElementById('close-impressum-modal');
    const closeImpressumBtn = document.getElementById('close-impressum-btn');

    if (impressumBtn && impressumModal) {
      impressumBtn.addEventListener('click', () => {
        impressumModal.style.display = 'flex';
      });
    }

    if (closeImpressumModal && impressumModal) {
      closeImpressumModal.addEventListener('click', () => {
        impressumModal.style.display = 'none';
      });
    }

    if (closeImpressumBtn && impressumModal) {
      closeImpressumBtn.addEventListener('click', () => {
        impressumModal.style.display = 'none';
      });
    }

    // Datenschutz modal
    const datenschutzBtn = document.getElementById('datenschutz-btn');
    const datenschutzModal = document.getElementById('datenschutz-modal');
    const closeDatenschutzModal = document.getElementById('close-datenschutz-modal');
    const closeDatenschutzBtn = document.getElementById('close-datenschutz-btn');

    if (datenschutzBtn && datenschutzModal) {
      datenschutzBtn.addEventListener('click', () => {
        datenschutzModal.style.display = 'flex';
      });
    }

    if (closeDatenschutzModal && datenschutzModal) {
      closeDatenschutzModal.addEventListener('click', () => {
        datenschutzModal.style.display = 'none';
      });
    }

    if (closeDatenschutzBtn && datenschutzModal) {
      closeDatenschutzBtn.addEventListener('click', () => {
        datenschutzModal.style.display = 'none';
      });
    }

    // Über Zanobot modal
    const aboutBtn = document.getElementById('about-btn');
    const aboutModal = document.getElementById('about-modal');
    const closeAboutModal = document.getElementById('close-about-modal');
    const closeAboutBtn = document.getElementById('close-about-btn');

    if (aboutBtn && aboutModal) {
      aboutBtn.addEventListener('click', () => {
        aboutModal.style.display = 'flex';
      });
    }

    if (closeAboutModal && aboutModal) {
      closeAboutModal.addEventListener('click', () => {
        aboutModal.style.display = 'none';
      });
    }

    if (closeAboutBtn && aboutModal) {
      closeAboutBtn.addEventListener('click', () => {
        aboutModal.style.display = 'none';
      });
    }

    // Close modals on background click
    [impressumModal, datenschutzModal, aboutModal].forEach((modal) => {
      if (modal) {
        modal.addEventListener('click', (e) => {
          if (e.target === modal) {
            modal.style.display = 'none';
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
