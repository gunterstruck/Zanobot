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

class ZanobotApp {
  private router: Router | null = null;

  constructor() {
    this.init();
  }

  /**
   * Initialize application
   */
  private async init(): Promise<void> {
    console.log('🤖 Zanobot AI Assistant starting...');
    console.log('   Version: 2.0.0 (GMIA Algorithm)');

    // Wait for DOM
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => this.setup());
    } else {
      await this.setup();
    }
  }

  /**
   * Setup application after DOM is ready
   */
  private async setup(): Promise<void> {
    try {
      // Initialize database
      console.log('📦 Initializing database...');
      await initDB();

      const stats = await getDBStats();
      console.log(`   Machines: ${stats.machines}`);
      console.log(`   Recordings: ${stats.recordings}`);
      console.log(`   Diagnoses: ${stats.diagnoses}`);

      // Initialize router (3-phase flow)
      console.log('🔀 Initializing router...');
      this.router = new Router();

      // Setup UI interactions
      this.setupCollapsibleSections();
      this.setupThemeSwitcher();

      // Register service worker
      this.registerServiceWorker();

      console.log('✅ Zanobot initialized successfully!');
    } catch (error) {
      console.error('❌ Initialization failed:', error);
      alert('Failed to initialize app. Please refresh the page.');
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
            console.log('✅ Service Worker registered:', registration);
          })
          .catch((error) => {
            console.error('❌ Service Worker registration failed:', error);
          });
      });
    }
  }
}

// Start the app
new ZanobotApp();
