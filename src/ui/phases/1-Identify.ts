/**
 * ZANOBOT - PHASE 1: IDENTIFY
 *
 * Entry point of the app flow.
 * User identifies a machine via:
 * - QR/Barcode scan (with integrated camera scanner)
 * - Manual entry
 */

import { saveMachine, getMachine, getAllMachines } from '@data/db.js';
import { notify } from '@utils/notifications.js';
import type { Machine } from '@data/types.js';
import { Html5Qrcode } from 'html5-qrcode';
import { logger } from '@utils/logger.js';
import {
  HardwareCheck,
  type AudioQualityReport,
  type AudioDeviceInfo,
} from '@core/audio/HardwareCheck.js';
import { getRawAudioStream, AUDIO_CONSTRAINTS } from '@core/audio/audioHelper.js';

export class IdentifyPhase {
  private onMachineSelected: (machine: Machine) => void;
  private html5QrCode: Html5Qrcode | null = null;
  private scannerModal: HTMLElement | null = null;
  private isScanning: boolean = false;

  // Hardware Intelligence
  private currentAudioStream: MediaStream | null = null;
  private selectedDeviceId: string | undefined = undefined;
  private audioQualityReport: AudioQualityReport | null = null;

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
      this.showScannerError('Fehler beim Starten des Scanners');
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
          'Kamerazugriff wurde verweigert',
          'Bitte erlauben Sie den Kamerazugriff in Ihren Browser-Einstellungen'
        );
      } else if (errorName === 'NotFoundError') {
        this.showScannerError(
          'Keine Kamera gefunden',
          'Bitte stellen Sie sicher, dass Ihr Gerät eine Kamera hat'
        );
      } else {
        this.showScannerError(
          'Scanner konnte nicht gestartet werden',
          'Bitte versuchen Sie die manuelle Eingabe'
        );
      }
    }
  }

  /**
   * Handle successful scan
   */
  private async onScanSuccess(decodedText: string, decodedResult: any): Promise<void> {
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
        notify.error('Fehler beim Verarbeiten des QR-Codes', error as Error, {
          title: 'Scanfehler',
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
        this.showError(validation.error || 'Ungültiger Code gescannt');
        return;
      }

      await this.handleMachineId(trimmedCode);
    } catch (error) {
      logger.error('Error processing scanned code:', error);
      this.showError('Fehler beim Verarbeiten des Codes');
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
      successMessage.textContent = `Code erkannt: ${code}`;
    }
  }

  /**
   * Play success beep sound
   */
  private playSuccessBeep(): void {
    try {
      // Create a simple beep using Web Audio API
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
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
      this.showError('Manuelle Eingabe konnte nicht geladen werden');
      return;
    }

    const trimmedCode = manualInput.value.trim();
    const validation = this.validateMachineId(trimmedCode);

    if (!validation.valid) {
      this.showError(validation.error || 'Ungültige Maschinen-ID');
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
   */
  private async handleMachineId(id: string): Promise<void> {
    try {
      const machine = await getMachine(id);

      if (machine) {
        notify.success(`Maschine "${machine.name}" geladen`);
        this.onMachineSelected(machine);
        return;
      }

      const autoName = `Maschine ${id}`;
      const newMachine: Machine = {
        id,
        name: autoName,
        createdAt: Date.now(),
        referenceModels: [],
      };

      await saveMachine(newMachine);
      notify.success(`Neue Maschine "${autoName}" automatisch angelegt.`);
      this.onMachineSelected(newMachine);
    } catch (error) {
      logger.error('Error handling machine ID:', error);
      notify.error('Fehler beim Laden der Maschine', error as Error);
    }
  }

  /**
   * Handle manual machine creation
   */
  private async handleCreateMachine(): Promise<void> {
    try {
      const nameInput = document.getElementById('machine-name-input') as HTMLInputElement;
      const idInput = document.getElementById('machine-id-input') as HTMLInputElement;

      if (!nameInput || !idInput) {
        throw new Error('Input elements not found');
      }

      const name = nameInput.value.trim();
      const idInputValue = idInput.value.trim();

      // Validate name
      if (!name) {
        this.showError('Bitte geben Sie einen Maschinennamen ein');
        return;
      }

      // Validate name is not just whitespace and has reasonable length
      if (!/\S/.test(name)) {
        this.showError('Maschinenname darf nicht nur aus Leerzeichen bestehen');
        return;
      }

      if (name.length > 100) {
        this.showError('Maschinenname ist zu lang (maximal 100 Zeichen)');
        return;
      }

      // Generate or validate ID
      let id: string;
      if (idInputValue) {
        // Validate provided ID
        const validation = this.validateMachineId(idInputValue);
        if (!validation.valid) {
          this.showError(validation.error || 'Ungültige Maschinen-ID');
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
        this.showError('Eine Maschine mit dieser ID existiert bereits');
        return;
      }

      // Create new machine
      const machine: Machine = {
        id,
        name,
        createdAt: Date.now(),
        referenceModels: [], // MULTICLASS: Initialize empty model array
      };

      await saveMachine(machine);

      // DEBUG LOGGING: Show created machine
      logger.debug('✅ Machine Created:', {
        id: machine.id,
        name: machine.name,
        createdAt: new Date(machine.createdAt).toLocaleString(),
      });
      logger.debug('📞 Calling onMachineSelected() with new machine...');

      // Clear inputs
      nameInput.value = '';
      idInput.value = '';

      this.showNotification(`Maschine erstellt: ${name}`);
      this.onMachineSelected(machine);
    } catch (error) {
      logger.error('Create machine error:', error);
      this.showError('Fehler beim Erstellen der Maschine');
    }
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
      return { valid: false, error: 'Maschinen-ID darf nicht leer sein' };
    }

    // Check minimum length (at least 1 character)
    if (trimmedId.length < 1) {
      return { valid: false, error: 'Maschinen-ID ist zu kurz' };
    }

    // Check maximum length (prevent excessive IDs)
    if (trimmedId.length > 100) {
      return { valid: false, error: 'Maschinen-ID ist zu lang (maximal 100 Zeichen)' };
    }

    // Check for only whitespace characters (extra safety)
    if (!/\S/.test(trimmedId)) {
      return { valid: false, error: 'Maschinen-ID darf nicht nur aus Leerzeichen bestehen' };
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
   * ========================================
   * HARDWARE INTELLIGENCE
   * ========================================
   */

  /**
   * Initialize hardware check on page load
   */
  private async initializeHardwareCheck(): Promise<void> {
    let tempStream: MediaStream | null = null;
    try {
      // Request audio stream to check current device
      tempStream = await getRawAudioStream(this.selectedDeviceId);

      // Get current device info
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
      const devices = await HardwareCheck.getAvailableDevices();

      // Get or create modal
      const modal = document.getElementById('microphone-selection-modal');
      if (!modal) {
        logger.error('Microphone selection modal not found in DOM');
        return;
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
      this.showError('Fehler beim Laden der Mikrofone');
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
      notify.success(`Mikrofon gewechselt: ${device.label}`);
    } catch (error) {
      logger.error('Failed to select microphone:', error);
      this.showError('Fehler beim Wechseln des Mikrofons');
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

      this.showNotification(`Maschine geladen: ${machine.name}`);
      this.onMachineSelected(machine);
    } catch (error) {
      logger.error('Failed to quick select machine:', error);
      this.showError('Fehler beim Laden der Maschine');
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
   * Cleanup on phase exit
   */
  public cleanup(): void {
    if (this.currentAudioStream) {
      this.currentAudioStream.getTracks().forEach((track) => track.stop());
      this.currentAudioStream = null;
    }
  }
}
