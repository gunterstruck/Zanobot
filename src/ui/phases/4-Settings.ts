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

    // Load stats on init
    this.showStats();
  }

  /**
   * Handle database export
   */
  private async handleExportData(): Promise<void> {
    try {
      console.log('📦 Exporting database...');

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

      console.log(`✅ Database exported: ${filename}`);
      alert(`✅ Datenbank exportiert!\n\nDatei: ${filename}\n\nMaschinen: ${data.machines.length}\nAufnahmen: ${data.recordings.length}\nDiagnosen: ${data.diagnoses.length}`);
    } catch (error) {
      console.error('Export error:', error);
      alert('❌ Fehler beim Exportieren der Datenbank.');
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

        console.log(`📥 Importing database from: ${file.name}`);

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

          alert(
            `✅ Datenbank importiert!\n\n` +
            `Maschinen: ${stats.machines}\n` +
            `Aufnahmen: ${stats.recordings}\n` +
            `Diagnosen: ${stats.diagnoses}\n\n` +
            `Modus: ${merge ? 'Zusammengeführt' : 'Ersetzt'}`
          );

          // Refresh stats display
          this.showStats();

          console.log('✅ Database import complete');
        } catch (error) {
          console.error('Import error:', error);
          alert(`❌ Fehler beim Importieren:\n\n${(error as Error).message}`);
        }
      };

      input.click();
    } catch (error) {
      console.error('Import setup error:', error);
      alert('❌ Fehler beim Vorbereiten des Imports.');
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
      `Sind Sie ABSOLUT SICHER?\n\n` +
      `Diese Aktion kann NICHT rückgängig gemacht werden!`
    );

    if (!doubleConfirm) {
      return;
    }

    try {
      console.log('🗑️ Clearing all data...');

      await clearAllData();

      alert('✅ Alle Daten wurden gelöscht.');

      // Refresh stats display
      this.showStats();

      console.log('✅ All data cleared');
    } catch (error) {
      console.error('Clear error:', error);
      alert('❌ Fehler beim Löschen der Daten.');
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

      console.log('📊 Database stats:', stats);
    } catch (error) {
      console.error('Stats error:', error);
    }
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    // Nothing to clean up
  }
}
