/**
 * ZANOBOT - PHASE 1: IDENTIFY
 *
 * Entry point of the app flow.
 * User identifies a machine via:
 * - QR/Barcode scan (with integrated camera scanner)
 * - Manual entry
 */

import { saveMachine, getMachine } from '@data/db.js';
import { notify } from '@utils/notifications.js';
import type { Machine } from '@data/types.js';
import { Html5Qrcode } from 'html5-qrcode';
import { logger } from '@utils/logger.js';
import { HardwareCheck, type AudioQualityReport, type AudioDeviceInfo } from '@core/audio/HardwareCheck.js';
import { getRawAudioStream } from '@core/audio/audioHelper.js';

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

    if (closeScannerBtn) {
      closeScannerBtn.addEventListener('click', () => this.closeScanner());
    }

    if (manualInputBtn) {
      manualInputBtn.addEventListener('click', () => this.handleManualInput());
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
          // @ts-ignore - Html5QrcodeSupportedFormats is available
          0,  // QR_CODE
          8,  // CODE_128
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
    } catch (error: any) {
      logger.error('Failed to start scanner:', error);
      this.isScanning = false;
      // Clean up scanner instance on error to prevent stale state
      this.html5QrCode = null;

      // Check if it's a permission error
      if (error?.name === 'NotAllowedError' || error?.message?.includes('Permission')) {
        this.showScannerError(
          'Kamerazugriff wurde verweigert',
          'Bitte erlauben Sie den Kamerazugriff in Ihren Browser-Einstellungen'
        );
      } else if (error?.name === 'NotFoundError') {
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
      await this.processScannedCode(decodedText);
      this.closeScanner();
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
      // Check if machine exists
      let machine = await getMachine(code);

      if (!machine) {
        // Create new machine from scanned code
        machine = {
          id: code,
          name: `Machine ${code}`,
          createdAt: Date.now(),
          referenceModels: [], // MULTICLASS: Initialize empty model array
        };

        await saveMachine(machine);
        this.showNotification(`Neue Maschine erstellt: ${machine.name}`);
      } else {
        this.showNotification(`Maschine geladen: ${machine.name}`);
      }

      this.onMachineSelected(machine);
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
    if (errorHint && hint) {
      errorHint.textContent = hint;
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
    } catch (error) {
      logger.warn('Could not play beep sound:', error);
    }
  }

  /**
   * Handle manual input from scanner modal
   */
  private async handleManualInput(): Promise<void> {
    await this.closeScanner();

    // Prompt for manual input
    const scannedCode = prompt('Barcode/QR-Code manuell eingeben:');

    if (!scannedCode) {
      return;
    }

    await this.processScannedCode(scannedCode);
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
      const id = idInput.value.trim() || this.generateMachineId();

      if (!name) {
        this.showError('Bitte geben Sie einen Maschinennamen ein');
        return;
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
        const audioTrack = tempStream.getAudioTracks()[0];
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

      // CRITICAL FIX: Stop temporary stream immediately after hardware check
      // This prevents resource leak and keeps microphone available for actual recordings
      if (tempStream) {
        tempStream.getTracks().forEach((track) => track.stop());
        tempStream = null;
      }
    } catch (error) {
      logger.error('Failed to initialize hardware check:', error);
      // CRITICAL FIX: Ensure stream is stopped even on error
      if (tempStream) {
        tempStream.getTracks().forEach((track) => track.stop());
      }
      // Don't block user flow - just log the error
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
      let modal = document.getElementById('microphone-selection-modal');
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
        const tempReport = HardwareCheck.analyzeCurrentDevice(device.label, 44100);
        const statusClass = tempReport.status === 'good' ? 'status-good' : 'status-warning';

        deviceItem.innerHTML = `
          <div class="device-info">
            <div class="device-icon ${statusClass}">
              ${
                tempReport.status === 'good'
                  ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                      <polyline points="22 4 12 14.01 9 11.01"/>
                    </svg>`
                  : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>`
              }
            </div>
            <div class="device-details">
              <div class="device-name">${device.label}</div>
              <div class="device-status">${tempReport.reason}</div>
            </div>
          </div>
          ${
            isSelected
              ? '<div class="device-checkmark"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg></div>'
              : ''
          }
        `;

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
      const audioTrack = this.currentAudioStream.getAudioTracks()[0];
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
   * Cleanup on phase exit
   */
  public cleanup(): void {
    if (this.currentAudioStream) {
      this.currentAudioStream.getTracks().forEach((track) => track.stop());
      this.currentAudioStream = null;
    }
  }
}
