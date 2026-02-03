/**
 * ZANOBOT - ROUTER
 *
 * Simple state manager that controls the 4-phase flow:
 * Phase 1: Identify → Phase 2: Reference / Phase 3: Diagnose
 * Phase 4: Settings (always available, independent of machine selection)
 *
 * The user MUST select a machine (Phase 1) before accessing Phase 2 or 3.
 *
 * DETECTION MODE SUPPORT:
 * - STATIONARY (Level 1): Uses GMIA analysis (ReferencePhase, DiagnosePhase)
 * - CYCLIC (Level 2): Uses YAMNet ML analysis (Level2ReferencePhase, Level2DiagnosePhase)
 */

import { IdentifyPhase } from './phases/1-Identify.js';
import { ReferencePhase } from './phases/2-Reference.js';
import { DiagnosePhase } from './phases/3-Diagnose.js';
import { SettingsPhase } from './phases/4-Settings.js';
import { Level2ReferencePhase } from './phases/Level2-Reference.js';
import { Level2DiagnosePhase } from './phases/Level2-Diagnose.js';
import { DiagnoseCardController } from './components/DiagnoseCardController.js';
import { getDetectionModeManager } from '@core/detection-mode.js';
import type { DetectionMode } from '@data/types.js';
import type { Machine } from '@data/types.js';
import { logger } from '@utils/logger.js';
import { t } from '../i18n/index.js';

export class Router {
  private currentMachine: Machine | null = null;
  private identifyPhase: IdentifyPhase;
  private settingsPhase: SettingsPhase;

  // Level 1 (GMIA) phases
  private referencePhase: ReferencePhase | null = null;
  private diagnosePhase: DiagnosePhase | null = null;

  // Level 2 (YAMNet) phases
  private level2ReferencePhase: Level2ReferencePhase | null = null;
  private level2DiagnosePhase: Level2DiagnosePhase | null = null;

  // Diagnose card state controller
  private diagnoseCardController: DiagnoseCardController;

  // Mode management
  private modeManager = getDetectionModeManager();
  private unsubscribeModeChange?: () => void;

  constructor() {
    // Initialize Phase 1 (always available)
    this.identifyPhase = new IdentifyPhase((machine) => this.onMachineSelected(machine));
    this.identifyPhase.init();

    // Initialize Phase 4 (Settings - always available, independent of machine selection)
    this.settingsPhase = new SettingsPhase();
    this.settingsPhase.init();

    // Initialize DiagnoseCardController for state-based UI
    this.diagnoseCardController = new DiagnoseCardController();
    this.diagnoseCardController.init({
      onMachineSelected: (machine) => this.onMachineSelected(machine),
      onScanRequested: () => this.handleDiagnoseScanRequest(),
      onCreateRequested: () => this.handleDiagnoseCreateRequest(),
    });

    // Lock Phase 2 and 3 initially
    this.lockPhases();

    // Set initial mode visibility
    this.updateModeVisibility(this.modeManager.getMode());

    // Subscribe to mode changes
    this.unsubscribeModeChange = this.modeManager.onModeChange((newMode, oldMode) => {
      logger.info(`🔄 Detection mode changed: ${oldMode} → ${newMode}`);
      this.handleModeChange(newMode);
    });
  }

  /**
   * Called when a machine is selected in Phase 1
   */
  private onMachineSelected(machine: Machine): void {
    logger.info(`🤖 Machine selected: ${machine.name} (${machine.id})`);

    // DEBUG LOGGING: Show selected machine details
    logger.debug('🎯 Machine Selection Debug:', {
      machineId: machine.id,
      machineName: machine.name,
      createdAt: new Date(machine.createdAt).toLocaleString(),
      numModels: machine.referenceModels?.length || 0,
      models: machine.referenceModels?.map(m => ({
        label: m.label,
        trainingDate: new Date(m.trainingDate).toLocaleString(),
        weightMagnitude: m.metadata?.weightMagnitude?.toFixed(6) || 'N/A',
      })) || [],
    });

    // Stop any active IdentifyPhase resources (e.g., temporary microphone streams)
    this.identifyPhase.cleanup();

    this.currentMachine = machine;

    // Update UI to show selected machine
    this.updateMachineDisplay(machine);

    // Update diagnose card state to show machine info
    this.diagnoseCardController.setMachine(machine);

    // Unlock Phase 2 and 3
    this.unlockPhases();

    // Collapse the machine selection container after successful selection
    this.collapseSection('select-machine-content');

    // Initialize Phase 2 and 3 with the selected machine
    this.initializePhases(machine);
  }

  /**
   * Handle scan request from diagnose card
   * Opens the scanner modal via IdentifyPhase
   */
  private handleDiagnoseScanRequest(): void {
    logger.info('📷 Scan requested from diagnose card');
    // Trigger the scan button click in the identify phase
    const scanBtn = document.getElementById('scan-btn');
    if (scanBtn) {
      scanBtn.click();
    }
  }

  /**
   * Handle create machine request from diagnose card
   * Expands the machine selection section and focuses on name input
   */
  private handleDiagnoseCreateRequest(): void {
    logger.info('➕ Create machine requested from diagnose card');
    // Expand the machine selection section
    this.expandSection('select-machine-content');
    // Focus on the name input
    const nameInput = document.getElementById('machine-name-input') as HTMLInputElement;
    if (nameInput) {
      nameInput.focus();
    }
  }

  /**
   * Expand a collapsible section by content ID
   */
  private expandSection(sectionId: string): void {
    const content = document.getElementById(sectionId);
    if (!content) {
      return;
    }

    const computedDisplay = window.getComputedStyle(content).display;
    if (computedDisplay === 'none') {
      content.style.display = content.dataset.originalDisplay || 'block';
    }

    const header = document.querySelector(`.section-header[data-target="${sectionId}"]`);
    const icon = header?.querySelector('.collapse-icon');
    if (icon) {
      icon.classList.add('rotated');
    }
  }

  /**
   * Initialize Phase 2 (Reference) and Phase 3 (Diagnose)
   * Initializes the appropriate phases based on current detection mode.
   */
  private initializePhases(machine: Machine): void {
    // Cleanup all previous instances with error handling
    this.cleanupAllPhases();

    // Get selected microphone device ID from Phase 1
    const selectedDeviceId = this.identifyPhase.getSelectedDeviceId();
    logger.info(`📱 Using microphone device: ${selectedDeviceId || 'default'}`);

    const currentMode = this.modeManager.getMode();
    logger.info(`🎯 Initializing phases for mode: ${currentMode}`);

    if (currentMode === 'STATIONARY') {
      // Level 1: GMIA analysis
      this.initializeLevel1Phases(machine, selectedDeviceId);
    } else {
      // Level 2: YAMNet ML analysis
      this.initializeLevel2Phases(machine, selectedDeviceId);
    }

    // Update mode visibility in UI
    this.updateModeVisibility(currentMode);
  }

  /**
   * Initialize Level 1 (GMIA) phases
   */
  private initializeLevel1Phases(machine: Machine, selectedDeviceId?: string): void {
    logger.info('📊 Initializing Level 1 (GMIA) phases');

    // Create Level 1 instances
    this.referencePhase = new ReferencePhase(machine, selectedDeviceId);
    this.referencePhase.init();

    this.diagnosePhase = new DiagnosePhase(machine, selectedDeviceId);
    this.diagnosePhase.init();

    // Register callback to update UI when reference model is saved
    this.referencePhase.setOnMachineUpdated((updatedMachine) => {
      if (this.diagnosePhase) {
        this.diagnosePhase.setMachine(updatedMachine);
      }
      this.updateMachineDisplay(updatedMachine);
    });
  }

  /**
   * Initialize Level 2 (YAMNet ML) phases
   */
  private async initializeLevel2Phases(machine: Machine, selectedDeviceId?: string): Promise<void> {
    logger.info('🔄 Initializing Level 2 (YAMNet) phases');

    // Create Level 2 instances
    this.level2ReferencePhase = new Level2ReferencePhase(machine, selectedDeviceId);
    this.level2DiagnosePhase = new Level2DiagnosePhase(machine, selectedDeviceId);

    // Render into containers
    this.level2ReferencePhase.render('level2-reference-container');
    this.level2DiagnosePhase.render('level2-diagnose-container');

    // CRITICAL: Register callback to update diagnose phase when reference is created
    // This ensures the diagnose phase reloads the reference after training
    this.level2ReferencePhase.setOnComplete(async () => {
      logger.info('🔄 Level 2 reference created, reloading in diagnose phase...');
      if (this.level2DiagnosePhase) {
        await this.level2DiagnosePhase.reloadReference();
      }
    });

    // Initialize ML models asynchronously
    try {
      await Promise.all([
        this.level2ReferencePhase.initialize(),
        this.level2DiagnosePhase.initialize(),
      ]);
      logger.info('✅ Level 2 phases initialized successfully');
    } catch (error) {
      logger.error('❌ Error initializing Level 2 phases:', error);
    }
  }

  /**
   * Cleanup all phase instances
   */
  private cleanupAllPhases(): void {
    // Cleanup Level 1 phases
    if (this.referencePhase) {
      try {
        this.referencePhase.destroy();
      } catch (error) {
        logger.warn('⚠️ Error destroying reference phase:', error);
      }
      this.referencePhase = null;
    }
    if (this.diagnosePhase) {
      try {
        this.diagnosePhase.destroy();
      } catch (error) {
        logger.warn('⚠️ Error destroying diagnose phase:', error);
      }
      this.diagnosePhase = null;
    }

    // Cleanup Level 2 phases
    if (this.level2ReferencePhase) {
      try {
        this.level2ReferencePhase.destroy();
      } catch (error) {
        logger.warn('⚠️ Error destroying Level 2 reference phase:', error);
      }
      this.level2ReferencePhase = null;
    }
    if (this.level2DiagnosePhase) {
      try {
        this.level2DiagnosePhase.destroy();
      } catch (error) {
        logger.warn('⚠️ Error destroying Level 2 diagnose phase:', error);
      }
      this.level2DiagnosePhase = null;
    }
  }

  /**
   * Handle detection mode change
   * Reinitializes phases for the new mode if a machine is selected.
   */
  private handleModeChange(newMode: DetectionMode): void {
    // Update visibility first
    this.updateModeVisibility(newMode);

    // If a machine is selected, reinitialize phases for the new mode
    if (this.currentMachine) {
      this.initializePhases(this.currentMachine);
    }
  }

  /**
   * Update UI visibility based on detection mode
   */
  private updateModeVisibility(mode: DetectionMode): void {
    // Set mode attribute on body for CSS-based visibility
    document.body.setAttribute('data-detection-mode', mode);

    // Update visibility of mode-specific containers
    const level1Contents = document.querySelectorAll('[data-detection-mode="STATIONARY"]');
    const level2Contents = document.querySelectorAll('[data-detection-mode="CYCLIC"]');

    level1Contents.forEach((el) => {
      (el as HTMLElement).style.display = mode === 'STATIONARY' ? '' : 'none';
    });

    level2Contents.forEach((el) => {
      (el as HTMLElement).style.display = mode === 'CYCLIC' ? '' : 'none';
    });

    logger.debug(`Mode visibility updated: ${mode}`);
  }

  /**
   * Lock Phase 2 and 3 (disable buttons)
   */
  private lockPhases(): void {
    this.setPhaseState('record-reference-content', false);
    this.setPhaseState('run-diagnosis-content', false);
  }

  /**
   * Unlock Phase 2 and 3 (enable buttons)
   */
  private unlockPhases(): void {
    this.setPhaseState('record-reference-content', true);
    this.setPhaseState('run-diagnosis-content', true);
  }

  /**
   * Enable/disable a phase section
   */
  private setPhaseState(sectionId: string, enabled: boolean): void {
    const section = document.getElementById(sectionId);
    if (!section) return;

    const buttons = section.querySelectorAll('button');
    buttons.forEach((btn) => {
      btn.disabled = !enabled;
      btn.style.opacity = enabled ? '1' : '0.5';
      btn.style.cursor = enabled ? 'pointer' : 'not-allowed';
    });
  }

  /**
   * Update UI to display selected machine info
   */
  private updateMachineDisplay(machine: Machine): void {
    // Update user name in header
    const userName = document.getElementById('user-name');
    if (userName) {
      userName.textContent = machine.name;
    }

    // Show reference status (MULTICLASS)
    const recordSection = document.getElementById('record-reference-content');
    if (recordSection) {
      const description = recordSection.querySelector('.sub-description');
      if (description) {
        if (machine.referenceModels && machine.referenceModels.length > 0) {
          const count = machine.referenceModels.length;
          // CRITICAL FIX: Sort by trainingDate with defensive fallback for missing dates
          // This prevents crashes if any model has undefined/null trainingDate
          const sortedModels = [...machine.referenceModels].sort(
            (a, b) => (b.trainingDate || 0) - (a.trainingDate || 0)
          );
          // CRITICAL FIX: Use toLocaleString() instead of toLocaleDateString() to include time
          const latestTimestamp = sortedModels[0]?.trainingDate;
          const latestDate = latestTimestamp
            ? new Date(latestTimestamp).toLocaleString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : t('common.unknown');
          description.textContent = t('router.statesTrained', { count: String(count), plural: count > 1 ? 'e' : '', date: latestDate });
        } else {
          description.textContent = t('router.referenceRequired');
        }
      }
    }

    // Show/hide diagnosis availability
    const diagnoseSection = document.getElementById('run-diagnosis-content');
    if (diagnoseSection) {
      const description = diagnoseSection.querySelector('.sub-description');
      if (description) {
        if (machine.referenceModels && machine.referenceModels.length > 0) {
          description.textContent = t('router.liveAnalysis');
        } else {
          description.textContent = t('router.referenceRequired');
        }
      }
    }
  }

  /**
   * Collapse a collapsible section by content ID
   */
  private collapseSection(sectionId: string): void {
    const content = document.getElementById(sectionId);
    if (!content) {
      return;
    }

    if (!content.dataset.originalDisplay) {
      const computedStyle = window.getComputedStyle(content);
      content.dataset.originalDisplay = computedStyle.display;
    }

    const computedDisplay = window.getComputedStyle(content).display;
    if (computedDisplay !== 'none') {
      content.style.display = 'none';
    }

    const header = document.querySelector(`.section-header[data-target="${sectionId}"]`);
    const icon = header?.querySelector('.collapse-icon');
    if (icon) {
      icon.classList.remove('rotated');
    }
  }
}
