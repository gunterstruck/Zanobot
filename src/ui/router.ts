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
import { AutoDetectionPhase } from './phases/AutoDetectionPhase.js';
import { DiagnoseCardController } from './components/DiagnoseCardController.js';
import { ReferenceCardController } from './components/ReferenceCardController.js';
import { getDetectionModeManager } from '@core/detection-mode.js';
import { getAllMachines } from '@data/db.js';
import type { DetectionMode, AutoDetectionResult, MachineMatchResult } from '@data/types.js';
import type { Machine } from '@data/types.js';
import { logger } from '@utils/logger.js';
import { notify } from '@utils/notifications.js';
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

  // Auto-detection phase (simplified flow)
  private autoDetectionPhase: AutoDetectionPhase | null = null;

  // Card state controllers
  private diagnoseCardController: DiagnoseCardController;
  private referenceCardController: ReferenceCardController;

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
      onSelectRequested: () => this.handleDiagnoseSelectRequest(),
      onCreateRequested: () => this.handleDiagnoseCreateRequest(),
      onAutoDetectRequested: () => this.handleAutoDetectRequest(),
    });

    // Initialize ReferenceCardController for state-based UI (mirrors DiagnoseCardController)
    this.referenceCardController = new ReferenceCardController();
    this.referenceCardController.init({
      onScanRequested: () => this.handleReferenceScanRequest(),
      onSelectRequested: () => this.handleReferenceSelectRequest(),
      onCreateRequested: () => this.handleReferenceCreateRequest(),
    });

    // Lock Phase 2 and 3 initially
    this.lockPhases();

    // CRITICAL: Explicitly ensure auto-detect buttons are always enabled
    // This is needed because auto-detection works WITHOUT machine pre-selection
    this.ensureAutoDetectButtonsEnabled();

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

    // Update card states to show machine info
    this.diagnoseCardController.setMachine(machine);
    this.referenceCardController.setMachine(machine);

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
   * Handle select existing machine request from diagnose card
   * Checks if machines exist, then expands the machine selection section
   */
  private async handleDiagnoseSelectRequest(): Promise<void> {
    logger.info('📋 Select machine requested from diagnose card');

    try {
      const machines = await getAllMachines();

      if (machines.length === 0) {
        // No machines exist - show hint and redirect to create
        notify.info(t('diagnose.noMachinesYet'), {
          title: t('diagnose.noMachinesHint'),
          duration: 4000,
        });
        // Redirect to create new machine
        this.handleDiagnoseCreateRequest();
        return;
      }

      // Machines exist - show the selection
      this.expandSection('select-machine-content');
      // Scroll to machine overview section
      const machineOverview = document.getElementById('machine-overview');
      if (machineOverview) {
        machineOverview.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (error) {
      logger.error('Error checking machines:', error);
      // Fallback: just expand the section
      this.expandSection('select-machine-content');
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
   * Handle scan request from reference card
   * Opens the scanner modal via IdentifyPhase
   */
  private handleReferenceScanRequest(): void {
    logger.info('📷 Scan requested from reference card');
    // Trigger the scan button click in the identify phase
    const scanBtn = document.getElementById('scan-btn');
    if (scanBtn) {
      scanBtn.click();
    }
  }

  /**
   * Handle select existing machine request from reference card
   * Checks if machines exist, then expands the machine selection section
   */
  private async handleReferenceSelectRequest(): Promise<void> {
    logger.info('📋 Select machine requested from reference card');

    try {
      const machines = await getAllMachines();

      if (machines.length === 0) {
        // No machines exist - show hint and redirect to create
        notify.info(t('reference.noMachinesYet'), {
          title: t('reference.noMachinesHint'),
          duration: 4000,
        });
        // Redirect to create new machine
        this.handleReferenceCreateRequest();
        return;
      }

      // Machines exist - show the selection
      this.expandSection('select-machine-content');
      // Scroll to machine overview section
      const machineOverview = document.getElementById('machine-overview');
      if (machineOverview) {
        machineOverview.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } catch (error) {
      logger.error('Error checking machines:', error);
      // Fallback: just expand the section
      this.expandSection('select-machine-content');
    }
  }

  /**
   * Handle create machine request from reference card
   * Expands the machine selection section and focuses on name input
   */
  private handleReferenceCreateRequest(): void {
    logger.info('➕ Create machine requested from reference card');
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

  // ============================================================================
  // AUTO-DETECTION FLOW (Simplified "Zustand prüfen")
  // ============================================================================

  /**
   * Handle auto-detect request from diagnose card
   * Starts the simplified flow where no machine pre-selection is needed
   */
  private handleAutoDetectRequest(): void {
    logger.info('🔍 Auto-detection requested');

    // Get selected microphone device ID from Phase 1
    const selectedDeviceId = this.identifyPhase.getSelectedDeviceId();

    // Cleanup any existing auto-detection phase
    if (this.autoDetectionPhase) {
      this.autoDetectionPhase.destroy();
      this.autoDetectionPhase = null;
    }

    // Create new auto-detection phase with callbacks
    this.autoDetectionPhase = new AutoDetectionPhase(
      {
        onMachineRecognized: (machine, result) => this.handleMachineRecognized(machine, result),
        onUncertainMatch: (candidates, result) => this.handleUncertainMatch(candidates, result),
        onNoMatch: (result) => this.handleNoMatch(result),
        onCancel: () => this.handleAutoDetectCancel(),
      },
      selectedDeviceId
    );

    // Start detection
    this.autoDetectionPhase.start();
  }

  /**
   * Fall A: Machine recognized with high confidence (≥80%)
   * Auto-select the machine and show diagnosis result
   */
  private handleMachineRecognized(machine: Machine, result: AutoDetectionResult): void {
    logger.info(`✅ Machine auto-recognized: ${machine.name}`);

    // Show recognition result modal
    this.showMachineRecognizedModal(machine, result);
  }

  /**
   * Fall B: Uncertain match (40-79%)
   * Show candidates for user selection
   */
  private handleUncertainMatch(candidates: MachineMatchResult[], result: AutoDetectionResult): void {
    logger.info(`⚠️ Uncertain match with ${candidates.length} candidates`);

    // Show selection modal
    this.showCandidateSelectionModal(candidates, result);
  }

  /**
   * Fall C: No match found (<40%)
   * Show "unknown sound" modal with options
   */
  private handleNoMatch(result: AutoDetectionResult): void {
    logger.info('❌ No matching machine found');

    // Show no-match modal
    this.showNoMatchModal(result);
  }

  /**
   * Auto-detection cancelled by user
   */
  private handleAutoDetectCancel(): void {
    logger.info('🚫 Auto-detection cancelled');

    // Cleanup
    if (this.autoDetectionPhase) {
      this.autoDetectionPhase.destroy();
      this.autoDetectionPhase = null;
    }
  }

  /**
   * Show modal for Fall A: Machine recognized with high confidence
   */
  private showMachineRecognizedModal(machine: Machine, result: AutoDetectionResult): void {
    const modal = document.getElementById('machine-recognized-modal');
    if (!modal) return;

    // Update machine info
    const nameEl = document.getElementById('recognized-machine-name');
    if (nameEl) nameEl.textContent = machine.name;

    const similarityEl = document.getElementById('recognized-similarity');
    if (similarityEl && result.bestMatch) {
      similarityEl.textContent = `${result.bestMatch.similarity.toFixed(0)}%`;
    }

    // Update status based on the match
    const statusEl = document.getElementById('recognized-status');
    if (statusEl && result.bestMatch) {
      const status = result.bestMatch.status;
      statusEl.textContent = status === 'healthy'
        ? t('status.healthy')
        : status === 'faulty'
          ? t('status.faulty')
          : t('status.uncertain');
      statusEl.className = `recognized-status status-${status}`;
    }

    // Setup continue button - proceed to full diagnosis
    const continueBtn = document.getElementById('recognized-continue-btn');
    if (continueBtn) {
      continueBtn.onclick = () => {
        modal.style.display = 'none';
        this.onMachineSelected(machine);
        // Auto-start diagnosis with the recognized machine
        setTimeout(() => {
          const diagnoseBtn = document.getElementById('diagnose-btn');
          if (diagnoseBtn) diagnoseBtn.click();
        }, 100);
      };
    }

    // Setup "different machine" button
    const differentBtn = document.getElementById('recognized-different-btn');
    if (differentBtn) {
      differentBtn.onclick = () => {
        modal.style.display = 'none';
        this.expandSection('select-machine-content');
      };
    }

    modal.style.display = 'flex';
  }

  /**
   * Show modal for Fall B: Uncertain match with candidate selection
   */
  private showCandidateSelectionModal(candidates: MachineMatchResult[], result: AutoDetectionResult): void {
    const modal = document.getElementById('candidate-selection-modal');
    if (!modal) return;

    // Build candidate list
    const listEl = document.getElementById('candidate-list');
    if (listEl) {
      listEl.innerHTML = '';

      candidates.forEach((candidate, index) => {
        const item = document.createElement('button');
        item.className = 'candidate-item';
        item.innerHTML = `
          <div class="candidate-info">
            <span class="candidate-name">${candidate.machine.name}</span>
            <span class="candidate-similarity">${candidate.similarity.toFixed(0)}%</span>
          </div>
          <div class="candidate-status status-${candidate.status}">
            ${candidate.status === 'healthy' ? t('status.healthy') : candidate.status === 'faulty' ? t('status.faulty') : t('status.uncertain')}
          </div>
        `;
        item.onclick = () => {
          modal.style.display = 'none';
          this.onMachineSelected(candidate.machine);
          // Auto-start diagnosis
          setTimeout(() => {
            const diagnoseBtn = document.getElementById('diagnose-btn');
            if (diagnoseBtn) diagnoseBtn.click();
          }, 100);
        };
        listEl.appendChild(item);
      });

      // Add "New machine" option
      const newMachineItem = document.createElement('button');
      newMachineItem.className = 'candidate-item candidate-new';
      newMachineItem.innerHTML = `
        <div class="candidate-info">
          <span class="candidate-name">${t('autoDetect.newMachine')}</span>
        </div>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"/>
          <line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      `;
      newMachineItem.onclick = () => {
        modal.style.display = 'none';
        this.handleDiagnoseCreateRequest();
      };
      listEl.appendChild(newMachineItem);
    }

    // Setup cancel button
    const cancelBtn = document.getElementById('candidate-cancel-btn');
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        modal.style.display = 'none';
      };
    }

    modal.style.display = 'flex';
  }

  /**
   * Show modal for Fall C: No match found
   */
  private showNoMatchModal(result: AutoDetectionResult): void {
    const modal = document.getElementById('no-match-modal');
    if (!modal) return;

    // Setup "Record reference" button
    const recordRefBtn = document.getElementById('no-match-record-btn');
    if (recordRefBtn) {
      recordRefBtn.onclick = () => {
        modal.style.display = 'none';
        // Open reference section and create flow
        this.handleReferenceCreateRequest();
      };
    }

    // Setup "New machine" button
    const newMachineBtn = document.getElementById('no-match-new-machine-btn');
    if (newMachineBtn) {
      newMachineBtn.onclick = () => {
        modal.style.display = 'none';
        this.handleDiagnoseCreateRequest();
      };
    }

    // Setup cancel button
    const cancelBtn = document.getElementById('no-match-cancel-btn');
    if (cancelBtn) {
      cancelBtn.onclick = () => {
        modal.style.display = 'none';
      };
    }

    modal.style.display = 'flex';
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
      // Skip diagnose tile buttons - they should always be clickable
      // to allow machine selection even when phase is "locked"
      if (btn.classList.contains('diagnose-tile')) {
        return;
      }
      // Skip auto-detect button - it should always be clickable since
      // auto-detection works without requiring machine pre-selection
      if (btn.classList.contains('auto-detect-btn')) {
        return;
      }
      // Skip manual selection toggle - always needs to be clickable
      if (btn.classList.contains('manual-selection-toggle')) {
        return;
      }
      btn.disabled = !enabled;
      btn.style.opacity = enabled ? '1' : '0.5';
      btn.style.cursor = enabled ? 'pointer' : 'not-allowed';
    });
  }

  /**
   * Explicitly ensure auto-detect buttons are always enabled
   * Called after lockPhases() to guarantee these buttons remain clickable
   */
  private ensureAutoDetectButtonsEnabled(): void {
    // Auto-detect button
    const autoDetectBtn = document.getElementById('diagnose-auto-detect-btn');
    if (autoDetectBtn instanceof HTMLButtonElement) {
      autoDetectBtn.disabled = false;
      autoDetectBtn.style.opacity = '1';
      autoDetectBtn.style.cursor = 'pointer';
      autoDetectBtn.style.pointerEvents = 'auto';
      logger.debug('[Router] Auto-detect button explicitly enabled');
    }

    // Manual selection toggle
    const manualToggleBtn = document.getElementById('diagnose-show-manual-btn');
    if (manualToggleBtn instanceof HTMLButtonElement) {
      manualToggleBtn.disabled = false;
      manualToggleBtn.style.opacity = '1';
      manualToggleBtn.style.cursor = 'pointer';
      manualToggleBtn.style.pointerEvents = 'auto';
      logger.debug('[Router] Manual selection toggle explicitly enabled');
    }
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
