/**
 * ZANOBOT - REFERENCE DATABASE SERVICE
 *
 * Handles downloading and managing reference databases for NFC-based machine setup.
 * Enables Servicetechniker to configure machines with pre-trained models,
 * and Basisnutzer to automatically download reference data when scanning NFC tags.
 *
 * Flow:
 * 1. Servicetechniker creates machine with referenceDbUrl (Google Drive link)
 * 2. Servicetechniker programs NFC tag with #/m/<machine_id>
 * 3. Basisnutzer scans NFC tag → PWA opens → downloads reference DB → ready to test
 */

import {
  getMachine,
  saveMachine,
  getReferenceDatabase,
  saveReferenceDatabase,
  hasReferenceDatabase,
} from './db.js';
import type { Machine, ReferenceDatabase, GMIAModel } from './types.js';
import { logger } from '@utils/logger.js';

/**
 * Result of a reference database download operation
 */
export interface DownloadResult {
  success: boolean;
  error?: string;
  version?: string;
  modelsImported?: number;
}

/**
 * Progress callback for download status updates
 */
export type ProgressCallback = (status: string, progress?: number) => void;

/**
 * Reference Database Service
 *
 * Manages downloading, validating, and applying reference databases
 * from Google Drive for NFC-based machine setup.
 */
export class ReferenceDbService {
  /**
   * Check if a machine needs reference database download
   *
   * @param machineId - Machine ID to check
   * @returns True if machine has referenceDbUrl but no local reference data
   */
  public static async needsDownload(machineId: string): Promise<boolean> {
    const machine = await getMachine(machineId);

    if (!machine) {
      return false;
    }

    // No reference URL configured - nothing to download
    if (!machine.referenceDbUrl) {
      return false;
    }

    // Already has reference models from manual training - no download needed
    if (machine.referenceModels && machine.referenceModels.length > 0) {
      return false;
    }

    // Check if reference DB already downloaded
    const hasLocalDb = await hasReferenceDatabase(machineId);

    return !hasLocalDb;
  }

  /**
   * Download and apply reference database for a machine
   *
   * @param machineId - Machine ID
   * @param onProgress - Progress callback for UI updates
   * @returns Download result
   */
  public static async downloadAndApply(
    machineId: string,
    onProgress?: ProgressCallback
  ): Promise<DownloadResult> {
    try {
      // Get machine configuration
      const machine = await getMachine(machineId);

      if (!machine) {
        return { success: false, error: 'machine_not_found' };
      }

      if (!machine.referenceDbUrl) {
        return { success: false, error: 'no_reference_url' };
      }

      onProgress?.('downloading', 10);

      // Download the reference database
      const response = await this.fetchWithRetry(machine.referenceDbUrl);

      if (!response.ok) {
        logger.error(`Failed to download reference DB: HTTP ${response.status}`);
        return { success: false, error: 'download_failed' };
      }

      onProgress?.('parsing', 40);

      // Parse the JSON response
      let refData: ReferenceDatabase['data'];
      try {
        const rawData = await response.json();

        // Handle both direct format and wrapped format
        refData = rawData.data ?? rawData;
      } catch (e) {
        logger.error('Failed to parse reference DB JSON:', e);
        return { success: false, error: 'invalid_format' };
      }

      onProgress?.('validating', 60);

      // Validate the data structure
      const validation = this.validateReferenceData(refData);
      if (!validation.valid) {
        logger.error('Reference DB validation failed:', validation.error);
        return { success: false, error: validation.error };
      }

      onProgress?.('saving', 80);

      // Save the reference database
      const refDb: ReferenceDatabase = {
        machineId,
        version: refData.config?.version as string || '1.0.0',
        downloadedAt: Date.now(),
        sourceUrl: machine.referenceDbUrl,
        data: refData,
      };

      await saveReferenceDatabase(refDb);

      // Apply reference models to machine if available
      let modelsImported = 0;
      if (refData.referenceModels && refData.referenceModels.length > 0) {
        modelsImported = await this.applyModelsToMachine(machine, refData.referenceModels);
      }

      // Update machine metadata if provided
      if (refData.machineName || refData.location || refData.notes) {
        await this.updateMachineMetadata(machine, refData);
      }

      // Mark machine as having reference DB loaded
      machine.referenceDbLoaded = true;
      machine.referenceDbVersion = refDb.version;
      await saveMachine(machine);

      onProgress?.('complete', 100);

      logger.info(`✅ Reference DB loaded for machine ${machineId}: ${modelsImported} models imported`);

      return {
        success: true,
        version: refDb.version,
        modelsImported,
      };
    } catch (error) {
      logger.error('Reference DB download error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'unknown_error',
      };
    }
  }

  /**
   * Check if a newer version of the reference database is available
   *
   * @param machineId - Machine ID
   * @returns True if update available, false otherwise
   */
  public static async checkForUpdate(machineId: string): Promise<boolean> {
    const machine = await getMachine(machineId);
    const localDb = await getReferenceDatabase(machineId);

    if (!machine?.referenceDbUrl || !localDb) {
      return false;
    }

    try {
      // Fetch just the headers or a small portion to check version
      const response = await fetch(machine.referenceDbUrl, { method: 'GET' });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const remoteVersion = data.data?.config?.version || data.config?.version || '1.0.0';

      return remoteVersion !== localDb.version;
    } catch {
      return false;
    }
  }

  /**
   * Validate URL format for Google Drive direct download
   *
   * @param url - URL to validate
   * @returns Validation result
   */
  public static validateUrl(url: string): { valid: boolean; error?: string } {
    if (!url || url.trim() === '') {
      return { valid: false, error: 'url_empty' };
    }

    try {
      const parsed = new URL(url);

      // Must be HTTPS
      if (parsed.protocol !== 'https:') {
        return { valid: false, error: 'url_not_https' };
      }

      // Validate Google Drive format (recommended but not required)
      const isGoogleDrive = parsed.hostname === 'drive.google.com';

      if (isGoogleDrive) {
        // Validate direct download format
        if (!url.includes('export=download') && !url.includes('/uc?')) {
          return { valid: false, error: 'google_drive_not_direct' };
        }
      }

      return { valid: true };
    } catch {
      return { valid: false, error: 'url_invalid' };
    }
  }

  /**
   * Fetch with retry logic for network resilience
   */
  private static async fetchWithRetry(
    url: string,
    maxRetries: number = 3
  ): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'GET',
          // Don't follow redirects automatically for Google Drive
          redirect: 'follow',
        });

        // Handle Google Drive virus scan warning page
        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('text/html')) {
            // Likely a Google Drive warning page, try with confirm parameter
            const confirmUrl = this.addGoogleDriveConfirm(url);
            if (confirmUrl !== url) {
              return await fetch(confirmUrl);
            }
          }
        }

        return response;
      } catch (error) {
        lastError = error as Error;
        logger.warn(`Fetch attempt ${attempt + 1} failed:`, error);

        // Wait before retry (exponential backoff)
        if (attempt < maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
        }
      }
    }

    throw lastError || new Error('Fetch failed after retries');
  }

  /**
   * Add Google Drive confirm parameter for large files
   */
  private static addGoogleDriveConfirm(url: string): string {
    const parsed = new URL(url);

    if (parsed.hostname === 'drive.google.com' && !parsed.searchParams.has('confirm')) {
      parsed.searchParams.set('confirm', 't');
      return parsed.toString();
    }

    return url;
  }

  /**
   * Validate reference data structure
   */
  private static validateReferenceData(
    data: unknown
  ): { valid: boolean; error?: string } {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'invalid_data_structure' };
    }

    // Must have at least one of: referenceModels, config
    const hasModels = 'referenceModels' in data && Array.isArray((data as Record<string, unknown>).referenceModels);
    const hasConfig = 'config' in data && typeof (data as Record<string, unknown>).config === 'object';

    if (!hasModels && !hasConfig) {
      return { valid: false, error: 'no_models_or_config' };
    }

    // Validate models if present
    if (hasModels) {
      const models = (data as { referenceModels: unknown[] }).referenceModels;

      for (const model of models) {
        if (!this.isValidModel(model)) {
          return { valid: false, error: 'invalid_model_format' };
        }
      }
    }

    return { valid: true };
  }

  /**
   * Check if an object is a valid GMIA model
   */
  private static isValidModel(model: unknown): boolean {
    if (!model || typeof model !== 'object') {
      return false;
    }

    const m = model as Record<string, unknown>;

    // Required fields for a GMIA model
    const requiredFields = ['label', 'type', 'weightVector'];

    for (const field of requiredFields) {
      if (!(field in m)) {
        return false;
      }
    }

    // Validate type
    if (m.type !== 'healthy' && m.type !== 'faulty') {
      return false;
    }

    // Validate weightVector (can be array or Float64Array serialized as array)
    if (!Array.isArray(m.weightVector) && !(m.weightVector instanceof Float64Array)) {
      return false;
    }

    return true;
  }

  /**
   * Apply reference models to a machine
   */
  private static async applyModelsToMachine(
    machine: Machine,
    models: GMIAModel[]
  ): Promise<number> {
    // Convert serialized weight vectors back to Float64Array
    const processedModels: GMIAModel[] = models.map(model => ({
      ...model,
      machineId: machine.id, // Ensure machineId matches
      weightVector: Array.isArray(model.weightVector)
        ? new Float64Array(model.weightVector)
        : model.weightVector,
    }));

    // Replace existing models with imported ones
    machine.referenceModels = processedModels;
    await saveMachine(machine);

    return processedModels.length;
  }

  /**
   * Update machine metadata from reference data
   */
  private static async updateMachineMetadata(
    machine: Machine,
    refData: ReferenceDatabase['data']
  ): Promise<void> {
    let updated = false;

    // Only update if local data is missing
    if (!machine.name && refData.machineName) {
      machine.name = refData.machineName;
      updated = true;
    }

    if (!machine.location && refData.location) {
      machine.location = refData.location;
      updated = true;
    }

    if (!machine.notes && refData.notes) {
      machine.notes = refData.notes;
      updated = true;
    }

    if (updated) {
      await saveMachine(machine);
    }
  }
}
