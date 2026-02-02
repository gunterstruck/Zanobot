/**
 * ZANOBOT - PHASE 1: IDENTIFY
 *
 * Entry point of the app flow.
 * User identifies a machine via:
 * - QR/Barcode scan (with integrated camera scanner)
 * - Manual entry
 */

import { saveMachine, getMachine, getAllMachines, getLatestDiagnosis, getAllDiagnoses } from '@data/db.js';
import { notify } from '@utils/notifications.js';
import type { Machine, DiagnosisResult } from '@data/types.js';
import { Html5Qrcode } from 'html5-qrcode';
import { logger } from '@utils/logger.js';
import { t } from '../../i18n/index.js';
import {
  HardwareCheck,
  type AudioQualityReport,
  type AudioDeviceInfo,
} from '@core/audio/HardwareCheck.js';
import { getMicrophones, getRawAudioStream, AUDIO_CONSTRAINTS } from '@core/audio/audioHelper.js';
import { HashRouter } from '../HashRouter.js';
import { ReferenceDbService } from '@data/ReferenceDbService.js';
import { ReferenceLoadingOverlay } from '../components/ReferenceLoadingOverlay.js';

type NDEFRecordInit = {
  recordType: 'url';
  data: string;
};

type NDEFMessageInit = {
  records: NDEFRecordInit[];
};

type NDEFReaderConstructor = new () => {
  write: (message: NDEFMessageInit) => Promise<void>;
};

export class IdentifyPhase {
  private onMachineSelected: (machine: Machine) => void;
  private html5QrCode: Html5Qrcode | null = null;
  private scannerModal: HTMLElement | null = null;
  private isScanning: boolean = false;
  private currentMachine: Machine | null = null;

  // Hardware Intelligence
  private currentAudioStream: MediaStream | null = null;
  private selectedDeviceId: string | undefined = undefined;
  private audioQualityReport: AudioQualityReport | null = null;

  // NFC Writer UI
  private nfcModal: HTMLElement | null = null;
  private nfcStatus: HTMLElement | null = null;
  private nfcWriteBtn: HTMLButtonElement | null = null;
  private nfcGenericOption: HTMLInputElement | null = null;
  private nfcSpecificOption: HTMLInputElement | null = null;
  private nfcSpecificDetail: HTMLElement | null = null;
  private nfcSupportDetails: HTMLElement | null = null;
  private deepLinkOverlay: HTMLElement | null = null;
  private nfcDiagnosisModal: HTMLElement | null = null;
  private nfcDiagnosisConfirmBtn: HTMLButtonElement | null = null;
  private nfcDiagnosisCancelBtn: HTMLButtonElement | null = null;
  // NFC customerId field for Variante B
  private nfcCustomerIdInput: HTMLInputElement | null = null;
  private nfcDbUrlPreview: HTMLElement | null = null;

  constructor(onMachineSelected: (machine: Machine) => void) {
    this.onMachineSelected = onMachineSelected;
  }

  /**
   * Initialize the identify phase UI
   */
  public init(): void {
    // Scan button
    const scanBtn = document.getElementById('scan-btn');
    if (scanBtn) {
      scanBtn.addEventListener('click', () => this.handleScan());
    }

    // Create machine button
    const createBtn = document.getElementById('create-machine-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.handleCreateMachine());
    }

    // Scanner modal elements
    this.scannerModal = document.getElementById('scanner-modal');
    const closeScannerBtn = document.getElementById('close-scanner-modal');
    const manualInputBtn = document.getElementById('manual-input-btn');
    const manualInputConfirmBtn = document.getElementById('manual-input-confirm');
    const manualInputCancelBtn = document.getElementById('manual-input-cancel');
    const manualInputCloseBtn = document.getElementById('close-manual-input-modal');
    const manualInputModal = document.getElementById('manual-input-modal');

    if (closeScannerBtn) {
      closeScannerBtn.addEventListener('click', () => this.closeScanner());
    }

    if (manualInputBtn) {
      manualInputBtn.addEventListener('click', () => this.handleManualInput());
    }

    if (manualInputConfirmBtn) {
      manualInputConfirmBtn.addEventListener('click', () => this.submitManualInput());
    }

    if (manualInputCancelBtn) {
      manualInputCancelBtn.addEventListener('click', () => this.closeManualInputModal());
    }

    if (manualInputCloseBtn) {
      manualInputCloseBtn.addEventListener('click', () => this.closeManualInputModal());
    }

    if (manualInputModal) {
      manualInputModal.addEventListener('click', (e) => {
        if (e.target === manualInputModal) {
          this.closeManualInputModal();
        }
      });
    }

    // Close modal when clicking outside
    if (this.scannerModal) {
      this.scannerModal.addEventListener('click', (e) => {
        if (e.target === this.scannerModal) {
          this.closeScanner();
        }
      });
    }

    // Hardware Intelligence: Change Microphone Button
    const changeMicBtn = document.getElementById('change-microphone-btn');
    if (changeMicBtn) {
      changeMicBtn.addEventListener('click', () => this.showMicrophoneSelection());
    }

    // Initialize hardware check
    this.initializeHardwareCheck();

    // Load and render machine history for quick select
    this.loadMachineHistory();

    // Load and render machine overview (all machines with status)
    this.loadMachineOverview();

    // Load and render diagnosis history
    this.loadDiagnosisHistory();

    // "Neue Maschine" button handler
    const addNewMachineBtn = document.getElementById('add-new-machine-btn');
    if (addNewMachineBtn) {
      addNewMachineBtn.addEventListener('click', () => this.handleAddNewMachine());
    }

    // NFC Writer integration
    this.initNfcWriter();

    // NFC diagnosis prompt modal
    this.initNfcDiagnosisPrompt();

    // Deep link handling
    void this.handleDeepLink();
  }

  /**
   * Handle QR/Barcode scan
   */
  private async handleScan(): Promise<void> {
    try {
      this.openScannerModal();
      await this.startScanner();
    } catch (error) {
      logger.error('Scan error:', error);
      this.showScannerError(t('identify.errors.scannerStart'));
    }
  }

  /**
   * Open scanner modal
   */
  private openScannerModal(): void {
    if (this.scannerModal) {
      this.scannerModal.style.display = 'flex';

      // Hide error and success messages
      const errorDiv = document.getElementById('scanner-error');
      const successDiv = document.getElementById('scanner-success');
      const scannerContainer = document.getElementById('scanner-container');

      if (errorDiv) errorDiv.style.display = 'none';
      if (successDiv) successDiv.style.display = 'none';
      if (scannerContainer) scannerContainer.style.display = 'block';
    }
  }

  /**
   * Start the QR/Barcode scanner
   */
  private async startScanner(): Promise<void> {
    if (this.isScanning) return;

    try {
      this.isScanning = true;
      this.html5QrCode = new Html5Qrcode('qr-reader');

      // Configuration for scanning QR codes and barcodes
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        formatsToSupport: [
          0, // QR_CODE
          8, // CODE_128
          13, // EAN_13
          14, // EAN_8
        ],
      };

      await this.html5QrCode.start(
        { facingMode: 'environment' }, // Use back camera
        config,
        this.onScanSuccess.bind(this),
        this.onScanFailure.bind(this)
      );
    } catch (error) {
      logger.error('Failed to start scanner:', error);
      this.isScanning = false;
      // Clean up scanner instance on error to prevent stale state
      this.html5QrCode = null;

      // OPTIMIZATION: Type-safe error handling with single type guard check
      // Avoid redundant instanceof checks by storing the result
      const isErrorObject = error instanceof Error;
      const errorName = isErrorObject ? error.name : '';
      const errorMessage = isErrorObject ? error.message : String(error);

      // Check if it's a permission error
      if (errorName === 'NotAllowedError' || errorMessage.includes('Permission')) {
        this.showScannerError(
          t('identify.errors.cameraAccessDenied'),
          t('identify.errors.cameraAccessHint')
        );
      } else if (errorName === 'NotFoundError') {
        this.showScannerError(
          t('identify.errors.noCameraFound'),
          t('identify.errors.noCameraHint')
        );
      } else {
        this.showScannerError(
          t('identify.errors.scannerStart'),
          t('identify.errors.manualEntryLoad')
        );
      }
    }
  }

  /**
   * Handle successful scan
   */
  private async onScanSuccess(decodedText: string, decodedResult: unknown): Promise<void> {
    logger.info('Code detected:', decodedText);

    // Stop scanner immediately
    await this.stopScanner();

    // Play success beep
    this.playSuccessBeep();

    // Show success message
    this.showScannerSuccess(decodedText);

    // Wait a moment before proceeding
    setTimeout(async () => {
      try {
        await this.processScannedCode(decodedText);
      } catch (error) {
        logger.error('Failed to process scanned code:', error);
        notify.error(t('identify.errors.qrProcessing'), error as Error, {
          title: t('modals.scanError'),
          duration: 0,
        });
      } finally {
        this.closeScanner();
      }
    }, 800);
  }

  /**
   * Handle scan failure (this is called continuously, so we don't show errors here)
   */
  private onScanFailure(error: string): void {
    // Don't log every failure - it's called very frequently while scanning
    // Only log if it's not the typical "No MultiFormat Readers" message
    if (!error.includes('No MultiFormat Readers')) {
      logger.debug('Scan attempt:', error);
    }
  }

  /**
   * Process the scanned code
   */
  private async processScannedCode(code: string): Promise<void> {
    try {
      // Trim and validate the scanned code
      const trimmedCode = code.trim();
      const validation = this.validateMachineId(trimmedCode);

      if (!validation.valid) {
        this.showError(validation.error || t('identify.errors.invalidCode'));
        return;
      }

      await this.handleMachineId(trimmedCode);
    } catch (error) {
      logger.error('Error processing scanned code:', error);
      this.showError(t('identify.errors.codeProcessing'));
    }
  }

  /**
   * Stop the scanner
   */
  private async stopScanner(): Promise<void> {
    if (this.html5QrCode && this.isScanning) {
      try {
        await this.html5QrCode.stop();
        this.html5QrCode.clear();
      } catch (error) {
        logger.error('Error stopping scanner:', error);
      } finally {
        this.isScanning = false;
      }
    }
  }

  /**
   * Close scanner modal
   */
  private async closeScanner(): Promise<void> {
    await this.stopScanner();

    if (this.scannerModal) {
      this.scannerModal.style.display = 'none';
    }
  }

  /**
   * Show scanner error
   */
  private showScannerError(message: string, hint?: string): void {
    const errorDiv = document.getElementById('scanner-error');
    const successDiv = document.getElementById('scanner-success');
    const scannerContainer = document.getElementById('scanner-container');
    const errorMessage = document.getElementById('scanner-error-message');
    const errorHint = document.querySelector('.scanner-error-hint');

    if (errorDiv) {
      errorDiv.style.display = 'flex';
    }
    if (successDiv) {
      successDiv.style.display = 'none';
    }
    if (scannerContainer) {
      scannerContainer.style.display = 'none';
    }
    if (errorMessage) {
      errorMessage.textContent = message;
    }
    // CRITICAL FIX: Always reset hint text (even when empty) to prevent stale hints
    // This ensures old hints don't remain visible when new errors occur without hints
    if (errorHint) {
      errorHint.textContent = hint || '';
    }
  }

  /**
   * Show scanner success
   */
  private showScannerSuccess(code: string): void {
    const errorDiv = document.getElementById('scanner-error');
    const successDiv = document.getElementById('scanner-success');
    const scannerContainer = document.getElementById('scanner-container');
    const successMessage = document.getElementById('scanner-success-message');

    if (errorDiv) {
      errorDiv.style.display = 'none';
    }
    if (successDiv) {
      successDiv.style.display = 'flex';
    }
    if (scannerContainer) {
      scannerContainer.style.display = 'none';
    }
    if (successMessage) {
      successMessage.textContent = t('identify.messages.codeRecognized', { code });
    }
  }

  /**
   * Play success beep sound
   */
  private playSuccessBeep(): void {
    try {
      // Create a simple beep using Web Audio API
      const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextClass) {
        logger.warn('AudioContext not supported in this browser');
        return;
      }
      const audioContext = new AudioContextClass();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 800; // Frequency in Hz
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);

      // CRITICAL FIX: Close AudioContext after beep finishes to prevent resource leak
      // Wait for sound duration (200ms) + small buffer before closing context
      setTimeout(() => {
        if (audioContext && audioContext.state !== 'closed') {
          try {
            audioContext.close();
          } catch (error) {
            logger.warn('⚠️ Error closing AudioContext:', error);
          }
        }
      }, 250); // 200ms sound + 50ms buffer
    } catch (error) {
      logger.warn('Could not play beep sound:', error);
    }
  }

  /**
   * Handle manual input from scanner modal
   */
  private async handleManualInput(): Promise<void> {
    await this.closeScanner();
    this.openManualInputModal();
  }

  /**
   * Handle manual machine ID submission
   */
  private async submitManualInput(): Promise<void> {
    const manualInput = document.getElementById(
      'manual-machine-id-input'
    ) as HTMLInputElement | null;

    if (!manualInput) {
      this.showError(t('identify.errors.manualEntryLoad'));
      return;
    }

    const trimmedCode = manualInput.value.trim();
    const validation = this.validateMachineId(trimmedCode);

    if (!validation.valid) {
      this.showError(validation.error || t('identify.errors.invalidMachineId'));
      return;
    }

    this.closeManualInputModal();
    await this.handleMachineId(trimmedCode);
  }

  /**
   * Open manual input modal
   */
  private openManualInputModal(): void {
    const manualInputModal = document.getElementById('manual-input-modal');
    const manualInput = document.getElementById(
      'manual-machine-id-input'
    ) as HTMLInputElement | null;

    if (manualInputModal) {
      manualInputModal.style.display = 'flex';
    }

    if (manualInput) {
      manualInput.value = '';
      manualInput.focus();
    }
  }

  /**
   * Close manual input modal
   */
  private closeManualInputModal(): void {
    const manualInputModal = document.getElementById('manual-input-modal');
    if (manualInputModal) {
      manualInputModal.style.display = 'none';
    }
  }

  /**
   * Handle machine selection or auto-create if missing
   * Also triggers automatic reference database download for NFC-based setup
   *
   * @param id - Machine identifier
   * @param referenceDbUrl - Optional reference DB URL from NFC link (enables auto-creation with DB)
   */
  private async handleMachineId(id: string, referenceDbUrl?: string): Promise<boolean> {
    try {
      let machine = await getMachine(id);

      if (machine) {
        // Update referenceDbUrl if provided and different from current
        if (referenceDbUrl && machine.referenceDbUrl !== referenceDbUrl) {
          logger.info(`🔄 Updating reference URL for machine ${id}`);
          machine.referenceDbUrl = referenceDbUrl;
          await saveMachine(machine);
        }

        notify.success(t('identify.success.machineLoaded', { name: machine.name }));
        this.setCurrentMachine(machine);
        this.onMachineSelected(machine);

        // Check if reference database download is needed (NFC setup flow)
        const needsDownload = await ReferenceDbService.needsDownload(id);
        if (needsDownload && machine.referenceDbUrl) {
          await this.downloadReferenceDatabase(machine);
          // Reload machine to get updated reference models
          machine = await getMachine(id);
          if (machine) {
            this.setCurrentMachine(machine);
            this.onMachineSelected(machine);
          }
        }

        return true;
      }

      // Machine not found - auto-create
      // If referenceDbUrl is provided (from NFC link), include it for DB download
      if (referenceDbUrl) {
        // Validate URL before creating machine
        const validation = ReferenceDbService.validateUrl(referenceDbUrl);
        if (!validation.valid) {
          logger.error(`Invalid reference URL: ${validation.error}`);
          this.showError(t('identify.errors.invalidReferenceUrl') || 'Invalid reference database URL');
          return false;
        }
        logger.info(`🆕 Auto-creating machine ${id} with reference DB URL from NFC`);
      }

      const autoName = t('identify.messages.autoMachineName', { id });
      const newMachine: Machine = {
        id,
        name: autoName,
        createdAt: Date.now(),
        referenceModels: [],
        referenceDbUrl: referenceDbUrl, // Include URL from NFC link
      };

      await saveMachine(newMachine);
      await this.refreshMachineLists();
      notify.success(t('identify.success.machineAutoCreated', { name: autoName }));
      this.setCurrentMachine(newMachine);
      this.onMachineSelected(newMachine);

      // If referenceDbUrl was provided, download the database immediately
      if (referenceDbUrl) {
        await this.downloadReferenceDatabase(newMachine);
        // Reload machine to get updated reference models and metadata
        const updatedMachine = await getMachine(id);
        if (updatedMachine) {
          this.setCurrentMachine(updatedMachine);
          this.onMachineSelected(updatedMachine);
        }
      }

      return true;
    } catch (error) {
      logger.error('Error handling machine ID:', error);
      notify.error(t('identify.errors.machineLoad'), error as Error);
      return false;
    }
  }

  /**
   * Download reference database for a machine (NFC setup flow)
   * Shows loading overlay during download
   */
  private async downloadReferenceDatabase(machine: Machine): Promise<void> {
    const overlay = new ReferenceLoadingOverlay();
    overlay.show();

    try {
      const result = await ReferenceDbService.downloadAndApply(
        machine.id,
        (status, progress) => {
          overlay.updateStatus(this.getLocalizedDownloadStatus(status), progress);
        }
      );

      if (result.success) {
        overlay.showSuccess();
        logger.info(`✅ Reference DB downloaded: ${result.modelsImported} models, v${result.version}`);
      } else {
        overlay.showError(this.getLocalizedDownloadError(result.error || 'unknown'));
        // Keep overlay visible longer for error
        await new Promise(resolve => setTimeout(resolve, 3000));
        overlay.hide();
      }
    } catch (error) {
      logger.error('Reference DB download error:', error);
      overlay.showError(t('machineSetup.errorUnknown'));
      await new Promise(resolve => setTimeout(resolve, 3000));
      overlay.hide();
    }
  }

  /**
   * Get localized download status message
   */
  private getLocalizedDownloadStatus(status: string): string {
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
   * Get localized download error message
   */
  private getLocalizedDownloadError(error: string): string {
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
   * Handle manual machine creation
   * Includes service technician fields for NFC setup (expert mode)
   */
  private async handleCreateMachine(): Promise<void> {
    try {
      const nameInput = document.getElementById('machine-name-input') as HTMLInputElement;
      const idInput = document.getElementById('machine-id-input') as HTMLInputElement;

      // Service technician fields (expert mode)
      const refDbUrlInput = document.getElementById('reference-db-url-input') as HTMLInputElement;
      const locationInput = document.getElementById('machine-location-input') as HTMLInputElement;
      const notesInput = document.getElementById('machine-notes-input') as HTMLTextAreaElement;

      if (!nameInput || !idInput) {
        throw new Error('Input elements not found');
      }

      const name = nameInput.value.trim();
      const idInputValue = idInput.value.trim();

      // Get service technician fields if available
      const referenceDbUrl = refDbUrlInput?.value.trim() || undefined;
      const location = locationInput?.value.trim() || undefined;
      const notes = notesInput?.value.trim() || undefined;

      // Validate name
      if (!name) {
        this.showError(t('identify.errors.nameRequired'));
        return;
      }

      // Validate name is not just whitespace and has reasonable length
      if (!/\S/.test(name)) {
        this.showError(t('identify.errors.nameWhitespace'));
        return;
      }

      if (name.length > 100) {
        this.showError(t('identify.errors.nameTooLong'));
        return;
      }

      // Validate reference DB URL if provided
      if (referenceDbUrl) {
        const urlValidation = ReferenceDbService.validateUrl(referenceDbUrl);
        if (!urlValidation.valid) {
          this.showError(t(`machineSetup.${this.getUrlErrorKey(urlValidation.error || 'urlInvalid')}`));
          return;
        }
      }

      // Generate or validate ID
      let id: string;
      if (idInputValue) {
        // Validate provided ID
        const validation = this.validateMachineId(idInputValue);
        if (!validation.valid) {
          this.showError(validation.error || t('identify.errors.invalidMachineId'));
          return;
        }
        id = idInputValue;
      } else {
        // Generate new ID
        id = this.generateMachineId();
      }

      // Check if ID already exists
      const existing = await getMachine(id);
      if (existing) {
        this.showError(t('identify.errors.machineExists'));
        return;
      }

      // Create new machine with service technician fields
      const machine: Machine = {
        id,
        name,
        createdAt: Date.now(),
        referenceModels: [],
        // Service technician fields (NFC setup)
        referenceDbUrl,
        location,
        notes,
      };

      await saveMachine(machine);
      await this.refreshMachineLists();

      logger.debug('✅ Machine Created:', {
        id: machine.id,
        name: machine.name,
        createdAt: new Date(machine.createdAt).toLocaleString(),
        hasReferenceDbUrl: !!machine.referenceDbUrl,
      });
      logger.debug('📞 Calling onMachineSelected() with new machine...');

      // Clear inputs
      nameInput.value = '';
      idInput.value = '';
      if (refDbUrlInput) refDbUrlInput.value = '';
      if (locationInput) locationInput.value = '';
      if (notesInput) notesInput.value = '';

      this.showNotification(t('identify.success.machineCreated', { name }));
      this.setCurrentMachine(machine);
      this.onMachineSelected(machine);
    } catch (error) {
      logger.error('Create machine error:', error);
      this.showError(t('identify.errors.machineCreate'));
    }
  }

  /**
   * Map URL validation error to i18n key
   */
  private getUrlErrorKey(error: string): string {
    const errorMap: Record<string, string> = {
      url_empty: 'urlEmpty',
      url_invalid: 'urlInvalid',
      url_not_https: 'urlNotHttps',
      google_drive_not_direct: 'googleDriveNotDirect',
      url_not_official_source: 'urlNotOfficialSource',
    };
    return errorMap[error] || 'urlInvalid';
  }

  /**
   * Refresh machine lists (overview + quick select) after updates.
   */
  private async refreshMachineLists(): Promise<void> {
    await Promise.all([this.loadMachineOverview(), this.loadMachineHistory()]);
  }

  /**
   * Generate random machine ID
   */
  private generateMachineId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 7);
    return `${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Validate machine ID format
   * Ensures ID is not empty, not just whitespace, and has reasonable length
   */
  private validateMachineId(id: string): { valid: boolean; error?: string } {
    // Trim whitespace
    const trimmedId = id.trim();

    // Check if empty after trimming
    if (!trimmedId) {
      return { valid: false, error: t('identify.errors.idEmpty') };
    }

    // Check minimum length (at least 1 character)
    if (trimmedId.length < 1) {
      return { valid: false, error: t('identify.errors.idTooShort') };
    }

    // Check maximum length (prevent excessive IDs)
    if (trimmedId.length > 100) {
      return { valid: false, error: t('identify.errors.idTooLong') };
    }

    // Check for only whitespace characters (extra safety)
    if (!/\S/.test(trimmedId)) {
      return { valid: false, error: t('identify.errors.idWhitespace') };
    }

    return { valid: true };
  }

  /**
   * Show notification message
   */
  private showNotification(message: string): void {
    notify.success(message);
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    notify.error(message);
  }

  /**
   * Track currently selected machine for NFC writer context.
   */
  private setCurrentMachine(machine: Machine): void {
    this.currentMachine = machine;
    this.updateNfcSpecificOption();
  }

  /**
   * Deep link handling for magic URLs.
   * Supports:
   * - New format: #/m/<id>?c=<customer_id> (customerId builds DB URL automatically)
   * - Legacy hash format: #/m/<id>?ref=<encoded_url>
   * - Legacy query param format: ?machineId=<id>
   *
   * When customerId (c) is provided (NFC setup flow - Variante B):
   * - DB URL is built automatically: https://gunterstruck.github.io/<customerId>/db-latest.json
   * - Auto-creates machine if not found
   * - Downloads and imports the complete database
   * - Selects the specific machine
   * - Offers "Test starten" immediately
   */
  private async handleDeepLink(): Promise<void> {
    let machineId: string | null = null;
    let referenceDbUrl: string | undefined;
    let customerId: string | undefined;
    let isHashRoute = false;

    // Check hash-based route first using HashRouter for correct parsing
    // This properly handles #/m/<machine_id>?c=<customer_id> (new) or ?ref=<encoded_url> (legacy)
    const hash = window.location.hash;
    if (hash && hash.startsWith('#/m/')) {
      const router = new HashRouter();
      const match = router.parseHash(hash);
      if (match.type === 'machine' && match.machineId) {
        machineId = match.machineId;
        customerId = match.customerId;
        referenceDbUrl = match.referenceDbUrl;
        isHashRoute = true;
        logger.info(`🔗 Deep link parsed: machineId=${machineId}, customerId=${customerId || 'none'}, dbUrl=${referenceDbUrl || 'none'}`);
      }
    }

    // Fallback to legacy query param: ?machineId=<id>
    if (!machineId) {
      const params = new URLSearchParams(window.location.search);
      machineId = params.get('machineId');
    }

    if (!machineId) {
      return;
    }

    const validation = this.validateMachineId(machineId);
    if (!validation.valid) {
      this.showError(validation.error || t('identify.errors.invalidMachineId'));
      return;
    }

    this.showDeepLinkOverlay(true);
    let machineHandled = false;
    try {
      machineHandled = await this.handleMachineId(machineId, referenceDbUrl);

      // Clean up URL after processing
      if (isHashRoute) {
        // Clear hash
        window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
      } else {
        // Clear query param
        const params = new URLSearchParams(window.location.search);
        params.delete('machineId');
        const newUrl = `${window.location.pathname}${params.toString() ? `?${params.toString()}` : ''}`;
        window.history.replaceState({}, document.title, newUrl);
      }
    } catch (error) {
      logger.error('Failed to handle deep link:', error);
      this.showError(t('identify.errors.machineLoad'));
    } finally {
      this.showDeepLinkOverlay(false);
    }

    if (machineHandled) {
      this.openNfcDiagnosisPrompt();
    }
  }

  private showDeepLinkOverlay(show: boolean): void {
    if (!this.deepLinkOverlay) {
      this.deepLinkOverlay = document.getElementById('deep-link-overlay');
    }
    if (this.deepLinkOverlay) {
      this.deepLinkOverlay.style.display = show ? 'flex' : 'none';
    }
  }

  private initNfcDiagnosisPrompt(): void {
    this.nfcDiagnosisModal = document.getElementById('nfc-diagnosis-modal');
    this.nfcDiagnosisConfirmBtn = document.getElementById('nfc-diagnosis-confirm-btn') as HTMLButtonElement | null;
    this.nfcDiagnosisCancelBtn = document.getElementById('nfc-diagnosis-cancel-btn') as HTMLButtonElement | null;
    const closeBtn = document.getElementById('close-nfc-diagnosis-modal');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeNfcDiagnosisPrompt());
    }
    if (this.nfcDiagnosisCancelBtn) {
      this.nfcDiagnosisCancelBtn.addEventListener('click', () => this.closeNfcDiagnosisPrompt());
    }
    if (this.nfcDiagnosisConfirmBtn) {
      this.nfcDiagnosisConfirmBtn.addEventListener('click', () => {
        this.closeNfcDiagnosisPrompt();
        this.startDiagnosisFromNfc();
      });
    }
    if (this.nfcDiagnosisModal) {
      this.nfcDiagnosisModal.addEventListener('click', (event) => {
        if (event.target === this.nfcDiagnosisModal) {
          this.closeNfcDiagnosisPrompt();
        }
      });
    }
  }

  private openNfcDiagnosisPrompt(): void {
    if (!this.nfcDiagnosisModal) {
      return;
    }
    this.nfcDiagnosisModal.style.display = 'flex';
  }

  private closeNfcDiagnosisPrompt(): void {
    if (this.nfcDiagnosisModal) {
      this.nfcDiagnosisModal.style.display = 'none';
    }
  }

  private startDiagnosisFromNfc(): void {
    const content = document.getElementById('run-diagnosis-content');
    const header = document.querySelector('.section-header[data-target="run-diagnosis-content"]') as HTMLElement | null;
    if (content && header && window.getComputedStyle(content).display === 'none') {
      header.click();
    }

    // Set flag to force basic view for NFC-initiated diagnosis
    // This ensures simplified inspection modal is shown regardless of user's view level setting
    document.body.setAttribute('data-nfc-diagnosis', 'true');

    const mode = document.body.getAttribute('data-detection-mode');
    const level2Button = document.getElementById('level2-diag-btn') as HTMLButtonElement | null;
    const level1Button = document.getElementById('diagnose-btn') as HTMLButtonElement | null;
    const startButton = mode === 'CYCLIC' ? level2Button : level1Button;

    if (!startButton) {
      return;
    }

    if (!startButton.disabled) {
      startButton.click();
      return;
    }

    const waitForEnableTimeout = 4000;
    const startTime = Date.now();
    const intervalId = window.setInterval(() => {
      if (!startButton.disabled) {
        startButton.click();
        window.clearInterval(intervalId);
        return;
      }
      if (Date.now() - startTime >= waitForEnableTimeout) {
        window.clearInterval(intervalId);
      }
    }, 250);
  }

  /**
   * NFC Writer setup and flow.
   */
  private initNfcWriter(): void {
    const openBtn = document.getElementById('open-nfc-writer-btn') as HTMLButtonElement | null;
    const settingsBtn = document.getElementById('settings-nfc-writer-btn') as HTMLButtonElement | null;
    const availabilityHint = document.getElementById('nfc-availability-hint');
    const settingsAvailabilityHint = document.getElementById('settings-nfc-availability-hint');

    this.nfcModal = document.getElementById('nfc-writer-modal');
    this.nfcStatus = document.getElementById('nfc-status');
    this.nfcWriteBtn = document.getElementById('nfc-write-btn') as HTMLButtonElement | null;
    this.nfcGenericOption = document.getElementById('nfc-option-generic') as HTMLInputElement | null;
    this.nfcSpecificOption = document.getElementById('nfc-option-specific') as HTMLInputElement | null;
    this.nfcSpecificDetail = document.getElementById('nfc-option-specific-detail');
    this.nfcSupportDetails = document.getElementById('nfc-support-details');

    // CustomerId input field for Variante B
    this.nfcCustomerIdInput = document.getElementById('nfc-customer-id-input') as HTMLInputElement | null;
    this.nfcDbUrlPreview = document.getElementById('nfc-db-url-preview');

    const closeBtn = document.getElementById('close-nfc-writer-modal');
    const cancelBtn = document.getElementById('nfc-cancel-btn');

    const { supported: supportsNfc } = this.getNfcSupportStatus();

    if (openBtn) {
      openBtn.addEventListener('click', () => this.openNfcModal());
    }
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.openNfcModal());
    }

    if (availabilityHint) {
      availabilityHint.style.display = supportsNfc ? 'none' : 'block';
    }
    if (settingsAvailabilityHint) {
      settingsAvailabilityHint.style.display = supportsNfc ? 'none' : 'block';
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.closeNfcModal());
    }
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => this.closeNfcModal());
    }
    if (this.nfcModal) {
      this.nfcModal.addEventListener('click', (event) => {
        if (event.target === this.nfcModal) {
          this.closeNfcModal();
        }
      });
    }
    if (this.nfcWriteBtn) {
      this.nfcWriteBtn.addEventListener('click', () => {
        void this.handleNfcWrite();
      });
    }

    // Update DB URL preview when customerId changes
    if (this.nfcCustomerIdInput) {
      this.nfcCustomerIdInput.addEventListener('input', () => this.updateNfcDbUrlPreview());
    }

    this.updateNfcSpecificOption();
  }

  /**
   * Update the DB URL preview based on customerId input
   */
  private updateNfcDbUrlPreview(): void {
    if (!this.nfcDbUrlPreview || !this.nfcCustomerIdInput) {
      return;
    }

    const customerId = this.nfcCustomerIdInput.value.trim();
    if (customerId) {
      const dbUrl = HashRouter.buildDbUrlFromCustomerId(customerId);
      this.nfcDbUrlPreview.textContent = t('nfc.dbUrlPreview', { url: dbUrl });
      this.nfcDbUrlPreview.style.display = 'block';
    } else {
      this.nfcDbUrlPreview.style.display = 'none';
    }
  }

  private getNfcSupportStatus(): { supported: boolean; message?: string } {
    if (!window.isSecureContext) {
      return { supported: false, message: t('nfc.requiresSecureContext') };
    }

    const hasReader = typeof (window as typeof window & { NDEFReader?: NDEFReaderConstructor }).NDEFReader !== 'undefined';
    if (!hasReader) {
      return { supported: false, message: t('nfc.unsupportedBrowser') };
    }

    return { supported: true };
  }

  private openNfcModal(): void {
    if (!this.nfcModal) {
      return;
    }
    const { supported: supportsNfc, message } = this.getNfcSupportStatus();
    this.updateNfcSpecificOption();
    this.updateNfcSupportDetails();
    if (this.nfcWriteBtn) {
      this.nfcWriteBtn.disabled = !supportsNfc;
    }
    this.setNfcStatus(supportsNfc ? '' : message || t('nfc.unsupported'), supportsNfc ? undefined : 'error');
    this.nfcModal.style.display = 'flex';
  }

  private closeNfcModal(): void {
    if (this.nfcModal) {
      this.nfcModal.style.display = 'none';
    }
  }

  private updateNfcSpecificOption(): void {
    if (!this.nfcSpecificOption || !this.nfcSpecificDetail) {
      return;
    }

    if (this.currentMachine) {
      this.nfcSpecificOption.disabled = false;
      this.nfcSpecificDetail.textContent = t('nfc.optionSpecificDetail', {
        name: this.currentMachine.name,
        id: this.currentMachine.id,
      });
    } else {
      this.nfcSpecificOption.disabled = true;
      if (this.nfcGenericOption) {
        this.nfcGenericOption.checked = true;
      }
      this.nfcSpecificDetail.textContent = t('nfc.optionSpecificUnavailable');
    }
  }

  private updateNfcSupportDetails(): void {
    if (!this.nfcSupportDetails) {
      return;
    }

    const hasSecureContext = window.isSecureContext;
    const hasReader = typeof (window as typeof window & { NDEFReader?: NDEFReaderConstructor }).NDEFReader !== 'undefined';
    const yes = t('common.yes');
    const no = t('common.no');

    this.nfcSupportDetails.textContent = t('nfc.supportDetails', {
      secureContext: hasSecureContext ? yes : no,
      ndefReader: hasReader ? yes : no,
    });
  }

  private setNfcStatus(message: string, status?: 'success' | 'error'): void {
    if (!this.nfcStatus) {
      return;
    }
    this.nfcStatus.textContent = message;
    this.nfcStatus.classList.remove('status-success', 'status-error');
    if (status === 'success') {
      this.nfcStatus.classList.add('status-success');
    }
    if (status === 'error') {
      this.nfcStatus.classList.add('status-error');
    }
  }

  private getBaseAppUrl(): string {
    return new URL('/', window.location.origin).toString();
  }

  private async handleNfcWrite(): Promise<void> {
    if (!this.nfcWriteBtn) {
      return;
    }

    const { supported: supportsNfc, message } = this.getNfcSupportStatus();
    if (!supportsNfc) {
      this.setNfcStatus(message || t('nfc.unsupported'), 'error');
      return;
    }

    const readerConstructor = (window as typeof window & { NDEFReader?: NDEFReaderConstructor }).NDEFReader;
    if (!readerConstructor) {
      this.setNfcStatus(t('nfc.unsupported'), 'error');
      return;
    }

    const selectedOption = this.nfcSpecificOption?.checked ? 'specific' : 'generic';
    if (selectedOption === 'specific' && !this.currentMachine) {
      this.setNfcStatus(t('nfc.optionSpecificUnavailable'), 'error');
      return;
    }

    // Get customerId from input field (required for machine-specific links)
    const customerId = this.nfcCustomerIdInput?.value.trim() || '';

    // Validate: customerId is required for machine-specific links
    if (selectedOption === 'specific' && !customerId) {
      this.setNfcStatus(t('nfc.customerIdRequired'), 'error');
      return;
    }

    // Use hash-based URL for NFC: #/m/<machine_id>?c=<customer_id>
    // The customerId determines which database to load (Variante B)
    const baseUrl = this.getBaseAppUrl();
    const url = selectedOption === 'specific' && this.currentMachine
      ? HashRouter.getFullMachineUrl(this.currentMachine.id, customerId)
      : baseUrl;

    logger.info(`📝 Writing NFC tag: ${url}`);

    this.nfcWriteBtn.disabled = true;
    this.setNfcStatus(t('nfc.statusWriting'));

    try {
      const reader = new readerConstructor();
      await reader.write({
        records: [
          {
            recordType: 'url',
            data: url,
          },
        ],
      });
      this.setNfcStatus(t('nfc.statusSuccess'), 'success');
    } catch (error) {
      const isError = error instanceof Error;
      const errorName = isError ? error.name : '';
      if (errorName === 'AbortError') {
        this.setNfcStatus(t('nfc.statusCancelled'), 'error');
      } else {
        this.setNfcStatus(t('nfc.statusError'), 'error');
      }
      logger.error('NFC write failed:', error);
    } finally {
      this.nfcWriteBtn.disabled = false;
    }
  }

  /**
   * ========================================
   * HARDWARE INTELLIGENCE
   * ========================================
   */

  /**
   * Initialize hardware check on page load
   *
   * SMART MICROPHONE AUTO-SELECTION:
   * 1. Request initial audio permission (gets device labels)
   * 2. Search for optimal rear/environment microphone
   * 3. Automatically switch to best mic if found
   * 4. Notify user of optimization
   */
  private async initializeHardwareCheck(): Promise<void> {
    let tempStream: MediaStream | null = null;
    try {
      // Step 1: Request initial audio permission to get device labels
      tempStream = await getRawAudioStream(this.selectedDeviceId);

      // Step 2: SMART MICROPHONE AUTO-SELECTION
      // Now that we have permission, device labels are available
      const bestMic = await HardwareCheck.findBestMicrophone();

      if (bestMic && bestMic.deviceId !== this.selectedDeviceId) {
        logger.info(`🎤 Smart Auto-Selection: Switching to "${bestMic.label}"`);

        // Stop the initial stream before switching
        tempStream.getTracks().forEach((track) => track.stop());
        tempStream = null;

        // Set the optimal microphone
        this.selectedDeviceId = bestMic.deviceId;

        // Get new stream with the optimal microphone
        tempStream = await getRawAudioStream(this.selectedDeviceId);

        // Notify user of automatic optimization
        notify.success(t('identify.success.microphoneOptimized', { label: bestMic.label }));
      }

      // Step 3: Analyze the (potentially new) hardware
      const currentDevice = await HardwareCheck.getCurrentDevice(tempStream);

      if (currentDevice) {
        // Get audio track settings for sample rate
        const audioTracks = tempStream.getAudioTracks();
        if (audioTracks.length === 0) {
          logger.warn('No audio tracks found on device');
          return;
        }
        const audioTrack = audioTracks[0];
        const settings = audioTrack.getSettings();
        const sampleRate = settings.sampleRate || 44100;

        // Analyze hardware
        this.audioQualityReport = HardwareCheck.analyzeCurrentDevice(
          currentDevice.label,
          sampleRate
        );

        // Update UI
        this.updateHardwareInfoCard();
      }
    } catch (error) {
      logger.error('Failed to initialize hardware check:', error);
      // Don't block user flow - just log the error
    } finally {
      // CRITICAL FIX: Stop temporary stream after hardware check (success or failure)
      // This prevents resource leak and keeps microphone available for actual recordings
      if (tempStream) {
        tempStream.getTracks().forEach((track) => track.stop());
        tempStream = null;
      }
    }
  }

  /**
   * Update hardware info card in UI
   */
  private updateHardwareInfoCard(): void {
    if (!this.audioQualityReport) {
      return;
    }

    const statusIcon = document.getElementById('hardware-status-icon');
    const deviceLabel = document.getElementById('hardware-device-label');
    const statusText = document.getElementById('hardware-status-text');

    if (!statusIcon || !deviceLabel || !statusText) {
      return;
    }

    // Update device label
    deviceLabel.textContent = this.audioQualityReport.deviceLabel;

    // Update status icon and text
    if (this.audioQualityReport.status === 'good') {
      statusIcon.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--status-healthy)" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      `;
      statusText.textContent = this.audioQualityReport.reason;
      statusText.style.color = 'var(--status-healthy)';
    } else {
      statusIcon.innerHTML = `
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--status-warning)" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      `;
      statusText.textContent = this.audioQualityReport.reason;
      statusText.style.color = 'var(--status-warning)';
    }
  }

  /**
   * Show microphone selection modal
   */
  private async showMicrophoneSelection(): Promise<void> {
    try {
      const liveDevices = await getMicrophones();
      const devices: AudioDeviceInfo[] = liveDevices.map((device) => ({
        deviceId: device.deviceId,
        label: device.label || t('hardware.microphoneId', { id: device.deviceId.substring(0, 8) }),
        kind: device.kind,
        groupId: device.groupId,
      }));

      // Get or create modal
      const modal = document.getElementById('microphone-selection-modal');
      if (!modal) {
        logger.error('Microphone selection modal not found in DOM');
        return;
      }

      const hasSelectedDevice =
        !!this.selectedDeviceId &&
        (this.selectedDeviceId === HardwareCheck.IOS_REAR_MIC_DEVICE_ID ||
          devices.some((device) => device.deviceId === this.selectedDeviceId));

      if (this.selectedDeviceId && !hasSelectedDevice) {
        logger.warn(
          `🎤 Selected microphone "${this.selectedDeviceId}" not found in live device list.`
        );
        notify.warning(t('identify.warnings.preferredMicrophoneUnavailable'));
        this.selectedDeviceId = undefined;
      }

      // Populate device list
      const deviceList = document.getElementById('microphone-device-list');
      if (!deviceList) {
        logger.error('Device list container not found');
        return;
      }

      deviceList.innerHTML = '';

      devices.forEach((device) => {
        const deviceItem = document.createElement('div');
        deviceItem.className = 'microphone-device-item';
        deviceItem.dataset.deviceId = device.deviceId;

        // Check if this is the currently selected device
        const isSelected =
          this.selectedDeviceId === device.deviceId ||
          (!this.selectedDeviceId && device.deviceId === 'default');

        if (isSelected) {
          deviceItem.classList.add('selected');
        }

        // Analyze this device
        // CRITICAL FIX: Use sample rate from AUDIO_CONSTRAINTS instead of hardcoded value
        // Note: This is the requested rate - actual rate will be determined when stream is created
        const estimatedSampleRate = AUDIO_CONSTRAINTS.audio.sampleRate;
        const tempReport = HardwareCheck.analyzeCurrentDevice(device.label, estimatedSampleRate);
        const statusClass = tempReport.status === 'good' ? 'status-good' : 'status-warning';

        // CRITICAL FIX: Use safe DOM manipulation instead of innerHTML to prevent XSS
        // Create device info container
        const deviceInfo = document.createElement('div');
        deviceInfo.className = 'device-info';

        // Create device icon with status
        const deviceIcon = document.createElement('div');
        deviceIcon.className = `device-icon ${statusClass}`;

        // Add appropriate SVG based on status (safe static content)
        if (tempReport.status === 'good') {
          deviceIcon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>`;
        } else {
          deviceIcon.innerHTML = `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>`;
        }

        // Create device details container
        const deviceDetails = document.createElement('div');
        deviceDetails.className = 'device-details';

        // Use textContent instead of innerHTML to prevent XSS attacks
        const deviceName = document.createElement('div');
        deviceName.className = 'device-name';
        deviceName.textContent = device.label; // SAFE - textContent escapes HTML

        const deviceStatus = document.createElement('div');
        deviceStatus.className = 'device-status';
        deviceStatus.textContent = tempReport.reason; // SAFE - textContent escapes HTML

        // Assemble the structure
        deviceDetails.appendChild(deviceName);
        deviceDetails.appendChild(deviceStatus);
        deviceInfo.appendChild(deviceIcon);
        deviceInfo.appendChild(deviceDetails);
        deviceItem.appendChild(deviceInfo);

        // Add checkmark for selected device
        if (isSelected) {
          const checkmark = document.createElement('div');
          checkmark.className = 'device-checkmark';
          checkmark.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>`;
          deviceItem.appendChild(checkmark);
        }

        deviceItem.addEventListener('click', () => this.selectMicrophone(device));
        deviceList.appendChild(deviceItem);
      });

      // Show modal
      modal.style.display = 'flex';

      // Setup close handlers
      const closeBtn = document.getElementById('close-microphone-modal');
      if (closeBtn) {
        closeBtn.onclick = () => this.closeMicrophoneModal();
      }

      modal.onclick = (e) => {
        if (e.target === modal) {
          this.closeMicrophoneModal();
        }
      };
    } catch (error) {
      logger.error('Failed to show microphone selection:', error);
      this.showError(t('identify.errors.microphoneLoad'));
    }
  }

  /**
   * Select a microphone
   */
  private async selectMicrophone(device: AudioDeviceInfo): Promise<void> {
    try {
      logger.info(`Selecting microphone: ${device.label}`);

      // Stop current stream
      if (this.currentAudioStream) {
        this.currentAudioStream.getTracks().forEach((track) => track.stop());
      }

      // Update selected device
      this.selectedDeviceId = device.deviceId;

      // Get new stream with selected device
      this.currentAudioStream = await getRawAudioStream(device.deviceId);

      // Re-analyze hardware
      const audioTracks = this.currentAudioStream.getAudioTracks();
      if (audioTracks.length === 0) {
        throw new Error('No audio tracks available on selected device');
      }
      const audioTrack = audioTracks[0];
      const settings = audioTrack.getSettings();
      const sampleRate = settings.sampleRate || 44100;

      this.audioQualityReport = HardwareCheck.analyzeCurrentDevice(device.label, sampleRate);

      // Update UI
      this.updateHardwareInfoCard();

      // Close modal
      this.closeMicrophoneModal();

      // Notify user
      notify.success(t('identify.success.microphoneChanged', { label: device.label }));
    } catch (error) {
      logger.error('Failed to select microphone:', error);
      this.showError(t('identify.errors.microphoneSwitch'));
    }
  }

  /**
   * Close microphone selection modal
   */
  private closeMicrophoneModal(): void {
    const modal = document.getElementById('microphone-selection-modal');
    if (modal) {
      modal.style.display = 'none';
    }
  }

  /**
   * Get selected device ID for recording
   * Called by other phases that need to record audio
   */
  public getSelectedDeviceId(): string | undefined {
    return this.selectedDeviceId;
  }

  /**
   * ========================================
   * MACHINE HISTORY / QUICK SELECT
   * ========================================
   */

  /**
   * Load machine history and render quick select list
   */
  private async loadMachineHistory(): Promise<void> {
    try {
      // Get all machines from database
      const machines = await getAllMachines();

      // Filter machines that have at least one trained model
      const trainedMachines = machines.filter(
        (machine) => machine.referenceModels && machine.referenceModels.length > 0
      );

      // Sort by most recent training date (newest first)
      trainedMachines.sort((a, b) => {
        // Get latest training date for each machine (defensive: handle edge cases)
        const aLatestDate =
          a.referenceModels.length > 0
            ? Math.max(...a.referenceModels.map((m) => m.trainingDate || 0))
            : 0;
        const bLatestDate =
          b.referenceModels.length > 0
            ? Math.max(...b.referenceModels.map((m) => m.trainingDate || 0))
            : 0;
        return bLatestDate - aLatestDate;
      });

      // Render the quick select list (max 10 machines)
      this.renderQuickSelectList(trainedMachines.slice(0, 10));
    } catch (error) {
      logger.error('Failed to load machine history:', error);
      // Don't show error to user - just hide the quick select section
      this.hideQuickSelectSection();
    }
  }

  /**
   * Render quick select list with recent machines
   */
  private renderQuickSelectList(machines: Machine[]): void {
    const quickSelectSection = document.getElementById('quick-select-section');
    const quickSelectList = document.getElementById('quick-select-list');

    if (!quickSelectSection || !quickSelectList) {
      logger.warn('Quick select elements not found in DOM');
      return;
    }

    // Hide section if no machines available
    if (machines.length === 0) {
      quickSelectSection.style.display = 'none';
      return;
    }

    // Show section
    quickSelectSection.style.display = 'block';

    // Clear existing list
    quickSelectList.innerHTML = '';

    // Render each machine
    machines.forEach((machine) => {
      const machineItem = document.createElement('div');
      machineItem.className = 'quick-select-item';
      machineItem.dataset.machineId = machine.id;

      // Create machine info
      const machineInfo = document.createElement('div');
      machineInfo.className = 'quick-select-item-info';

      const machineName = document.createElement('div');
      machineName.className = 'quick-select-machine-name';
      machineName.textContent = machine.name;

      const machineId = document.createElement('div');
      machineId.className = 'quick-select-machine-id';
      machineId.textContent = machine.id;

      machineInfo.appendChild(machineName);
      machineInfo.appendChild(machineId);

      // Create chevron icon
      const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      chevron.setAttribute('width', '20');
      chevron.setAttribute('height', '20');
      chevron.setAttribute('viewBox', '0 0 24 24');
      chevron.setAttribute('fill', 'none');
      chevron.setAttribute('stroke', 'currentColor');
      chevron.setAttribute('stroke-width', '2');
      chevron.style.color = 'var(--text-muted)';
      chevron.style.flexShrink = '0';

      const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      polyline.setAttribute('points', '9 18 15 12 9 6');
      chevron.appendChild(polyline);

      // Assemble item
      machineItem.appendChild(machineInfo);
      machineItem.appendChild(chevron);

      // Add click handler
      machineItem.addEventListener('click', () => this.handleQuickSelect(machine));

      // Add to list
      quickSelectList.appendChild(machineItem);
    });
  }

  /**
   * Handle quick select machine click
   */
  private async handleQuickSelect(machine: Machine): Promise<void> {
    try {
      logger.info(`Quick select: ${machine.name} (${machine.id})`);

      // DEBUG LOGGING: Show quick-selected machine
      logger.debug('🎯 Quick-Select Clicked:', {
        id: machine.id,
        name: machine.name,
        numModels: machine.referenceModels?.length || 0,
      });
      logger.debug('📞 Calling onMachineSelected() with quick-selected machine...');

      this.showNotification(t('identify.success.machineLoaded', { name: machine.name }));
      this.setCurrentMachine(machine);
      this.onMachineSelected(machine);
    } catch (error) {
      logger.error('Failed to quick select machine:', error);
      this.showError(t('identify.errors.machineLoad'));
    }
  }

  /**
   * Hide quick select section
   */
  private hideQuickSelectSection(): void {
    const quickSelectSection = document.getElementById('quick-select-section');
    if (quickSelectSection) {
      quickSelectSection.style.display = 'none';
    }
  }

  /**
   * ========================================
   * MACHINE OVERVIEW
   * ========================================
   */

  /**
   * Load all machines and render the overview with status
   */
  private async loadMachineOverview(): Promise<void> {
    try {
      const machines = await getAllMachines();

      // Sort by most recent activity (lastDiagnosisAt or createdAt)
      machines.sort((a, b) => {
        const aTime = a.lastDiagnosisAt || a.createdAt;
        const bTime = b.lastDiagnosisAt || b.createdAt;
        return bTime - aTime;
      });

      await this.renderMachineOverview(machines);
    } catch (error) {
      logger.error('Failed to load machine overview:', error);
    }
  }

  /**
   * Render machine overview list with status
   */
  private async renderMachineOverview(machines: Machine[]): Promise<void> {
    const overviewContainer = document.getElementById('machine-overview');
    const emptyState = document.getElementById('machine-overview-empty');

    if (!overviewContainer) {
      logger.warn('Machine overview container not found');
      return;
    }

    // Clear existing items (except empty state)
    const existingItems = overviewContainer.querySelectorAll('.machine-item');
    existingItems.forEach((item) => item.remove());

    // Show/hide empty state
    if (emptyState) {
      emptyState.style.display = machines.length === 0 ? 'block' : 'none';
    }

    // Render each machine
    for (const machine of machines) {
      const machineItem = await this.createMachineOverviewItem(machine);
      // Insert before the empty state element
      if (emptyState) {
        overviewContainer.insertBefore(machineItem, emptyState);
      } else {
        overviewContainer.appendChild(machineItem);
      }
    }
  }

  /**
   * Create a machine overview item element
   */
  private async createMachineOverviewItem(machine: Machine): Promise<HTMLElement> {
    const machineItem = document.createElement('div');
    machineItem.className = 'machine-item';
    machineItem.dataset.machineId = machine.id;

    // Get latest diagnosis for status
    const latestDiagnosis = await getLatestDiagnosis(machine.id);

    // Determine status and label
    let statusClass = 'status-no-data';
    let statusLabel = t('status.noData');
    let timeLabel = t('status.notChecked');

    if (latestDiagnosis) {
      statusClass = `status-${latestDiagnosis.status}`;
      statusLabel = this.getStatusLabel(latestDiagnosis.status);
      timeLabel = `Letzte Prüfung ${this.formatRelativeTime(latestDiagnosis.timestamp)}`;
    } else if (machine.referenceModels && machine.referenceModels.length > 0) {
      // Has reference models but no diagnosis yet
      statusLabel = t('status.ready');
      statusClass = 'status-ready';
      timeLabel = t('identify.statesTrained', { count: String(machine.referenceModels.length) });
    }

    // Create machine info
    const machineInfo = document.createElement('div');
    machineInfo.className = 'machine-info';

    const machineName = document.createElement('h4');
    machineName.className = 'machine-name';
    machineName.textContent = machine.name;

    const machineStatus = document.createElement('p');
    machineStatus.className = `machine-status ${statusClass}`;
    machineStatus.textContent = statusLabel;

    const machineTime = document.createElement('p');
    machineTime.className = 'machine-time';
    machineTime.textContent = timeLabel;

    machineInfo.appendChild(machineName);
    machineInfo.appendChild(machineStatus);
    machineInfo.appendChild(machineTime);

    // Create chevron icon
    const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chevron.setAttribute('class', 'chevron-right');
    chevron.setAttribute('width', '24');
    chevron.setAttribute('height', '24');
    chevron.setAttribute('viewBox', '0 0 24 24');
    chevron.setAttribute('fill', 'none');
    chevron.setAttribute('stroke', 'currentColor');
    chevron.setAttribute('stroke-width', '2');

    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', '9 18 15 12 9 6');
    chevron.appendChild(polyline);

    // Assemble item
    machineItem.appendChild(machineInfo);
    machineItem.appendChild(chevron);

    // Add click handler
    machineItem.addEventListener('click', () => this.handleMachineSelect(machine));

    return machineItem;
  }

  /**
   * Handle machine selection from overview
   */
  private async handleMachineSelect(machine: Machine): Promise<void> {
    logger.info(`Machine selected from overview: ${machine.name} (${machine.id})`);
    this.showNotification(t('identify.success.machineLoaded', { name: machine.name }));
    this.setCurrentMachine(machine);
    this.onMachineSelected(machine);
  }

  /**
   * ========================================
   * DIAGNOSIS HISTORY
   * ========================================
   */

  /**
   * Load and render diagnosis history
   */
  private async loadDiagnosisHistory(): Promise<void> {
    try {
      // Get last 10 diagnoses across all machines
      const diagnoses = await getAllDiagnoses(10);
      await this.renderDiagnosisHistory(diagnoses);
    } catch (error) {
      logger.error('Failed to load diagnosis history:', error);
    }
  }

  /**
   * Render diagnosis history list
   */
  private async renderDiagnosisHistory(diagnoses: DiagnosisResult[]): Promise<void> {
    const historyContainer = document.getElementById('history-list');
    const emptyState = document.getElementById('history-empty');
    const historySection = document.getElementById('history-section');

    if (!historyContainer) {
      logger.warn('History container not found');
      return;
    }

    // Clear existing items (except empty state)
    const existingItems = historyContainer.querySelectorAll('.history-item');
    existingItems.forEach((item) => item.remove());

    // Show/hide empty state and section
    if (emptyState) {
      emptyState.style.display = diagnoses.length === 0 ? 'block' : 'none';
    }

    // Hide entire section if no diagnoses
    if (historySection) {
      historySection.style.display = diagnoses.length === 0 ? 'none' : 'block';
    }

    // Get machine names for display
    const machines = await getAllMachines();
    const machineMap = new Map(machines.map((m) => [m.id, m]));

    // Render each diagnosis
    for (const diagnosis of diagnoses) {
      const machine = machineMap.get(diagnosis.machineId);
      const historyItem = this.createHistoryItem(diagnosis, machine);
      // Insert before the empty state element
      if (emptyState) {
        historyContainer.insertBefore(historyItem, emptyState);
      } else {
        historyContainer.appendChild(historyItem);
      }
    }
  }

  /**
   * Create a history item element
   */
  private createHistoryItem(diagnosis: DiagnosisResult, machine?: Machine): HTMLElement {
    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.dataset.machineId = diagnosis.machineId;

    // Create history info
    const historyInfo = document.createElement('div');
    historyInfo.className = 'history-info';

    const machineName = document.createElement('div');
    machineName.className = 'history-machine-name';
    machineName.textContent =
      machine?.name || t('identify.messages.autoMachineName', { id: diagnosis.machineId });

    const historyDetails = document.createElement('div');
    historyDetails.className = 'history-details';

    // Status badge
    const statusBadge = document.createElement('span');
    statusBadge.className = `history-status-badge status-${diagnosis.status}`;
    statusBadge.textContent = this.getStatusLabel(diagnosis.status);

    // Score
    const scoreText = document.createElement('span');
    scoreText.className = 'history-score';
    scoreText.textContent = `${Math.round(diagnosis.healthScore)}%`;

    // Time
    const timeText = document.createElement('span');
    timeText.className = 'history-time';
    timeText.textContent = this.formatRelativeTime(diagnosis.timestamp);

    historyDetails.appendChild(statusBadge);
    historyDetails.appendChild(scoreText);
    historyDetails.appendChild(timeText);

    historyInfo.appendChild(machineName);
    historyInfo.appendChild(historyDetails);

    // Create chevron icon
    const chevron = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    chevron.setAttribute('class', 'chevron-right');
    chevron.setAttribute('width', '20');
    chevron.setAttribute('height', '20');
    chevron.setAttribute('viewBox', '0 0 24 24');
    chevron.setAttribute('fill', 'none');
    chevron.setAttribute('stroke', 'currentColor');
    chevron.setAttribute('stroke-width', '2');

    const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
    polyline.setAttribute('points', '9 18 15 12 9 6');
    chevron.appendChild(polyline);

    // Assemble item
    historyItem.appendChild(historyInfo);
    historyItem.appendChild(chevron);

    // Add click handler - select the machine
    if (machine) {
      historyItem.addEventListener('click', () => this.handleMachineSelect(machine));
    }

    return historyItem;
  }

  /**
   * ========================================
   * HELPER FUNCTIONS
   * ========================================
   */

  /**
   * Format timestamp to relative time (German)
   */
  private formatRelativeTime(timestamp: number): string {
    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    const weeks = Math.floor(days / 7);

    if (seconds < 60) {
      return t('identify.time.justNow');
    } else if (minutes < 60) {
      return t('identify.time.minutesAgo', { minutes: String(minutes) });
    } else if (hours < 24) {
      return t('identify.time.hoursAgo', { hours: String(hours) });
    } else if (days < 7) {
      return days === 1 ? t('identify.time.dayAgo') : t('identify.time.daysAgo', { days: String(days) });
    } else {
      return weeks === 1 ? t('identify.time.weekAgo') : t('identify.time.weeksAgo', { weeks: String(weeks) });
    }
  }

  /**
   * Get localized status label
   */
  private getStatusLabel(status: DiagnosisResult['status']): string {
    switch (status) {
      case 'healthy':
        return t('status.healthy');
      case 'uncertain':
        return t('status.uncertain');
      case 'faulty':
        return t('status.faulty');
      default:
        return t('status.unknown');
    }
  }

  /**
   * Handle "Neue Maschine" button click
   * Scrolls to the machine creation section and focuses the input
   */
  private handleAddNewMachine(): void {
    const createSection = document.getElementById('create-machine-form');
    const nameInput = document.getElementById('machine-name-input') as HTMLInputElement | null;

    if (createSection) {
      createSection.scrollIntoView({ behavior: 'smooth', block: 'center' });

      // Focus the input after scrolling
      setTimeout(() => {
        if (nameInput) {
          nameInput.focus();
        }
      }, 500);
    } else {
      // Fallback: just focus the input
      if (nameInput) {
        nameInput.focus();
      }
    }
  }

  /**
   * Cleanup on phase exit
   */
  public cleanup(): void {
    if (this.currentAudioStream) {
      this.currentAudioStream.getTracks().forEach((track) => track.stop());
      this.currentAudioStream = null;
    }
  }
}
