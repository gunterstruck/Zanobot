/**
 * ZANOBOT - OPERATING POINT MONITOR (Expert Mode Only)
 *
 * Displays transparency metrics below the Similarity Score in expert mode.
 * Shows: P10 Similarity, Energy Delta, Frequency Delta, Stability.
 *
 * Each metric includes:
 *  - Value + unit
 *  - Traffic-light indicator (green / yellow / red)
 *  - Short label (2-3 words)
 *  - One-sentence explanation (as subtext)
 *
 * During warmup (baseline capture), shows an initialization banner
 * telling the user to hold the device steady.
 *
 * A warning banner appears when the operating point has changed significantly.
 *
 * This component is PURELY presentational — all calculations happen
 * in OperatingPointMetrics (DSP layer).
 */

import type { OperatingPointResult, OperatingPointMetric, TrafficLight } from '@core/dsp/operatingPointMetrics.js';
import { t } from '../../i18n/index.js';

/**
 * CSS class constants
 */
const CLS = {
  container: 'op-monitor',
  header: 'op-monitor-header',
  row: 'op-monitor-row',
  light: 'op-monitor-light',
  value: 'op-monitor-value',
  label: 'op-monitor-label',
  desc: 'op-monitor-desc',
  textBlock: 'op-monitor-text',
  banner: 'op-monitor-banner',
  bannerHidden: 'op-monitor-banner--hidden',
  initBanner: 'op-monitor-init-banner',
  initBannerHidden: 'op-monitor-init-banner--hidden',
} as const;

/**
 * Traffic light colour map
 */
const LIGHT_COLORS: Record<TrafficLight, string> = {
  green: 'var(--color-healthy, #4CAF50)',
  yellow: 'var(--color-warning, #FFC107)',
  red: 'var(--color-faulty, #F44336)',
};

export class OperatingPointMonitor {
  private containerEl: HTMLElement | null = null;
  private parentId: string;
  private isDestroyed = false;

  // Cached DOM references for fast updates
  private p10ValueEl: HTMLElement | null = null;
  private p10LightEl: HTMLElement | null = null;
  private energyValueEl: HTMLElement | null = null;
  private energyLightEl: HTMLElement | null = null;
  private freqValueEl: HTMLElement | null = null;
  private freqLightEl: HTMLElement | null = null;
  private stabValueEl: HTMLElement | null = null;
  private stabLightEl: HTMLElement | null = null;
  private bannerEl: HTMLElement | null = null;
  private initBannerEl: HTMLElement | null = null;

  constructor(parentId: string) {
    this.parentId = parentId;
  }

  /**
   * Create the DOM structure and append to parent.
   * Call once after the parent element is in the DOM.
   */
  public mount(): void {
    const parent = document.getElementById(this.parentId);
    if (!parent || this.isDestroyed) return;

    // Prevent double-mount
    if (this.containerEl) return;

    this.containerEl = document.createElement('div');
    this.containerEl.className = CLS.container;
    this.containerEl.id = 'op-monitor';

    this.containerEl.innerHTML = `
      <div class="${CLS.header}">${t('opMonitor.title')}</div>
      <div class="${CLS.initBanner}" id="op-monitor-init-banner">
        ${t('opMonitor.initializingBaseline')}
      </div>
      ${this.renderRow('p10')}
      ${this.renderRow('energy')}
      ${this.renderRow('freq')}
      ${this.renderRow('stab')}
      <div class="${CLS.banner} ${CLS.bannerHidden}" id="op-monitor-banner">
        ${t('opMonitor.operatingPointChanged')}
      </div>
    `;

    parent.appendChild(this.containerEl);

    // Cache element references
    this.p10ValueEl = this.containerEl.querySelector('#op-p10-value');
    this.p10LightEl = this.containerEl.querySelector('#op-p10-light');
    this.energyValueEl = this.containerEl.querySelector('#op-energy-value');
    this.energyLightEl = this.containerEl.querySelector('#op-energy-light');
    this.freqValueEl = this.containerEl.querySelector('#op-freq-value');
    this.freqLightEl = this.containerEl.querySelector('#op-freq-light');
    this.stabValueEl = this.containerEl.querySelector('#op-stab-value');
    this.stabLightEl = this.containerEl.querySelector('#op-stab-light');
    this.bannerEl = this.containerEl.querySelector('#op-monitor-banner');
    this.initBannerEl = this.containerEl.querySelector('#op-monitor-init-banner');
  }

  /**
   * Update all metrics with fresh data from OperatingPointMetrics.
   */
  public update(result: OperatingPointResult): void {
    if (this.isDestroyed || !this.containerEl) return;

    this.updateMetric(this.p10ValueEl, this.p10LightEl, result.similarityP10);
    this.updateMetric(this.energyValueEl, this.energyLightEl, result.energyDelta);
    this.updateMetric(this.freqValueEl, this.freqLightEl, result.frequencyDelta);
    this.updateMetric(this.stabValueEl, this.stabLightEl, result.stability);

    // Initialization banner (warmup phase)
    if (this.initBannerEl) {
      if (result.isInitializing) {
        this.initBannerEl.classList.remove(CLS.initBannerHidden);
      } else {
        this.initBannerEl.classList.add(CLS.initBannerHidden);
      }
    }

    // Warning banner (operating point changed)
    if (this.bannerEl) {
      if (result.operatingPointChanged && !result.isInitializing) {
        this.bannerEl.classList.remove(CLS.bannerHidden);
      } else {
        this.bannerEl.classList.add(CLS.bannerHidden);
      }
    }
  }

  /**
   * Remove from DOM and release references.
   */
  public destroy(): void {
    this.isDestroyed = true;
    if (this.containerEl) {
      this.containerEl.remove();
      this.containerEl = null;
    }
    this.p10ValueEl = null;
    this.p10LightEl = null;
    this.energyValueEl = null;
    this.energyLightEl = null;
    this.freqValueEl = null;
    this.freqLightEl = null;
    this.stabValueEl = null;
    this.stabLightEl = null;
    this.bannerEl = null;
    this.initBannerEl = null;
  }

  // ---------------------------------------------------------------------------
  // Private helpers
  // ---------------------------------------------------------------------------

  private renderRow(metricId: string): string {
    const labelKey = this.getI18nKeyForMetric(metricId, 'shortLabel');
    const descKey = this.getI18nKeyForMetric(metricId, 'description');

    return `
      <div class="${CLS.row}">
        <span class="${CLS.light}" id="op-${metricId}-light"></span>
        <span class="${CLS.value}" id="op-${metricId}-value">--</span>
        <div class="${CLS.textBlock}">
          <span class="${CLS.label}">${t(labelKey)}</span>
          <span class="${CLS.desc}">${t(descKey)}</span>
        </div>
      </div>
    `;
  }

  private getI18nKeyForMetric(metricId: string, suffix: string): string {
    const map: Record<string, string> = {
      p10: 'opMonitor.similarityP10',
      energy: 'opMonitor.energyDelta',
      freq: 'opMonitor.frequencyDelta',
      stab: 'opMonitor.stability',
    };
    return `${map[metricId]}.${suffix}`;
  }

  private updateMetric(
    valueEl: HTMLElement | null,
    lightEl: HTMLElement | null,
    metric: OperatingPointMetric
  ): void {
    if (valueEl) {
      valueEl.textContent = metric.displayValue;
    }
    if (lightEl) {
      lightEl.style.backgroundColor = LIGHT_COLORS[metric.status];
    }
  }
}
