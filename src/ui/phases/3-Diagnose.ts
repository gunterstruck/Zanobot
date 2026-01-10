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
import {
  getRawAudioStream,
  SmartStartManager,
  getSmartStartStatusMessage,
  DEFAULT_SMART_START_CONFIG,
} from '@core/audio/audioHelper.js';
import type { Machine, DiagnosisResult } from '@data/types.js';

export class DiagnosePhase {
  private machine: Machine;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private visualizer: AudioVisualizer | null = null;
  private healthGauge: HealthGauge | null = null;

  // Real-time processing
  private isProcessing: boolean = false;
  private ringBuffer: Float32Array;
  private ringBufferWritePos: number = 0;
  private scoreHistory: ScoreHistory;
  private processingInterval: number | null = null;
  private lastProcessedScore: number = 0;
  private lastProcessedStatus: string = 'UNKNOWN';
  private hasValidMeasurement: boolean = false; // Track if actual measurement occurred
  private smartStartManager: SmartStartManager | null = null;
  private smartStartActive: boolean = true; // Start with Smart Start enabled

  // Configuration
  private chunkSize: number; // 330ms in samples
  private sampleRate: number = 44100;
  private updateFrequency: number = 300; // ms (3-4x per second)

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
        alert('No reference model found. Please record a reference first.');
        return;
      }

      console.log('🔴 Starting REAL-TIME diagnosis with Smart Start...');

      // Reset state for new diagnosis
      this.hasValidMeasurement = false;
      this.lastProcessedScore = 0;
      this.lastProcessedStatus = 'UNKNOWN';
      this.scoreHistory.clear();

      // Reset ring buffer to prevent contamination from previous runs
      this.ringBuffer.fill(0);
      this.ringBufferWritePos = 0;
      this.smartStartActive = true;

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

      // Initialize Smart Start Manager (same config as Phase 2!)
      this.smartStartManager = new SmartStartManager(DEFAULT_SMART_START_CONFIG, {
        onStateChange: (state) => {
          const statusMsg = getSmartStartStatusMessage(state);
          this.updateSmartStartStatus(statusMsg);
        },
        onRecordingStart: () => {
          console.log('✅ Smart Start: Diagnosis started!');
          this.updateSmartStartStatus('Diagnose läuft');
          this.smartStartActive = false; // Disable Smart Start, start real processing
        },
        onTimeout: () => {
          alert('Kein Signal erkannt. Bitte näher an die Maschine gehen und erneut versuchen.');
          this.stopRecording();
        },
      });

      // Setup audio processing pipeline (with Smart Start integration)
      this.setupAudioProcessing();

      // Start Smart Start sequence
      this.smartStartManager.start();

      console.log('✅ Real-time diagnosis initialized with Smart Start!');
    } catch (error) {
      console.error('Diagnosis error:', error);
      alert('Failed to access microphone. Please grant permission.');

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

    // Clear interval
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }

    // Disconnect audio processor
    if (this.scriptProcessor) {
      this.scriptProcessor.disconnect();
      this.scriptProcessor = null;
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
   * Setup audio processing with ScriptProcessorNode (with Smart Start integration)
   */
  private setupAudioProcessing(): void {
    if (!this.audioContext || !this.mediaStream) {
      return;
    }

    // Create source from microphone
    const source = this.audioContext.createMediaStreamSource(this.mediaStream);

    // Create ScriptProcessorNode (buffer size: 4096 samples)
    this.scriptProcessor = this.audioContext.createScriptProcessor(4096, 1, 1);

    // Process incoming audio data
    this.scriptProcessor.onaudioprocess = (event) => {
      const inputData = event.inputBuffer.getChannelData(0);

      // Phase 1: Smart Start processing (warm-up + signal trigger)
      if (this.smartStartActive && this.smartStartManager) {
        const shouldStart = this.smartStartManager.processAudio(inputData);
        if (shouldStart) {
          // Smart Start complete, begin real-time processing
          this.isProcessing = true;
          this.startProcessingLoop();
        }
        return;
      }

      // Phase 2: Real-time diagnosis processing
      if (!this.isProcessing) return;

      // Write to ring buffer for analysis
      this.writeToRingBuffer(inputData);
    };

    // Connect: source → processor → destination (for monitoring)
    source.connect(this.scriptProcessor);
    this.scriptProcessor.connect(this.audioContext.destination);
  }

  /**
   * Write incoming audio to ring buffer
   */
  private writeToRingBuffer(samples: Float32Array): void {
    for (let i = 0; i < samples.length; i++) {
      this.ringBuffer[this.ringBufferWritePos] = samples[i];
      this.ringBufferWritePos = (this.ringBufferWritePos + 1) % this.ringBuffer.length;
    }
  }

  /**
   * Read latest chunk from ring buffer
   */
  private readLatestChunk(): Float32Array {
    const chunk = new Float32Array(this.chunkSize);

    // Read backwards from current write position
    let readPos = this.ringBufferWritePos - this.chunkSize;
    if (readPos < 0) {
      readPos += this.ringBuffer.length;
    }

    for (let i = 0; i < this.chunkSize; i++) {
      chunk[i] = this.ringBuffer[readPos];
      readPos = (readPos + 1) % this.ringBuffer.length;
    }

    return chunk;
  }

  /**
   * Start processing loop (3-4x per second)
   */
  private startProcessingLoop(): void {
    this.processingInterval = window.setInterval(() => {
      this.processChunk();
    }, this.updateFrequency);
  }

  /**
   * Process current audio chunk and update UI
   *
   * Pipeline:
   * 1. Get latest 330ms from ring buffer
   * 2. Extract features
   * 3. GMIA inference
   * 4. Calculate health score
   * 5. Apply filtering (last 10 scores)
   * 6. Update HealthGauge
   */
  private processChunk(): void {
    if (!this.machine.referenceModel) {
      return;
    }

    try {
      // Step 1: Get latest chunk from ring buffer
      const chunk = this.readLatestChunk();

      // Step 2: Extract features (Energy Spectral Densities)
      const featureVector = extractFeaturesFromChunk(chunk, DEFAULT_DSP_CONFIG);

      // Step 3: GMIA inference (cosine similarity)
      const cosineSimilarities = inferGMIA(this.machine.referenceModel, [featureVector]);
      const cosineSimilarity = cosineSimilarities[0];

      // Step 4: Calculate raw health score
      const rawScore = calculateHealthScore(
        cosineSimilarity,
        this.machine.referenceModel.scalingConstant
      );

      // Step 5: Add to history for filtering
      this.scoreHistory.addScore(rawScore);

      // Step 6: Get filtered score (trimmed mean of last 10)
      const filteredScore = this.scoreHistory.getFilteredScore();

      // Step 7: Classify status
      const status = classifyHealthStatus(filteredScore);

      // Step 8: Update UI in real-time
      this.updateLiveDisplay(filteredScore, status);

      // Step 9: Store for final save
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
      alert('Failed to save diagnosis. Please try again.');
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

    // Reset Smart Start manager
    if (this.smartStartManager) {
      this.smartStartManager.reset();
      this.smartStartManager = null;
    }
  }
}
