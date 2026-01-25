/**
 * ZANOBOT - LEVEL 2: DIAGNOSE PHASE (ML-based)
 *
 * Compares current machine audio against reference using YAMNet embeddings.
 * This is used for cyclic machine analysis (Level 2).
 *
 * Flow:
 * 1. Load reference embedding from storage
 * 2. Record current machine audio (10 seconds)
 * 3. Extract YAMNet embeddings from current audio
 * 4. Calculate cosine similarity with reference
 * 5. Display health status and spectrogram
 *
 * IMPORTANT: This phase is completely separate from Level 1 (GMIA)!
 */

import { Level2Detector } from '@core/ml/level2/index.js';
import { MelSpectrogramGenerator } from '@core/audio/mel-spectrogram.js';
import type { Level2AnalysisResult, HealthStatusResult } from '@core/ml/level2/index.js';
import { notify } from '@utils/notifications.js';
import { logger } from '@utils/logger.js';
import type { Machine } from '@data/types.js';

/**
 * Diagnosis state
 */
type DiagnosisState = 'idle' | 'loading-reference' | 'recording' | 'analyzing' | 'complete' | 'error' | 'no-reference';

/**
 * Level 2 Diagnose Phase
 *
 * Handles ML-based diagnosis for cyclic machines.
 */
export class Level2DiagnosePhase {
  private machine: Machine;
  private detector: Level2Detector;
  private specGen: MelSpectrogramGenerator;
  private selectedDeviceId: string | undefined;

  // State
  private state: DiagnosisState = 'idle';
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingDuration: number = 10000; // 10 seconds
  private lastResult: Level2AnalysisResult | null = null;

  // UI Elements
  private container: HTMLElement | null = null;
  private statusElement: HTMLElement | null = null;
  private resultElement: HTMLElement | null = null;
  private spectrogramCanvas: HTMLCanvasElement | null = null;
  private startButton: HTMLButtonElement | null = null;
  private similarityMeter: HTMLElement | null = null;

  // Callbacks
  private onComplete?: (result: Level2AnalysisResult) => void;
  private onError?: (error: Error) => void;

  constructor(machine: Machine, selectedDeviceId?: string) {
    this.machine = machine;
    this.selectedDeviceId = selectedDeviceId;
    this.specGen = new MelSpectrogramGenerator();
    this.detector = new Level2Detector({
      onProgress: (progress, message) => this.updateProgress(progress, message),
      onError: (error) => this.handleError(error),
      onAnalysisComplete: (result) => this.handleAnalysisComplete(result),
    });

    logger.info('🔍 Level2DiagnosePhase initialized for machine:', machine.id);
  }

  /**
   * Initialize the phase (load YAMNet and reference)
   */
  async initialize(): Promise<void> {
    try {
      this.setState('loading-reference');
      await this.detector.initialize();

      // Try to load reference
      const hasReference = await this.detector.loadReferenceFromStorage(this.machine.id);

      if (!hasReference) {
        this.setState('no-reference');
        this.updateStatus('⚠️ Keine Referenz vorhanden. Bitte zuerst Referenz erstellen.', 'warning');
      } else {
        this.setState('idle');
        this.updateStatus('✅ Referenz geladen. Bereit für Diagnose.', 'ready');
      }
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Render the UI
   */
  render(containerId: string): void {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      logger.error(`Container element not found: ${containerId}`);
      return;
    }

    this.container.innerHTML = this.getTemplate();
    this.bindElements();
    this.attachEventListeners();
  }

  /**
   * Get HTML template
   */
  private getTemplate(): string {
    return `
      <div class="level2-diagnose-phase">
        <div class="phase-header">
          <h2>🔍 Level 2: Maschine prüfen (ML)</h2>
          <p class="phase-description">
            Vergleichen Sie den aktuellen Maschinenzustand mit der Referenz.
          </p>
        </div>

        <div class="machine-info">
          <span class="machine-label">Maschine:</span>
          <span class="machine-name">${this.machine.name}</span>
        </div>

        <div class="diagnosis-status" id="level2-diag-status">
          <div class="status-icon">🔍</div>
          <div class="status-text">Initialisiere...</div>
        </div>

        <div class="similarity-container" id="level2-similarity" style="display: none;">
          <div class="similarity-label">Übereinstimmung mit Referenz</div>
          <div class="similarity-meter">
            <div class="meter-bar">
              <div class="meter-fill" id="similarity-fill" style="width: 0%"></div>
            </div>
            <div class="meter-value" id="similarity-value">0%</div>
          </div>
        </div>

        <div class="health-status" id="level2-health-status" style="display: none;">
          <div class="health-icon"></div>
          <div class="health-message"></div>
        </div>

        <div class="spectrogram-container" id="level2-spectrogram" style="display: none;">
          <h4>Spektrogramm</h4>
          <canvas id="spectrogram-canvas" width="600" height="200"></canvas>
        </div>

        <div class="action-buttons">
          <button id="level2-diag-btn" class="btn btn-primary btn-large" disabled>
            🔍 Maschine prüfen
          </button>
        </div>

        <div class="result-details" id="level2-result-details" style="display: none;">
          <h4>📊 Analyseergebnis</h4>
          <div class="details-grid">
            <div class="detail-item">
              <span class="detail-label">Ähnlichkeit:</span>
              <span class="detail-value" id="detail-similarity">-</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Status:</span>
              <span class="detail-value" id="detail-status">-</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Analysezeit:</span>
              <span class="detail-value" id="detail-time">-</span>
            </div>
          </div>
        </div>

        <div class="backend-info" id="level2-diag-backend-info"></div>
      </div>
    `;
  }

  /**
   * Bind UI elements
   */
  private bindElements(): void {
    this.statusElement = this.container?.querySelector('#level2-diag-status') || null;
    this.resultElement = this.container?.querySelector('#level2-result-details') || null;
    this.startButton = this.container?.querySelector('#level2-diag-btn') || null;
    this.similarityMeter = this.container?.querySelector('#level2-similarity') || null;
    this.spectrogramCanvas = this.container?.querySelector('#spectrogram-canvas') || null;

    // Show backend info
    const backendInfo = this.container?.querySelector('#level2-diag-backend-info');
    if (backendInfo && this.detector.isReady()) {
      const info = this.detector.getBackendInfo();
      backendInfo.innerHTML = `
        <small>Backend: ${info?.backend || 'nicht geladen'} ${info?.isGPU ? '(GPU)' : '(CPU)'}</small>
      `;
    }
  }

  /**
   * Attach event listeners
   */
  private attachEventListeners(): void {
    this.startButton?.addEventListener('click', () => this.startDiagnosis());
  }

  /**
   * Start diagnosis recording
   */
  async startDiagnosis(): Promise<void> {
    if (this.state !== 'idle') return;

    if (!this.detector.hasLoadedReference()) {
      notify.error('Keine Referenz vorhanden. Bitte zuerst Referenz erstellen.');
      return;
    }

    try {
      this.setState('recording');
      this.updateStatus('🎤 Aufnahme läuft...', 'recording');

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: this.selectedDeviceId ? { exact: this.selectedDeviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      // Start recording
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        await this.processRecording();
      };

      // Start recording
      this.mediaRecorder.start();

      // Show countdown
      this.showRecordingTimer(this.recordingDuration / 1000);

      // Stop after duration
      setTimeout(() => {
        if (this.mediaRecorder?.state === 'recording') {
          this.mediaRecorder.stop();
        }
      }, this.recordingDuration);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Show recording timer
   */
  private showRecordingTimer(seconds: number): void {
    let remaining = seconds;
    const interval = setInterval(() => {
      remaining--;
      this.updateStatus(`🔴 Aufnahme läuft... (${remaining}s)`, 'recording');

      if (remaining <= 0) {
        clearInterval(interval);
      }
    }, 1000);
  }

  /**
   * Process recorded audio
   */
  private async processRecording(): Promise<void> {
    this.setState('analyzing');
    this.updateStatus('🔄 Analysiere Aufnahme...', 'analyzing');

    try {
      // Convert chunks to AudioBuffer
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      const arrayBuffer = await audioBlob.arrayBuffer();

      // Decode audio
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      audioContext.close();

      // Analyze
      await this.detector.analyzeAudio(audioBuffer);
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Handle analysis completion
   */
  private handleAnalysisComplete(result: Level2AnalysisResult): void {
    this.lastResult = result;
    this.setState('complete');

    // Update UI
    this.updateSimilarityMeter(result.percentage);
    this.updateHealthStatus(result.status);
    this.renderSpectrogram(result.spectrogram);
    this.showResultDetails(result);

    this.updateStatus(`✅ Analyse abgeschlossen: ${result.percentage.toFixed(1)}%`, 'complete');

    // Notification based on status
    if (result.status.status === 'HEALTHY') {
      notify.success(result.status.message);
    } else if (result.status.status === 'WARNING') {
      notify.warning(result.status.message);
    } else {
      notify.error(result.status.message);
    }

    this.onComplete?.(result);

    logger.info('✅ Level 2 analysis complete:', {
      similarity: result.percentage,
      status: result.status.status,
      analysisTime: result.analysisTime,
    });
  }

  /**
   * Update similarity meter
   */
  private updateSimilarityMeter(percentage: number): void {
    if (!this.similarityMeter) return;

    this.similarityMeter.style.display = 'block';

    const fill = document.getElementById('similarity-fill') as HTMLElement;
    const value = document.getElementById('similarity-value');

    if (fill) {
      fill.style.width = `${percentage}%`;
      fill.style.transition = 'width 0.5s ease-out';

      // Color based on percentage
      if (percentage >= 85) {
        fill.style.background = 'linear-gradient(to right, #10b981, #34d399)';
      } else if (percentage >= 70) {
        fill.style.background = 'linear-gradient(to right, #f59e0b, #fbbf24)';
      } else {
        fill.style.background = 'linear-gradient(to right, #ef4444, #f87171)';
      }
    }

    if (value) {
      value.textContent = `${percentage.toFixed(1)}%`;
    }
  }

  /**
   * Update health status display
   */
  private updateHealthStatus(status: HealthStatusResult): void {
    const healthElement = this.container?.querySelector('#level2-health-status') as HTMLElement;
    if (!healthElement) return;

    healthElement.style.display = 'block';
    healthElement.style.backgroundColor = status.color;
    healthElement.style.padding = '20px';
    healthElement.style.borderRadius = '12px';
    healthElement.style.textAlign = 'center';
    healthElement.style.color = 'white';

    const icon = healthElement.querySelector('.health-icon');
    const message = healthElement.querySelector('.health-message');

    if (icon) icon.textContent = status.icon;
    if (message) message.textContent = status.message;
  }

  /**
   * Render spectrogram visualization
   */
  private renderSpectrogram(spectrogram: number[][]): void {
    const container = this.container?.querySelector('#level2-spectrogram') as HTMLElement;
    if (!container || !this.spectrogramCanvas) return;

    container.style.display = 'block';
    this.specGen.renderToCanvas(spectrogram, this.spectrogramCanvas);
  }

  /**
   * Show result details
   */
  private showResultDetails(result: Level2AnalysisResult): void {
    if (!this.resultElement) return;

    this.resultElement.style.display = 'block';

    const similarity = document.getElementById('detail-similarity');
    const status = document.getElementById('detail-status');
    const time = document.getElementById('detail-time');

    if (similarity) similarity.textContent = `${result.percentage.toFixed(1)}%`;
    if (status) {
      status.textContent = result.status.status;
      status.style.color = result.status.color;
    }
    if (time) time.textContent = `${result.analysisTime.toFixed(0)} ms`;
  }

  /**
   * Update status display
   */
  private updateStatus(text: string, type: string): void {
    if (!this.statusElement) return;

    const icons: Record<string, string> = {
      ready: '✅',
      recording: '🔴',
      analyzing: '🔄',
      complete: '✅',
      error: '❌',
      warning: '⚠️',
    };

    const statusText = this.statusElement.querySelector('.status-text');
    const statusIcon = this.statusElement.querySelector('.status-icon');

    if (statusText) statusText.textContent = text;
    if (statusIcon) statusIcon.textContent = icons[type] || '🔍';

    this.statusElement.className = `diagnosis-status status-${type}`;
  }

  /**
   * Update progress (from detector events)
   */
  private updateProgress(_progress: number, _message: string): void {
    // Progress is shown via status updates for now
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    this.setState('error');
    this.updateStatus(`❌ Fehler: ${error.message}`, 'error');

    notify.error(error.message, error);

    // Reset button
    if (this.startButton) {
      this.startButton.textContent = '🔍 Maschine prüfen';
      this.startButton.disabled = false;
    }

    this.onError?.(error);
    logger.error('Level 2 Diagnose error:', error);
  }

  /**
   * Set state and update button
   */
  private setState(state: DiagnosisState): void {
    this.state = state;

    if (this.startButton) {
      this.startButton.disabled = state !== 'idle';

      if (state === 'complete') {
        this.startButton.textContent = '🔍 Erneut prüfen';
        this.startButton.disabled = false;
      }
    }
  }

  /**
   * Set completion callback
   */
  setOnComplete(callback: (result: Level2AnalysisResult) => void): void {
    this.onComplete = callback;
  }

  /**
   * Set error callback
   */
  setOnError(callback: (error: Error) => void): void {
    this.onError = callback;
  }

  /**
   * Get last result
   */
  getLastResult(): Level2AnalysisResult | null {
    return this.lastResult;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop();
    }
    this.detector.dispose();
    this.container = null;
    logger.info('🧹 Level2DiagnosePhase destroyed');
  }
}
