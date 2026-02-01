/**
 * ZANOBOT - HASH ROUTER
 *
 * Handles hash-based routing for NFC deep links.
 * Format: #/m/<machine_id>
 *
 * This enables NFC tags to open the app directly to a specific machine,
 * triggering automatic reference database download for Basisnutzer.
 */

import { getMachine, saveMachine } from '@data/db.js';
import { ReferenceDbService } from '@data/ReferenceDbService.js';
import type { Machine } from '@data/types.js';
import { logger } from '@utils/logger.js';
import { t } from '../i18n/index.js';

/**
 * Route match result
 */
export interface RouteMatch {
  type: 'machine' | 'unknown';
  machineId?: string;
}

/**
 * Hash change event callback
 */
export type HashChangeCallback = (match: RouteMatch) => void;

/**
 * Machine load result
 */
export interface MachineLoadResult {
  machine: Machine | null;
  created: boolean;
  error?: string;
  needsReferenceDownload: boolean;
}

/**
 * Hash Router for NFC deep links
 */
export class HashRouter {
  private onRouteChange?: HashChangeCallback;
  private onMachineReady?: (machine: Machine) => void;
  private onDownloadProgress?: (status: string, progress?: number) => void;
  private onDownloadError?: (error: string) => void;

  constructor() {
    // Listen for hash changes
    window.addEventListener('hashchange', () => this.handleHashChange());
  }

  /**
   * Set callback for route changes
   */
  public setOnRouteChange(callback: HashChangeCallback): void {
    this.onRouteChange = callback;
  }

  /**
   * Set callback for when machine is ready (loaded + reference downloaded)
   */
  public setOnMachineReady(callback: (machine: Machine) => void): void {
    this.onMachineReady = callback;
  }

  /**
   * Set callback for download progress updates
   */
  public setOnDownloadProgress(callback: (status: string, progress?: number) => void): void {
    this.onDownloadProgress = callback;
  }

  /**
   * Set callback for download errors
   */
  public setOnDownloadError(callback: (error: string) => void): void {
    this.onDownloadError = callback;
  }

  /**
   * Initialize router and process current hash
   */
  public async init(): Promise<void> {
    await this.handleHashChange();
  }

  /**
   * Parse hash URL and extract route info
   */
  public parseHash(hash: string): RouteMatch {
    // Remove leading # if present
    const cleanHash = hash.startsWith('#') ? hash.substring(1) : hash;

    // Match #/m/<machine_id> pattern
    const machineMatch = cleanHash.match(/^\/m\/([^/]+)$/);

    if (machineMatch) {
      return {
        type: 'machine',
        machineId: decodeURIComponent(machineMatch[1]),
      };
    }

    return { type: 'unknown' };
  }

  /**
   * Generate hash URL for a machine
   */
  public static getMachineHash(machineId: string): string {
    return `#/m/${encodeURIComponent(machineId)}`;
  }

  /**
   * Generate full URL for NFC tag writing
   */
  public static getFullMachineUrl(machineId: string): string {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}${this.getMachineHash(machineId)}`;
  }

  /**
   * Handle hash change event
   */
  private async handleHashChange(): Promise<void> {
    const hash = window.location.hash;

    if (!hash || hash === '#') {
      return;
    }

    const match = this.parseHash(hash);
    logger.info(`🔗 Hash route: ${hash} → ${match.type}${match.machineId ? ` (${match.machineId})` : ''}`);

    // Notify listeners
    this.onRouteChange?.(match);

    // Handle machine route
    if (match.type === 'machine' && match.machineId) {
      await this.handleMachineRoute(match.machineId);
    }
  }

  /**
   * Handle machine route - load machine and download reference if needed
   */
  private async handleMachineRoute(machineId: string): Promise<void> {
    try {
      // Load or create machine
      const result = await this.loadOrCreateMachine(machineId);

      if (result.error || !result.machine) {
        logger.error(`Failed to load machine ${machineId}:`, result.error);
        this.onDownloadError?.(result.error || 'unknown_error');
        return;
      }

      // Check if reference download is needed
      if (result.needsReferenceDownload) {
        logger.info(`📥 Machine ${machineId} needs reference download`);
        await this.downloadReference(result.machine);
      }

      // Notify that machine is ready
      this.onMachineReady?.(result.machine);

      // Clear the hash after processing (optional - keeps URL clean)
      // window.history.replaceState(null, '', window.location.pathname);
    } catch (error) {
      logger.error('Error handling machine route:', error);
      this.onDownloadError?.(error instanceof Error ? error.message : 'unknown_error');
    }
  }

  /**
   * Load existing machine or create a placeholder
   */
  private async loadOrCreateMachine(machineId: string): Promise<MachineLoadResult> {
    // Try to load existing machine
    let machine = await getMachine(machineId);
    let created = false;

    if (!machine) {
      // Machine not found - this can happen if:
      // 1. Basisnutzer scans NFC before Servicetechniker synced the machine
      // 2. Database was cleared
      // For now, we don't auto-create - show error to contact Servicetechniker
      return {
        machine: null,
        created: false,
        error: 'machine_not_found',
        needsReferenceDownload: false,
      };
    }

    // Check if reference download is needed
    const needsDownload = await ReferenceDbService.needsDownload(machineId);

    return {
      machine,
      created,
      needsReferenceDownload: needsDownload,
    };
  }

  /**
   * Download reference database for a machine
   */
  private async downloadReference(machine: Machine): Promise<void> {
    this.onDownloadProgress?.(t('machineSetup.downloadingReference'), 0);

    const result = await ReferenceDbService.downloadAndApply(
      machine.id,
      (status, progress) => {
        this.onDownloadProgress?.(this.getLocalizedStatus(status), progress);
      }
    );

    if (!result.success) {
      this.onDownloadError?.(this.getLocalizedError(result.error || 'unknown'));
      return;
    }

    logger.info(`✅ Reference downloaded: ${result.modelsImported} models, version ${result.version}`);
  }

  /**
   * Get localized status message
   */
  private getLocalizedStatus(status: string): string {
    const statusMap: Record<string, string> = {
      downloading: t('machineSetup.statusDownloading'),
      parsing: t('machineSetup.statusParsing'),
      validating: t('machineSetup.statusValidating'),
      saving: t('machineSetup.statusSaving'),
      complete: t('machineSetup.statusComplete'),
    };

    return statusMap[status] || status;
  }

  /**
   * Get localized error message
   */
  private getLocalizedError(error: string): string {
    const errorMap: Record<string, string> = {
      machine_not_found: t('machineSetup.errorMachineNotFound'),
      no_reference_url: t('machineSetup.errorNoReferenceUrl'),
      download_failed: t('machineSetup.errorDownloadFailed'),
      invalid_format: t('machineSetup.errorInvalidFormat'),
      invalid_data_structure: t('machineSetup.errorInvalidStructure'),
      no_models_or_config: t('machineSetup.errorNoModels'),
      invalid_model_format: t('machineSetup.errorInvalidModel'),
    };

    return errorMap[error] || t('machineSetup.errorUnknown');
  }

  /**
   * Clean up router
   */
  public destroy(): void {
    window.removeEventListener('hashchange', () => this.handleHashChange());
  }
}
