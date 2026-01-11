/**
 * ZANOBOT - PHASE 3: DIAGNOSE (REAL-TIME)
 *
 * Real-time operation mode with live feedback loop.
 *
 * Flow:
 * 1. Stream audio continuously
 * 2. Process in 330ms chunks (3-4x per second)
 * 3. Extract features → GMIA inference → Health score
 * 4. Apply filtering (last 10 scores, trim 2 min/max)
 * 5. Update HealthGauge in real-time
 * 6. User sees live feedback ("Sweet Spot Search")
 * 7. Stop button saves final filtered score
 */

import { extractFeaturesFromChunk, DEFAULT_DSP_CONFIG } from '@core/dsp/features.js';
import { inferGMIA } from '@core/ml/gmia.js';
import {
  calculateHealthScore,
  ScoreHistory,
  classifyHealthStatus,
  getClassificationDetails,
} from '@core/ml/scoring.js';
import { saveDiagnosis } from '@data/db.js';
import { AudioVisualizer } from '@ui/components/AudioVisualizer.js';
import { HealthGauge } from '@ui/components/HealthGauge.js';
import { getRawAudioStream, getSmartStartStatusMessage } from '@core/audio/audioHelper.js';
import {
  AudioWorkletManager,
  isAudioWorkletSupported,
} from '@core/audio/audioWorkletHelper.js';
import { notify } from '@utils/notifications.js';
import type { Machine, DiagnosisResult } from '@data/types.js';

export class DiagnosePhase {
  private machine: Machine;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioWorkletManager: AudioWorkletManager | null = null;
  private visualizer: AudioVisualizer | null = null;
  private healthGauge: HealthGauge | null = null;

  // Real-time processing
  private isProcessing: boolean = false;
  private ringBuffer: Float32Array;
  private ringBufferWritePos: number = 0;
  private scoreHistory: ScoreHistory;
  private lastProcessedScore: number = 0;
  private lastProcessedStatus: string = 'UNKNOWN';
  private hasValidMeasurement: boolean = false; // Track if actual measurement occurred
  private useAudioWorklet: boolean = true;

  // Configuration
  private chunkSize: number; // 330ms in samples
  private sampleRate: number = 44100;

  constructor(machine: Machine) {
    this.machine = machine;

    // Calculate chunk size (330ms)
    this.chunkSize = Math.floor(DEFAULT_DSP_CONFIG.windowSize * this.sampleRate);

    // Initialize ring buffer (2x chunk size for safety)
    this.ringBuffer = new Float32Array(this.chunkSize * 2);

    // Initialize score history for filtering
    this.scoreHistory = new ScoreHistory();
  }

  /**
   * Initialize the diagnose phase UI
   */
  public init(): void {
    const diagnoseBtn = document.getElementById('diagnose-btn');
    if (diagnoseBtn) {
      diagnoseBtn.addEventListener('click', () => this.startDiagnosis());
    }
  }

  /**
   * Start real-time diagnosis with Smart Start
   */
  private async startDiagnosis(): Promise<void> {
    try {
      // Check if machine has reference model
      if (!this.machine.referenceModel) {
        notify.error('Kein Referenzmodell gefunden. Bitte zuerst eine Referenzaufnahme erstellen.');
        return;
      }

      console.log('🔴 Starting REAL-TIME diagnosis with Smart Start...');

      // Check AudioWorklet support
      this.useAudioWorklet = isAudioWorkletSupported();
      if (!this.useAudioWorklet) {
        console.warn('⚠️ AudioWorklet not supported, Smart Start disabled');
      }

      // Reset state for new diagnosis
      this.hasValidMeasurement = false;
      this.lastProcessedScore = 0;
      this.lastProcessedStatus = 'UNKNOWN';
      this.scoreHistory.clear();

      // Reset ring buffer to prevent contamination from previous runs
      this.ringBuffer.fill(0);
      this.ringBufferWritePos = 0;

      // Request microphone access using central helper (same as Phase 2!)
      this.mediaStream = await getRawAudioStream();

      // Create audio context
      this.audioContext = new AudioContext({ sampleRate: this.sampleRate });

      // Show recording modal
      this.showRecordingModal();

      // Initialize HealthGauge
      const gaugeCanvas = document.getElementById('health-gauge-canvas');
      if (gaugeCanvas) {
        this.healthGauge = new HealthGauge('health-gauge-canvas');
        this.healthGauge.draw(0, 'UNKNOWN'); // Initial state
      }

      // Start visualizer
      const waveformCanvas = document.getElementById('waveform-canvas');
      if (waveformCanvas) {
        this.visualizer = new AudioVisualizer('waveform-canvas');
        this.visualizer.start(this.audioContext, this.mediaStream);
      }

      if (this.useAudioWorklet) {
        // Initialize AudioWorklet Manager
        this.audioWorkletManager = new AudioWorkletManager({
          bufferSize: this.chunkSize * 2,
          onAudioChunk: (chunk) => {
            // Real-time audio chunk received from worklet
            if (this.isProcessing) {
              this.processChunkDirectly(chunk);
            }
          },
          onSmartStartStateChange: (state) => {
            const statusMsg = getSmartStartStatusMessage(state);
            this.updateSmartStartStatus(statusMsg);
          },
          onSmartStartComplete: (rms) => {
            console.log(`✅ Smart Start: Signal detected! RMS: ${rms.toFixed(4)}`);
            this.updateSmartStartStatus('Diagnose läuft');
            this.isProcessing = true; // Start processing incoming chunks
          },
          onSmartStartTimeout: () => {
            notify.warning('Kein Signal erkannt', 'Bitte näher an die Maschine gehen und erneut versuchen.');
            this.stopRecording();
          },
        });

        // Initialize AudioWorklet
        await this.audioWorkletManager.init(this.audioContext, this.mediaStream);

        // Start Smart Start sequence
        this.audioWorkletManager.startSmartStart();
      } else {
        // Fallback: Start processing immediately without Smart Start
        console.log('⏭️ Skipping Smart Start (AudioWorklet not supported)');
        this.updateSmartStartStatus('Diagnose läuft');
        this.isProcessing = true;
        // Note: Without AudioWorklet, real-time processing won't work optimally
        notify.warning('AudioWorklet nicht unterstützt', 'Diagnose-Funktionalität eingeschränkt.');
      }

      console.log('✅ Real-time diagnosis initialized!');
    } catch (error) {
      console.error('Diagnosis error:', error);
      notify.error('Mikrofonzugriff fehlgeschlagen', error as Error, {
        title: 'Zugriff verweigert',
        duration: 0
      });

      // Cleanup on error
      this.cleanup();
    }
  }

  /**
   * Cleanup resources (AudioContext, MediaStream, etc.)
   */
  private cleanup(): void {
    // Stop processing
    this.isProcessing = false;

    // Cleanup AudioWorklet
    if (this.audioWorkletManager) {
      this.audioWorkletManager.cleanup();
      this.audioWorkletManager = null;
    }

    // Stop visualizer
    if (this.visualizer) {
      this.visualizer.stop();
    }

    // Stop media stream tracks
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    console.log('🧹 Cleanup complete');
  }

  /**
   * Process audio chunk directly (called from AudioWorklet)
   *
   * This is the NEW real-time processing pipeline using AudioWorklet.
   * Receives chunks directly from the audio thread.
   *
   * @param chunk - Audio chunk from AudioWorklet (4096 samples)
   */
  private processChunkDirectly(chunk: Float32Array): void {
    if (!this.machine.referenceModel) {
      return;
    }

    try {
      // Ensure chunk is large enough for feature extraction (330ms = ~14553 samples at 44.1kHz)
      if (chunk.length < this.chunkSize) {
        // Buffer too small, wait for more data
        return;
      }

      // Use only the required chunk size for feature extraction
      const processingChunk = chunk.slice(0, this.chunkSize);

      // Step 1: Extract features (Energy Spectral Densities)
      const featureVector = extractFeaturesFromChunk(processingChunk, DEFAULT_DSP_CONFIG);

      // Step 2: GMIA inference (cosine similarity)
      const cosineSimilarities = inferGMIA(this.machine.referenceModel, [featureVector]);
      const cosineSimilarity = cosineSimilarities[0];

      // Step 3: Calculate raw health score
      const rawScore = calculateHealthScore(
        cosineSimilarity,
        this.machine.referenceModel.scalingConstant
      );

      // Step 4: Add to history for filtering
      this.scoreHistory.addScore(rawScore);

      // Step 5: Get filtered score (trimmed mean of last 10)
      const filteredScore = this.scoreHistory.getFilteredScore();

      // Step 6: Classify status
      const status = classifyHealthStatus(filteredScore);

      // Step 7: Update UI in real-time
      this.updateLiveDisplay(filteredScore, status);

      // Step 8: Store for final save
      this.lastProcessedScore = filteredScore;
      this.lastProcessedStatus = status;
      this.hasValidMeasurement = true; // Mark that we have valid data

      // Debug log every 10th update
      if (this.scoreHistory.getAllScores().length % 10 === 0) {
        console.log(`📊 Live Score: ${filteredScore.toFixed(1)}% (${status})`);
      }
    } catch (error) {
      console.error('Chunk processing error:', error);
    }
  }


  /**
   * Update Smart Start status message
   */
  private updateSmartStartStatus(message: string): void {
    const statusElement = document.getElementById('smart-start-status');
    if (statusElement) {
      statusElement.textContent = message;

      // Hide once recording starts
      if (message.includes('läuft')) {
        statusElement.style.display = 'none';
      }
    }
  }

  /**
   * Update live display (HealthGauge)
   */
  private updateLiveDisplay(score: number, status: string): void {
    if (this.healthGauge) {
      this.healthGauge.draw(score, status);
    }

    // Update score display if visible in modal
    const scoreElement = document.getElementById('live-health-score');
    if (scoreElement) {
      scoreElement.textContent = `${score.toFixed(1)}%`;
    }

    const statusElement = document.getElementById('live-status');
    if (statusElement) {
      statusElement.textContent = status;
      statusElement.className = `live-status status-${status.toLowerCase()}`;
    }
  }

  /**
   * Stop recording and save final result
   */
  private stopRecording(): void {
    console.log('⏹️ Stopping diagnosis...');

    // Cleanup resources
    this.cleanup();

    // Save final diagnosis ONLY if we have valid measurement data
    if (this.hasValidMeasurement) {
      this.saveFinalDiagnosis();
    } else {
      console.log('⚠️ No valid measurement data - skipping save');
      this.hideRecordingModal();
    }
  }

  /**
   * Save final diagnosis result
   */
  private async saveFinalDiagnosis(): Promise<void> {
    try {
      if (!this.machine.referenceModel) {
        throw new Error('No reference model available');
      }

      // Use the last processed (filtered) score
      const finalScore = this.lastProcessedScore;
      const finalStatus = this.lastProcessedStatus;

      // Get classification details
      const classification = getClassificationDetails(finalScore);

      // Create diagnosis result
      const diagnosis: DiagnosisResult = {
        id: `diag-${Date.now()}`,
        machineId: this.machine.id,
        timestamp: Date.now(),
        healthScore: finalScore,
        status: finalStatus,
        confidence: classification.confidence,
        rawCosineSimilarity: 0, // Not stored for real-time
        metadata: {
          processingMode: 'real-time',
          totalScores: this.scoreHistory.getAllScores().length,
          scoreHistory: this.scoreHistory.getAllScores().slice(-10),
        },
      };

      console.log(`💾 Saving final diagnosis: ${finalScore.toFixed(1)}% (${finalStatus})`);

      // Save to database
      await saveDiagnosis(diagnosis);

      // Hide modal
      this.hideRecordingModal();

      // Show results
      this.showResults(diagnosis);

      console.log('✅ Diagnosis saved successfully!');
    } catch (error) {
      console.error('Save error:', error);
      notify.error('Diagnose konnte nicht gespeichert werden', error as Error, {
        title: 'Speicherfehler',
        duration: 0
      });
      this.hideRecordingModal();
    }
  }

  /**
   * Show recording modal
   */
  private showRecordingModal(): void {
    const modal = document.getElementById('recording-modal');
    if (modal) {
      modal.style.display = 'flex';
    }

    // Update button text and behavior
    const stopBtn = document.getElementById('stop-recording-btn');
    if (stopBtn) {
      stopBtn.textContent = 'Stop & Save';
      stopBtn.onclick = () => this.stopRecording();
    }

    // Update modal title
    const modalTitle = document.querySelector('#recording-modal .modal-header h3');
    if (modalTitle) {
      modalTitle.textContent = 'Live Diagnosis - Find Sweet Spot';
    }

    // Add Smart Start status and live score display
    const modalBody = document.querySelector('#recording-modal .modal-body');
    if (modalBody && !document.getElementById('live-health-score')) {
      const liveDisplay = document.createElement('div');
      liveDisplay.className = 'live-display';
      liveDisplay.innerHTML = `
        <div id="smart-start-status" class="smart-start-status">Initialisierung...</div>
        <div class="live-score-container">
          <p class="live-hint">Move phone closer to machine for optimal signal</p>
          <p class="live-score-label">Current Health Score:</p>
          <p id="live-health-score" class="live-score">--</p>
          <p id="live-status" class="live-status">UNKNOWN</p>
        </div>
      `;
      modalBody.appendChild(liveDisplay);
    }
  }

  /**
   * Hide recording modal
   */
  private hideRecordingModal(): void {
    const modal = document.getElementById('recording-modal');
    if (modal) {
      modal.style.display = 'none';
    }

    // Clean up live display
    const liveDisplay = document.querySelector('.live-display');
    if (liveDisplay) {
      liveDisplay.remove();
    }
  }

  /**
   * Show diagnosis results
   */
  private showResults(diagnosis: DiagnosisResult): void {
    const modal = document.getElementById('diagnosis-modal');
    if (!modal) return;

    // Update machine info
    const machineBarcode = document.getElementById('machine-barcode');
    if (machineBarcode) {
      machineBarcode.textContent = this.machine.name;
    }

    // Draw final health gauge
    const gaugeCanvas = document.getElementById('health-gauge-canvas');
    if (gaugeCanvas) {
      const finalGauge = new HealthGauge('health-gauge-canvas');
      finalGauge.draw(diagnosis.healthScore, diagnosis.status);
    }

    // Update status
    const resultStatus = document.getElementById('result-status');
    if (resultStatus) {
      resultStatus.textContent = diagnosis.status;
      resultStatus.className = `result-status status-${diagnosis.status.toLowerCase()}`;
    }

    // Update confidence
    const resultConfidence = document.getElementById('result-confidence');
    if (resultConfidence) {
      resultConfidence.textContent = diagnosis.healthScore.toFixed(1);
    }

    // Update analysis hint
    const analysisHint = document.getElementById('analysis-hint');
    if (analysisHint) {
      const classification = getClassificationDetails(diagnosis.healthScore);
      analysisHint.textContent = classification.recommendation;
    }

    // Show modal
    modal.style.display = 'flex';

    // Setup close button
    const closeBtn = document.getElementById('close-diagnosis-modal');
    if (closeBtn) {
      closeBtn.onclick = () => {
        modal.style.display = 'none';
      };
    }
  }

  /**
   * Destroy phase and cleanup all resources
   */
  public destroy(): void {
    this.cleanup();

    // Destroy visualizer
    if (this.visualizer) {
      this.visualizer.destroy();
      this.visualizer = null;
    }

    // Clear score history
    this.scoreHistory.clear();
  }
}
