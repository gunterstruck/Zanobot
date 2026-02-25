/**
 * ZANOBOT - Pipeline Status Dashboard
 *
 * Live-Feedback panel for all DSP pipeline features:
 * - Cherry-Picking (frame rejection statistics)
 * - Room Compensation T60/Chirp (reverberation measurement)
 * - Room Compensation CMN (cepstral mean normalization)
 *
 * Only visible in Expert mode when at least one DSP feature is active.
 * Displayed in the Diagnose modal (live, per-frame) and the Review modal (static, batch).
 */

import { t } from '../../i18n/index.js';

/**
 * Live data the dashboard displays.
 * Populated by DSP modules, read by the dashboard.
 */
export interface PipelineStatusData {
  // Cherry-Picking
  cherryPick: {
    enabled: boolean;
    totalFrames: number;
    rejectedFrames: number;
    lastFrameRejected: boolean; // For blink animation
    sigmaThreshold: number;
  };

  // Room Compensation
  roomComp: {
    enabled: boolean;
    cmnEnabled: boolean;
    cmnActive: boolean;           // Was CMN actually applied?
    t60Enabled: boolean;
    t60Value: number | null;      // Measured T60 value (null = not measured / failed)
    t60Classification: string;    // Classification label
    t60Color: string;             // CSS color class
    chirpSuccess: boolean | null; // null = not attempted, true = success, false = failed
    beta: number;
  };
}

/**
 * Pipeline Status Dashboard Component
 *
 * Shows the live status of all active DSP pipeline stages.
 * Only visible in Expert mode when at least one feature is active.
 */
export class PipelineStatusDashboard {
  private container: HTMLElement | null = null;
  private data: PipelineStatusData;
  private isVisible: boolean = false;
  private blinkTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    this.data = this.getDefaultData();
  }

  private getDefaultData(): PipelineStatusData {
    return {
      cherryPick: {
        enabled: false,
        totalFrames: 0,
        rejectedFrames: 0,
        lastFrameRejected: false,
        sigmaThreshold: 2.0,
      },
      roomComp: {
        enabled: false,
        cmnEnabled: false,
        cmnActive: false,
        t60Enabled: false,
        t60Value: null,
        t60Classification: '',
        t60Color: '',
        chirpSuccess: null,
        beta: 1.0,
      },
    };
  }

  /**
   * Create the dashboard DOM and attach it to the given parent container.
   *
   * @param parentElement - The element in which the dashboard is inserted
   * @param insertBefore - Optional: Element before which to insert
   */
  public mount(parentElement: HTMLElement, insertBefore?: HTMLElement): void {
    this.container = document.createElement('div');
    this.container.id = 'pipeline-status-dashboard';
    this.container.className = 'pipeline-status-dashboard';
    this.container.style.display = 'none'; // Initially hidden

    this.container.innerHTML = `
      <div class="pipeline-status-header">
        <span class="pipeline-status-icon">\u{1F527}</span>
        <span class="pipeline-status-title">${t('pipelineStatus.title')}</span>
      </div>
      <div class="pipeline-status-items">
        <div class="pipeline-item" id="ps-chirp" style="display:none;">
          <span class="pipeline-item-icon">\u{1F50A}</span>
          <span class="pipeline-item-label" id="ps-chirp-label">\u2014</span>
        </div>
        <div class="pipeline-item" id="ps-cherry" style="display:none;">
          <span class="pipeline-item-icon">\u{1F352}</span>
          <span class="pipeline-item-label" id="ps-cherry-label">\u2014</span>
        </div>
        <div class="pipeline-item" id="ps-cmn" style="display:none;">
          <span class="pipeline-item-icon">\u{1F4CA}</span>
          <span class="pipeline-item-label" id="ps-cmn-label">\u2014</span>
        </div>
      </div>
    `;

    if (insertBefore) {
      parentElement.insertBefore(this.container, insertBefore);
    } else {
      parentElement.appendChild(this.container);
    }
  }

  /**
   * Show the dashboard (if at least one feature is active)
   */
  public show(): void {
    if (!this.container) return;
    const hasAnyFeature = this.data.cherryPick.enabled || this.data.roomComp.enabled;
    if (!hasAnyFeature) {
      this.container.style.display = 'none';
      this.isVisible = false;
      return;
    }
    this.container.style.display = '';
    this.isVisible = true;
    this.render();
  }

  /**
   * Hide the dashboard
   */
  public hide(): void {
    if (!this.container) return;
    this.container.style.display = 'none';
    this.isVisible = false;
  }

  /**
   * Set T60/Chirp result
   */
  public setT60Result(t60Value: number | null, chirpSuccess: boolean): void {
    this.data.roomComp.t60Value = t60Value;
    this.data.roomComp.chirpSuccess = chirpSuccess;

    if (t60Value !== null) {
      const { classification, color } = classifyT60(t60Value);
      this.data.roomComp.t60Classification = classification;
      this.data.roomComp.t60Color = color;
    } else {
      this.data.roomComp.t60Classification = chirpSuccess === false
        ? t('pipelineStatus.chirpFailed')
        : '';
      this.data.roomComp.t60Color = 'status-uncertain';
    }

    this.render();
  }

  /**
   * Cherry-Picking frame update (per frame in live diagnosis)
   */
  public updateCherryPick(accepted: boolean): void {
    this.data.cherryPick.totalFrames++;
    if (!accepted) {
      this.data.cherryPick.rejectedFrames++;
      this.data.cherryPick.lastFrameRejected = true;

      // Blink animation: reset after 300ms
      if (this.blinkTimeout) clearTimeout(this.blinkTimeout);
      this.blinkTimeout = setTimeout(() => {
        this.data.cherryPick.lastFrameRejected = false;
        this.render();
      }, 300);
    } else {
      this.data.cherryPick.lastFrameRejected = false;
    }

    this.render();
  }

  /**
   * Cherry-Picking batch result (for Reference phase)
   */
  public setCherryPickBatchResult(total: number, rejected: number): void {
    this.data.cherryPick.totalFrames = total;
    this.data.cherryPick.rejectedFrames = rejected;
    this.render();
  }

  /**
   * Set CMN active status
   */
  public setCmnActive(active: boolean): void {
    this.data.roomComp.cmnActive = active;
    this.render();
  }

  /**
   * Load settings and initialize data
   */
  public loadFromSettings(
    cherryPickEnabled: boolean,
    roomCompEnabled: boolean,
    cmnEnabled: boolean,
    t60Enabled: boolean,
    sigma: number,
    beta: number
  ): void {
    this.data.cherryPick.enabled = cherryPickEnabled;
    this.data.cherryPick.sigmaThreshold = sigma;
    this.data.roomComp.enabled = roomCompEnabled;
    this.data.roomComp.cmnEnabled = cmnEnabled;
    this.data.roomComp.t60Enabled = t60Enabled;
    this.data.roomComp.beta = beta;
  }

  /**
   * Reset (for new run)
   */
  public reset(): void {
    this.data = this.getDefaultData();
    this.render();
  }

  /**
   * Remove DOM element
   */
  public destroy(): void {
    if (this.blinkTimeout) clearTimeout(this.blinkTimeout);
    if (this.container && this.container.parentElement) {
      this.container.parentElement.removeChild(this.container);
    }
    this.container = null;
    this.isVisible = false;
  }

  /**
   * Render all status rows
   */
  private render(): void {
    if (!this.container || !this.isVisible) return;

    // --- Chirp/T60 Row ---
    const chirpRow = this.container.querySelector('#ps-chirp') as HTMLElement;
    const chirpLabel = this.container.querySelector('#ps-chirp-label') as HTMLElement;
    if (chirpRow && chirpLabel) {
      if (this.data.roomComp.enabled && this.data.roomComp.t60Enabled) {
        chirpRow.style.display = '';
        if (this.data.roomComp.t60Value !== null) {
          chirpLabel.textContent = `${t('pipelineStatus.room')}: T60 = ${this.data.roomComp.t60Value.toFixed(2)}s (${this.data.roomComp.t60Classification})`;
          chirpLabel.className = `pipeline-item-label ${this.data.roomComp.t60Color}`;
        } else if (this.data.roomComp.chirpSuccess === false) {
          chirpLabel.textContent = t('pipelineStatus.chirpFailed');
          chirpLabel.className = 'pipeline-item-label status-uncertain';
        } else {
          chirpLabel.textContent = t('pipelineStatus.chirpPending');
          chirpLabel.className = 'pipeline-item-label';
        }
      } else {
        chirpRow.style.display = 'none';
      }
    }

    // --- Cherry-Picking Row ---
    const cherryRow = this.container.querySelector('#ps-cherry') as HTMLElement;
    const cherryLabel = this.container.querySelector('#ps-cherry-label') as HTMLElement;
    if (cherryRow && cherryLabel) {
      if (this.data.cherryPick.enabled) {
        cherryRow.style.display = '';
        const total = this.data.cherryPick.totalFrames;
        const rejected = this.data.cherryPick.rejectedFrames;
        const pct = total > 0 ? ((rejected / total) * 100).toFixed(0) : '0';
        cherryLabel.textContent = `Cherry-Pick: ${rejected}/${total} ${t('pipelineStatus.rejected')} (${pct}%)`;

        // Blink on rejection
        if (this.data.cherryPick.lastFrameRejected) {
          cherryRow.classList.add('pipeline-item-blink');
        } else {
          cherryRow.classList.remove('pipeline-item-blink');
        }
      } else {
        cherryRow.style.display = 'none';
      }
    }

    // --- CMN Row ---
    const cmnRow = this.container.querySelector('#ps-cmn') as HTMLElement;
    const cmnLabel = this.container.querySelector('#ps-cmn-label') as HTMLElement;
    if (cmnRow && cmnLabel) {
      if (this.data.roomComp.enabled && this.data.roomComp.cmnEnabled) {
        cmnRow.style.display = '';
        cmnLabel.textContent = this.data.roomComp.cmnActive
          ? `CMN: ${t('pipelineStatus.active')}`
          : `CMN: ${t('pipelineStatus.waiting')}`;
      } else {
        cmnRow.style.display = 'none';
      }
    }
  }
}

/**
 * Classify T60 value and assign color
 */
function classifyT60(t60: number): { classification: string; color: string } {
  if (t60 < 0.3) {
    return { classification: t('pipelineStatus.t60VeryDry'), color: 'status-healthy' };
  } else if (t60 < 0.6) {
    return { classification: t('pipelineStatus.t60Dry'), color: 'status-healthy' };
  } else if (t60 < 1.0) {
    return { classification: t('pipelineStatus.t60Medium'), color: 'status-uncertain' };
  } else if (t60 < 2.0) {
    return { classification: t('pipelineStatus.t60Reverberant'), color: 'status-warning' };
  } else {
    return { classification: t('pipelineStatus.t60VeryReverberant'), color: 'status-faulty' };
  }
}
