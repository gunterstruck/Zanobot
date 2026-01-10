/**
 * ZANOBOT - PHASE 1: IDENTIFY
 *
 * Entry point of the app flow.
 * User identifies a machine via:
 * - QR/Barcode scan (with integrated camera scanner)
 * - Manual entry
 */

import { saveMachine, getMachine } from '@data/db.js';
import type { Machine } from '@data/types.js';
import { Html5Qrcode } from 'html5-qrcode';

export class IdentifyPhase {
  private onMachineSelected: (machine: Machine) => void;
  private html5QrCode: Html5Qrcode | null = null;
  private scannerModal: HTMLElement | null = null;
  private isScanning: boolean = false;

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
  }

  /**
   * Handle QR/Barcode scan
   */
  private async handleScan(): Promise<void> {
    try {
      this.openScannerModal();
      await this.startScanner();
    } catch (error) {
      console.error('Scan error:', error);
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
      console.error('Failed to start scanner:', error);
      this.isScanning = false;

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
    console.log('Code detected:', decodedText);

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
      console.debug('Scan attempt:', error);
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
        };

        await saveMachine(machine);
        this.showNotification(`Neue Maschine erstellt: ${machine.name}`);
      } else {
        this.showNotification(`Maschine geladen: ${machine.name}`);
      }

      this.onMachineSelected(machine);
    } catch (error) {
      console.error('Error processing scanned code:', error);
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
        console.error('Error stopping scanner:', error);
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
      console.warn('Could not play beep sound:', error);
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
      };

      await saveMachine(machine);

      // Clear inputs
      nameInput.value = '';
      idInput.value = '';

      this.showNotification(`Maschine erstellt: ${name}`);
      this.onMachineSelected(machine);
    } catch (error) {
      console.error('Create machine error:', error);
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
    // Simple notification (can be enhanced with a toast component)
    console.log(`✅ ${message}`);
    alert(message); // Placeholder
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    console.error(`❌ ${message}`);
    alert(`Error: ${message}`); // Placeholder
  }
}
