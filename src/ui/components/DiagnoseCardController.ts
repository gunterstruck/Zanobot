/**
 * ZANOBOT - DiagnoseCardController
 *
 * Controls the state-based UI of the "Zustand prüfen" card.
 * Manages transitions between:
 * - State B: No machine selected (shows three equal action buttons)
 * - State A: Machine selected (shows machine info + ANALYSIEREN button)
 */

import type { Machine } from '@data/types.js';
import { logger } from '@utils/logger.js';
import { t } from '../../i18n/index.js';

export class DiagnoseCardController {
  // State tracking
  private currentMachine: Machine | null = null;

  // UI Elements
  private noMachineState: HTMLElement | null = null;
  private machineReadyState: HTMLElement | null = null;
  private machineNameDisplay: HTMLElement | null = null;
  private machineMetaDisplay: HTMLElement | null = null;

  // Callbacks
  private onMachineSelected: ((machine: Machine) => void) | null = null;
  private onScanRequested: (() => void) | null = null;
  private onSelectRequested: (() => void) | null = null;
  private onCreateRequested: (() => void) | null = null;

  constructor() {
    // Elements will be initialized in init()
  }

  /**
   * Initialize the controller and set up event listeners
   */
  public init(callbacks: {
    onMachineSelected: (machine: Machine) => void;
    onScanRequested: () => void;
    onSelectRequested: () => void;
    onCreateRequested: () => void;
  }): void {
    this.onMachineSelected = callbacks.onMachineSelected;
    this.onScanRequested = callbacks.onScanRequested;
    this.onSelectRequested = callbacks.onSelectRequested;
    this.onCreateRequested = callbacks.onCreateRequested;

    // Get UI elements
    this.noMachineState = document.getElementById('diagnose-no-machine');
    this.machineReadyState = document.getElementById('diagnose-machine-ready');
    this.machineNameDisplay = document.getElementById('diagnose-selected-machine-name');
    this.machineMetaDisplay = document.getElementById('diagnose-selected-machine-meta');

    // Set up event listeners
    this.setupEventListeners();

    // Show initial state (no machine selected)
    this.showNoMachineState();

    logger.debug('[DiagnoseCardController] Initialized');
  }

  /**
   * Set up event listeners for UI interactions
   */
  private setupEventListeners(): void {
    // Scan button
    const scanBtn = document.getElementById('diagnose-scan-btn');
    if (scanBtn) {
      scanBtn.addEventListener('click', () => {
        if (this.onScanRequested) {
          this.onScanRequested();
        }
      });
    }

    // Select existing machine button
    const selectBtn = document.getElementById('diagnose-select-btn');
    if (selectBtn) {
      selectBtn.addEventListener('click', () => {
        if (this.onSelectRequested) {
          this.onSelectRequested();
        }
      });
    }

    // Create new machine button
    const createBtn = document.getElementById('diagnose-create-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        if (this.onCreateRequested) {
          this.onCreateRequested();
        }
      });
    }

    // Change machine button (in State A)
    const changeMachineBtn = document.getElementById('diagnose-change-machine-btn');
    if (changeMachineBtn) {
      changeMachineBtn.addEventListener('click', () => {
        this.showNoMachineState();
        this.currentMachine = null;
      });
    }
  }

  /**
   * Update the card to show machine-selected state (State A)
   */
  public setMachine(machine: Machine): void {
    this.currentMachine = machine;
    this.showMachineReadyState(machine);
    logger.debug(`[DiagnoseCardController] Machine set: ${machine.name}`);
  }

  /**
   * Clear the selected machine and show selection state (State B)
   */
  public clearMachine(): void {
    this.currentMachine = null;
    this.showNoMachineState();
    logger.debug('[DiagnoseCardController] Machine cleared');
  }

  /**
   * Get the currently selected machine
   */
  public getCurrentMachine(): Machine | null {
    return this.currentMachine;
  }

  /**
   * Show the no-machine-selected state (State B)
   */
  private showNoMachineState(): void {
    if (this.noMachineState) {
      this.noMachineState.style.display = 'block';
    }
    if (this.machineReadyState) {
      this.machineReadyState.style.display = 'none';
    }
  }

  /**
   * Show the machine-ready state (State A)
   */
  private showMachineReadyState(machine: Machine): void {
    if (this.noMachineState) {
      this.noMachineState.style.display = 'none';
    }
    if (this.machineReadyState) {
      this.machineReadyState.style.display = 'block';
    }

    // Update machine info display
    if (this.machineNameDisplay) {
      this.machineNameDisplay.textContent = machine.name;
    }

    // Update meta info
    if (this.machineMetaDisplay) {
      const metaText = this.getMachineMetaText(machine);
      this.machineMetaDisplay.textContent = metaText;
      this.machineMetaDisplay.style.display = metaText ? 'block' : 'none';
    }
  }

  /**
   * Generate meta text for the machine (e.g., trained states count)
   */
  private getMachineMetaText(machine: Machine): string {
    if (machine.referenceModels && machine.referenceModels.length > 0) {
      const count = machine.referenceModels.length;
      return t('diagnose.statesReady', { count: String(count) });
    }
    return t('diagnose.noReference');
  }
}
