/**
 * ZANOBOT - ROUTER
 *
 * Simple state manager that controls the 4-phase flow:
 * Phase 1: Identify → Phase 2: Reference / Phase 3: Diagnose
 * Phase 4: Settings (always available, independent of machine selection)
 *
 * The user MUST select a machine (Phase 1) before accessing Phase 2 or 3.
 *
 * Uses GMIA analysis (ReferencePhase, DiagnosePhase) for Gaussian model detection.
 */

import { IdentifyPhase } from './phases/1-Identify.js';
import { ReferencePhase } from './phases/2-Reference.js';
import { DiagnosePhase } from './phases/3-Diagnose.js';
import { SettingsPhase } from './phases/4-Settings.js';
import { AutoDetectionPhase } from './phases/AutoDetectionPhase.js';
import { DiagnoseCardController } from './components/DiagnoseCardController.js';
import { ReferenceCardController } from './components/ReferenceCardController.js';
import { getAllMachines } from '@data/db.js';
import type { AutoDetectionResult, MachineMatchResult } from '@data/types.js';
import type { Machine } from '@data/types.js';
import { logger } from '@utils/logger.js';
import { notify } from '@utils/notifications.js';
import { escapeHtml } from '@utils/sanitize.js';
import { t, getLocale, LANGUAGE_CHANGE_EVENT } from '../i18n/index.js';
import { getRecordingSettings, RECORDING_SETTINGS_EVENT } from '@utils/recordingSettings.js';

export class Router {
  private currentMachine: Machine | null = null;
  private identifyPhase: IdentifyPhase;
  private settingsPhase: SettingsPhase;

  // GMIA phases
  private referencePhase: ReferencePhase | null = null;
  private diagnosePhase: DiagnosePhase | null = null;

  // Auto-detection phase (simplified flow)
  private autoDetectionPhase: AutoDetectionPhase | null = null;

  // Card state controllers
  private diagnoseCardController: DiagnoseCardController;
  private referenceCardController: ReferenceCardController;

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

    // Lock Phase 3 initially, but keep Phase 2 (Reference) available for zero-friction
    this.lockPhases();

    // CRITICAL: Explicitly ensure auto-detect buttons are always enabled
    // This is needed because auto-detection works WITHOUT machine pre-selection
    this.ensureAutoDetectButtonsEnabled();

    // CRITICAL: Ensure tile buttons (QR scannen, Maschine wählen, Neue Maschine) are always clickable
    this.ensureTileButtonsEnabled();

    // ZERO-FRICTION: Initialize reference phase without machine for zero-friction recording
    // This allows users to start recording immediately without selecting a machine first
    this.initializeZeroFrictionReferencePhase();

    // CRITICAL FIX: Update duration-dependent UI texts on init and when settings change
    // This ensures the displayed recording duration always matches the user's settings
    this.updateRecordingDurationTexts();

    // Listen for recording settings changes to update duration texts immediately
    window.addEventListener(RECORDING_SETTINGS_EVENT, () => {
      this.updateRecordingDurationTexts();
    });

    // Listen for language changes to re-render duration texts with correct locale
    window.addEventListener(LANGUAGE_CHANGE_EVENT, () => {
      this.updateRecordingDurationTexts();
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
    this.navigateToNewMachineInput();
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
    this.navigateToNewMachineInput();
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
   * Navigate to new machine input field
   * Expands the section, scrolls smoothly, focuses input, and adds visual feedback
   */
  private navigateToNewMachineInput(): void {
    // Step 1: Expand the machine selection section
    this.expandSection('select-machine-content');

    // Step 2: Wait for DOM update, then scroll and focus
    requestAnimationFrame(() => {
      const nameInput = document.getElementById('machine-name-input') as HTMLInputElement;
      if (!nameInput) {
        logger.warn('machine-name-input element not found');
        return;
      }

      // Step 3: Scroll the input into view with smooth animation
      nameInput.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });

      // Step 4: After scroll completes (~300ms), focus and add highlight animation
      setTimeout(() => {
        // Focus the input to open keyboard on mobile
        nameInput.focus();

        // Add highlight animation class
        nameInput.classList.add('input-highlight');

        // Remove the animation class after it completes
        setTimeout(() => {
          nameInput.classList.remove('input-highlight');
        }, 1500);
      }, 350);
    });
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
  private showCandidateSelectionModal(candidates: MachineMatchResult[], _result: AutoDetectionResult): void {
    const modal = document.getElementById('candidate-selection-modal');
    if (!modal) return;

    // Build candidate list
    const listEl = document.getElementById('candidate-list');
    if (listEl) {
      listEl.innerHTML = '';

      const ALLOWED_STATUSES = ['healthy', 'faulty', 'uncertain'] as const;

      candidates.forEach((candidate) => {
        const safeStatus = ALLOWED_STATUSES.includes(candidate.status as any)
          ? candidate.status
          : 'uncertain';

        const item = document.createElement('button');
        item.className = 'candidate-item';
        item.innerHTML = `
          <div class="candidate-info">
            <span class="candidate-name">${escapeHtml(candidate.machine.name)}</span>
            <span class="candidate-similarity">${candidate.similarity.toFixed(0)}%</span>
          </div>
          <div class="candidate-status status-${safeStatus}">
            ${safeStatus === 'healthy' ? t('status.healthy') : safeStatus === 'faulty' ? t('status.faulty') : t('status.uncertain')}
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
  private showNoMatchModal(_result: AutoDetectionResult): void {
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
   */
  private initializePhases(machine: Machine): void {
    // Cleanup all previous instances with error handling
    this.cleanupAllPhases();

    // Get selected microphone device ID from Phase 1
    const selectedDeviceId = this.identifyPhase.getSelectedDeviceId();
    logger.info(`📱 Using microphone device: ${selectedDeviceId || 'default'}`);

    // Initialize GMIA analysis phases
    this.initializeLevel1Phases(machine, selectedDeviceId);
  }

  /**
   * Initialize GMIA phases
   */
  private initializeLevel1Phases(machine: Machine, selectedDeviceId?: string): void {
    logger.info('📊 Initializing GMIA phases');

    // Create phase instances
    this.referencePhase = new ReferencePhase(machine, selectedDeviceId);
    this.referencePhase.init();

    this.diagnosePhase = new DiagnosePhase(machine, selectedDeviceId);
    this.diagnosePhase.init();

    // Register callback to update UI when reference model is saved
    this.referencePhase.setOnMachineUpdated((updatedMachine) => {
      // ZERO-FRICTION: Update current machine state when a new machine is auto-created
      this.currentMachine = updatedMachine;

      // Update card controllers with new machine
      this.diagnoseCardController.setMachine(updatedMachine);
      this.referenceCardController.setMachine(updatedMachine);

      if (this.diagnosePhase) {
        this.diagnosePhase.setMachine(updatedMachine);
      }
      this.updateMachineDisplay(updatedMachine);

      // ZERO-FRICTION: Unlock diagnosis phase after machine is created/updated
      this.unlockPhases();
    });
  }

  /**
   * ZERO-FRICTION: Initialize reference phase without machine selection
   * This allows users to start recording immediately without pre-selecting a machine.
   * A new machine will be auto-created when the recording is saved.
   */
  private initializeZeroFrictionReferencePhase(): void {
    logger.info('🎯 Initializing zero-friction reference phase (no machine selected)');

    // Get selected microphone device ID
    const selectedDeviceId = this.identifyPhase.getSelectedDeviceId();

    // Create reference phase without machine (null)
    this.referencePhase = new ReferencePhase(null, selectedDeviceId);
    this.referencePhase.init();

    // Register callback to handle machine creation during zero-friction flow
    this.referencePhase.setOnMachineUpdated((newMachine) => {
      logger.info(`🤖 Zero-friction: Machine created - ${newMachine.name}`);

      // Update router state with new machine
      this.currentMachine = newMachine;

      // Update card controllers
      this.diagnoseCardController.setMachine(newMachine);
      this.referenceCardController.setMachine(newMachine);

      // Update UI display
      this.updateMachineDisplay(newMachine);

      // Initialize diagnose phase with new machine
      this.diagnosePhase = new DiagnosePhase(newMachine, selectedDeviceId);
      this.diagnosePhase.init();

      // Unlock all phases now that we have a machine
      this.unlockPhases();

      // Collapse machine selection section
      this.collapseSection('select-machine-content');
    });

    // Ensure reference button is always enabled for zero-friction
    this.ensureReferenceButtonEnabled();
  }

  /**
   * ZERO-FRICTION: Ensure reference record button is always enabled
   */
  private ensureReferenceButtonEnabled(): void {
    const recordBtn = document.getElementById('record-reference-btn');
    if (recordBtn instanceof HTMLButtonElement) {
      recordBtn.disabled = false;
      recordBtn.style.opacity = '1';
      recordBtn.style.cursor = 'pointer';
      recordBtn.style.pointerEvents = 'auto';
      logger.debug('[Router] Reference record button explicitly enabled for zero-friction');
    }
  }

  /**
   * Cleanup all phase instances
   */
  private cleanupAllPhases(): void {
    // Cleanup phases
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
  }

  /**
   * Lock Phase 2 and 3 (disable buttons)
   */
  private lockPhases(): void {
    this.setPhaseState('record-reference-content', false);
    this.setPhaseState('run-diagnosis-content', false);
    // Safety: re-enable tile buttons that must always stay clickable
    this.ensureTileButtonsEnabled();
  }

  /**
   * Unlock Phase 2 and 3 (enable buttons)
   */
  private unlockPhases(): void {
    this.setPhaseState('record-reference-content', true);
    this.setPhaseState('run-diagnosis-content', true);
    // Safety: re-enable tile buttons that must always stay clickable
    this.ensureTileButtonsEnabled();
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
      // ZERO-FRICTION: Skip reference record button - always enabled for zero-friction recording
      if (btn.id === 'record-reference-btn') {
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
   * Explicitly ensure all diagnose-tile buttons are always enabled
   * Called after lockPhases() to guarantee tile buttons remain clickable
   */
  private ensureTileButtonsEnabled(): void {
    const tileIds = [
      'reference-scan-btn',
      'reference-select-btn',
      'reference-create-btn',
      'diagnose-scan-btn',
      'diagnose-select-btn',
      'diagnose-create-btn',
    ];

    for (const id of tileIds) {
      const btn = document.getElementById(id);
      if (btn instanceof HTMLButtonElement) {
        btn.disabled = false;
        btn.style.opacity = '1';
        btn.style.cursor = 'pointer';
        btn.style.pointerEvents = 'auto';
      }
    }
    logger.debug('[Router] Tile buttons explicitly enabled');
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
            ? new Date(latestTimestamp).toLocaleString(getLocale(), {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })
            : t('common.unknown');
          description.textContent = t('router.statesTrained', { count: String(count), plural: count > 1 ? 'e' : '', date: latestDate });
        } else {
          const duration = getRecordingSettings().recordingDuration;
          description.textContent = t('router.referenceRequired', { duration });
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
          const duration = getRecordingSettings().recordingDuration;
          description.textContent = t('router.referenceRequired', { duration });
        }
      }
    }
  }

  /**
   * Update all duration-dependent UI texts to reflect current recording settings
   *
   * Called on:
   * - Router init (to set correct initial values)
   * - Recording settings change (RECORDING_SETTINGS_EVENT)
   * - Language change (LANGUAGE_CHANGE_EVENT)
   */
  private updateRecordingDurationTexts(): void {
    const { recordingDuration } = getRecordingSettings();
    const warmUpDuration = 5; // Fixed warmup duration
    const totalDuration = warmUpDuration + recordingDuration;

    // Update reference card sub-description (initial state before machine selection)
    const referenceDurationText = document.getElementById('reference-duration-text');
    if (referenceDurationText) {
      // Only update if the router hasn't overwritten it with machine-specific info
      // Check if a machine with models is selected - if so, don't overwrite the statesTrained text
      const hasModels = this.currentMachine?.referenceModels && this.currentMachine.referenceModels.length > 0;
      if (!hasModels) {
        referenceDurationText.textContent = t('reference.tenSecondRecording', { duration: recordingDuration });
      }
    }

    // Update review modal recording info text
    const reviewRecordingInfo = document.getElementById('review-recording-info');
    if (reviewRecordingInfo) {
      reviewRecordingInfo.textContent = t('review.recordingInfo', {
        total: totalDuration,
        duration: recordingDuration,
      });
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
