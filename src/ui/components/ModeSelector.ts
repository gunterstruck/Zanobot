/**
 * ZANOBOT - Mode Selector Component
 *
 * UI component for switching between Level 1 (GMIA) and Level 2 (ML) modes.
 * Can be integrated into the Settings page or shown as a modal.
 */

import {
  getDetectionModeManager,
  DETECTION_MODES,
  type DetectionModeConfig,
} from '@core/detection-mode.js';
import type { DetectionMode } from '@data/types.js';
import { notify } from '@utils/notifications.js';
import { logger } from '@utils/logger.js';
import { t } from '../../i18n/index.js';

/**
 * Mode Selector Component
 *
 * Renders a toggle/card selection for choosing detection mode.
 */
export class ModeSelector {
  private container: HTMLElement | null = null;
  private modeManager = getDetectionModeManager();
  private onChange?: (mode: DetectionMode) => void;

  constructor() {
    // Subscribe to mode changes
    this.modeManager.onModeChange((newMode, oldMode) => {
      logger.info(`Mode changed: ${oldMode} → ${newMode}`);
      this.updateUI();
    });
  }

  /**
   * Render the component
   */
  render(containerId: string): void {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      logger.error(`Container not found: ${containerId}`);
      return;
    }

    this.container.innerHTML = this.getTemplate();
    this.attachEventListeners();
    this.updateUI();
  }

  /**
   * Get HTML template
   */
  private getTemplate(): string {
    const currentMode = this.modeManager.getMode();

    return `
      <div class="mode-selector-component">
        <h3 class="mode-selector-title">🎯 ${t('modeSelector.title')}</h3>
        <p class="mode-selector-description">
          ${t('modeSelector.description')}
        </p>

        <div class="mode-cards">
          ${this.renderModeCard(DETECTION_MODES.STATIONARY, currentMode === 'STATIONARY')}
          ${this.renderModeCard(DETECTION_MODES.CYCLIC, currentMode === 'CYCLIC')}
        </div>

        <div class="mode-info" id="mode-info">
          ${this.renderModeInfo(DETECTION_MODES[currentMode])}
        </div>
      </div>
    `;
  }

  /**
   * Render a mode card
   */
  private renderModeCard(config: DetectionModeConfig, isSelected: boolean): string {
    return `
      <label class="mode-card ${isSelected ? 'selected' : ''}" data-mode="${config.mode}">
        <input
          type="radio"
          name="detection-mode"
          value="${config.mode}"
          ${isSelected ? 'checked' : ''}
        >
        <div class="mode-card-icon">${config.icon}</div>
        <div class="mode-card-content">
          <strong class="mode-card-name">${config.name}</strong>
          <span class="mode-card-description">${config.description}</span>
        </div>
        <div class="mode-card-check">
          ${isSelected ? '✓' : ''}
        </div>
      </label>
    `;
  }

  /**
   * Render mode info/features
   */
  private renderModeInfo(config: DetectionModeConfig): string {
    return `
      <div class="mode-features">
        <h4>${config.icon} ${t('modeSelector.featuresOf', { level: config.mode === 'STATIONARY' ? 'Level 1' : 'Level 2' })}</h4>
        <ul>
          ${config.features.map((f) => `<li>✓ ${f}</li>`).join('')}
        </ul>
      </div>
    `;
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    const radios = this.container?.querySelectorAll('input[name="detection-mode"]');

    radios?.forEach((radio) => {
      radio.addEventListener('change', (e) => {
        const target = e.target as HTMLInputElement;
        const mode = target.value as DetectionMode;
        this.selectMode(mode);
      });
    });

    // Also handle card clicks
    const cards = this.container?.querySelectorAll('.mode-card');
    cards?.forEach((card) => {
      card.addEventListener('click', () => {
        const mode = card.getAttribute('data-mode') as DetectionMode;
        const radio = card.querySelector('input') as HTMLInputElement;
        if (radio && !radio.checked) {
          radio.checked = true;
          this.selectMode(mode);
        }
      });
    });
  }

  /**
   * Select a mode
   */
  private selectMode(mode: DetectionMode): void {
    const oldMode = this.modeManager.getMode();
    if (mode === oldMode) return;

    this.modeManager.setMode(mode);

    // Show notification
    const config = DETECTION_MODES[mode];
    notify.success(t('modeSelector.modeChanged', { name: config.name }));

    // Trigger callback
    this.onChange?.(mode);
  }

  /**
   * Update UI to reflect current mode
   */
  private updateUI(): void {
    if (!this.container) return;

    const currentMode = this.modeManager.getMode();

    // Update cards
    const cards = this.container.querySelectorAll('.mode-card');
    cards.forEach((card) => {
      const mode = card.getAttribute('data-mode');
      const isSelected = mode === currentMode;

      card.classList.toggle('selected', isSelected);

      const check = card.querySelector('.mode-card-check');
      if (check) check.textContent = isSelected ? '✓' : '';

      const radio = card.querySelector('input') as HTMLInputElement;
      if (radio) radio.checked = isSelected;
    });

    // Update info
    const infoElement = this.container.querySelector('#mode-info');
    if (infoElement) {
      infoElement.innerHTML = this.renderModeInfo(DETECTION_MODES[currentMode]);
    }
  }

  /**
   * Get current mode
   */
  getCurrentMode(): DetectionMode {
    return this.modeManager.getMode();
  }

  /**
   * Set change callback
   */
  setOnChange(callback: (mode: DetectionMode) => void): void {
    this.onChange = callback;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.container = null;
  }
}

/**
 * Get singleton mode selector styles
 * Call this once to inject styles into the document
 */
export function injectModeSelectorStyles(): void {
  if (document.getElementById('mode-selector-styles')) return;

  const style = document.createElement('style');
  style.id = 'mode-selector-styles';
  style.textContent = `
    .mode-selector-component {
      padding: 16px;
    }

    .mode-selector-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--text-primary, #1a2332);
    }

    .mode-selector-description {
      font-size: 14px;
      color: var(--text-secondary, #6b7280);
      margin-bottom: 16px;
    }

    .mode-cards {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    @media (max-width: 600px) {
      .mode-cards {
        flex-direction: column;
      }
    }

    .mode-card {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 20px;
      border: 2px solid var(--border-color, #e5e7eb);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: var(--bg-secondary, #ffffff);
      position: relative;
    }

    .mode-card:hover {
      border-color: var(--accent-color, #00d4ff);
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 212, 255, 0.2);
    }

    .mode-card.selected {
      border-color: var(--accent-color, #00d4ff);
      background: rgba(0, 212, 255, 0.1);
    }

    .mode-card input {
      position: absolute;
      opacity: 0;
      pointer-events: none;
    }

    .mode-card-icon {
      font-size: 48px;
      margin-bottom: 12px;
    }

    .mode-card-content {
      text-align: center;
    }

    .mode-card-name {
      display: block;
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary, #1a2332);
      margin-bottom: 4px;
    }

    .mode-card-description {
      display: block;
      font-size: 12px;
      color: var(--text-secondary, #6b7280);
      line-height: 1.4;
    }

    .mode-card-check {
      position: absolute;
      top: 12px;
      right: 12px;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: var(--accent-color, #00d4ff);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: bold;
    }

    .mode-info {
      background: var(--bg-tertiary, #f3f4f6);
      border-radius: 8px;
      padding: 16px;
    }

    .mode-features h4 {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 8px;
      color: var(--text-primary, #1a2332);
    }

    .mode-features ul {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .mode-features li {
      font-size: 13px;
      color: var(--text-secondary, #6b7280);
      padding: 4px 0;
    }

    /* Level 2 specific styles */
    .level2-reference-phase,
    .level2-diagnose-phase {
      padding: 20px;
    }

    .phase-header {
      margin-bottom: 24px;
    }

    .phase-header h2 {
      font-size: 24px;
      margin-bottom: 8px;
    }

    .phase-description {
      color: var(--text-secondary, #6b7280);
    }

    .machine-info {
      background: var(--bg-tertiary, #f3f4f6);
      padding: 12px 16px;
      border-radius: 8px;
      margin-bottom: 20px;
    }

    .machine-label {
      font-size: 12px;
      color: var(--text-secondary, #6b7280);
    }

    .machine-name {
      font-weight: 600;
      margin-left: 8px;
    }

    .recording-status,
    .diagnosis-status {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: var(--bg-secondary, #ffffff);
      border-radius: 12px;
      margin-bottom: 20px;
      border: 1px solid var(--border-color, #e5e7eb);
    }

    .status-icon {
      font-size: 32px;
    }

    .status-text {
      font-size: 16px;
      color: var(--text-primary, #1a2332);
    }

    .progress-container {
      margin-bottom: 20px;
    }

    .progress-bar {
      height: 8px;
      background: var(--bg-tertiary, #e5e7eb);
      border-radius: 4px;
      overflow: hidden;
      margin-bottom: 8px;
    }

    .progress-fill {
      height: 100%;
      background: var(--accent-color, #00d4ff);
      transition: width 0.3s ease;
    }

    .progress-text {
      font-size: 12px;
      color: var(--text-secondary, #6b7280);
    }

    .timer-display {
      text-align: center;
      padding: 20px;
      background: var(--bg-tertiary, #f3f4f6);
      border-radius: 12px;
      margin-bottom: 20px;
    }

    .timer-value {
      font-size: 48px;
      font-weight: bold;
      color: var(--accent-color, #00d4ff);
    }

    .timer-unit {
      display: block;
      font-size: 14px;
      color: var(--text-secondary, #6b7280);
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
    }

    .btn-large {
      padding: 16px 32px;
      font-size: 16px;
    }

    .info-box {
      background: rgba(0, 212, 255, 0.1);
      border: 1px solid rgba(0, 212, 255, 0.3);
      border-radius: 8px;
      padding: 16px;
      margin-bottom: 20px;
    }

    .info-box h4 {
      margin-bottom: 8px;
      color: var(--text-primary, #1a2332);
    }

    .info-box ul {
      margin: 0;
      padding-left: 20px;
    }

    .info-box li {
      font-size: 14px;
      color: var(--text-secondary, #6b7280);
      margin-bottom: 4px;
    }

    .backend-info {
      text-align: center;
      padding: 8px;
      color: var(--text-secondary, #6b7280);
    }

    .similarity-container {
      margin-bottom: 20px;
    }

    .similarity-label {
      font-size: 14px;
      color: var(--text-secondary, #6b7280);
      margin-bottom: 8px;
    }

    .similarity-meter {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .meter-bar {
      flex: 1;
      height: 24px;
      background: var(--bg-tertiary, #e5e7eb);
      border-radius: 12px;
      overflow: hidden;
    }

    .meter-fill {
      height: 100%;
      border-radius: 12px;
      transition: width 0.5s ease-out;
    }

    .meter-value {
      font-size: 24px;
      font-weight: bold;
      min-width: 80px;
      text-align: right;
    }

    .health-status {
      margin-bottom: 20px;
    }

    .health-icon {
      font-size: 48px;
      margin-bottom: 8px;
    }

    .health-message {
      font-size: 18px;
      font-weight: 600;
    }

    .spectrogram-container {
      margin-bottom: 20px;
    }

    .spectrogram-container h4 {
      margin-bottom: 12px;
    }

    #spectrogram-canvas {
      width: 100%;
      max-width: 600px;
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 8px;
    }

    .result-details {
      background: var(--bg-secondary, #ffffff);
      border: 1px solid var(--border-color, #e5e7eb);
      border-radius: 12px;
      padding: 16px;
    }

    .result-details h4 {
      margin-bottom: 12px;
    }

    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 12px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
    }

    .detail-label {
      font-size: 12px;
      color: var(--text-secondary, #6b7280);
    }

    .detail-value {
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary, #1a2332);
    }
  `;

  document.head.appendChild(style);
}
