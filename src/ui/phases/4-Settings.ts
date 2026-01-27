/**
 * ZANOBOT - PHASE 4: SETTINGS
 *
 * Application settings and data management.
 *
 * Features:
 * - Database backup (export to JSON)
 * - Database restore (import from JSON)
 * - Data statistics
 * - Clear all data
 */

import { exportData, importData, getDBStats, clearAllData } from '@data/db.js';
import { notify } from '@utils/notifications.js';
import { logger } from '@utils/logger.js';
import {
  getVisualizerSettings,
  setVisualizerSettings,
} from '@utils/visualizerSettings.js';
import { ModeSelector, injectModeSelectorStyles } from '@ui/components/ModeSelector.js';
import { getDetectionModeManager } from '@core/detection-mode.js';
import { t } from '../../i18n/index.js';

export class SettingsPhase {
  private modeSelector: ModeSelector | null = null;
  private unsubscribeModeChange?: () => void;

  constructor() {}

  /**
   * Initialize the settings phase UI
   */
  public init(): void {
    // Export database button
    const exportBtn = document.getElementById('export-data-btn');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => this.handleExportData());
    }

    // Import database button
    const importBtn = document.getElementById('import-data-btn');
    if (importBtn) {
      importBtn.addEventListener('click', () => this.handleImportData());
    }

    // Clear all data button
    const clearBtn = document.getElementById('clear-data-btn');
    if (clearBtn) {
      clearBtn.addEventListener('click', () => this.handleClearData());
    }

    // Show statistics button
    const statsBtn = document.getElementById('show-stats-btn');
    if (statsBtn) {
      statsBtn.addEventListener('click', () => this.showStats());
    }

    this.initVisualizerScaleSettings();

    // Initialize mode selector for analysis method selection
    this.initModeSelector();

    // Load stats on init
    this.showStats();
  }

  /**
   * Initialize the Mode Selector component for GIMA/YAMNet toggle
   */
  private initModeSelector(): void {
    // Inject styles
    injectModeSelectorStyles();

    // Create and render the mode selector
    this.modeSelector = new ModeSelector();
    this.modeSelector.render('analysis-mode-selector');

    // Subscribe to mode changes to update visibility of mode-dependent settings
    const modeManager = getDetectionModeManager();
    this.unsubscribeModeChange = modeManager.onModeChange((newMode) => {
      this.updateModeVisibility(newMode);
    });

    // Set initial visibility based on current mode
    this.updateModeVisibility(modeManager.getMode());

    logger.info('🎛️ Mode selector initialized');
  }

  /**
   * Update visibility of mode-dependent settings
   */
  private updateModeVisibility(mode: 'STATIONARY' | 'CYCLIC'): void {
    // Update data-detection-mode attribute on body for CSS-based visibility
    document.body.setAttribute('data-detection-mode', mode);

    // Update info badges in the mode settings info section
    const infoSection = document.getElementById('mode-settings-info');
    if (infoSection) {
      const badges = infoSection.querySelectorAll('[data-detection-mode]');
      badges.forEach((badge) => {
        const badgeMode = badge.getAttribute('data-detection-mode');
        (badge as HTMLElement).style.display = badgeMode === mode ? 'flex' : 'none';
      });
    }

    logger.debug(`Mode visibility updated: ${mode}`);
  }

  private initVisualizerScaleSettings(): void {
    const freqToggle = document.getElementById(
      'frequency-scale-toggle'
    ) as HTMLInputElement | null;
    const ampToggle = document.getElementById(
      'amplitude-scale-toggle'
    ) as HTMLInputElement | null;

    if (!freqToggle && !ampToggle) {
      return;
    }

    const settings = getVisualizerSettings();

    if (freqToggle) {
      freqToggle.checked = settings.frequencyScale === 'log';
      freqToggle.addEventListener('change', () => {
        setVisualizerSettings({
          frequencyScale: freqToggle.checked ? 'log' : 'linear',
        });
      });
    }

    if (ampToggle) {
      ampToggle.checked = settings.amplitudeScale === 'log';
      ampToggle.addEventListener('change', () => {
        setVisualizerSettings({
          amplitudeScale: ampToggle.checked ? 'log' : 'linear',
        });
      });
    }
  }

  /**
   * Handle database export
   */
  private async handleExportData(): Promise<void> {
    try {
      logger.info('📦 Exporting database...');

      // Get all data
      const data = await exportData();

      // Create JSON blob
      const jsonString = JSON.stringify(data, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });

      // Create filename with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = `zanobot-backup-${timestamp}.json`;

      // Trigger download
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      logger.info(`✅ Database exported: ${filename}`);
      notify.success(
        t('settings.export.success', {
          filename,
          machines: data.machines.length,
          recordings: data.recordings.length,
          diagnoses: data.diagnoses.length,
        }),
        { title: t('modals.databaseExported') }
      );
    } catch (error) {
      logger.error('Export error:', error);
      notify.error(t('settings.exportError'), error as Error);
    }
  }

  /**
   * Handle database import
   */
  private async handleImportData(): Promise<void> {
    try {
      // Create file input
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'application/json,.json';

      input.onchange = async (e: Event) => {
        const target = e.target as HTMLInputElement;
        const file = target.files?.[0];

        if (!file) {
          return;
        }

        logger.info(`📥 Importing database from: ${file.name}`);

        try {
          // Read file
          const text = await file.text();
          const data = JSON.parse(text);

          // Validate data structure
          if (!data.machines && !data.recordings && !data.diagnoses) {
            throw new Error('Invalid backup file format');
          }

          // Ask for merge or replace
          const merge = confirm(t('settings.import.confirmMerge', { filename: file.name }));

          // Confirm replace if not merging
          if (!merge) {
            const confirmReplace = confirm(t('settings.import.confirmReplace'));

            if (!confirmReplace) {
              return;
            }
          }

          // Import data
          await importData(data, merge);

          // Show success
          const stats = {
            machines: data.machines?.length || 0,
            recordings: data.recordings?.length || 0,
            diagnoses: data.diagnoses?.length || 0,
          };

          notify.success(
            t('settings.import.success', {
              machines: stats.machines,
              recordings: stats.recordings,
              diagnoses: stats.diagnoses,
              mode: merge ? t('settings.import.modeMerged') : t('settings.import.modeReplaced'),
            }),
            { title: t('modals.databaseImported') }
          );

          // Refresh stats display
          this.showStats();

          logger.info('✅ Database import complete');
        } catch (error) {
          logger.error('Import error:', error);
          notify.error(t('settings.importError'), error as Error, {
            duration: 0,
          });
        }
      };

      input.click();
    } catch (error) {
      logger.error('Import setup error:', error);
      notify.error(t('settings.import.setupError'), error as Error);
    }
  }

  /**
   * Handle clear all data
   */
  private async handleClearData(): Promise<void> {
    const confirmed = confirm(t('settings.clear.confirmFirst'));

    if (!confirmed) {
      return;
    }

    // Double confirmation
    const doubleConfirm = confirm(t('settings.clear.confirmSecond'));

    if (!doubleConfirm) {
      return;
    }

    try {
      logger.info('🗑️ Clearing all data...');

      await clearAllData();

      notify.success(t('settings.clear.success'), { title: t('modals.databaseCleared') });

      // Refresh stats display
      this.showStats();

      logger.info('✅ All data cleared');
    } catch (error) {
      logger.error('Clear error:', error);
      notify.error(t('settings.clear.error'), error as Error, {
        duration: 0,
      });
    }
  }

  /**
   * Show database statistics
   */
  private async showStats(): Promise<void> {
    try {
      const stats = await getDBStats();

      // Update UI elements
      const machinesCount = document.getElementById('stats-machines');
      const recordingsCount = document.getElementById('stats-recordings');
      const diagnosesCount = document.getElementById('stats-diagnoses');

      if (machinesCount) {
        machinesCount.textContent = stats.machines.toString();
      }

      if (recordingsCount) {
        recordingsCount.textContent = stats.recordings.toString();
      }

      if (diagnosesCount) {
        diagnosesCount.textContent = stats.diagnoses.toString();
      }

      logger.debug('📊 Database stats:', stats);
    } catch (error) {
      logger.error('Stats error:', error);
    }
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    // Cleanup mode selector
    if (this.modeSelector) {
      this.modeSelector.destroy();
      this.modeSelector = null;
    }

    // Unsubscribe from mode changes
    if (this.unsubscribeModeChange) {
      this.unsubscribeModeChange();
      this.unsubscribeModeChange = undefined;
    }
  }
}
