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
import type { Machine, DiagnosisResult } from '@data/types.js';
import { getMachine, saveDiagnosis } from '@data/db.js';

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

  // VISUAL POSITIONING: Camera stream for ghost overlay
  private cameraStream: MediaStream | null = null;

  // CRITICAL FIX: Store audio stream reference for proper cleanup
  // Without this, the microphone could stay locked if destroy() is called
  // before MediaRecorder.onstop triggers (e.g., during quick navigation)
  private audioStream: MediaStream | null = null;

  // LIVE WATERFALL: Audio context and analyser for real-time visualization
  private audioContext: AudioContext | null = null;
  private analyserNode: AnalyserNode | null = null;
  private waterfallCanvas: HTMLCanvasElement | null = null;
  private waterfallCtx: CanvasRenderingContext2D | null = null;
  private waterfallAnimationId: number | null = null;
  private waterfallData: number[][] = []; // Stores history of FFT data for waterfall effect
  private waterfallStartTime: number = 0;

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

        <!-- VISUAL POSITIONING: Ghost overlay container (hidden initially) -->
        <div class="ghost-overlay-container" id="level2-ghost-container" style="display: none;">
          <div class="ghost-overlay-wrapper">
            <video id="level2-live-video" autoplay playsinline muted></video>
            <img id="level2-ghost-image" class="ghost-overlay-image" alt="Reference position" />
          </div>
          <p class="ghost-hint">👻 Bewegen Sie das Handy, bis Live-Bild und Referenzbild übereinstimmen</p>
        </div>

        <!-- LIVE WATERFALL: Real-time spectrogram during recording -->
        <div class="waterfall-container" id="level2-waterfall-container" style="display: none;">
          <h4>🌊 Live-Aufnahme</h4>
          <canvas id="level2-waterfall-canvas" width="400" height="150"></canvas>
          <div class="waterfall-time-indicator">
            <span id="waterfall-elapsed">0</span>s / 10s
          </div>
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

        <!-- TRAFFIC LIGHT: Enhanced health status display -->
        <div class="traffic-light-status" id="level2-traffic-light" style="display: none;">
          <div class="traffic-light">
            <div class="light red" id="light-red"></div>
            <div class="light yellow" id="light-yellow"></div>
            <div class="light green" id="light-green"></div>
          </div>
          <div class="traffic-light-info">
            <div class="traffic-light-label" id="traffic-light-label">-</div>
            <div class="traffic-light-score" id="traffic-light-score">-</div>
          </div>
        </div>

        <div class="health-status" id="level2-health-status" style="display: none;">
          <div class="health-icon"></div>
          <div class="health-message"></div>
        </div>

        <div class="spectrogram-container" id="level2-spectrogram" style="display: none;">
          <h4>📊 Spektrogramm (Analyse)</h4>
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

    // LIVE WATERFALL: Bind canvas
    this.waterfallCanvas = this.container?.querySelector('#level2-waterfall-canvas') || null;
    if (this.waterfallCanvas) {
      this.waterfallCtx = this.waterfallCanvas.getContext('2d');
    }

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
    // Allow restart from 'idle' or 'complete' state
    if (this.state !== 'idle' && this.state !== 'complete') return;

    if (!this.detector.hasLoadedReference()) {
      notify.error('Keine Referenz vorhanden. Bitte zuerst Referenz erstellen.');
      return;
    }

    try {
      this.setState('recording');
      this.updateStatus('🎤 Aufnahme läuft...', 'recording');

      // Refresh machine data for reference image
      const latestMachine = await getMachine(this.machine.id);
      if (latestMachine) {
        this.machine = latestMachine;
      }

      // Get microphone access
      // CRITICAL FIX: Store stream as class property for proper cleanup in destroy()
      this.audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: this.selectedDeviceId ? { exact: this.selectedDeviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      // VISUAL POSITIONING: Request camera access (non-blocking)
      try {
        this.cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
          audio: false,
        });
        logger.info('📷 Camera access granted for ghost overlay');
        this.setupGhostOverlay();
      } catch (cameraError) {
        logger.warn('⚠️ Camera access denied - continuing without ghost overlay');
        this.cameraStream = null;
      }

      // LIVE WATERFALL: Setup audio context and analyser
      this.audioContext = new AudioContext();
      this.analyserNode = this.audioContext.createAnalyser();
      this.analyserNode.fftSize = 256;
      this.analyserNode.smoothingTimeConstant = 0.7;

      const source = this.audioContext.createMediaStreamSource(this.audioStream);
      source.connect(this.analyserNode);

      // Start waterfall visualization
      this.startWaterfallVisualization();

      // Start recording
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(this.audioStream);

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
        }
      };

      this.mediaRecorder.onstop = async () => {
        // CRITICAL FIX: Use class property and null-check for safety
        this.cleanupAudioStream();
        this.stopWaterfallVisualization();
        this.cleanupCameraStream();
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
   * VISUAL POSITIONING: Setup ghost overlay with reference image
   */
  private setupGhostOverlay(): void {
    const ghostContainer = this.container?.querySelector('#level2-ghost-container') as HTMLElement;
    const videoElement = this.container?.querySelector('#level2-live-video') as HTMLVideoElement;
    const ghostImage = this.container?.querySelector('#level2-ghost-image') as HTMLImageElement;

    if (!ghostContainer || !videoElement || !ghostImage) return;

    // Attach camera stream to video
    if (this.cameraStream) {
      videoElement.srcObject = this.cameraStream;
    }

    // Load reference image if available
    if (this.machine.referenceImage) {
      const imageUrl = URL.createObjectURL(this.machine.referenceImage);
      ghostImage.src = imageUrl;
      ghostImage.onload = () => {
        // Revoke URL after image loads to free memory
        // Note: We create a new one each time, so this is safe
      };
    }

    // Show the container
    ghostContainer.style.display = 'block';
    logger.info('✅ Ghost overlay activated');
  }

  /**
   * CRITICAL FIX: Cleanup audio stream to release microphone
   * This ensures the microphone is released even if destroy() is called
   * before MediaRecorder.onstop triggers (e.g., during quick navigation).
   * Without this, phone calls could be blocked!
   */
  private cleanupAudioStream(): void {
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
      logger.debug('🎤 Audio stream released - microphone is now available for other apps');
    }
  }

  /**
   * Cleanup camera stream
   */
  private cleanupCameraStream(): void {
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach(track => track.stop());
      this.cameraStream = null;
    }

    // Hide ghost container
    const ghostContainer = this.container?.querySelector('#level2-ghost-container') as HTMLElement;
    if (ghostContainer) {
      ghostContainer.style.display = 'none';
    }

    // Revoke ghost image URL
    const ghostImage = this.container?.querySelector('#level2-ghost-image') as HTMLImageElement;
    if (ghostImage && ghostImage.src) {
      URL.revokeObjectURL(ghostImage.src);
      ghostImage.src = '';
    }
  }

  /**
   * LIVE WATERFALL: Start real-time spectrogram visualization
   */
  private startWaterfallVisualization(): void {
    const container = this.container?.querySelector('#level2-waterfall-container') as HTMLElement;
    if (container) {
      container.style.display = 'block';
    }

    this.waterfallData = [];
    this.waterfallStartTime = Date.now();

    const render = () => {
      if (!this.analyserNode || !this.waterfallCanvas || !this.waterfallCtx) {
        return;
      }

      const bufferLength = this.analyserNode.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      this.analyserNode.getByteFrequencyData(dataArray);

      // Convert to normalized values and add to history
      const normalized = Array.from(dataArray).map(v => v / 255);
      this.waterfallData.push(normalized);

      // Limit history to canvas width
      const maxColumns = this.waterfallCanvas.width;
      if (this.waterfallData.length > maxColumns) {
        this.waterfallData.shift();
      }

      // Render waterfall
      this.renderWaterfall();

      // Update time indicator
      const elapsed = Math.floor((Date.now() - this.waterfallStartTime) / 1000);
      const elapsedElement = this.container?.querySelector('#waterfall-elapsed');
      if (elapsedElement) {
        elapsedElement.textContent = elapsed.toString();
      }

      this.waterfallAnimationId = requestAnimationFrame(render);
    };

    render();
  }

  /**
   * Render waterfall spectrogram to canvas
   */
  private renderWaterfall(): void {
    if (!this.waterfallCanvas || !this.waterfallCtx || this.waterfallData.length === 0) return;

    const ctx = this.waterfallCtx;
    const width = this.waterfallCanvas.width;
    const height = this.waterfallCanvas.height;

    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);

    // Calculate column width (builds up from left to right)
    const columnWidth = Math.max(1, Math.floor(width / (this.recordingDuration / 1000 * 30))); // ~30fps
    const numColumns = this.waterfallData.length;

    for (let col = 0; col < numColumns; col++) {
      const column = this.waterfallData[col];
      const x = col * columnWidth;

      for (let row = 0; row < column.length; row++) {
        const value = column[row];
        const y = height - (row / column.length) * height;
        const rowHeight = height / column.length;

        // Color based on intensity (blue -> cyan -> green -> yellow -> red)
        const color = this.getWaterfallColor(value);
        ctx.fillStyle = color;
        ctx.fillRect(x, y - rowHeight, columnWidth, rowHeight);
      }
    }

    // Draw progress line
    const progress = (Date.now() - this.waterfallStartTime) / this.recordingDuration;
    const lineX = Math.min(progress * width, width - 2);
    ctx.strokeStyle = '#00f3ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(lineX, 0);
    ctx.lineTo(lineX, height);
    ctx.stroke();
  }

  /**
   * Get color for waterfall visualization (Viridis-like)
   */
  private getWaterfallColor(value: number): string {
    // Clamp value
    const v = Math.max(0, Math.min(1, value));

    // Enhanced color mapping for visibility
    if (v < 0.2) {
      // Dark blue/purple
      const intensity = v / 0.2;
      return `rgb(${Math.floor(20 + 20 * intensity)}, ${Math.floor(10 + 30 * intensity)}, ${Math.floor(60 + 40 * intensity)})`;
    } else if (v < 0.4) {
      // Blue to cyan
      const intensity = (v - 0.2) / 0.2;
      return `rgb(${Math.floor(40 * (1 - intensity))}, ${Math.floor(40 + 180 * intensity)}, ${Math.floor(100 + 155 * intensity)})`;
    } else if (v < 0.6) {
      // Cyan to green
      const intensity = (v - 0.4) / 0.2;
      return `rgb(${Math.floor(100 * intensity)}, ${Math.floor(220 - 20 * intensity)}, ${Math.floor(255 - 155 * intensity)})`;
    } else if (v < 0.8) {
      // Green to yellow
      const intensity = (v - 0.6) / 0.2;
      return `rgb(${Math.floor(100 + 155 * intensity)}, ${Math.floor(200 + 55 * intensity)}, ${Math.floor(100 - 100 * intensity)})`;
    } else {
      // Yellow to red
      const intensity = (v - 0.8) / 0.2;
      return `rgb(255, ${Math.floor(255 - 200 * intensity)}, ${Math.floor(intensity * 50)})`;
    }
  }

  /**
   * Stop waterfall visualization
   */
  private stopWaterfallVisualization(): void {
    if (this.waterfallAnimationId) {
      cancelAnimationFrame(this.waterfallAnimationId);
      this.waterfallAnimationId = null;
    }

    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    this.analyserNode = null;

    // Hide waterfall container
    const container = this.container?.querySelector('#level2-waterfall-container') as HTMLElement;
    if (container) {
      container.style.display = 'none';
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
  private async handleAnalysisComplete(result: Level2AnalysisResult): Promise<void> {
    this.lastResult = result;
    this.setState('complete');

    // Update UI
    this.updateSimilarityMeter(result.percentage);
    this.updateHealthStatus(result.status);
    this.updateTrafficLight(result.percentage, result.status); // TRAFFIC LIGHT
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

    // Save diagnosis result to database
    await this.saveDiagnosisResult(result);

    this.onComplete?.(result);

    logger.info('✅ Level 2 analysis complete:', {
      similarity: result.percentage,
      status: result.status.status,
      analysisTime: result.analysisTime,
    });
  }

  /**
   * Save diagnosis result to database
   */
  private async saveDiagnosisResult(result: Level2AnalysisResult): Promise<void> {
    try {
      // Map Level2 status to DiagnosisResult status
      const statusMap: Record<string, 'healthy' | 'uncertain' | 'faulty'> = {
        'HEALTHY': 'healthy',
        'WARNING': 'uncertain',
        'CRITICAL': 'faulty',
      };

      const diagnosis: DiagnosisResult = {
        id: `diag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        machineId: this.machine.id,
        timestamp: result.timestamp,
        healthScore: result.percentage,
        status: statusMap[result.status.status] || 'uncertain',
        confidence: result.similarity * 100, // Convert 0-1 to 0-100
        rawCosineSimilarity: result.similarity,
        metadata: {
          analysisMethod: 'YAMNet',
          level: 2,
          analysisTime: result.analysisTime,
          statusMessage: result.status.message,
        },
      };

      await saveDiagnosis(diagnosis);
      logger.info('💾 Level 2 diagnosis saved to database');
      notify.info('Diagnose gespeichert');
    } catch (error) {
      logger.error('❌ Failed to save diagnosis:', error);
      notify.error('Diagnose konnte nicht gespeichert werden');
    }
  }

  /**
   * TRAFFIC LIGHT: Update visual status indicator
   * Uses same colors as Level 1 for consistency:
   * - Green (Healthy): ≥85% similarity
   * - Yellow (Warning): 70-85% similarity
   * - Red (Critical): <70% similarity
   */
  private updateTrafficLight(percentage: number, status: HealthStatusResult): void {
    const trafficLight = this.container?.querySelector('#level2-traffic-light') as HTMLElement;
    if (!trafficLight) return;

    trafficLight.style.display = 'flex';

    const redLight = this.container?.querySelector('#light-red') as HTMLElement;
    const yellowLight = this.container?.querySelector('#light-yellow') as HTMLElement;
    const greenLight = this.container?.querySelector('#light-green') as HTMLElement;
    const label = this.container?.querySelector('#traffic-light-label') as HTMLElement;
    const score = this.container?.querySelector('#traffic-light-score') as HTMLElement;

    // Reset all lights
    [redLight, yellowLight, greenLight].forEach(light => {
      if (light) {
        light.classList.remove('active');
      }
    });

    // Activate appropriate light based on status
    if (status.status === 'HEALTHY') {
      greenLight?.classList.add('active');
      if (label) {
        label.textContent = 'GESUND';
        label.style.color = '#10b981';
      }
    } else if (status.status === 'WARNING') {
      yellowLight?.classList.add('active');
      if (label) {
        label.textContent = 'WARNUNG';
        label.style.color = '#f59e0b';
      }
    } else {
      redLight?.classList.add('active');
      if (label) {
        label.textContent = 'KRITISCH';
        label.style.color = '#ef4444';
      }
    }

    // Update score display
    if (score) {
      score.textContent = `${percentage.toFixed(1)}%`;
      score.style.color = status.color;
    }
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
   * Reload reference from storage
   * Called when a new reference is created in Level2ReferencePhase
   */
  async reloadReference(): Promise<boolean> {
    try {
      this.setState('loading-reference');
      this.updateStatus('🔄 Lade neue Referenz...', 'loading');

      const hasReference = await this.detector.loadReferenceFromStorage(this.machine.id);

      if (hasReference) {
        this.setState('idle');
        this.updateStatus('✅ Neue Referenz geladen. Bereit für Diagnose.', 'ready');
        logger.info('✅ Level2DiagnosePhase: Reference reloaded successfully');
        return true;
      } else {
        this.setState('no-reference');
        this.updateStatus('⚠️ Keine Referenz vorhanden. Bitte zuerst Referenz erstellen.', 'warning');
        return false;
      }
    } catch (error) {
      logger.error('❌ Error reloading reference:', error);
      this.handleError(error as Error);
      return false;
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
   *
   * CRITICAL FIX: Always release audio stream to ensure microphone is available
   * for other apps (e.g., phone calls). Previously, the stream was only stopped
   * in MediaRecorder.onstop callback, which wouldn't be called if destroy()
   * was invoked before recording started or completed.
   */
  destroy(): void {
    if (this.mediaRecorder?.state === 'recording') {
      this.mediaRecorder.stop();
    }

    // CRITICAL FIX: Always cleanup audio stream to release microphone
    // This ensures phone calls work even if MediaRecorder.onstop wasn't triggered
    this.cleanupAudioStream();

    // Cleanup waterfall visualization
    this.stopWaterfallVisualization();

    // Cleanup camera stream
    this.cleanupCameraStream();

    this.detector.dispose();
    this.container = null;
    logger.info('🧹 Level2DiagnosePhase destroyed');
  }
}
