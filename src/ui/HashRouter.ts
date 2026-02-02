/**
 * ZANOBOT - HASH ROUTER
 *
 * Handles hash-based routing for NFC deep links.
 * Format: #/m/<machine_id>?c=<customer_id>
 *
 * This enables NFC tags to open the app directly to a specific machine,
 * triggering automatic reference database download for Basisnutzer.
 * The customerId parameter (c) determines which customer's database to load.
 * The DB URL is automatically built: https://gunterstruck.github.io/<customerId>/db-latest.json
 */

import { getMachine, saveMachine } from '@data/db.js';
import { ReferenceDbService } from '@data/ReferenceDbService.js';
import type { Machine } from '@data/types.js';
import { logger } from '@utils/logger.js';
import { onboardingTrace } from '@utils/onboardingTrace.js';
import { t } from '../i18n/index.js';

/**
 * Base URL for GitHub Pages reference databases (MVP)
 * All customer databases are hosted under this domain
 */
export const GITHUB_PAGES_BASE_URL = 'https://gunterstruck.github.io';

/**
 * Route match result
 */
export interface RouteMatch {
  type: 'machine' | 'unknown';
  machineId?: string;
  /** Customer ID from NFC link (c parameter) - used to build DB URL */
  customerId?: string;
  /** Reference DB URL from NFC link (allows auto-creation on new devices) */
  referenceDbUrl?: string;
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
   * Supports:
   * - New format: #/m/<machine_id>?c=<customer_id> (customerId builds DB URL automatically)
   * - Legacy format: #/m/<machine_id>?ref=<encoded_url> (full URL in parameter)
   */
  public parseHash(hash: string): RouteMatch {
    // Remove leading # if present
    const cleanHash = hash.startsWith('#') ? hash.substring(1) : hash;

    // Trace: Hash parsed
    onboardingTrace.step('hash_parsed', { hash: cleanHash });

    // Split path and query string
    const [path, queryString] = cleanHash.split('?');

    // Match /m/<machine_id> pattern
    const machineMatch = path.match(/^\/m\/([^/?]+)/);

    if (machineMatch) {
      const result: RouteMatch = {
        type: 'machine',
        machineId: decodeURIComponent(machineMatch[1]),
      };

      // Trace: Machine ID extracted
      onboardingTrace.success('machine_id_extracted', { machineId: result.machineId });

      // Parse query parameters
      if (queryString) {
        const params = new URLSearchParams(queryString);

        // New format: customerId (c parameter) - preferred
        const customerId = params.get('c');
        if (customerId) {
          result.customerId = customerId;
          // Trace: Customer ID extracted
          onboardingTrace.success('customer_id_extracted', { customerId });

          // Auto-build the reference DB URL from customerId
          result.referenceDbUrl = HashRouter.buildDbUrlFromCustomerId(customerId);
          // Trace: DB URL derived
          onboardingTrace.success('db_url_derived', { dbUrl: result.referenceDbUrl });
          logger.info(`🔗 CustomerId "${customerId}" → DB URL: ${result.referenceDbUrl}`);
        }

        // Legacy format: full ref URL (fallback for backwards compatibility)
        if (!result.referenceDbUrl) {
          const refUrl = params.get('ref');
          if (refUrl) {
            result.referenceDbUrl = decodeURIComponent(refUrl);
            // Trace: DB URL from legacy ref param
            onboardingTrace.success('db_url_derived', { dbUrl: result.referenceDbUrl, source: 'legacy_ref' });
          }
        }
      }

      return result;
    }

    return { type: 'unknown' };
  }

  /**
   * Build the reference database URL from a customer ID
   * Rule: https://gunterstruck.github.io/<customerId>/db-latest.json
   *
   * @param customerId - Customer identifier (e.g., "Kundenkennung_nr1")
   * @returns Full URL to the customer's database
   */
  public static buildDbUrlFromCustomerId(customerId: string): string {
    // Sanitize customerId: remove leading/trailing slashes, encode special chars
    const sanitized = customerId.trim().replace(/^\/+|\/+$/g, '');
    return `${GITHUB_PAGES_BASE_URL}/${encodeURIComponent(sanitized)}/db-latest.json`;
  }

  /**
   * Generate hash URL for a machine
   * @param machineId - Machine identifier
   * @param customerId - Optional customer ID (determines which database to load)
   */
  public static getMachineHash(machineId: string, customerId?: string): string {
    const base = `#/m/${encodeURIComponent(machineId)}`;
    if (customerId) {
      return `${base}?c=${encodeURIComponent(customerId)}`;
    }
    return base;
  }

  /**
   * Generate full URL for NFC tag writing
   * @param machineId - Machine identifier
   * @param customerId - Optional customer ID (determines which database to load)
   */
  public static getFullMachineUrl(machineId: string, customerId?: string): string {
    const baseUrl = window.location.origin + window.location.pathname;
    return `${baseUrl}${this.getMachineHash(machineId, customerId)}`;
  }

  /**
   * Handle hash change event
   */
  private async handleHashChange(): Promise<void> {
    const hash = window.location.hash;

    if (!hash || hash === '#') {
      return;
    }

    // Trace: Deep link detected - start session if not already active
    if (!onboardingTrace.isActive) {
      onboardingTrace.start('deep_link');
    }
    onboardingTrace.step('deep_link_detected', { hash, fullUrl: window.location.href });

    const match = this.parseHash(hash);
    logger.info(`🔗 Hash route: ${hash} → ${match.type}${match.machineId ? ` (${match.machineId})` : ''}${match.referenceDbUrl ? ' (has ref URL)' : ''}`);

    // Notify listeners
    this.onRouteChange?.(match);

    // Handle machine route
    if (match.type === 'machine' && match.machineId) {
      await this.handleMachineRoute(match.machineId, match.referenceDbUrl);
    }
  }

  /**
   * Handle machine route - load machine and download/update reference if needed
   *
   * Version-aware flow:
   * 1. Check if local DB exists (or auto-create if referenceDbUrl provided)
   * 2. If not exists: download initial reference
   * 3. If exists: compare versions (remote > local means update needed)
   * 4. Only update if remote version is HIGHER than local
   *
   * @param machineId - Machine identifier
   * @param referenceDbUrl - Optional reference DB URL from NFC link (enables auto-creation)
   */
  private async handleMachineRoute(machineId: string, referenceDbUrl?: string): Promise<void> {
    try {
      // Trace: Machine lookup
      onboardingTrace.step('machine_lookup', { machineId, hasDbUrl: !!referenceDbUrl });

      // Load or create machine (auto-creates if referenceDbUrl provided)
      const result = await this.loadOrCreateMachine(machineId, referenceDbUrl);

      if (result.error || !result.machine) {
        logger.error(`Failed to load machine ${machineId}:`, result.error);
        // Trace: Machine not found / error
        onboardingTrace.fail('machine_not_found', { machineId, error: result.error });
        onboardingTrace.fail('process_failed', { reason: result.error });
        this.onDownloadError?.(result.error || 'unknown_error');
        return;
      }

      // Trace: Machine found or created
      if (result.created) {
        onboardingTrace.success('machine_created', { machineId, name: result.machine.name });
      } else {
        onboardingTrace.success('machine_found', {
          machineId,
          name: result.machine.name,
          hasLocalDb: !result.needsReferenceDownload,
          localVersion: result.localVersion,
        });
      }

      // Check if reference download or update is needed
      if (result.needsReferenceDownload) {
        logger.info(`📥 Machine ${machineId} needs initial reference download`);
        await this.downloadReference(result.machine);
      } else if (result.needsUpdate) {
        logger.info(`📦 Machine ${machineId} has update available: v${result.localVersion} → v${result.remoteVersion}`);
        await this.downloadReference(result.machine);
      } else {
        logger.info(`✓ Machine ${machineId} is up-to-date (v${result.localVersion || 'unknown'})`);
        // Trace: No download needed
        onboardingTrace.success('process_complete', {
          machineId,
          status: 'up_to_date',
          version: result.localVersion,
        });
      }

      // Trace: Machine selected
      onboardingTrace.success('machine_selected', { machineId, name: result.machine.name });

      // Notify that machine is ready
      this.onMachineReady?.(result.machine);

      // Clear the hash after processing (optional - keeps URL clean)
      // window.history.replaceState(null, '', window.location.pathname);
    } catch (error) {
      logger.error('Error handling machine route:', error);
      // Trace: Process failed
      onboardingTrace.fail('process_failed', {
        machineId,
        error: error instanceof Error ? error.message : 'unknown_error',
      });
      this.onDownloadError?.(error instanceof Error ? error.message : 'unknown_error');
    }
  }

  /**
   * Load existing machine or create from NFC link data
   * Checks for both initial download and version-based updates
   *
   * @param machineId - Machine identifier
   * @param referenceDbUrl - Optional reference DB URL from NFC link (enables auto-creation)
   */
  private async loadOrCreateMachine(machineId: string, referenceDbUrl?: string): Promise<MachineLoadResult> {
    // Try to load existing machine
    let machine = await getMachine(machineId);
    let created = false;

    if (!machine) {
      // Machine not found - check if we can auto-create from NFC link data
      if (referenceDbUrl) {
        // Validate the URL before creating machine
        const validation = ReferenceDbService.validateUrl(referenceDbUrl);
        if (!validation.valid) {
          logger.error(`Invalid reference URL in NFC link: ${validation.error}`);
          return {
            machine: null,
            created: false,
            error: 'invalid_reference_url',
            needsReferenceDownload: false,
          };
        }

        // Auto-create machine with reference URL from NFC link
        logger.info(`🆕 Auto-creating machine ${machineId} from NFC link`);
        machine = {
          id: machineId,
          name: machineId, // Will be updated from reference DB metadata
          createdAt: Date.now(),
          referenceModels: [],
          referenceDbUrl: referenceDbUrl,
        };
        await saveMachine(machine);
        created = true;
      } else {
        // No reference URL provided - cannot auto-create
        // User should contact Servicetechniker
        return {
          machine: null,
          created: false,
          error: 'machine_not_found',
          needsReferenceDownload: false,
        };
      }
    } else if (referenceDbUrl && machine.referenceDbUrl !== referenceDbUrl) {
      // Machine exists but has different URL - update it
      logger.info(`🔄 Updating reference URL for machine ${machineId}`);
      machine.referenceDbUrl = referenceDbUrl;
      await saveMachine(machine);
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
    // Only fetch if machine has a reference URL configured
    if (machine.referenceDbUrl) {
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

    // No reference URL - just return machine
    return {
      machine,
      created,
      needsReferenceDownload: false,
      needsUpdate: false,
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
