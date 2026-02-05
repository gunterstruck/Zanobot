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
import {
  applyDeviceInvariantDetails,
  clearDeviceInvariantMismatch,
  getDeviceInvariantConfig,
  getDeviceInvariantMismatch,
  getDeviceInvariantSettings,
  setDeviceInvariantMismatch,
  setDeviceInvariantSettings,
  type DeviceInvariantStrength,
} from '@utils/deviceInvariantSettings.js';
import {
  formatFeatureModeDetails,
  getFeatureModeDetailsFromConfig,
  getFeatureModeSummary,
  isFeatureModeMatch,
} from '@utils/featureMode.js';
import { ModeSelector, injectModeSelectorStyles } from '@ui/components/ModeSelector.js';
import { getDetectionModeManager } from '@core/detection-mode.js';
import { t } from '../../i18n/index.js';

export class SettingsPhase {
  private modeSelector: ModeSelector | null = null;
  private unsubscribeModeChange?: () => void;

  // Pre-built export payload for instant sharing (preserves user gesture)
  private preparedSharePayload: {
    file: File;
    filename: string;
    blob: Blob;
  } | null = null;
  private isPreparingPayload = false;

  // CRITICAL FIX: Store event handler references for proper cleanup in destroy()
  private eventHandlers: Map<string, { element: HTMLElement; handler: () => void }> = new Map();

  constructor() {}

  /**
   * Initialize the settings phase UI
   */
  public init(): void {
    // CRITICAL FIX: Use helper method to register event handlers for proper cleanup
    this.registerEventHandler('export-data-btn', () => this.handleExportData());
    this.registerEventHandler('import-data-btn', () => this.handleImportData());
    this.registerEventHandler('share-data-btn', () => this.handleShareData());
    this.registerEventHandler('clear-data-btn', () => this.handleClearData());
    this.registerEventHandler('show-stats-btn', () => this.showStats());

    this.initVisualizerScaleSettings();
    this.initDeviceInvariantSettings();

    // Initialize mode selector for analysis method selection
    this.initModeSelector();

    // Initialize banner settings (advanced/expert only)
    this.initBannerSettings();

    // Load stats on init
    this.showStats();

    // Pre-build share payload in background (for instant sharing without losing user gesture)
    this.prepareSharePayload();
  }

  /**
   * Prepare export payload in background for instant sharing.
   * This is called on init so that when user clicks "Share",
   * we can call navigator.share() immediately without async work,
   * preserving the user gesture (required by Web Share API).
   */
  private async prepareSharePayload(): Promise<void> {
    if (this.isPreparingPayload) return;

    this.isPreparingPayload = true;
    try {
      logger.info('🔄 Preparing share payload in background...');
      const payload = await this.buildExportPayload();
      this.preparedSharePayload = payload;
      logger.info('✅ Share payload ready');
    } catch (error) {
      logger.warn('Failed to prepare share payload:', error);
      this.preparedSharePayload = null;
    } finally {
      this.isPreparingPayload = false;
    }
  }

  /**
   * Initialize the Mode Selector component for GMIA/YAMNet toggle
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

  private initDeviceInvariantSettings(): void {
    const toggle = document.getElementById('device-invariant-toggle') as HTMLInputElement | null;
    const advancedToggle = document.getElementById(
      'device-invariant-advanced-toggle'
    ) as HTMLButtonElement | null;
    const details = document.getElementById('device-invariant-details') as HTMLElement | null;
    const methodSelect = document.getElementById('device-invariant-method') as HTMLSelectElement | null;
    const strengthSelect = document.getElementById('device-invariant-strength') as HTMLSelectElement | null;
    const zNormToggle = document.getElementById('device-invariant-znorm') as HTMLInputElement | null;
    const warningCard = document.getElementById('device-invariant-db-warning') as HTMLElement | null;
    const warningText = document.getElementById('device-invariant-db-warning-text');
    const applyButton = document.getElementById('device-invariant-apply-db');

    if (!toggle && !details && !methodSelect && !strengthSelect && !zNormToggle) {
      return;
    }

    let isExpanded = false;
    const setExpanded = (expanded: boolean) => {
      isExpanded = expanded;
      if (details) {
        details.style.display = expanded ? 'block' : 'none';
      }
      if (advancedToggle) {
        advancedToggle.setAttribute('aria-expanded', expanded ? 'true' : 'false');
        advancedToggle.classList.toggle('is-expanded', expanded);
      }
    };

    const applyVisibility = (enabled: boolean) => {
      if (advancedToggle) {
        advancedToggle.disabled = !enabled;
      }
      if (!enabled) {
        setExpanded(false);
        return;
      }
      setExpanded(true);
    };

    const syncUI = () => {
      const settings = getDeviceInvariantSettings();
      if (toggle) {
        toggle.checked = settings.enabled;
      }
      if (methodSelect) {
        methodSelect.value = settings.method;
      }
      if (strengthSelect) {
        strengthSelect.value = settings.strength;
      }
      if (zNormToggle) {
        zNormToggle.checked = settings.zNorm;
      }
      applyVisibility(settings.enabled);
    };

    syncUI();

    if (toggle) {
      toggle.addEventListener('change', () => {
        const updated = setDeviceInvariantSettings({ enabled: toggle.checked });
        applyVisibility(updated.enabled);
      });
    }

    if (advancedToggle) {
      advancedToggle.addEventListener('click', () => {
        if (!toggle?.checked) {
          return;
        }
        setExpanded(!isExpanded);
      });
    }

    if (methodSelect) {
      methodSelect.addEventListener('change', () => {
        setDeviceInvariantSettings({
          method: methodSelect.value as 'dctLifter' | 'smoothSubtract',
        });
      });
    }

    if (strengthSelect) {
      strengthSelect.addEventListener('change', () => {
        setDeviceInvariantSettings({ strength: strengthSelect.value as DeviceInvariantStrength });
      });
    }

    if (zNormToggle) {
      zNormToggle.addEventListener('change', () => {
        setDeviceInvariantSettings({ zNorm: zNormToggle.checked });
      });
    }

    const mismatch = getDeviceInvariantMismatch();
    if (warningCard) {
      if (mismatch) {
        warningCard.style.display = 'block';
        if (warningText) {
          warningText.textContent = t('settingsUI.deviceInvariantMismatchDescription', {
            dbMode: formatFeatureModeDetails(mismatch.details, t),
            appMode: formatFeatureModeDetails(
              getFeatureModeDetailsFromConfig(getDeviceInvariantConfig()),
              t
            ),
          });
        }
      } else {
        warningCard.style.display = 'none';
      }
    }

    if (applyButton && mismatch) {
      applyButton.addEventListener('click', () => {
        applyDeviceInvariantDetails(mismatch.details);
        clearDeviceInvariantMismatch();
        syncUI();
        if (warningCard) {
          warningCard.style.display = 'none';
        }
        notify.success(t('settingsUI.deviceInvariantApplied'), {
          title: t('settingsUI.deviceInvariantMismatchTitle'),
        });
      });
    }
  }

  private async initBannerSettings(): Promise<void> {
    const previewImage = document.getElementById('banner-preview-image') as HTMLImageElement | null;
    const uploadBtn = document.getElementById('banner-upload-btn');
    const resetBtn = document.getElementById('banner-reset-btn') as HTMLButtonElement | null;
    const uploadInput = document.getElementById('banner-upload-input') as HTMLInputElement | null;

    if (!previewImage || !uploadBtn || !resetBtn || !uploadInput) {
      return;
    }

    // Import BannerManager dynamically to access instance
    const { getBannerManager } = await import('../BannerManager.js');
    const bannerManager = getBannerManager();

    if (!bannerManager) {
      logger.warn('⚠️ BannerManager not available for settings');
      return;
    }

    // Update preview and reset button state
    const updateBannerPreview = async () => {
      const currentSrc = bannerManager.getCurrentBannerSrc();
      if (currentSrc) {
        previewImage.src = currentSrc;
      }

      const hasCustom = await bannerManager.hasCustomBannerForCurrentTheme();
      resetBtn.disabled = !hasCustom;
    };

    // Initial update
    void updateBannerPreview();

    // Upload button click
    uploadBtn.addEventListener('click', () => {
      uploadInput.click();
    });

    // Handle file selection
    uploadInput.addEventListener('change', async (event) => {
      const input = event.currentTarget as HTMLInputElement | null;
      const file = input?.files?.[0];

      if (!file) {
        return;
      }

      const success = await bannerManager.uploadBanner(file);
      if (success) {
        await updateBannerPreview();
      }

      // Clear input so same file can be selected again
      input.value = '';
    });

    // Reset button click
    resetBtn.addEventListener('click', async () => {
      await bannerManager.resetBanner();
      await updateBannerPreview();
    });

    // Update preview when theme changes
    window.addEventListener('themechange', () => {
      void updateBannerPreview();
    });
  }

  /**
   * Handle database export
   */
  private async handleExportData(): Promise<void> {
    try {
      logger.info('📦 Exporting database...');

      const { data, filename, blob } = await this.buildExportPayload();

      this.triggerDownload(blob, filename);

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
   * Handle database share (send as file)
   *
   * IMPORTANT: Web Share API requires "transient user activation" - the share()
   * call must happen IMMEDIATELY after the user gesture (click), without any
   * await in between. That's why we pre-build the payload in prepareSharePayload()
   * and use it directly here.
   */
  private async handleShareData(): Promise<void> {
    logger.info('📤 Share button clicked');

    // Use pre-built payload if available (instant share, preserves user gesture)
    let payload = this.preparedSharePayload;

    // If payload not ready yet, we have to build it now (will likely fail on Android)
    if (!payload) {
      if (this.isPreparingPayload) {
        notify.info(t('settings.share.preparing'));
        return;
      }

      // Build payload now (fallback - user gesture will likely expire)
      logger.warn('Share payload not ready, building now (user gesture may expire)');
      try {
        payload = await this.buildExportPayload();
      } catch (error) {
        logger.error('Failed to build export payload:', error);
        notify.error(t('settings.shareError'), error as Error);
        return;
      }
    }

    const { file, filename, blob } = payload;

    // Check if Web Share API with files is available
    if (!navigator.share) {
      logger.info('navigator.share not available, downloading instead');
      this.triggerDownload(blob, filename);
      notify.info(t('settings.share.fallback', { filename }), {
        title: t('modals.databaseExported'),
      });
      this.refreshSharePayload();
      return;
    }

    // Try sharing - this MUST happen immediately after click (no await before this!)
    try {
      await navigator.share({
        files: [file],
        title: t('settings.share.title'),
        text: t('settings.share.text', { filename }),
      });

      logger.info(`✅ Database shared: ${filename}`);
      notify.success(t('settings.share.success', { filename }), {
        title: t('modals.databaseShared'),
      });
    } catch (shareError) {
      const errorName = (shareError as Error).name;
      const errorMessage = (shareError as Error).message;

      // User cancelled sharing - not an error
      if (errorName === 'AbortError') {
        logger.info('Share cancelled by user');
        return;
      }

      // NotAllowedError: User gesture expired or file sharing not supported
      // TypeError: Files not supported on this browser
      logger.warn(`Share API failed (${errorName}): ${errorMessage}`);

      // Fallback to download
      this.triggerDownload(blob, filename);
      notify.info(t('settings.share.fallback', { filename }), {
        title: t('modals.databaseExported'),
      });
    }

    // Refresh payload for next share attempt (data may have changed)
    this.refreshSharePayload();
  }

  /**
   * Refresh the prepared share payload (call after sharing or when data changes)
   */
  private refreshSharePayload(): void {
    this.preparedSharePayload = null;
    // Rebuild in background
    setTimeout(() => this.prepareSharePayload(), 100);
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

          const importedModels = (data.machines || [])
            .flatMap((machine: { referenceModels?: unknown[] }) => machine.referenceModels || [])
            .filter(Boolean);
          const modeSummary = getFeatureModeSummary(importedModels as never[]);
          const currentConfig = getDeviceInvariantConfig();
          if (modeSummary && !isFeatureModeMatch(currentConfig, modeSummary.details)) {
            setDeviceInvariantMismatch(modeSummary.details, 'import');
            notify.warning(
              t('settingsUI.deviceInvariantMismatchNotice', {
                mode: formatFeatureModeDetails(modeSummary.details, t),
              }),
              {
                title: t('settingsUI.deviceInvariantMismatchTitle'),
                duration: 0,
              }
            );
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

          setTimeout(() => {
            window.location.reload();
          }, 1500);

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

      setTimeout(() => {
        window.location.reload();
      }, 1500);

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

  private async buildExportPayload(): Promise<{
    data: Awaited<ReturnType<typeof exportData>>;
    filename: string;
    blob: Blob;
    file: File;
  }> {
    // Get all data
    const data = await exportData();

    // Create JSON blob
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });

    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `zanobot-backup-${timestamp}.json`;
    const file = new File([blob], filename, { type: 'application/json' });

    return { data, filename, blob, file };
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Register an event handler with automatic cleanup tracking
   * CRITICAL FIX: Prevents memory leaks by storing references for removal in destroy()
   */
  private registerEventHandler(elementId: string, handler: () => void): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.addEventListener('click', handler);
      this.eventHandlers.set(elementId, { element: element as HTMLElement, handler });
    }
  }

  /**
   * Cleanup
   */
  public destroy(): void {
    // CRITICAL FIX: Remove all registered event handlers to prevent memory leaks
    for (const [elementId, { element, handler }] of this.eventHandlers) {
      element.removeEventListener('click', handler);
      logger.debug(`🧹 Removed event handler from ${elementId}`);
    }
    this.eventHandlers.clear();

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

    // Clear prepared share payload to release memory
    this.preparedSharePayload = null;
  }
}
