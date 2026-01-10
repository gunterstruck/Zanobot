/**
 * ZANOBOT - PHASE 1: IDENTIFY
 *
 * Entry point of the app flow.
 * User identifies a machine via:
 * - QR/Barcode scan
 * - Manual entry
 */

import { saveMachine, getMachine } from '@data/db.js';
import type { Machine } from '@data/types.js';

export class IdentifyPhase {
  private onMachineSelected: (machine: Machine) => void;

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
  }

  /**
   * Handle QR/Barcode scan
   */
  private async handleScan(): Promise<void> {
    try {
      // TODO: Implement actual barcode scanning
      // For now, use a prompt as placeholder

      const scannedCode = prompt('Enter barcode/QR code (temporary input):');

      if (!scannedCode) {
        return;
      }

      // Check if machine exists
      let machine = await getMachine(scannedCode);

      if (!machine) {
        // Create new machine from scanned code
        machine = {
          id: scannedCode,
          name: `Machine ${scannedCode}`,
          createdAt: Date.now(),
        };

        await saveMachine(machine);
        this.showNotification(`New machine created: ${machine.name}`);
      } else {
        this.showNotification(`Machine loaded: ${machine.name}`);
      }

      this.onMachineSelected(machine);
    } catch (error) {
      console.error('Scan error:', error);
      this.showError('Failed to scan barcode');
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
      const id = idInput.value.trim() || this.generateMachineId();

      if (!name) {
        this.showError('Please enter a machine name');
        return;
      }

      // Check if ID already exists
      const existing = await getMachine(id);
      if (existing) {
        this.showError('A machine with this ID already exists');
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

      this.showNotification(`Machine created: ${name}`);
      this.onMachineSelected(machine);
    } catch (error) {
      console.error('Create machine error:', error);
      this.showError('Failed to create machine');
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
