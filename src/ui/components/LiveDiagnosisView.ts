/**
 * ZANOBOT - Live Diagnosis View Component
 *
 * A unified live diagnosis overlay that adapts drastically between three user modes:
 *
 * - **Basis**: Minimalist "traffic light" — large centered score circle only.
 *   No camera, no spectrum, no technical data. Pure simplicity.
 *
 * - **Fortgeschritten** (Advanced): Split-view with camera overlay (left) and
 *   score (right) in the top section, plus a tall spectrum graph below.
 *
 * - **Experte** (Expert): Inherits the Advanced layout and adds a "Technische
 *   Parameter" section at the bottom with real-time debug values.
 *
 * Designed as an evolution from a simple "Ampel-System" to a full analysis dashboard.
 */

import { logger } from '@utils/logger.js';
import { t } from '../../i18n/index.js';
import { getViewLevel, VIEW_LEVEL_EVENT, type ViewLevel } from '@utils/viewLevelSettings.js';

/** Technical parameter entry for Expert mode */
export interface TechParameter {
  label: string;
  value: string;
  unit?: string;
  highlight?: boolean;
}

/** Score update data */
export interface LiveScoreData {
  score: number;
  status: 'healthy' | 'uncertain' | 'faulty' | 'UNKNOWN';
  label?: string;
}

/** Configuration for LiveDiagnosisView */
export interface LiveDiagnosisViewConfig {
  /** ID of the container element to render into */
  containerId: string;
  /** Callback when user presses STOP */
  onStop: () => void;
  /** Machine name to display */
  machineName?: string;
  /** Reference state name */
  referenceState?: string;
}

/**
 * LiveDiagnosisView — The three-mode live diagnosis overlay.
 *
 * Usage:
 * ```ts
 * const view = new LiveDiagnosisView({
 *   containerId: 'live-diagnosis-overlay',
 *   onStop: () => diagnosePhase.stopRecording(),
 * });
 * view.show();
 * view.updateScore({ score: 85, status: 'healthy' });
 * view.updateTechParams([{ label: 'RPM', value: '2950', unit: 'U/min' }]);
 * view.hide();
 * view.destroy();
 * ```
 */
export class LiveDiagnosisView {
  private container: HTMLElement | null = null;
  private config: LiveDiagnosisViewConfig;
  private currentLevel: ViewLevel;
  private isVisible: boolean = false;
  private isDestroyed: boolean = false;
  private viewLevelListener: ((e: Event) => void) | null = null;

  // DOM references (cached for real-time updates)
  private scoreValueEl: HTMLElement | null = null;
  private scoreUnitEl: HTMLElement | null = null;
  private statusLabelEl: HTMLElement | null = null;
  private scoreContainerEl: HTMLElement | null = null;
  private pulseAnimationEl: HTMLElement | null = null;
  private smartStartEl: HTMLElement | null = null;
  private techParamsBodyEl: HTMLElement | null = null;
  private spectrumCanvasEl: HTMLCanvasElement | null = null;
  private cameraVideoEl: HTMLVideoElement | null = null;
  private cameraGhostEl: HTMLImageElement | null = null;
  private hintEl: HTMLElement | null = null;

  constructor(config: LiveDiagnosisViewConfig) {
    this.config = config;
    this.currentLevel = getViewLevel();

    this.initContainer();
    this.listenForViewLevelChanges();

    logger.debug('[LiveDiagnosisView] Initialized for level:', this.currentLevel);
  }

  // ─── Lifecycle ──────────────────────────────────────

  /** Show the overlay */
  public show(): void {
    if (this.isDestroyed || !this.container) return;
    this.currentLevel = getViewLevel();
    this.render();
    this.container.style.display = 'flex';
    this.isVisible = true;
    document.body.classList.add('live-diagnosis-active');
    logger.info('[LiveDiagnosisView] Shown in mode:', this.currentLevel);
  }

  /** Hide the overlay */
  public hide(): void {
    if (!this.container) return;
    this.container.style.display = 'none';
    this.isVisible = false;
    document.body.classList.remove('live-diagnosis-active');
    this.resetState();
  }

  /** Destroy the component, clean up event listeners and DOM */
  public destroy(): void {
    this.isDestroyed = true;
    this.hide();

    if (this.viewLevelListener) {
      window.removeEventListener(VIEW_LEVEL_EVENT, this.viewLevelListener);
      this.viewLevelListener = null;
    }

    // Revoke camera ghost image URL
    if (this.cameraGhostEl?.src) {
      URL.revokeObjectURL(this.cameraGhostEl.src);
    }

    this.clearDomRefs();
    if (this.container) {
      this.container.innerHTML = '';
    }
    this.container = null;

    logger.debug('[LiveDiagnosisView] Destroyed');
  }

  // ─── Real-time Update API ───────────────────────────

  /** Update the live score display */
  public updateScore(data: LiveScoreData): void {
    if (this.isDestroyed) return;

    const { score, status, label } = data;
    const roundedScore = Math.round(score);

    // Update score value
    if (this.scoreValueEl) {
      this.scoreValueEl.textContent = String(roundedScore);
    }

    // Update status coloring on container + score + label
    const statusClass = `status-${status === 'UNKNOWN' ? 'uncertain' : status}`;
    this.applyStatusClass(this.scoreContainerEl, statusClass);
    this.applyStatusClass(this.scoreValueEl, statusClass);
    this.applyStatusClass(this.statusLabelEl, statusClass);

    // Update status label text
    if (this.statusLabelEl) {
      const statusText = this.getLocalizedStatus(status);
      this.statusLabelEl.textContent = label ?? statusText;
    }

    // Remove initializing state
    const contentEl = this.container?.querySelector('.ldv-content');
    if (contentEl) {
      contentEl.classList.remove('is-initializing');
    }
  }

  /** Update smart-start / initialization status text */
  public updateSmartStartStatus(text: string): void {
    if (this.smartStartEl) {
      this.smartStartEl.textContent = text;
    }
  }

  /** Update the quality/positioning hint */
  public updateHint(text: string, visible: boolean = true): void {
    if (this.hintEl) {
      this.hintEl.textContent = text;
      this.hintEl.classList.toggle('hint-hidden', !visible);
    }
  }

  /** Update the technical parameters table (Expert mode only) */
  public updateTechParams(params: TechParameter[]): void {
    if (!this.techParamsBodyEl || this.currentLevel !== 'expert') return;

    this.techParamsBodyEl.innerHTML = params
      .map(
        (p) => `
        <tr class="ldv-tech-row${p.highlight ? ' ldv-tech-highlight' : ''}">
          <td class="ldv-tech-label">${this.escapeHtml(p.label)}</td>
          <td class="ldv-tech-value">${this.escapeHtml(p.value)}${p.unit ? `<span class="ldv-tech-unit">${this.escapeHtml(p.unit)}</span>` : ''}</td>
        </tr>`
      )
      .join('');
  }

  /** Get the spectrum canvas element for connecting to AudioVisualizer */
  public getSpectrumCanvas(): HTMLCanvasElement | null {
    return this.spectrumCanvasEl;
  }

  /** Get the camera video element for connecting a MediaStream */
  public getCameraVideo(): HTMLVideoElement | null {
    return this.cameraVideoEl;
  }

  /** Set ghost overlay image from a Blob (reference image) */
  public setCameraGhostImage(blob: Blob): void {
    if (this.cameraGhostEl) {
      // Revoke previous URL
      if (this.cameraGhostEl.src) {
        URL.revokeObjectURL(this.cameraGhostEl.src);
      }
      this.cameraGhostEl.src = URL.createObjectURL(blob);
    }
  }

  /** Set the camera stream on the video element */
  public setCameraStream(stream: MediaStream): void {
    if (this.cameraVideoEl) {
      this.cameraVideoEl.srcObject = stream;
    }
  }

  // ─── Internal: Initialization ───────────────────────

  private initContainer(): void {
    this.container = document.getElementById(this.config.containerId);
    if (!this.container) {
      logger.warn('[LiveDiagnosisView] Container not found:', this.config.containerId);
    }
  }

  private listenForViewLevelChanges(): void {
    this.viewLevelListener = (e: Event) => {
      const newLevel = (e as CustomEvent<ViewLevel>).detail;
      if (newLevel !== this.currentLevel) {
        this.currentLevel = newLevel;
        if (this.isVisible) {
          this.render();
        }
      }
    };
    window.addEventListener(VIEW_LEVEL_EVENT, this.viewLevelListener);
  }

  // ─── Internal: Rendering ────────────────────────────

  private render(): void {
    if (!this.container) return;

    // Set data attribute for CSS targeting
    this.container.setAttribute('data-diagnosis-level', this.currentLevel);

    switch (this.currentLevel) {
      case 'basic':
        this.renderBasicMode();
        break;
      case 'advanced':
        this.renderAdvancedMode();
        break;
      case 'expert':
        this.renderExpertMode();
        break;
    }

    this.cacheDomRefs();
  }

  /**
   * BASIC MODE — Minimalist
   * Only the score circle, centered, filling the screen.
   * No camera, no spectrum, no technical data.
   */
  private renderBasicMode(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="ldv-modal-content ldv-basic">
        <!-- Minimal header -->
        <header class="ldv-header ldv-header-basic">
          <h1 class="ldv-question">${t('inspection.mainQuestion')}</h1>
          <p class="ldv-subtitle ldv-smart-start" id="ldv-smart-start">${t('inspection.subtitleInitializing')}</p>
          <p class="ldv-machine-name">${this.escapeHtml(this.config.machineName ?? '')}</p>
        </header>

        <!-- Full-screen centered score -->
        <main class="ldv-content is-initializing">
          <div class="ldv-score-area-basic">
            <div class="ldv-score-container" id="ldv-score-container">
              <div class="ldv-pulse-animation" id="ldv-pulse-animation">
                <div class="ldv-pulse-ring"></div>
                <div class="ldv-pulse-ring"></div>
                <div class="ldv-pulse-ring"></div>
              </div>
              <span class="ldv-score-value" id="ldv-score-value">--</span>
              <span class="ldv-score-unit" id="ldv-score-unit">%</span>
              <span class="ldv-status-label" id="ldv-status-label">${t('common.initializing')}</span>
            </div>
          </div>

          <!-- Hint (hidden by default) -->
          <div class="ldv-hint hint-hidden" id="ldv-hint">${t('inspection.hintWaiting')}</div>
        </main>

        <!-- Footer with STOP -->
        <footer class="ldv-footer">
          <button class="ldv-stop-btn" id="ldv-stop-btn">${t('inspection.stopButton')}</button>
        </footer>
      </div>
    `;

    this.bindStopButton();
  }

  /**
   * ADVANCED MODE — Visual Analysis
   * Split-view: Camera (left) + Score (right) in top section.
   * Tall spectrum graph below.
   */
  private renderAdvancedMode(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="ldv-modal-content ldv-advanced">
        <!-- Compact header -->
        <header class="ldv-header ldv-header-advanced">
          <div class="ldv-header-row">
            <h2 class="ldv-title-compact">${t('diagnose.display.liveTitle') || 'Live Diagnosis'}</h2>
            <span class="ldv-machine-badge">${this.escapeHtml(this.config.machineName ?? '')}</span>
          </div>
          <p class="ldv-smart-start" id="ldv-smart-start">${t('inspection.subtitleInitializing')}</p>
        </header>

        <!-- Main content area -->
        <main class="ldv-content is-initializing">
          <!-- Top: 50/50 split — Camera left, Score right -->
          <div class="ldv-split-view">
            <div class="ldv-split-left">
              <div class="ldv-camera-container">
                <video class="ldv-camera-video" id="ldv-camera-video" autoplay playsinline muted></video>
                <img class="ldv-camera-ghost" id="ldv-camera-ghost" alt="" />
                <div class="ldv-camera-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="ldv-split-right">
              <div class="ldv-score-container ldv-score-compact" id="ldv-score-container">
                <div class="ldv-pulse-animation" id="ldv-pulse-animation">
                  <div class="ldv-pulse-ring"></div>
                  <div class="ldv-pulse-ring"></div>
                </div>
                <span class="ldv-score-value" id="ldv-score-value">--</span>
                <span class="ldv-score-unit" id="ldv-score-unit">%</span>
                <span class="ldv-status-label" id="ldv-status-label">${t('common.initializing')}</span>
              </div>
              <!-- Reference info -->
              <div class="ldv-reference-badge">
                <span class="ldv-reference-label">${t('inspection.referenceState')}</span>
                <span class="ldv-reference-value">${this.escapeHtml(this.config.referenceState ?? t('inspection.referenceDefault'))}</span>
              </div>
            </div>
          </div>

          <!-- Spectrum graph — tall, full-width -->
          <div class="ldv-spectrum-section">
            <canvas class="ldv-spectrum-canvas" id="ldv-spectrum-canvas" width="400" height="250"></canvas>
          </div>

          <!-- Hint -->
          <div class="ldv-hint hint-hidden" id="ldv-hint">${t('inspection.hintWaiting')}</div>
        </main>

        <!-- Footer with STOP -->
        <footer class="ldv-footer">
          <button class="ldv-stop-btn" id="ldv-stop-btn">${t('inspection.stopButton')}</button>
        </footer>
      </div>
    `;

    this.bindStopButton();
  }

  /**
   * EXPERT MODE — Full Data Dashboard
   * Inherits Advanced layout + adds Technische Parameter section below spectrum.
   */
  private renderExpertMode(): void {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="ldv-modal-content ldv-expert">
        <!-- Compact header -->
        <header class="ldv-header ldv-header-expert">
          <div class="ldv-header-row">
            <h2 class="ldv-title-compact">${t('diagnose.display.liveTitle') || 'Live Diagnosis'}</h2>
            <span class="ldv-machine-badge">${this.escapeHtml(this.config.machineName ?? '')}</span>
          </div>
          <p class="ldv-smart-start" id="ldv-smart-start">${t('inspection.subtitleInitializing')}</p>
        </header>

        <!-- Scrollable content area -->
        <main class="ldv-content ldv-content-scrollable is-initializing">
          <!-- Top: 50/50 split — Camera left, Score right -->
          <div class="ldv-split-view">
            <div class="ldv-split-left">
              <div class="ldv-camera-container">
                <video class="ldv-camera-video" id="ldv-camera-video" autoplay playsinline muted></video>
                <img class="ldv-camera-ghost" id="ldv-camera-ghost" alt="" />
                <div class="ldv-camera-placeholder">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                </div>
              </div>
            </div>
            <div class="ldv-split-right">
              <div class="ldv-score-container ldv-score-compact" id="ldv-score-container">
                <div class="ldv-pulse-animation" id="ldv-pulse-animation">
                  <div class="ldv-pulse-ring"></div>
                  <div class="ldv-pulse-ring"></div>
                </div>
                <span class="ldv-score-value" id="ldv-score-value">--</span>
                <span class="ldv-score-unit" id="ldv-score-unit">%</span>
                <span class="ldv-status-label" id="ldv-status-label">${t('common.initializing')}</span>
              </div>
              <div class="ldv-reference-badge">
                <span class="ldv-reference-label">${t('inspection.referenceState')}</span>
                <span class="ldv-reference-value">${this.escapeHtml(this.config.referenceState ?? t('inspection.referenceDefault'))}</span>
              </div>
            </div>
          </div>

          <!-- Spectrum graph — tall, full-width -->
          <div class="ldv-spectrum-section">
            <canvas class="ldv-spectrum-canvas" id="ldv-spectrum-canvas" width="400" height="250"></canvas>
          </div>

          <!-- Technische Parameter — Expert only -->
          <div class="ldv-tech-section">
            <div class="ldv-tech-header">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--primary-color)" stroke-width="2">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
              <h4 class="ldv-tech-title">${t('diagnose.display.techParams') || 'Technische Parameter'}</h4>
            </div>
            <table class="ldv-tech-table">
              <tbody id="ldv-tech-params-body">
                <tr class="ldv-tech-row ldv-tech-placeholder">
                  <td class="ldv-tech-label" colspan="2">${t('common.initializing')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Hint -->
          <div class="ldv-hint hint-hidden" id="ldv-hint">${t('inspection.hintWaiting')}</div>
        </main>

        <!-- Footer with STOP -->
        <footer class="ldv-footer">
          <button class="ldv-stop-btn" id="ldv-stop-btn">${t('inspection.stopButton')}</button>
        </footer>
      </div>
    `;

    this.bindStopButton();
  }

  // ─── Internal: DOM Helpers ──────────────────────────

  private cacheDomRefs(): void {
    if (!this.container) return;
    this.scoreValueEl = this.container.querySelector('#ldv-score-value');
    this.scoreUnitEl = this.container.querySelector('#ldv-score-unit');
    this.statusLabelEl = this.container.querySelector('#ldv-status-label');
    this.scoreContainerEl = this.container.querySelector('#ldv-score-container');
    this.pulseAnimationEl = this.container.querySelector('#ldv-pulse-animation');
    this.smartStartEl = this.container.querySelector('#ldv-smart-start');
    this.techParamsBodyEl = this.container.querySelector('#ldv-tech-params-body');
    this.spectrumCanvasEl = this.container.querySelector('#ldv-spectrum-canvas');
    this.cameraVideoEl = this.container.querySelector('#ldv-camera-video');
    this.cameraGhostEl = this.container.querySelector('#ldv-camera-ghost');
    this.hintEl = this.container.querySelector('#ldv-hint');
  }

  private clearDomRefs(): void {
    this.scoreValueEl = null;
    this.scoreUnitEl = null;
    this.statusLabelEl = null;
    this.scoreContainerEl = null;
    this.pulseAnimationEl = null;
    this.smartStartEl = null;
    this.techParamsBodyEl = null;
    this.spectrumCanvasEl = null;
    this.cameraVideoEl = null;
    this.cameraGhostEl = null;
    this.hintEl = null;
  }

  private bindStopButton(): void {
    const stopBtn = this.container?.querySelector('#ldv-stop-btn');
    if (stopBtn) {
      stopBtn.addEventListener('click', () => this.config.onStop());
    }
  }

  private resetState(): void {
    // Next show() will re-render fresh
  }

  private applyStatusClass(el: HTMLElement | null, statusClass: string): void {
    if (!el) return;
    el.classList.remove('status-healthy', 'status-uncertain', 'status-faulty');
    el.classList.add(statusClass);
  }

  private getLocalizedStatus(status: string): string {
    switch (status.toLowerCase()) {
      case 'healthy': return t('status.healthy');
      case 'uncertain': return t('status.uncertain');
      case 'faulty': return t('status.faulty');
      default: return t('status.unknown');
    }
  }

  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}
