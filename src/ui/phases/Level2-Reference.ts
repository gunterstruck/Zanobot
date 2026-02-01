/**
 * ZANOBOT - LEVEL 2: REFERENCE PHASE (ML-based)
 *
 * Creates a reference embedding from healthy machine audio using YAMNet.
 * This is used for cyclic machine analysis (Level 2).
 *
 * Flow:
 * 1. User starts recording (10 seconds)
 * 2. Audio is captured and converted to AudioBuffer
 * 3. YAMNet extracts 1024-dimensional embeddings
 * 4. Reference is saved to IndexedDB for later comparison
 *
 * IMPORTANT: This phase is completely separate from Level 1 (GMIA)!
 */

import { Level2Detector } from '@core/ml/level2/index.js';
import type { Level2Reference } from '@core/ml/level2/types.js';
import { notify } from '@utils/notifications.js';
import { logger } from '@utils/logger.js';
import { stopMediaStream } from '@utils/streamHelper.js';
import type { Machine } from '@data/types.js';
import { getMachine, saveMachine } from '@data/db.js';
import { t } from '../../i18n/index.js';

/**
 * Recording state
 */
type RecordingState = 'idle' | 'countdown' | 'recording' | 'processing' | 'complete' | 'error';

/**
 * Level 2 Reference Phase
 *
 * Handles the creation of ML-based reference recordings for cyclic machines.
 */
export class Level2ReferencePhase {
  private machine: Machine;
  private detector: Level2Detector;
  private selectedDeviceId: string | undefined;

  // Recording state
  private state: RecordingState = 'idle';
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private recordingDuration: number = 10000; // 10 seconds

  // VISUAL POSITIONING: Camera stream for reference image
  private cameraStream: MediaStream | null = null;
  private capturedReferenceImage: Blob | null = null;

  // UI Elements
  private container: HTMLElement | null = null;
  private statusElement: HTMLElement | null = null;
  private progressElement: HTMLElement | null = null;
  private startButton: HTMLButtonElement | null = null;
  private timerElement: HTMLElement | null = null;

  // Callbacks
  private onComplete?: (reference: Level2Reference) => void;
  private onError?: (error: Error) => void;

  constructor(machine: Machine, selectedDeviceId?: string) {
    this.machine = machine;
    this.selectedDeviceId = selectedDeviceId;
    this.detector = new Level2Detector({
      onProgress: (progress, message) => this.updateProgress(progress, message),
      onError: (error) => this.handleError(error),
      onReferenceCreated: (ref) => this.handleReferenceCreated(ref),
    });

    logger.info('🔄 Level2ReferencePhase initialized for machine:', machine.id);
  }

  /**
   * Initialize the phase (load YAMNet model)
   */
  async initialize(): Promise<void> {
    try {
      this.setState('processing');
      this.updateProgress(0, 'Initialisiere ML-Modell...');
      await this.detector.initialize();
      this.setState('idle');
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
      <div class="level2-reference-phase">
        <div class="phase-header">
          <h2>🔄 Level 2: Referenzlauf (ML)</h2>
          <p class="phase-description">
            Nehmen Sie einen Referenzlauf Ihrer Maschine im Normalzustand auf.
            Diese Aufnahme wird verwendet, um zukünftige Abweichungen zu erkennen.
          </p>
        </div>

        <div class="machine-info">
          <span class="machine-label">Maschine:</span>
          <span class="machine-name">${this.machine.name}</span>
        </div>

        <div class="recording-status" id="level2-status">
          <div class="status-icon">🎤</div>
          <div class="status-text">Bereit für Aufnahme</div>
        </div>

        <div class="progress-container" id="level2-progress" style="display: none;">
          <div class="progress-bar">
            <div class="progress-fill" style="width: 0%"></div>
          </div>
          <div class="progress-text">0%</div>
        </div>

        <div class="timer-display" id="level2-timer" style="display: none;">
          <span class="timer-value">10</span>
          <span class="timer-unit">Sekunden</span>
        </div>

        <!-- VISUAL POSITIONING: Camera preview for reference image -->
        <div class="camera-preview-container" id="level2-camera-container" style="display: none;">
          <video id="level2-camera-preview" autoplay playsinline muted></video>
          <p class="camera-hint">📷 Position für Referenzbild - halten Sie das Gerät ruhig</p>
        </div>

        <div class="action-buttons">
          <button id="level2-start-btn" class="btn btn-primary btn-large">
            🎤 Referenz aufnehmen
          </button>
        </div>

        <div class="info-box">
          <h4>ℹ️ Hinweise für gute Aufnahmen:</h4>
          <ul>
            <li>Stellen Sie sicher, dass die Maschine im Normalzustand läuft</li>
            <li>Halten Sie das Mikrofon konstant in Position</li>
            <li>Vermeiden Sie Störgeräusche während der Aufnahme</li>
            <li>Die Aufnahme dauert 10 Sekunden</li>
          </ul>
        </div>

        <div class="backend-info" id="level2-backend-info"></div>
      </div>
    `;
  }

  /**
   * Bind UI elements
   */
  private bindElements(): void {
    this.statusElement = this.container?.querySelector('#level2-status') || null;
    this.progressElement = this.container?.querySelector('#level2-progress') || null;
    this.startButton = this.container?.querySelector('#level2-start-btn') || null;
    this.timerElement = this.container?.querySelector('#level2-timer') || null;

    // Show backend info
    const backendInfo = this.container?.querySelector('#level2-backend-info');
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
    this.startButton?.addEventListener('click', () => this.startRecording());
  }

  /**
   * Start recording
   */
  async startRecording(): Promise<void> {
    if (this.state !== 'idle') return;

    try {
      this.setState('countdown');
      this.updateStatus('🎤 Aufnahme startet...', 'info');

      // Get microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: this.selectedDeviceId ? { exact: this.selectedDeviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      // VISUAL POSITIONING: Request camera access for reference image (non-blocking)
      try {
        this.cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }, // Prefer back camera
          audio: false,
        });
        logger.info('📷 Camera access granted for reference image');
        this.setupCameraPreview();
      } catch (cameraError) {
        logger.warn('⚠️ Camera access denied - continuing without reference image', cameraError);
        this.cameraStream = null;
      }

      // Start countdown (3 seconds)
      await this.countdown(3);

      // Start recording
      this.setState('recording');
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(stream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        // Stop all tracks
        stopMediaStream(stream);

        // Cleanup camera
        this.cleanupCamera();

        // Process recording
        await this.processRecording();
      };

      // Show timer
      this.showTimer(this.recordingDuration / 1000);

      // Start recording
      this.mediaRecorder.start();
      this.updateStatus('🔴 Aufnahme läuft...', 'recording');

      // VISUAL POSITIONING: Capture snapshot halfway through recording
      const snapshotDelay = (this.recordingDuration / 2);
      setTimeout(() => {
        this.captureReferenceSnapshot();
      }, snapshotDelay);

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
   * VISUAL POSITIONING: Setup camera preview
   */
  private setupCameraPreview(): void {
    const cameraContainer = this.container?.querySelector('#level2-camera-container') as HTMLElement;
    const videoElement = this.container?.querySelector('#level2-camera-preview') as HTMLVideoElement;

    if (!cameraContainer || !videoElement || !this.cameraStream) return;

    videoElement.srcObject = this.cameraStream;
    cameraContainer.style.display = 'block';
    logger.info('📷 Camera preview activated');
  }

  /**
   * VISUAL POSITIONING: Capture reference snapshot from camera
   */
  private captureReferenceSnapshot(): void {
    if (!this.cameraStream) {
      logger.info('📷 No camera stream - skipping reference snapshot');
      return;
    }

    const videoElement = this.container?.querySelector('#level2-camera-preview') as HTMLVideoElement;
    if (!videoElement || videoElement.readyState < 2) {
      logger.warn('⚠️ Video element not ready - skipping snapshot');
      return;
    }

    try {
      // Create canvas for snapshot
      const canvas = document.createElement('canvas');
      canvas.width = videoElement.videoWidth;
      canvas.height = videoElement.videoHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      ctx.drawImage(videoElement, 0, 0);

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (blob) {
            this.capturedReferenceImage = blob;
            logger.info(`📸 Reference snapshot captured: ${blob.size} bytes (${canvas.width}x${canvas.height})`);
          }
        },
        'image/jpeg',
        0.85
      );
    } catch (error) {
      logger.warn('⚠️ Failed to capture snapshot:', error);
    }
  }

  /**
   * VISUAL POSITIONING: Cleanup camera stream
   */
  private cleanupCamera(): void {
    // Hide camera container
    const cameraContainer = this.container?.querySelector('#level2-camera-container') as HTMLElement;
    if (cameraContainer) {
      cameraContainer.style.display = 'none';
    }

    // Stop camera stream
    stopMediaStream(this.cameraStream);
    this.cameraStream = null;

    logger.info('📷 Camera cleaned up');
  }

  /**
   * Countdown before recording
   */
  private async countdown(seconds: number): Promise<void> {
    for (let i = seconds; i > 0; i--) {
      this.updateStatus(`⏱️ Aufnahme startet in ${i}...`, 'countdown');
      await this.sleep(1000);
    }
  }

  /**
   * Show recording timer
   */
  private showTimer(seconds: number): void {
    if (!this.timerElement) return;

    this.timerElement.style.display = 'block';
    const timerValue = this.timerElement.querySelector('.timer-value');
    let remaining = seconds;

    const interval = setInterval(() => {
      remaining--;
      if (timerValue) {
        timerValue.textContent = String(remaining);
      }

      if (remaining <= 0) {
        clearInterval(interval);
        this.timerElement!.style.display = 'none';
      }
    }, 1000);
  }

  /**
   * Process the recorded audio
   */
  private async processRecording(): Promise<void> {
    this.setState('processing');
    this.updateStatus('🔄 Verarbeite Aufnahme...', 'processing');
    this.showProgress();

    try {
      const latestMachine = await getMachine(this.machine.id);
      if (!latestMachine) {
        throw new Error(`Machine not found: ${this.machine.id}`);
      }
      this.machine = latestMachine;

      // Convert chunks to AudioBuffer
      const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
      const arrayBuffer = await audioBlob.arrayBuffer();

      // Decode audio
      const audioContext = new AudioContext();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      audioContext.close();

      // Create reference
      await this.detector.createReference(audioBuffer, this.machine.id, t('reference.labels.baseline'));
    } catch (error) {
      this.handleError(error as Error);
    }
  }

  /**
   * Handle successful reference creation
   */
  private async handleReferenceCreated(reference: Level2Reference): Promise<void> {
    this.setState('complete');
    this.updateStatus('✅ Referenz erfolgreich erstellt!', 'success');
    this.hideProgress();

    // VISUAL POSITIONING: Save reference image to machine
    await this.saveReferenceImage();

    notify.success('Level 2 Referenz wurde gespeichert');

    // Update button
    if (this.startButton) {
      this.startButton.textContent = '✅ Referenz erstellt';
      this.startButton.disabled = true;
    }

    // Trigger callback
    this.onComplete?.(reference);

    logger.info('✅ Level 2 reference created:', {
      machineId: reference.machineId,
      duration: reference.duration,
      embeddingSize: reference.embedding.length,
      hasReferenceImage: !!this.capturedReferenceImage,
    });
  }

  /**
   * VISUAL POSITIONING: Save reference image to machine
   */
  private async saveReferenceImage(): Promise<void> {
    if (!this.capturedReferenceImage) {
      logger.info('📷 No reference image to save');
      return;
    }

    try {
      // Get latest machine data
      const machineToUpdate = await getMachine(this.machine.id);
      if (!machineToUpdate) {
        logger.warn('⚠️ Machine not found for image save');
        return;
      }

      // Save reference image
      machineToUpdate.referenceImage = this.capturedReferenceImage;
      await saveMachine(machineToUpdate);

      // Update local machine reference
      this.machine = machineToUpdate;

      logger.info(`📸 Reference image saved to machine (${this.capturedReferenceImage.size} bytes)`);
    } catch (error) {
      logger.error('❌ Failed to save reference image:', error);
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    this.setState('error');
    this.updateStatus(`❌ Fehler: ${error.message}`, 'error');
    this.hideProgress();

    notify.error(error.message, error);

    // Reset button
    if (this.startButton) {
      this.startButton.textContent = '🎤 Referenz aufnehmen';
      this.startButton.disabled = false;
    }

    this.onError?.(error);
    logger.error('Level 2 Reference error:', error);
  }

  /**
   * Update status display
   */
  private updateStatus(text: string, type: 'info' | 'recording' | 'processing' | 'success' | 'error' | 'countdown'): void {
    if (!this.statusElement) return;

    const icons: Record<string, string> = {
      info: '🎤',
      recording: '🔴',
      processing: '🔄',
      success: '✅',
      error: '❌',
      countdown: '⏱️',
    };

    const statusText = this.statusElement.querySelector('.status-text');
    const statusIcon = this.statusElement.querySelector('.status-icon');

    if (statusText) statusText.textContent = text;
    if (statusIcon) statusIcon.textContent = icons[type] || '🎤';

    // Update CSS class
    this.statusElement.className = `recording-status status-${type}`;
  }

  /**
   * Update progress display
   */
  private updateProgress(progress: number, message: string): void {
    if (!this.progressElement) return;

    const fill = this.progressElement.querySelector('.progress-fill') as HTMLElement;
    const text = this.progressElement.querySelector('.progress-text');

    if (fill) fill.style.width = `${progress}%`;
    if (text) text.textContent = message;
  }

  /**
   * Show progress bar
   */
  private showProgress(): void {
    if (this.progressElement) {
      this.progressElement.style.display = 'block';
    }
  }

  /**
   * Hide progress bar
   */
  private hideProgress(): void {
    if (this.progressElement) {
      this.progressElement.style.display = 'none';
    }
  }

  /**
   * Set internal state
   */
  private setState(state: RecordingState): void {
    this.state = state;

    // Update button state
    if (this.startButton) {
      this.startButton.disabled = state !== 'idle' && state !== 'complete' && state !== 'error';
    }
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Set completion callback
   */
  setOnComplete(callback: (reference: Level2Reference) => void): void {
    this.onComplete = callback;
  }

  /**
   * Set error callback
   */
  setOnError(callback: (error: Error) => void): void {
    this.onError = callback;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop();
    }

    // VISUAL POSITIONING: Cleanup camera
    this.cleanupCamera();
    this.capturedReferenceImage = null;

    this.detector.dispose();
    this.container = null;
    logger.info('🧹 Level2ReferencePhase destroyed');
  }
}
