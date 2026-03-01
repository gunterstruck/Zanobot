/**
 * ZANOBOT - SPRINT 7: QUICK COMPARE CONTROLLER
 *
 * Enables "zero-friction" fleet comparison:
 * 1. Choose machine count
 * 2. Record reference (Gold Standard)
 * 3. Guided compare loop (reuses existing Fleet Queue)
 * 4. Result screen with outlier detection + save-as-fleet option
 *
 * Design principles:
 * - No new DB schema changes (DB_VERSION stays 7)
 * - Reuses existing Fleet Queue (startFleetQueue / advanceFleetQueue / completeFleetQueue)
 * - Reuses existing Recording + GMIA infrastructure
 * - All machines persisted immediately in IndexedDB (crash-safe)
 */

import { saveMachine, getMachine, deleteMachine, getLatestDiagnosis } from '@data/db.js';
import type { Machine } from '@data/types.js';
import { t } from '../i18n/index.js';
import { logger } from '@utils/logger.js';
import { notify } from '@utils/notifications.js';

export class QuickCompareController {
  private machineCount: number = 0;
  private goldStandardId: string | null = null;
  private createdMachineIds: string[] = [];
  private _isActive: boolean = false;
  private currentStep: 'idle' | 'count' | 'reference' | 'compare' | 'result' = 'idle';
  /** NFC fleet mode: pre-provisioned machine IDs from fleet DB */
  private fleetMachineIds: string[] | null = null;
  /** NFC fleet mode: fleet name for display */
  private fleetName: string | null = null;

  /** Callback: start the fleet queue with comparison machine IDs */
  public onStartFleetQueue: ((machineIds: string[], groupName: string) => void) | null = null;
  /** Callback: select a machine (triggers Router.onMachineSelected) */
  public onSelectMachine: ((machine: Machine) => void) | null = null;
  /** Callback: navigate back to start screen */
  public onNavigateHome: (() => void) | null = null;

  public get isActive(): boolean {
    return this._isActive;
  }

  constructor() {}

  // ============================================================================
  // STEP 1: COUNT SELECTION (Maßnahme 1)
  // ============================================================================

  /** Start the quick compare flow – shows the count selection wizard */
  public start(): void {
    this._isActive = true;
    this.currentStep = 'count';
    this.machineCount = 0;
    this.goldStandardId = null;
    this.createdMachineIds = [];
    this.fleetMachineIds = null;
    this.fleetName = null;
    this.showCountSelection();
  }

  /**
   * Start quick compare with pre-provisioned fleet machines (NFC deep link flow).
   * Skips the count selection wizard entirely – machine count and names come from fleet DB.
   * The first machine in the list is suggested as gold standard candidate.
   */
  public startWithFleet(machineIds: string[], fleetName: string): void {
    this._isActive = true;
    this.currentStep = 'reference';
    this.machineCount = machineIds.length - 1; // N-1 comparison machines (1 is reference)
    this.goldStandardId = null;
    this.createdMachineIds = [];
    this.fleetMachineIds = machineIds;
    this.fleetName = fleetName;

    // Skip straight to reference step (no wizard)
    this.showReferenceStep();
  }

  /** Cancel and clean up the quick compare flow */
  public cancel(): void {
    this._isActive = false;
    this.currentStep = 'idle';
    this.removeOverlay();
  }

  private showCountSelection(): void {
    this.removeOverlay();

    const overlay = document.createElement('div');
    overlay.id = 'qc-overlay';
    overlay.className = 'fleet-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'fleet-modal qc-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', t('quickCompare.wizard.title'));

    // Header
    const header = document.createElement('div');
    header.className = 'fleet-modal-header';

    const titleEl = document.createElement('h3');
    titleEl.className = 'fleet-modal-title';
    titleEl.textContent = t('quickCompare.wizard.title');

    const closeBtn = document.createElement('button');
    closeBtn.className = 'bottomsheet-close fleet-modal-close';
    closeBtn.setAttribute('aria-label', t('buttons.close'));
    closeBtn.textContent = '\u2715';
    closeBtn.addEventListener('click', () => this.cancel());

    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    // Question
    const question = document.createElement('p');
    question.className = 'qc-question';
    question.textContent = t('quickCompare.wizard.howMany');

    // Preset chips
    const chips = document.createElement('div');
    chips.className = 'qc-count-chips';

    let selectedCount = 0;
    const presets = [3, 5, 8, 10];
    const chipBtns: HTMLButtonElement[] = [];

    const customInput = document.createElement('input');
    customInput.type = 'number';
    customInput.className = 'machine-input qc-custom-input';
    customInput.min = '2';
    customInput.max = '30';
    customInput.placeholder = t('quickCompare.wizard.customCount');

    const nextBtn = document.createElement('button');
    nextBtn.className = 'action-btn qc-next-btn';
    nextBtn.textContent = t('quickCompare.wizard.next');
    nextBtn.disabled = true;

    const errorMsg = document.createElement('div');
    errorMsg.className = 'qc-error-msg';
    errorMsg.style.display = 'none';

    const updateSelection = (count: number) => {
      selectedCount = count;
      chipBtns.forEach(b => b.classList.remove('active'));
      if (presets.includes(count)) {
        const idx = presets.indexOf(count);
        chipBtns[idx].classList.add('active');
        customInput.value = '';
      }
      nextBtn.disabled = count < 2;
      errorMsg.style.display = 'none';
    };

    for (const preset of presets) {
      const btn = document.createElement('button');
      btn.className = 'qc-count-chip';
      btn.textContent = String(preset);
      btn.addEventListener('click', () => updateSelection(preset));
      chips.appendChild(btn);
      chipBtns.push(btn);
    }

    customInput.addEventListener('input', () => {
      const val = parseInt(customInput.value, 10);
      chipBtns.forEach(b => b.classList.remove('active'));
      if (isNaN(val) || val < 2) {
        selectedCount = 0;
        nextBtn.disabled = true;
        if (customInput.value.length > 0 && val < 2) {
          errorMsg.textContent = t('quickCompare.wizard.minMachines');
          errorMsg.style.display = 'block';
        }
      } else if (val > 30) {
        selectedCount = 0;
        nextBtn.disabled = true;
        errorMsg.textContent = t('quickCompare.wizard.maxMachines');
        errorMsg.style.display = 'block';
      } else {
        selectedCount = val;
        nextBtn.disabled = false;
        errorMsg.style.display = 'none';
        if (presets.includes(val)) {
          chipBtns[presets.indexOf(val)].classList.add('active');
        }
      }
    });

    // Explanation
    const explanation = document.createElement('p');
    explanation.className = 'qc-explanation';
    explanation.textContent = t('quickCompare.wizard.explanation');

    // Next button
    nextBtn.addEventListener('click', () => {
      if (selectedCount >= 2 && selectedCount <= 30) {
        this.machineCount = selectedCount;
        this.removeOverlay();
        this.showReferenceStep();
      }
    });

    // Assemble modal
    modal.appendChild(header);
    modal.appendChild(question);
    modal.appendChild(chips);
    modal.appendChild(customInput);
    modal.appendChild(errorMsg);
    modal.appendChild(explanation);
    modal.appendChild(nextBtn);
    overlay.appendChild(modal);

    // Close on backdrop click
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.cancel();
    });

    document.body.appendChild(overlay);
  }

  // ============================================================================
  // STEP 2: GOLD-STANDARD REFERENCE (Maßnahme 2)
  // ============================================================================

  private showReferenceStep(): void {
    this.currentStep = 'reference';

    const overlay = document.createElement('div');
    overlay.id = 'qc-overlay';
    overlay.className = 'fleet-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'fleet-modal qc-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    // Header
    const header = document.createElement('div');
    header.className = 'fleet-modal-header';

    const titleEl = document.createElement('h3');
    titleEl.className = 'fleet-modal-title';
    titleEl.textContent = t('quickCompare.reference.title');

    const closeBtn = document.createElement('button');
    closeBtn.className = 'bottomsheet-close fleet-modal-close';
    closeBtn.setAttribute('aria-label', t('buttons.close'));
    closeBtn.textContent = '\u2715';
    closeBtn.addEventListener('click', () => this.cancel());

    header.appendChild(titleEl);
    header.appendChild(closeBtn);

    // Instruction
    const instruction = document.createElement('div');
    instruction.className = 'qc-reference-instruction';
    instruction.textContent = t('quickCompare.reference.instruction');

    // Hint
    const hint = document.createElement('p');
    hint.className = 'qc-reference-hint';
    hint.textContent = t('quickCompare.reference.hint');

    // Record button
    const recordBtn = document.createElement('button');
    recordBtn.className = 'action-btn qc-reference-record-btn';
    recordBtn.textContent = t('quickCompare.reference.startRecording');
    recordBtn.addEventListener('click', async () => {
      await this.startReferenceRecording();
    });

    // Assemble
    modal.appendChild(header);
    modal.appendChild(instruction);
    modal.appendChild(hint);
    modal.appendChild(recordBtn);
    overlay.appendChild(modal);

    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) this.cancel();
    });

    document.body.appendChild(overlay);
  }

  /** Create the Gold Standard machine and trigger recording via Router callback */
  private async startReferenceRecording(): Promise<void> {
    // Create Gold Standard machine
    const goldMachine: Machine = {
      id: `qc-${Date.now()}-gold`,
      name: t('quickCompare.reference.goldName'),
      createdAt: Date.now(),
      referenceModels: [],
    };
    await saveMachine(goldMachine);
    this.goldStandardId = goldMachine.id;
    this.createdMachineIds.push(goldMachine.id);

    logger.info(`[QuickCompare] Gold Standard machine created: ${goldMachine.id}`);

    // Select this machine in the Router (triggers Phase 2 Reference).
    // MUST happen BEFORE removeOverlay() so phases are initialized and the
    // reference section is expanded before the overlay disappears.
    if (this.onSelectMachine) {
      this.onSelectMachine(goldMachine);
    }

    // NOW remove overlay – phases are already set up underneath
    this.removeOverlay();

    // Show a toast to guide user
    notify.info(t('quickCompare.reference.recordingHint'));
  }

  // ============================================================================
  // STEP 2b: AFTER REFERENCE SAVED → CREATE COMPARISON MACHINES (Maßnahme 2)
  // ============================================================================

  /**
   * Called by Router when reference model is saved during Quick Compare.
   * Creates N comparison machines with copied Gold Standard reference,
   * then starts the fleet queue for the guided compare loop.
   *
   * In fleet mode (NFC deep link): copies reference to pre-provisioned machines
   * instead of creating new ones.
   */
  public async onReferenceComplete(goldMachine: Machine): Promise<void> {
    if (this.currentStep !== 'reference') return;
    this.currentStep = 'compare';

    logger.info(`[QuickCompare] Reference complete for Gold Standard: ${goldMachine.name}`);
    notify.success(t('quickCompare.reference.saved'));

    // Update stored Gold Standard with fresh data
    this.goldStandardId = goldMachine.id;

    // NFC fleet mode: copy reference to pre-provisioned machines
    if (this.fleetMachineIds) {
      const compareIds: string[] = [];
      for (const id of this.fleetMachineIds) {
        // Skip the gold standard machine itself
        if (id === goldMachine.id) continue;

        const machine = await getMachine(id);
        if (!machine) continue;

        // Copy Gold Standard reference to this machine
        machine.referenceModels = goldMachine.referenceModels.map(m => ({
          ...m,
          weightVector: new Float64Array(m.weightVector),
        }));
        machine.refLogMean = goldMachine.refLogMean ? [...goldMachine.refLogMean] : null;
        machine.refLogStd = goldMachine.refLogStd ? [...goldMachine.refLogStd] : null;
        machine.refLogResidualStd = goldMachine.refLogResidualStd ? [...goldMachine.refLogResidualStd] : null;
        machine.refDriftBaseline = goldMachine.refDriftBaseline ? { ...goldMachine.refDriftBaseline } : null;
        machine.refT60 = goldMachine.refT60 ?? null;
        machine.refT60Classification = goldMachine.refT60Classification ?? null;
        machine.fleetReferenceSourceId = goldMachine.id;
        await saveMachine(machine);

        this.createdMachineIds.push(id);
        compareIds.push(id);
      }

      logger.info(`[QuickCompare] Fleet mode: copied reference to ${compareIds.length} pre-provisioned machines`);

      if (this.onStartFleetQueue) {
        this.onStartFleetQueue(compareIds, this.fleetName || t('quickCompare.wizard.title'));
      }
      return;
    }

    // Manual mode: Create N comparison machines with copied Gold Standard reference
    const compareIds: string[] = [];
    for (let i = 1; i <= this.machineCount; i++) {
      const paddedNumber = i.toString().padStart(2, '0');
      const machine: Machine = {
        id: `qc-${Date.now()}-${paddedNumber}-${Math.random().toString(36).substring(2, 6)}`,
        name: t('zeroFriction.autoMachineName', { number: paddedNumber }),
        createdAt: Date.now(),
        // Deep copy reference models (especially Float64Array weightVector)
        referenceModels: goldMachine.referenceModels.map(m => ({
          ...m,
          weightVector: new Float64Array(m.weightVector),
        })),
        refLogMean: goldMachine.refLogMean ? [...goldMachine.refLogMean] : null,
        refLogStd: goldMachine.refLogStd ? [...goldMachine.refLogStd] : null,
        refLogResidualStd: goldMachine.refLogResidualStd ? [...goldMachine.refLogResidualStd] : null,
        refDriftBaseline: goldMachine.refDriftBaseline ? { ...goldMachine.refDriftBaseline } : null,
        refT60: goldMachine.refT60 ?? null,
        refT60Classification: goldMachine.refT60Classification ?? null,
        fleetReferenceSourceId: goldMachine.id,
        fleetGroup: null,
      };
      await saveMachine(machine);
      this.createdMachineIds.push(machine.id);
      compareIds.push(machine.id);
    }

    logger.info(`[QuickCompare] Created ${compareIds.length} comparison machines`);

    // Start the fleet queue (reuse existing guided fleet check from Sprint 6)
    if (this.onStartFleetQueue) {
      this.onStartFleetQueue(compareIds, t('quickCompare.wizard.title'));
    }
  }

  // ============================================================================
  // STEP 4: RESULT SCREEN (Maßnahme 4)
  // ============================================================================

  /** Called by Router when fleet queue completes during Quick Compare */
  public async showResults(): Promise<void> {
    this.currentStep = 'result';

    const results: Array<{
      machine: Machine;
      score: number | null;
      isGold: boolean;
    }> = [];

    // Build the full list of IDs to show: gold standard + comparison machines
    const allIds = new Set<string>();
    if (this.goldStandardId) allIds.add(this.goldStandardId);
    for (const id of this.createdMachineIds) allIds.add(id);

    for (const id of allIds) {
      const machine = await getMachine(id);
      if (!machine) continue;

      const isGold = id === this.goldStandardId;
      let score: number | null = null;

      if (!isGold) {
        const diagnosis = await getLatestDiagnosis(id);
        score = diagnosis ? diagnosis.healthScore : null;
      }

      results.push({ machine, score, isGold });
    }

    // Sort: Gold first, then by score ascending (worst first for highlighting), null at end
    results.sort((a, b) => {
      if (a.isGold) return -1;
      if (b.isGold) return 1;
      if (a.score === null && b.score === null) return 0;
      if (a.score === null) return 1;
      if (b.score === null) return -1;
      return a.score - b.score;
    });

    // Calculate statistics
    const scores = results.map(r => r.score).filter((s): s is number => s !== null);
    const stats = this.calculateStats(scores);
    const checked = scores.length;
    const total = this.machineCount;
    const outlierCount = stats ? scores.filter(s => s < stats.outlierThreshold).length : 0;

    this.renderResultScreen(results, stats, checked, total, outlierCount);
  }

  private calculateStats(scores: number[]): { median: number; mad: number; outlierThreshold: number } | null {
    if (scores.length < 2) return null;

    const sorted = [...scores].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];

    // MAD (Median Absolute Deviation)
    const deviations = sorted.map(s => Math.abs(s - median)).sort((a, b) => a - b);
    const madMid = Math.floor(deviations.length / 2);
    const mad = deviations.length % 2 === 0
      ? (deviations[madMid - 1] + deviations[madMid]) / 2
      : deviations[madMid];

    // Outlier threshold: Median - 2*MAD
    const outlierThreshold = median - 2 * mad;

    return { median, mad, outlierThreshold };
  }

  private renderResultScreen(
    results: Array<{ machine: Machine; score: number | null; isGold: boolean }>,
    stats: { median: number; mad: number; outlierThreshold: number } | null,
    checked: number,
    total: number,
    outlierCount: number,
  ): void {
    this.removeOverlay();

    const overlay = document.createElement('div');
    overlay.id = 'qc-overlay';
    overlay.className = 'fleet-modal-overlay';

    const screen = document.createElement('div');
    screen.className = 'fleet-modal qc-result-screen';
    screen.setAttribute('role', 'dialog');
    screen.setAttribute('aria-modal', 'true');

    // Header
    const headerDiv = document.createElement('div');
    headerDiv.className = 'qc-result-header';

    const titleEl = document.createElement('div');
    titleEl.className = 'qc-result-title';
    titleEl.textContent = t('quickCompare.result.title');
    headerDiv.appendChild(titleEl);

    const summary = document.createElement('div');
    summary.className = 'qc-result-summary';
    summary.textContent = t('quickCompare.result.summary', {
      checked: String(checked),
      total: String(total),
    });
    headerDiv.appendChild(summary);

    // Outlier alert or all-good
    if (outlierCount > 0) {
      const alert = document.createElement('div');
      alert.className = 'qc-result-outlier-alert';
      alert.textContent = t('quickCompare.result.outlierFound', { count: String(outlierCount) });
      headerDiv.appendChild(alert);
    } else if (checked > 0) {
      const allGood = document.createElement('div');
      allGood.className = 'qc-result-all-good';
      allGood.textContent = t('quickCompare.result.allGood');
      headerDiv.appendChild(allGood);
    }

    screen.appendChild(headerDiv);

    // Ranking list
    const list = document.createElement('div');
    list.className = 'qc-result-list';

    for (const entry of results) {
      const isOutlier = !entry.isGold && entry.score !== null && stats !== null && entry.score < stats.outlierThreshold;
      const item = this.createResultItem(entry.machine, entry.score, entry.isGold, isOutlier);
      list.appendChild(item);
    }

    screen.appendChild(list);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'qc-result-actions';

    // Save as fleet button (hidden in fleet mode – machines already belong to a fleet)
    if (!this.fleetMachineIds) {
      const saveBtn = document.createElement('button');
      saveBtn.className = 'qc-save-fleet-btn';
      saveBtn.textContent = t('quickCompare.result.saveAsFleet');
      saveBtn.addEventListener('click', () => this.showSaveFleetDialog(overlay));
      actions.appendChild(saveBtn);
    }

    // Secondary actions row
    const secondaryRow = document.createElement('div');
    secondaryRow.className = 'qc-secondary-actions';

    const doneBtn = document.createElement('button');
    doneBtn.className = 'qc-secondary-btn';
    doneBtn.textContent = t('quickCompare.result.done');
    doneBtn.addEventListener('click', () => {
      this.finish();
    });
    secondaryRow.appendChild(doneBtn);

    const cleanupBtn = document.createElement('button');
    cleanupBtn.className = 'qc-secondary-btn';
    cleanupBtn.textContent = t('quickCompare.result.cleanup');
    cleanupBtn.addEventListener('click', () => this.cleanupTestData());
    secondaryRow.appendChild(cleanupBtn);

    actions.appendChild(secondaryRow);
    screen.appendChild(actions);

    overlay.appendChild(screen);
    document.body.appendChild(overlay);
  }

  private createResultItem(
    machine: Machine,
    score: number | null,
    isGold: boolean,
    isOutlier: boolean,
  ): HTMLElement {
    const item = document.createElement('div');
    item.className = 'qc-result-item' + (isGold ? ' qc-gold' : '') + (isOutlier ? ' qc-outlier' : '');

    // Name
    const nameEl = document.createElement('div');
    nameEl.className = 'qc-result-name';
    nameEl.textContent = machine.name;

    // Rename button
    const renameBtn = document.createElement('button');
    renameBtn.className = 'qc-result-rename-btn';
    renameBtn.textContent = '\u270F\uFE0F';
    renameBtn.title = t('quickCompare.result.rename');
    renameBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const newName = prompt(
        t('zeroFriction.editMachineNamePrompt'),
        machine.name,
      );
      if (newName && newName.trim()) {
        machine.name = newName.trim();
        saveMachine(machine);
        nameEl.textContent = newName.trim();
        notify.success(t('zeroFriction.machineRenamed', { newName: newName.trim() }));
      }
    });

    const nameRow = document.createElement('div');
    nameRow.className = 'qc-result-name-row';
    nameRow.appendChild(nameEl);
    if (!isGold) {
      nameRow.appendChild(renameBtn);
    }

    // Score bar
    const barContainer = document.createElement('div');
    barContainer.className = 'qc-result-bar-container';

    if (isGold) {
      const goldLabel = document.createElement('span');
      goldLabel.className = 'qc-result-gold-label';
      goldLabel.textContent = '\uD83C\uDFC6 ' + t('quickCompare.result.goldLabel');
      barContainer.appendChild(goldLabel);
    } else if (score !== null) {
      const bar = document.createElement('div');
      bar.className = 'qc-result-bar' + (isOutlier ? ' qc-result-bar-outlier' : '');
      bar.style.width = `${Math.max(score, 2)}%`;
      barContainer.appendChild(bar);

      const scoreLabel = document.createElement('span');
      scoreLabel.className = 'qc-result-score' + (isOutlier ? ' qc-result-score-outlier' : '');
      scoreLabel.textContent = isOutlier ? `\u26A0 ${score.toFixed(0)}%` : `${score.toFixed(0)}%`;
      barContainer.appendChild(scoreLabel);
    } else {
      const noData = document.createElement('span');
      noData.className = 'fleet-rank-nodata';
      noData.textContent = t('quickCompare.result.notChecked');
      barContainer.appendChild(noData);
    }

    item.appendChild(nameRow);
    item.appendChild(barContainer);

    return item;
  }

  // ============================================================================
  // SAVE AS FLEET (Maßnahme 4)
  // ============================================================================

  private showSaveFleetDialog(_parentOverlay: HTMLElement): void {
    const fleetName = prompt(
      t('quickCompare.result.saveFleetName'),
      t('quickCompare.result.saveFleetPlaceholder'),
    );

    if (fleetName === null) return; // User cancelled

    const name = fleetName.trim() || t('quickCompare.result.defaultFleetName', {
      date: new Date().toLocaleDateString(),
    });

    this.saveAsFleet(name);
  }

  private async saveAsFleet(fleetName: string): Promise<void> {
    for (const id of this.createdMachineIds) {
      const machine = await getMachine(id);
      if (machine) {
        machine.fleetGroup = fleetName;
        if (id !== this.goldStandardId) {
          machine.fleetReferenceSourceId = this.goldStandardId;
        }
        await saveMachine(machine);
      }
    }

    notify.success(t('quickCompare.result.fleetSaved', {
      name: fleetName,
      count: String(this.createdMachineIds.length),
    }));
  }

  // ============================================================================
  // CLEANUP (Maßnahme 4)
  // ============================================================================

  private async cleanupTestData(): Promise<void> {
    // In fleet mode, only delete the gold standard (auto-created), not the provisioned machines
    const idsToDelete = this.fleetMachineIds
      ? (this.goldStandardId ? [this.goldStandardId] : [])
      : this.createdMachineIds;

    if (idsToDelete.length === 0) {
      this.finish();
      return;
    }

    const count = idsToDelete.length;

    if (!confirm(t('quickCompare.result.cleanupConfirm', { count: String(count) }))) {
      return;
    }

    for (const id of idsToDelete) {
      await deleteMachine(id);
    }

    notify.info(t('quickCompare.result.cleanupDone', { count: String(count) }));

    this.createdMachineIds = [];
    this.goldStandardId = null;
    this.finish();
  }

  // ============================================================================
  // HELPERS
  // ============================================================================

  private finish(): void {
    this._isActive = false;
    this.currentStep = 'idle';
    this.removeOverlay();
    if (this.onNavigateHome) {
      this.onNavigateHome();
    }
  }

  private removeOverlay(): void {
    document.getElementById('qc-overlay')?.remove();
  }
}
