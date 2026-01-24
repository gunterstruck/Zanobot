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

export class SettingsPhase {
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

    // Load stats on init
    this.showStats();
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
        `Datei: ${filename}\n\nMaschinen: ${data.machines.length}\nAufnahmen: ${data.recordings.length}\nDiagnosen: ${data.diagnoses.length}`,
        { title: 'Datenbank exportiert' }
      );
    } catch (error) {
      logger.error('Export error:', error);
      notify.error('Fehler beim Exportieren der Datenbank', error as Error);
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
          const merge = confirm(
            `Datenbank importieren aus: ${file.name}\n\n` +
              `Möchten Sie die Daten ZUSAMMENFÜHREN?\n\n` +
              `JA = Zusammenführen mit bestehenden Daten\n` +
              `NEIN = Alle bestehenden Daten ERSETZEN`
          );

          // Confirm replace if not merging
          if (!merge) {
            const confirmReplace = confirm(
              `⚠️ ACHTUNG!\n\n` +
                `Alle bestehenden Daten werden GELÖSCHT und durch die Import-Daten ersetzt!\n\n` +
                `Möchten Sie fortfahren?`
            );

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
            `Maschinen: ${stats.machines}\nAufnahmen: ${stats.recordings}\nDiagnosen: ${stats.diagnoses}\n\nModus: ${merge ? 'Zusammengeführt' : 'Ersetzt'}`,
            { title: 'Datenbank importiert' }
          );

          // Refresh stats display
          this.showStats();

          logger.info('✅ Database import complete');
        } catch (error) {
          logger.error('Import error:', error);
          notify.error('Fehler beim Importieren', error as Error, {
            duration: 0,
          });
        }
      };

      input.click();
    } catch (error) {
      logger.error('Import setup error:', error);
      notify.error('Fehler beim Vorbereiten des Imports', error as Error);
    }
  }

  /**
   * Handle clear all data
   */
  private async handleClearData(): Promise<void> {
    const confirmed = confirm(
      `⚠️ ACHTUNG!\n\n` +
        `Alle Daten werden UNWIDERRUFLICH gelöscht:\n` +
        `- Alle Maschinen\n` +
        `- Alle Referenzmodelle\n` +
        `- Alle Aufnahmen\n` +
        `- Alle Diagnosen\n\n` +
        `Möchten Sie fortfahren?`
    );

    if (!confirmed) {
      return;
    }

    // Double confirmation
    const doubleConfirm = confirm(
      `Sind Sie ABSOLUT SICHER?\n\n` + `Diese Aktion kann NICHT rückgängig gemacht werden!`
    );

    if (!doubleConfirm) {
      return;
    }

    try {
      logger.info('🗑️ Clearing all data...');

      await clearAllData();

      notify.success('Alle Daten wurden gelöscht', { title: 'Datenbank geleert' });

      // Refresh stats display
      this.showStats();

      logger.info('✅ All data cleared');
    } catch (error) {
      logger.error('Clear error:', error);
      notify.error('Fehler beim Löschen der Daten', error as Error, {
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
    // Nothing to clean up
  }
}
