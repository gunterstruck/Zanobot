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
import { Router } from './ui/router.js';
import { notify } from '@utils/notifications.js';
import { logger } from '@utils/logger.js';

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
   */
  private async setup(): Promise<void> {
    try {
      // Initialize database
      logger.info('📦 Initializing database...');
      await initDB();

      const stats = await getDBStats();
      logger.info(`   Machines: ${stats.machines}`);
      logger.info(`   Recordings: ${stats.recordings}`);
      logger.info(`   Diagnoses: ${stats.diagnoses}`);

      // Initialize router (3-phase flow)
      logger.info('🔀 Initializing router...');
      this.router = new Router();

      // Setup UI interactions
      this.setupCollapsibleSections();
      this.setupThemeSwitcher();

      // Register service worker
      this.registerServiceWorker();

      logger.info('✅ Zanobot initialized successfully!');
    } catch (error) {
      logger.error('❌ Initialization failed:', error);
      notify.error('App konnte nicht initialisiert werden', error as Error, {
        title: 'Initialisierungsfehler',
        duration: 0
      });
    }
  }

  /**
   * Setup collapsible sections
   */
  private setupCollapsibleSections(): void {
    const headers = document.querySelectorAll('.section-header');

    headers.forEach((header) => {
      header.addEventListener('click', () => {
        const target = header.getAttribute('data-target');
        if (!target) return;

        const content = document.getElementById(target);
        if (!content) return;

        // Toggle visibility
        const isVisible = content.style.display !== 'none';
        content.style.display = isVisible ? 'none' : 'block';

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
    const themeBtns = document.querySelectorAll('.theme-btn');

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
   * Register PWA service worker
   */
  private registerServiceWorker(): void {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((registration) => {
            logger.info('✅ Service Worker registered:', registration);
          })
          .catch((error) => {
            logger.error('❌ Service Worker registration failed:', error);
          });
      });
    }
  }
}

// Start the app
new ZanobotApp();
