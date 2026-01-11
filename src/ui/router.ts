/**
 * ZANOBOT - ROUTER
 *
 * Simple state manager that controls the 3-phase flow:
 * Phase 1: Identify → Phase 2: Reference / Phase 3: Diagnose
 *
 * The user MUST select a machine (Phase 1) before accessing Phase 2 or 3.
 */

import { IdentifyPhase } from './phases/1-Identify.js';
import { ReferencePhase } from './phases/2-Reference.js';
import { DiagnosePhase } from './phases/3-Diagnose.js';
import type { Machine } from '@data/types.js';
import { logger } from '@utils/logger.js';

export class Router {
  private currentMachine: Machine | null = null;
  private identifyPhase: IdentifyPhase;
  private referencePhase: ReferencePhase | null = null;
  private diagnosePhase: DiagnosePhase | null = null;

  constructor() {
    // Initialize Phase 1 (always available)
    this.identifyPhase = new IdentifyPhase((machine) => this.onMachineSelected(machine));
    this.identifyPhase.init();

    // Lock Phase 2 and 3 initially
    this.lockPhases();
  }

  /**
   * Called when a machine is selected in Phase 1
   */
  private onMachineSelected(machine: Machine): void {
    logger.info(`🤖 Machine selected: ${machine.name} (${machine.id})`);

    this.currentMachine = machine;

    // Update UI to show selected machine
    this.updateMachineDisplay(machine);

    // Unlock Phase 2 and 3
    this.unlockPhases();

    // Initialize Phase 2 and 3 with the selected machine
    this.initializePhases(machine);
  }

  /**
   * Initialize Phase 2 (Reference) and Phase 3 (Diagnose)
   */
  private initializePhases(machine: Machine): void {
    // Cleanup previous instances
    if (this.referencePhase) {
      this.referencePhase.destroy();
    }
    if (this.diagnosePhase) {
      this.diagnosePhase.destroy();
    }

    // Create new instances
    this.referencePhase = new ReferencePhase(machine);
    this.referencePhase.init();

    this.diagnosePhase = new DiagnosePhase(machine);
    this.diagnosePhase.init();
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
          const latestDate = new Date(machine.referenceModels[machine.referenceModels.length - 1].trainingDate).toLocaleDateString();
          description.textContent = `${count} Zustand${count > 1 ? 'e' : ''} trainiert (zuletzt: ${latestDate}) - Weitere hinzufügen`;
        } else {
          description.textContent = '10-Sekunden Referenzaufnahme (Erforderlich für Diagnose)';
        }
      }
    }

    // Show/hide diagnosis availability
    const diagnoseSection = document.getElementById('run-diagnosis-content');
    if (diagnoseSection) {
      const description = diagnoseSection.querySelector('.sub-description');
      if (description) {
        if (machine.referenceModels && machine.referenceModels.length > 0) {
          description.textContent = 'Live-Analyse durchführen';
        } else {
          description.textContent = '⚠️ Bitte erst Referenz aufnehmen';
        }
      }
    }
  }
}
