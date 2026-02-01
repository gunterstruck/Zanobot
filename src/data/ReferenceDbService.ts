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
import type { Machine, ReferenceDatabase, GMIAModel, ReferenceDbFile, ReferenceDbMeta } from './types.js';
import { logger } from '@utils/logger.js';

/**
 * Result of a reference database download operation
 */
export interface DownloadResult {
  success: boolean;
  error?: string;
  version?: string;
  modelsImported?: number;
  dbMeta?: ReferenceDbMeta;
}

/**
 * Result of fetching and validating a reference database
 * Used by MachineSetupForm to validate before saving
 */
export interface FetchValidateResult {
  success: boolean;
  error?: string;
  dbMeta?: ReferenceDbMeta;
  modelsCount?: number;
  rawData?: ReferenceDbFile;
}

/**
 * Result of version check
 */
export interface VersionCheckResult {
  needsUpdate: boolean;
  localVersion?: string;
  remoteVersion?: string;
  reason?: 'no_local_db' | 'version_higher' | 'version_same_or_lower' | 'error';
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
 *
 * Key principles:
 * - Official reference databases are versioned (db_meta.db_version)
 * - Local copies are only updated when remote version > local version
 * - User-added local references are preserved during updates
 * - No automatic overwrites without explicit version upgrade
 */
export class ReferenceDbService {
  /**
   * Compare two semantic versions
   *
   * @param versionA - First version (e.g., "1.0.0")
   * @param versionB - Second version (e.g., "1.2.0")
   * @returns -1 if A < B, 0 if A == B, 1 if A > B
   */
  public static compareVersions(versionA: string, versionB: string): number {
    // Default to "0.0.0" for missing versions
    const a = (versionA || '0.0.0').split('.').map(n => parseInt(n, 10) || 0);
    const b = (versionB || '0.0.0').split('.').map(n => parseInt(n, 10) || 0);

    // Ensure both arrays have 3 elements
    while (a.length < 3) a.push(0);
    while (b.length < 3) b.push(0);

    for (let i = 0; i < 3; i++) {
      if (a[i] < b[i]) return -1;
      if (a[i] > b[i]) return 1;
    }

    return 0;
  }

  /**
   * Check if a machine needs reference database download
   * (Initial download - no local DB exists)
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

    // Check if reference DB already downloaded locally
    const hasLocalDb = await hasReferenceDatabase(machineId);

    return !hasLocalDb;
  }

  /**
   * Check if machine needs a reference database update
   * Only returns true if remote version > local version
   *
   * @param machineId - Machine ID to check
   * @returns VersionCheckResult with details about the update status
   */
  public static async needsUpdate(machineId: string): Promise<VersionCheckResult> {
    const machine = await getMachine(machineId);

    if (!machine?.referenceDbUrl) {
      return { needsUpdate: false, reason: 'error' };
    }

    const localDb = await getReferenceDatabase(machineId);

    // No local DB exists - needs initial download
    if (!localDb) {
      return { needsUpdate: true, reason: 'no_local_db' };
    }

    try {
      // Fetch remote database to check version
      const response = await this.fetchWithRetry(machine.referenceDbUrl);

      if (!response.ok) {
        logger.warn(`Failed to check remote version: HTTP ${response.status}`);
        return { needsUpdate: false, localVersion: localDb.version, reason: 'error' };
      }

      const rawData = await response.json();
      const remoteVersion = this.extractVersion(rawData);
      const localVersion = localDb.version;

      // Compare versions - only update if remote is HIGHER
      const comparison = this.compareVersions(remoteVersion, localVersion);

      if (comparison > 0) {
        logger.info(`📦 Update available: ${localVersion} → ${remoteVersion}`);
        return {
          needsUpdate: true,
          localVersion,
          remoteVersion,
          reason: 'version_higher',
        };
      }

      logger.info(`✓ Local DB is up-to-date (v${localVersion})`);
      return {
        needsUpdate: false,
        localVersion,
        remoteVersion,
        reason: 'version_same_or_lower',
      };
    } catch (error) {
      logger.error('Error checking for updates:', error);
      return { needsUpdate: false, localVersion: localDb.version, reason: 'error' };
    }
  }

  /**
   * Extract version from reference database file
   * Supports both new db_meta format and legacy config.version
   */
  private static extractVersion(data: unknown): string {
    if (!data || typeof data !== 'object') {
      return '1.0.0';
    }

    const d = data as Record<string, unknown>;

    // New format: db_meta.db_version
    if (d.db_meta && typeof d.db_meta === 'object') {
      const meta = d.db_meta as Record<string, unknown>;
      if (typeof meta.db_version === 'string') {
        return meta.db_version;
      }
    }

    // Legacy format: data.config.version or config.version
    const dataObj = d.data as Record<string, unknown> | undefined;
    if (dataObj?.config && typeof dataObj.config === 'object') {
      const config = dataObj.config as Record<string, unknown>;
      if (typeof config.version === 'string') {
        return config.version;
      }
    }

    if (d.config && typeof d.config === 'object') {
      const config = d.config as Record<string, unknown>;
      if (typeof config.version === 'string') {
        return config.version;
      }
    }

    return '1.0.0';
  }

  /**
   * Fetch and validate a reference database without saving
   * Used by MachineSetupForm to validate before saving machine config
   *
   * @param url - URL to fetch the reference database from
   * @returns Validation result with metadata
   */
  public static async fetchAndValidate(url: string): Promise<FetchValidateResult> {
    try {
      // Validate URL first
      const urlValidation = this.validateUrl(url);
      if (!urlValidation.valid) {
        return { success: false, error: urlValidation.error };
      }

      // Fetch the database
      const response = await this.fetchWithRetry(url);

      if (!response.ok) {
        return { success: false, error: 'download_failed' };
      }

      // Parse JSON
      let rawData: unknown;
      try {
        rawData = await response.json();
      } catch {
        return { success: false, error: 'invalid_json' };
      }

      // Validate structure and extract metadata
      const normalizedData = this.normalizeReferenceData(rawData);

      if (!normalizedData) {
        return { success: false, error: 'invalid_format' };
      }

      // Extract db_meta
      const dbMeta = this.extractDbMeta(rawData);
      const models = normalizedData.models || normalizedData.referenceModels || [];

      // Validate models if present
      if (models.length > 0) {
        for (const model of models) {
          if (!this.isValidModel(model)) {
            return { success: false, error: 'invalid_model_format' };
          }
        }
      }

      return {
        success: true,
        dbMeta,
        modelsCount: models.length,
        rawData: normalizedData,
      };
    } catch (error) {
      logger.error('fetchAndValidate error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'unknown_error',
      };
    }
  }

  /**
   * Extract db_meta from raw data
   */
  private static extractDbMeta(data: unknown): ReferenceDbMeta | undefined {
    if (!data || typeof data !== 'object') {
      return undefined;
    }

    const d = data as Record<string, unknown>;

    if (d.db_meta && typeof d.db_meta === 'object') {
      const meta = d.db_meta as Record<string, unknown>;
      return {
        db_version: (meta.db_version as string) || '1.0.0',
        created_by: (meta.created_by as string) || 'unknown',
        created_at: (meta.created_at as string) || new Date().toISOString().split('T')[0],
        description: meta.description as string | undefined,
      };
    }

    // Create synthetic meta from legacy format
    return {
      db_version: this.extractVersion(data),
      created_by: 'legacy',
      created_at: new Date().toISOString().split('T')[0],
    };
  }

  /**
   * Normalize reference data to standard format
   * Handles both new db_meta format and legacy formats
   */
  private static normalizeReferenceData(data: unknown): ReferenceDbFile | null {
    if (!data || typeof data !== 'object') {
      return null;
    }

    const d = data as Record<string, unknown>;

    // New format with db_meta
    if (d.db_meta && typeof d.db_meta === 'object') {
      return {
        db_meta: d.db_meta as ReferenceDbMeta,
        models: (d.models as GMIAModel[]) || [],
        references: d.references as unknown[] | undefined,
        // Also include any legacy fields if present
        referenceModels: d.referenceModels as GMIAModel[] | undefined,
        machineName: d.machineName as string | undefined,
        location: d.location as string | undefined,
        notes: d.notes as string | undefined,
        config: d.config as Record<string, unknown> | undefined,
      };
    }

    // Legacy format with 'data' wrapper
    if (d.data && typeof d.data === 'object') {
      const inner = d.data as Record<string, unknown>;
      return {
        db_meta: {
          db_version: this.extractVersion(d),
          created_by: 'legacy',
          created_at: new Date().toISOString().split('T')[0],
        },
        models: (inner.referenceModels as GMIAModel[]) || [],
        referenceModels: inner.referenceModels as GMIAModel[] | undefined,
        machineName: inner.machineName as string | undefined,
        location: inner.location as string | undefined,
        notes: inner.notes as string | undefined,
        config: inner.config as Record<string, unknown> | undefined,
      };
    }

    // Direct legacy format
    if (d.referenceModels || d.config) {
      return {
        db_meta: {
          db_version: this.extractVersion(d),
          created_by: 'legacy',
          created_at: new Date().toISOString().split('T')[0],
        },
        models: (d.referenceModels as GMIAModel[]) || [],
        referenceModels: d.referenceModels as GMIAModel[] | undefined,
        machineName: d.machineName as string | undefined,
        location: d.location as string | undefined,
        notes: d.notes as string | undefined,
        config: d.config as Record<string, unknown> | undefined,
      };
    }

    return null;
  }

  /**
   * Download and apply reference database for a machine
   * Respects versioning: only updates if remote version > local version
   * Preserves locally added references during updates
   *
   * @param machineId - Machine ID
   * @param onProgress - Progress callback for UI updates
   * @param forceUpdate - Skip version check (used for initial setup)
   * @returns Download result
   */
  public static async downloadAndApply(
    machineId: string,
    onProgress?: ProgressCallback,
    forceUpdate: boolean = false
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

      // Get existing local database to preserve local references
      const existingLocalDb = await getReferenceDatabase(machineId);

      onProgress?.('downloading', 10);

      // Download the reference database
      const response = await this.fetchWithRetry(machine.referenceDbUrl);

      if (!response.ok) {
        logger.error(`Failed to download reference DB: HTTP ${response.status}`);
        return { success: false, error: 'download_failed' };
      }

      onProgress?.('parsing', 40);

      // Parse the JSON response
      let rawData: unknown;
      try {
        rawData = await response.json();
      } catch (e) {
        logger.error('Failed to parse reference DB JSON:', e);
        return { success: false, error: 'invalid_format' };
      }

      // Normalize to new format
      const normalizedData = this.normalizeReferenceData(rawData);

      if (!normalizedData) {
        return { success: false, error: 'invalid_format' };
      }

      const dbMeta = this.extractDbMeta(rawData);
      const remoteVersion = dbMeta?.db_version || '1.0.0';

      // Check version if not forcing update
      if (!forceUpdate && existingLocalDb) {
        const comparison = this.compareVersions(remoteVersion, existingLocalDb.version);

        if (comparison <= 0) {
          logger.info(`⏭️ Skipping download: local version (${existingLocalDb.version}) >= remote (${remoteVersion})`);
          return {
            success: true,
            version: existingLocalDb.version,
            modelsImported: 0,
            dbMeta: existingLocalDb.dbMeta,
          };
        }

        logger.info(`📦 Updating from v${existingLocalDb.version} to v${remoteVersion}`);
      }

      onProgress?.('validating', 60);

      // Get models from new format
      const models = normalizedData.models.length > 0
        ? normalizedData.models
        : normalizedData.referenceModels || [];

      // Validate models if present
      if (models.length > 0) {
        for (const model of models) {
          if (!this.isValidModel(model)) {
            logger.error('Invalid model format in reference DB');
            return { success: false, error: 'invalid_model_format' };
          }
        }
      }

      onProgress?.('saving', 80);

      // Build reference data for storage
      const refData: ReferenceDatabase['data'] = {
        referenceModels: models,
        machineName: normalizedData.machineName,
        location: normalizedData.location,
        notes: normalizedData.notes,
        config: normalizedData.config,
      };

      // Save the reference database, preserving local models
      const refDb: ReferenceDatabase = {
        machineId,
        version: remoteVersion,
        downloadedAt: Date.now(),
        sourceUrl: machine.referenceDbUrl,
        dbMeta,
        data: refData,
        // Preserve locally added models from previous database
        localModels: existingLocalDb?.localModels,
        localModelsUpdatedAt: existingLocalDb?.localModelsUpdatedAt,
      };

      await saveReferenceDatabase(refDb);

      // Apply reference models to machine if available
      let modelsImported = 0;
      if (models.length > 0) {
        modelsImported = await this.applyModelsToMachine(machine, models);
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

      logger.info(`✅ Reference DB loaded for machine ${machineId}: v${remoteVersion}, ${modelsImported} models imported`);

      return {
        success: true,
        version: refDb.version,
        modelsImported,
        dbMeta,
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
   * Add a locally trained model to the reference database
   * These are preserved during official DB updates
   *
   * @param machineId - Machine ID
   * @param model - Model to add
   */
  public static async addLocalModel(machineId: string, model: GMIAModel): Promise<boolean> {
    try {
      const refDb = await getReferenceDatabase(machineId);

      if (!refDb) {
        logger.warn(`Cannot add local model: no reference DB for machine ${machineId}`);
        return false;
      }

      // Initialize local models array if needed
      if (!refDb.localModels) {
        refDb.localModels = [];
      }

      // Add the model with machineId
      refDb.localModels.push({
        ...model,
        machineId,
      });

      refDb.localModelsUpdatedAt = Date.now();

      await saveReferenceDatabase(refDb);

      logger.info(`✅ Added local model "${model.label}" to reference DB`);
      return true;
    } catch (error) {
      logger.error('Failed to add local model:', error);
      return false;
    }
  }

  /**
   * Export the local reference database as a file
   * Creates a file in the new db_meta format that can be uploaded to Google Drive
   *
   * @param machineId - Machine ID
   * @returns Blob containing the exported JSON, or null on error
   */
  public static async exportDatabase(machineId: string): Promise<{
    blob: Blob;
    filename: string;
    version: string;
  } | null> {
    try {
      const machine = await getMachine(machineId);
      const refDb = await getReferenceDatabase(machineId);

      if (!machine || !refDb) {
        logger.error('Cannot export: machine or reference DB not found');
        return null;
      }

      // Combine official models with local models
      const allModels = [
        ...(refDb.data.referenceModels || []),
        ...(refDb.localModels || []),
      ];

      // Serialize models (convert Float64Array to regular arrays)
      const serializedModels = allModels.map(model => ({
        ...model,
        weightVector: Array.from(model.weightVector),
      }));

      // Increment patch version for export
      const currentVersion = refDb.version || '1.0.0';
      const versionParts = currentVersion.split('.').map(n => parseInt(n, 10) || 0);
      while (versionParts.length < 3) versionParts.push(0);
      versionParts[2]++; // Increment patch version
      const newVersion = versionParts.join('.');

      // Create export data in new format
      // Note: models array contains serialized weightVector (number[] instead of Float64Array)
      // This is intentional for JSON serialization - it will be converted back when imported
      const exportData = {
        db_meta: {
          db_version: newVersion,
          created_by: 'user-export',
          created_at: new Date().toISOString().split('T')[0],
          description: refDb.dbMeta?.description
            ? `${refDb.dbMeta.description} (+ local references)`
            : `Export from ${machine.name || machine.id}`,
        },
        models: serializedModels,
        // Include machine metadata
        machineName: machine.name,
        location: machine.location,
        notes: machine.notes,
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });

      // Generate filename
      const safeName = (machine.name || machine.id)
        .replace(/[^a-zA-Z0-9-_]/g, '_')
        .substring(0, 50);
      const filename = `reference-db_${safeName}_v${newVersion}.json`;

      logger.info(`📤 Exported reference DB: ${filename} (${allModels.length} models)`);

      return { blob, filename, version: newVersion };
    } catch (error) {
      logger.error('Export failed:', error);
      return null;
    }
  }

  /**
   * Trigger download of exported database
   * Creates a download link and clicks it
   *
   * @param machineId - Machine ID to export
   */
  public static async downloadExport(machineId: string): Promise<boolean> {
    const exportResult = await this.exportDatabase(machineId);

    if (!exportResult) {
      return false;
    }

    // Create download link
    const url = URL.createObjectURL(exportResult.blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = exportResult.filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    return true;
  }

  /**
   * Share exported database using Web Share API (if available)
   *
   * @param machineId - Machine ID to export
   * @returns True if shared successfully, false otherwise
   */
  public static async shareExport(machineId: string): Promise<boolean> {
    const exportResult = await this.exportDatabase(machineId);

    if (!exportResult) {
      return false;
    }

    // Check if Web Share API is available
    if (!navigator.share || !navigator.canShare) {
      // Fall back to download
      return this.downloadExport(machineId);
    }

    try {
      const file = new File([exportResult.blob], exportResult.filename, {
        type: 'application/json',
      });

      // Check if file sharing is supported
      if (!navigator.canShare({ files: [file] })) {
        return this.downloadExport(machineId);
      }

      await navigator.share({
        files: [file],
        title: `Reference Database v${exportResult.version}`,
      });

      return true;
    } catch (error) {
      // User cancelled or share failed
      if ((error as Error).name !== 'AbortError') {
        logger.error('Share failed:', error);
      }
      return false;
    }
  }

  /**
   * Check if a newer version of the reference database is available
   * (Legacy method - delegates to needsUpdate)
   *
   * @param machineId - Machine ID
   * @returns True if update available (remote > local), false otherwise
   */
  public static async checkForUpdate(machineId: string): Promise<boolean> {
    const result = await this.needsUpdate(machineId);
    return result.needsUpdate && result.reason === 'version_higher';
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
   * Supports both new db_meta format and legacy formats
   */
  private static validateReferenceData(
    data: unknown
  ): { valid: boolean; error?: string } {
    if (!data || typeof data !== 'object') {
      return { valid: false, error: 'invalid_data_structure' };
    }

    const d = data as Record<string, unknown>;

    // New format: must have db_meta with db_version
    const hasDbMeta = d.db_meta && typeof d.db_meta === 'object';
    const hasModels = 'models' in d && Array.isArray(d.models);

    // Legacy format checks
    const hasLegacyModels = 'referenceModels' in d && Array.isArray(d.referenceModels);
    const hasConfig = 'config' in d && typeof d.config === 'object';

    // Valid if has new format OR legacy format
    if (!hasDbMeta && !hasModels && !hasLegacyModels && !hasConfig) {
      return { valid: false, error: 'no_models_or_config' };
    }

    // Validate models if present (new format)
    if (hasModels) {
      const models = d.models as unknown[];

      for (const model of models) {
        if (!this.isValidModel(model)) {
          return { valid: false, error: 'invalid_model_format' };
        }
      }
    }

    // Validate models if present (legacy format)
    if (hasLegacyModels) {
      const models = d.referenceModels as unknown[];

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
