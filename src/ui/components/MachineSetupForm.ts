/**
 * ZANOBOT - MACHINE SETUP FORM
 *
 * UI component for Servicetechniker to configure machines with:
 * - Reference DB URL (required)
 * - Location
 * - Notes
 *
 * This form is used in the admin/service view to set up machines
 * that Basisnutzer can then access via NFC tags.
 */

import { t } from '../../i18n/index.js';
import { ReferenceDbService, type FetchValidateResult } from '@data/ReferenceDbService.js';
import { saveMachine, getMachine, saveReferenceDatabase } from '@data/db.js';
import type { Machine, ReferenceDatabase } from '@data/types.js';
import { logger } from '@utils/logger.js';
import { HashRouter } from '../HashRouter.js';

/**
 * Form submission callback
 */
export type OnSubmitCallback = (machine: Machine) => void;

/**
 * Machine Setup Form Component
 */
export class MachineSetupForm {
  private containerId: string;
  private machine: Machine | null = null;
  private onSubmit?: OnSubmitCallback;

  // Form elements
  private form: HTMLFormElement | null = null;
  private referenceDbUrlInput: HTMLInputElement | null = null;
  private locationInput: HTMLInputElement | null = null;
  private notesInput: HTMLTextAreaElement | null = null;
  private submitBtn: HTMLButtonElement | null = null;
  private nfcLinkDisplay: HTMLElement | null = null;
  private copyLinkBtn: HTMLButtonElement | null = null;
  private errorDisplay: HTMLElement | null = null;
  private statusDisplay: HTMLElement | null = null;
  private versionDisplay: HTMLElement | null = null;

  // State
  private isValidating: boolean = false;

  constructor(containerId: string) {
    this.containerId = containerId;
  }

  /**
   * Set callback for form submission
   */
  public setOnSubmit(callback: OnSubmitCallback): void {
    this.onSubmit = callback;
  }

  /**
   * Set the machine to edit
   */
  public setMachine(machine: Machine): void {
    this.machine = machine;
    this.populateForm();
    this.updateNfcLink();
  }

  /**
   * Render the form into the container
   */
  public render(): void {
    const container = document.getElementById(this.containerId);
    if (!container) {
      logger.error(`MachineSetupForm: Container ${this.containerId} not found`);
      return;
    }

    container.innerHTML = this.getFormHtml();
    this.attachEventListeners();
    this.populateForm();
  }

  /**
   * Generate form HTML
   */
  private getFormHtml(): string {
    return `
      <form class="machine-setup-form" id="machine-setup-form">
        <div class="form-section">
          <h4 class="form-section-title">${t('machineSetup.title')}</h4>

          <!-- Reference DB URL (Required) -->
          <div class="form-group required">
            <label for="reference-db-url">
              ${t('machineSetup.referenceDbUrl')}
              <span class="required-badge">${t('machineSetup.referenceDbUrlRequired')}</span>
            </label>
            <input
              type="url"
              id="reference-db-url"
              name="referenceDbUrl"
              class="form-input"
              placeholder="https://username.github.io/datei.json"
              required
            />
            <p class="form-hint">${t('machineSetup.referenceDbUrlHint')}</p>
            <p class="form-error" id="url-error"></p>
            <!-- Validation status display -->
            <div class="form-status" id="validation-status" style="display: none;">
              <span class="status-text"></span>
              <span class="status-spinner"></span>
            </div>
            <!-- Version info display -->
            <div class="form-version-info" id="version-info" style="display: none;">
              <span class="version-badge"></span>
            </div>
          </div>

          <!-- Location (Optional) -->
          <div class="form-group">
            <label for="machine-location">${t('machineSetup.location')}</label>
            <input
              type="text"
              id="machine-location"
              name="location"
              class="form-input"
              placeholder="${t('machineSetup.locationPlaceholder')}"
            />
          </div>

          <!-- Notes (Optional) -->
          <div class="form-group">
            <label for="machine-notes">${t('machineSetup.notes')}</label>
            <textarea
              id="machine-notes"
              name="notes"
              class="form-input form-textarea"
              placeholder="${t('machineSetup.notesPlaceholder')}"
              rows="3"
            ></textarea>
          </div>

          <!-- Submit Button -->
          <button type="submit" class="action-btn" id="setup-submit-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
              <polyline points="17 21 17 13 7 13 7 21"/>
              <polyline points="7 3 7 8 15 8"/>
            </svg>
            <span>${t('buttons.save')}</span>
          </button>
        </div>

        <!-- NFC Link Section (shown after machine is configured) -->
        <div class="form-section nfc-link-section" id="nfc-link-section" style="display: none;">
          <h4 class="form-section-title">${t('machineSetup.nfcMachineLink')}</h4>
          <div class="nfc-link-display" id="nfc-link-display">
            <code id="nfc-link-url"></code>
            <button type="button" class="copy-link-btn" id="copy-link-btn" title="Link kopieren">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
              </svg>
            </button>
          </div>
          <p class="form-hint">${t('nfc.hint')}</p>
        </div>
      </form>
    `;
  }

  /**
   * Attach event listeners to form elements
   */
  private attachEventListeners(): void {
    this.form = document.getElementById('machine-setup-form') as HTMLFormElement;
    this.referenceDbUrlInput = document.getElementById('reference-db-url') as HTMLInputElement;
    this.locationInput = document.getElementById('machine-location') as HTMLInputElement;
    this.notesInput = document.getElementById('machine-notes') as HTMLTextAreaElement;
    this.submitBtn = document.getElementById('setup-submit-btn') as HTMLButtonElement;
    this.nfcLinkDisplay = document.getElementById('nfc-link-section');
    this.copyLinkBtn = document.getElementById('copy-link-btn') as HTMLButtonElement;
    this.errorDisplay = document.getElementById('url-error');
    this.statusDisplay = document.getElementById('validation-status');
    this.versionDisplay = document.getElementById('version-info');

    // Form submission
    this.form?.addEventListener('submit', (e) => this.handleSubmit(e));

    // Real-time URL validation
    this.referenceDbUrlInput?.addEventListener('blur', () => this.validateUrl());
    this.referenceDbUrlInput?.addEventListener('input', () => {
      this.clearError();
      this.clearVersionInfo();
    });

    // Copy link button
    this.copyLinkBtn?.addEventListener('click', () => this.copyNfcLink());
  }

  /**
   * Populate form with current machine data
   */
  private populateForm(): void {
    if (!this.machine) return;

    if (this.referenceDbUrlInput) {
      this.referenceDbUrlInput.value = this.machine.referenceDbUrl || '';
    }

    if (this.locationInput) {
      this.locationInput.value = this.machine.location || '';
    }

    if (this.notesInput) {
      this.notesInput.value = this.machine.notes || '';
    }
  }

  /**
   * Update NFC link display
   * Includes referenceDbUrl in the link for auto-creation on new devices
   */
  private updateNfcLink(): void {
    if (!this.machine || !this.nfcLinkDisplay) return;

    // Include referenceDbUrl in NFC link for auto-creation on new devices
    const fullUrl = HashRouter.getFullMachineUrl(this.machine.id, this.machine.referenceDbUrl);
    const urlDisplay = document.getElementById('nfc-link-url');

    if (urlDisplay) {
      urlDisplay.textContent = fullUrl;
    }

    // Show NFC link section if machine has reference URL
    if (this.machine.referenceDbUrl) {
      this.nfcLinkDisplay.style.display = 'block';
    }
  }

  /**
   * Validate URL field
   */
  private validateUrl(): boolean {
    const url = this.referenceDbUrlInput?.value.trim() || '';

    if (!url) {
      this.showError(t('machineSetup.urlEmpty'));
      return false;
    }

    const validation = ReferenceDbService.validateUrl(url);

    if (!validation.valid) {
      const errorKey = `machineSetup.${this.getErrorKey(validation.error || 'urlInvalid')}`;
      this.showError(t(errorKey));
      return false;
    }

    this.clearError();
    return true;
  }

  /**
   * Map validation error to i18n key
   */
  private getErrorKey(error: string): string {
    const errorMap: Record<string, string> = {
      url_empty: 'urlEmpty',
      url_invalid: 'urlInvalid',
      url_not_https: 'urlNotHttps',
      google_drive_not_direct: 'googleDriveNotDirect',
    };
    return errorMap[error] || 'urlInvalid';
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    if (this.errorDisplay) {
      this.errorDisplay.textContent = message;
      this.errorDisplay.style.display = 'block';
    }

    this.referenceDbUrlInput?.classList.add('input-error');
  }

  /**
   * Clear error message
   */
  private clearError(): void {
    if (this.errorDisplay) {
      this.errorDisplay.textContent = '';
      this.errorDisplay.style.display = 'none';
    }

    this.referenceDbUrlInput?.classList.remove('input-error');
  }

  /**
   * Handle form submission
   * Downloads, validates, and saves the reference database before saving the machine
   */
  private async handleSubmit(e: Event): Promise<void> {
    e.preventDefault();

    if (!this.machine) {
      logger.error('No machine set for form submission');
      return;
    }

    // Prevent double submission
    if (this.isValidating) {
      return;
    }

    // Validate URL format first
    if (!this.validateUrl()) {
      return;
    }

    const url = this.referenceDbUrlInput?.value.trim() || '';

    // Check if URL has changed
    const urlChanged = url !== this.machine.referenceDbUrl;

    // Disable submit button and show loading
    this.isValidating = true;
    if (this.submitBtn) {
      this.submitBtn.disabled = true;
    }

    try {
      // If URL changed or no reference DB loaded yet, validate and download
      if (urlChanged || !this.machine.referenceDbLoaded) {
        this.showStatus(t('machineSetup.statusDownloading'), true);

        // Fetch and validate the reference database
        const result = await ReferenceDbService.fetchAndValidate(url);

        if (!result.success) {
          this.showError(this.getDownloadErrorMessage(result.error || 'unknown'));
          this.hideStatus();
          return;
        }

        this.showStatus(t('machineSetup.statusValidating'), true);

        // Check that we have valid data
        if (!result.rawData) {
          this.showError(t('machineSetup.errorInvalidFormat'));
          this.hideStatus();
          return;
        }

        this.showStatus(t('machineSetup.statusSaving'), true);

        // Save reference database locally
        const refDb: ReferenceDatabase = {
          machineId: this.machine.id,
          version: result.dbMeta?.db_version || '1.0.0',
          downloadedAt: Date.now(),
          sourceUrl: url,
          dbMeta: result.dbMeta,
          data: {
            referenceModels: result.rawData.models.length > 0
              ? result.rawData.models
              : result.rawData.referenceModels,
            machineName: result.rawData.machineName,
            location: result.rawData.location,
            notes: result.rawData.notes,
            config: result.rawData.config,
          },
        };

        await saveReferenceDatabase(refDb);

        // Update machine with form values and reference info
        this.machine.referenceDbUrl = url;
        this.machine.referenceDbVersion = refDb.version;
        this.machine.referenceDbLoaded = true;

        // Show version info
        this.showVersionInfo(refDb.version, result.modelsCount || 0, result.dbMeta?.description);

        this.showStatus(t('machineSetup.statusComplete'), false);

        logger.info(`✅ Reference DB v${refDb.version} validated and saved for machine ${this.machine.id}`);
      } else {
        // URL hasn't changed, just update other fields
        this.machine.referenceDbUrl = url;
      }

      // Update location and notes
      this.machine.location = this.locationInput?.value.trim() || undefined;
      this.machine.notes = this.notesInput?.value.trim() || undefined;

      // Save machine to database
      await saveMachine(this.machine);

      // Update NFC link display
      this.updateNfcLink();

      // Notify callback
      this.onSubmit?.(this.machine);

      // Hide status after success
      setTimeout(() => this.hideStatus(), 2000);

      logger.info(`✅ Machine ${this.machine.id} setup saved`);
    } catch (error) {
      logger.error('Failed to save machine setup:', error);
      this.showError(t('common.error'));
      this.hideStatus();
    } finally {
      this.isValidating = false;
      if (this.submitBtn) {
        this.submitBtn.disabled = false;
      }
    }
  }

  /**
   * Get user-friendly error message for download errors
   */
  private getDownloadErrorMessage(error: string): string {
    const errorMap: Record<string, string> = {
      'url_empty': t('machineSetup.urlEmpty'),
      'url_invalid': t('machineSetup.urlInvalid'),
      'url_not_https': t('machineSetup.urlNotHttps'),
      'google_drive_not_direct': t('machineSetup.googleDriveNotDirect'),
      'download_failed': t('machineSetup.errorDownloadFailed'),
      'invalid_json': t('machineSetup.errorInvalidFormat'),
      'invalid_format': t('machineSetup.errorInvalidFormat'),
      'invalid_data_structure': t('machineSetup.errorInvalidStructure'),
      'no_models_or_config': t('machineSetup.errorNoModels'),
      'invalid_model_format': t('machineSetup.errorInvalidModel'),
    };

    return errorMap[error] || t('machineSetup.errorUnknown');
  }

  /**
   * Show validation status
   */
  private showStatus(message: string, showSpinner: boolean): void {
    if (!this.statusDisplay) return;

    const textEl = this.statusDisplay.querySelector('.status-text');
    const spinnerEl = this.statusDisplay.querySelector('.status-spinner');

    if (textEl) {
      textEl.textContent = message;
    }

    if (spinnerEl) {
      (spinnerEl as HTMLElement).style.display = showSpinner ? 'inline-block' : 'none';
    }

    this.statusDisplay.style.display = 'flex';
  }

  /**
   * Hide validation status
   */
  private hideStatus(): void {
    if (this.statusDisplay) {
      this.statusDisplay.style.display = 'none';
    }
  }

  /**
   * Show version info after successful validation
   */
  private showVersionInfo(version: string, modelsCount: number, description?: string): void {
    if (!this.versionDisplay) return;

    const badgeEl = this.versionDisplay.querySelector('.version-badge');

    if (badgeEl) {
      let text = `✓ ${t('machineSetup.referenceLoaded')} (v${version})`;
      if (modelsCount > 0) {
        text += ` - ${modelsCount} ${t('machineSetup.modelsImported', { count: modelsCount })}`;
      }
      if (description) {
        text += ` - ${description}`;
      }
      badgeEl.textContent = text;
    }

    this.versionDisplay.style.display = 'block';
  }

  /**
   * Clear version info display
   */
  private clearVersionInfo(): void {
    if (this.versionDisplay) {
      this.versionDisplay.style.display = 'none';
    }
  }

  /**
   * Copy NFC link to clipboard
   * Includes referenceDbUrl for auto-creation on new devices
   */
  private async copyNfcLink(): Promise<void> {
    if (!this.machine) return;

    // Include referenceDbUrl in NFC link for auto-creation on new devices
    const fullUrl = HashRouter.getFullMachineUrl(this.machine.id, this.machine.referenceDbUrl);

    try {
      await navigator.clipboard.writeText(fullUrl);

      // Show feedback
      if (this.copyLinkBtn) {
        const originalHtml = this.copyLinkBtn.innerHTML;
        this.copyLinkBtn.innerHTML = `
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--status-healthy)" stroke-width="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        `;

        setTimeout(() => {
          if (this.copyLinkBtn) {
            this.copyLinkBtn.innerHTML = originalHtml;
          }
        }, 2000);
      }

      logger.info(`📋 NFC link copied: ${fullUrl}`);
    } catch (error) {
      logger.error('Failed to copy link:', error);
    }
  }

  /**
   * Clean up form
   */
  public destroy(): void {
    const container = document.getElementById(this.containerId);
    if (container) {
      container.innerHTML = '';
    }

    this.form = null;
    this.referenceDbUrlInput = null;
    this.locationInput = null;
    this.notesInput = null;
    this.submitBtn = null;
    this.nfcLinkDisplay = null;
    this.copyLinkBtn = null;
    this.errorDisplay = null;
  }
}
