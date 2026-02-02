/**
 * ZANOBOT - HASH ROUTER
 *
 * Handles hash-based routing for NFC deep links.
 * Format: #/m/<machine_id>
 *
 * Design principle:
 * - NFC tags contain ONLY the machine ID, NOT the database URL
 * - The database URL is stored in the machine's data (referenceDbUrl field)
 * - This allows updating the database URL without rewriting NFC tags
 *
 * Flow:
 * 1. User scans NFC tag → Browser opens PWA with #/m/<machine_id>
 * 2. PWA looks up machine by ID
 * 3. PWA reads referenceDbUrl from machine data
 * 4. PWA downloads reference database from gunterstruck.github.io
 * 5. Machine is ready for testing
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
  needsUpdate?: boolean;
  localVersion?: string;
  remoteVersion?: string;
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
   * Format: #/m/<machine_id>
   *
   * Note: The database URL is NOT included in the NFC link.
   * It is read from the machine's stored data (referenceDbUrl field).
   */
  public parseHash(hash: string): RouteMatch {
    // Remove leading # if present
    const cleanHash = hash.startsWith('#') ? hash.substring(1) : hash;

    // Split path (ignore query string - not used for NFC links)
    const [path] = cleanHash.split('?');

    // Match /m/<machine_id> pattern
    const machineMatch = path.match(/^\/m\/([^/?]+)/);

    if (machineMatch) {
      return {
        type: 'machine',
        machineId: decodeURIComponent(machineMatch[1]),
      };
    }

    return { type: 'unknown' };
  }

  /**
   * Generate hash URL for a machine (NFC tag format)
   *
   * The hash contains ONLY the machine ID.
   * The database URL is stored in the machine data, not in the NFC link.
   * This allows updating the database without rewriting NFC tags.
   *
   * @param machineId - Machine identifier
   */
  public static getMachineHash(machineId: string): string {
    return `#/m/${encodeURIComponent(machineId)}`;
  }

  /**
   * Generate full URL for NFC tag writing
   *
   * Format: https://gunterstruck.github.io/zanobot/#/m/<machine_id>
   *
   * The URL contains ONLY the machine ID.
   * The database URL is stored in the machine data, not in the NFC link.
   *
   * @param machineId - Machine identifier
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
   * Handle machine route - load machine and download/update reference if needed
   *
   * Flow (NFC contains ONLY machine ID, NOT the database URL):
   * 1. Load machine by ID
   * 2. If machine exists: read referenceDbUrl from machine data
   * 3. If machine has referenceDbUrl: check for download/update
   * 4. If machine doesn't exist: create without referenceDbUrl (operator must configure)
   *
   * @param machineId - Machine identifier from NFC/deep link
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

      // Check if reference download or update is needed
      if (result.needsReferenceDownload) {
        logger.info(`📥 Machine ${machineId} needs initial reference download`);
        await this.downloadReference(result.machine);
      } else if (result.needsUpdate) {
        logger.info(`📦 Machine ${machineId} has update available: v${result.localVersion} → v${result.remoteVersion}`);
        await this.downloadReference(result.machine);
      } else if (result.machine.referenceDbUrl) {
        logger.info(`✓ Machine ${machineId} is up-to-date (v${result.localVersion || 'unknown'})`);
      } else {
        logger.info(`ℹ️ Machine ${machineId} has no reference DB URL configured`);
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
   * Load existing machine or create new one
   *
   * The database URL is NOT in the NFC link - it's stored in the machine data.
   * If machine doesn't exist, it's created WITHOUT a referenceDbUrl.
   * The operator (Betreiber) must configure the referenceDbUrl via MachineSetupForm.
   *
   * @param machineId - Machine identifier from NFC/deep link
   */
  private async loadOrCreateMachine(machineId: string): Promise<MachineLoadResult> {
    // Try to load existing machine
    let machine = await getMachine(machineId);
    let created = false;

    if (!machine) {
      // Machine not found - create it without referenceDbUrl
      // The operator must configure the referenceDbUrl via MachineSetupForm
      logger.info(`🆕 Auto-creating machine ${machineId} (no reference DB URL yet)`);
      machine = {
        id: machineId,
        name: machineId, // Can be updated by operator later
        createdAt: Date.now(),
        referenceModels: [],
        // Note: referenceDbUrl is NOT set here - operator must configure it
      };
      await saveMachine(machine);
      created = true;
    }

    // If machine has no referenceDbUrl configured, return early
    // User needs to contact Servicetechniker to configure the machine
    if (!machine.referenceDbUrl) {
      return {
        machine,
        created,
        needsReferenceDownload: false,
        needsUpdate: false,
      };
    }

    // Check if initial reference download is needed (no local DB exists)
    const needsInitialDownload = await ReferenceDbService.needsDownload(machineId);

    if (needsInitialDownload) {
      return {
        machine,
        created,
        needsReferenceDownload: true,
        needsUpdate: false,
      };
    }

    // Local DB exists - check for version update
    const updateCheck = await ReferenceDbService.needsUpdate(machineId);

    if (updateCheck.needsUpdate && updateCheck.reason === 'version_higher') {
      return {
        machine,
        created,
        needsReferenceDownload: false,
        needsUpdate: true,
        localVersion: updateCheck.localVersion,
        remoteVersion: updateCheck.remoteVersion,
      };
    }

    // No update needed
    return {
      machine,
      created,
      needsReferenceDownload: false,
      needsUpdate: false,
      localVersion: updateCheck.localVersion,
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
