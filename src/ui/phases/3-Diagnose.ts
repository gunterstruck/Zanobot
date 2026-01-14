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
  LabelHistory,
  getClassificationDetails,
  classifyDiagnosticState,
  classifyHealthStatus,
} from '@core/ml/scoring.js';
import { saveDiagnosis, getMachine } from '@data/db.js';
import { AudioVisualizer } from '@ui/components/AudioVisualizer.js';
import { HealthGauge } from '@ui/components/HealthGauge.js';
import {
  getRawAudioStream,
  getSmartStartStatusMessage,
  DEFAULT_SMART_START_CONFIG,
} from '@core/audio/audioHelper.js';
import { AudioWorkletManager, isAudioWorkletSupported } from '@core/audio/audioWorkletHelper.js';
import { notify } from '@utils/notifications.js';
import type { Machine, DiagnosisResult, GMIAModel } from '@data/types.js';
import { logger } from '@utils/logger.js';
import { BUTTON_TEXT, MODAL_TITLE } from '@ui/constants.js';

export class DiagnosePhase {
  private machine: Machine;
  private selectedDeviceId: string | undefined; // Selected microphone device ID
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private audioWorkletManager: AudioWorkletManager | null = null;
  private visualizer: AudioVisualizer | null = null;
  private healthGauge: HealthGauge | null = null;
  private activeModels: GMIAModel[] = [];

  // Real-time processing
  private isProcessing: boolean = false;
  private scoreHistory: ScoreHistory;
  private labelHistory: LabelHistory; // CRITICAL FIX: Label history for majority voting
  private lastProcessedScore: number = 0;
  private lastProcessedStatus: 'healthy' | 'uncertain' | 'faulty' | 'UNKNOWN' = 'UNKNOWN';
  private lastDetectedState: string = 'UNKNOWN'; // MULTICLASS: Store detected state
  private hasValidMeasurement: boolean = false; // Track if actual measurement occurred
  private useAudioWorklet: boolean = true;
  private isStarting: boolean = false;

  // Configuration
  private chunkSize: number; // 330ms in samples
  // CRITICAL FIX: Use 48000 Hz to match AUDIO_CONSTRAINTS.sampleRate
  // This prevents unnecessary browser resampling (48k hardware → 44.1k context)
  private requestedSampleRate: number = 48000; // Requested sample rate
  private actualSampleRate: number = 48000; // Actual sample rate from AudioContext
  private dspConfig: typeof DEFAULT_DSP_CONFIG; // DSP config with actual sample rate

  // CRITICAL FIX: Store event listener reference for proper cleanup
  private diagnoseButtonClickHandler: (() => void) | null = null;

  constructor(machine: Machine, selectedDeviceId?: string) {
    this.machine = machine;
    this.selectedDeviceId = selectedDeviceId;

    // Initialize with default config (will be updated when AudioContext is created)
    this.chunkSize = Math.floor(DEFAULT_DSP_CONFIG.windowSize * this.requestedSampleRate);
    this.dspConfig = { ...DEFAULT_DSP_CONFIG };

    // Initialize score history for filtering
    this.scoreHistory = new ScoreHistory();
    // CRITICAL FIX: Initialize label history for majority voting
    this.labelHistory = new LabelHistory();
  }

  /**
   * Initialize the diagnose phase UI
   */
  public init(): void {
    const diagnoseBtn = document.getElementById('diagnose-btn');
    if (diagnoseBtn) {
      // CRITICAL FIX: Store handler reference to enable cleanup in destroy()
      this.diagnoseButtonClickHandler = () => this.startDiagnosis();
      diagnoseBtn.addEventListener('click', this.diagnoseButtonClickHandler);
    }
  }

  /**
   * Start real-time diagnosis with Smart Start
   */
  private async startDiagnosis(): Promise<void> {
    if (this.isStarting || this.isProcessing || this.mediaStream) {
      notify.warning('Eine Diagnose läuft bereits.');
      return;
    }

    try {
      // Refresh machine data to ensure latest reference models are loaded
      const latestMachine = await getMachine(this.machine.id);
      if (latestMachine) {
        this.machine = latestMachine;
      } else {
        notify.error('Maschine nicht gefunden. Bitte neu auswählen.');
        return;
      }

      // Check if machine has reference models (multiclass)
      if (!this.machine.referenceModels || this.machine.referenceModels.length === 0) {
        notify.error('Kein Referenzmodell gefunden. Bitte zuerst eine Referenzaufnahme erstellen.');
        return;
      }

      logger.info('🔴 Starting REAL-TIME diagnosis with Smart Start...');

      // Check AudioWorklet support - CRITICAL for real-time processing
      this.useAudioWorklet = isAudioWorkletSupported();
      if (!this.useAudioWorklet) {
        logger.error('❌ AudioWorklet not supported - Real-time diagnosis requires AudioWorklet');
        notify.error(
          'Ihr Browser unterstützt keine Real-Time-Diagnose. Bitte verwenden Sie Chrome, Edge oder Safari.',
          new Error('AudioWorklet not supported'),
          { title: 'Browser nicht kompatibel', duration: 0 }
        );
        return;
      }

      this.isStarting = true;

      // Reset state for new diagnosis
      this.hasValidMeasurement = false;
      this.lastProcessedScore = 0;
      this.lastProcessedStatus = 'UNKNOWN';
      this.lastDetectedState = 'UNKNOWN'; // MULTICLASS: Reset detected state
      this.scoreHistory.clear();
      this.labelHistory.clear(); // CRITICAL FIX: Clear label history

      // Request microphone access using central helper with selected device
      this.mediaStream = await getRawAudioStream(this.selectedDeviceId);

      // Create audio context
      this.audioContext = new AudioContext({ sampleRate: this.requestedSampleRate });

      // CRITICAL FIX: Update configuration with actual sample rate
      this.actualSampleRate = this.audioContext.sampleRate;

      if (this.actualSampleRate !== this.requestedSampleRate) {
        logger.warn(
          `⚠️ AudioContext sample rate is ${this.actualSampleRate}Hz instead of requested ${this.requestedSampleRate}Hz`
        );
        logger.info(
          `✅ Adapting feature extraction to use actual sample rate: ${this.actualSampleRate}Hz`
        );
      }

      // CRITICAL: Validate sample rate compatibility with trained models BEFORE starting
      // This prevents wasting time on a diagnosis that will fail
      this.activeModels = this.machine.referenceModels.filter(
        (model) => model.sampleRate === this.actualSampleRate
      );
      if (this.activeModels.length === 0) {
        const rateList = [...new Set(this.machine.referenceModels.map((model) => model.sampleRate))]
          .sort((a, b) => a - b)
          .join(', ');
        logger.error(
          `❌ Sample Rate Mismatch: Hardware=${this.actualSampleRate}Hz, ModelRates=[${rateList}]`
        );
        notify.error(
          `Audio-Setup Fehler: Ihr Mikrofon läuft bei ${this.actualSampleRate}Hz, aber kein ` +
            `Referenzmodell wurde bei dieser Sample Rate trainiert (Modelle: ${rateList}Hz). ` +
            'Bitte verwenden Sie das gleiche Audio-Setup wie beim Training oder erstellen Sie ' +
            'ein neues Referenzmodell mit der aktuellen Sample Rate.',
          new Error('Sample Rate Mismatch'),
          {
            title: 'Inkompatible Sample Rate',
            duration: 0,
          }
        );
        // Clean up and abort
        this.cleanup();
        return;
      }

      if (this.activeModels.length < this.machine.referenceModels.length) {
        logger.warn(
          `⚠️ Sample Rate Filter: ${this.activeModels.length}/${this.machine.referenceModels.length} Modelle kompatibel (${this.actualSampleRate}Hz)`
        );
      }

      logger.info(
        `✅ Sample Rate validation passed: ${this.actualSampleRate}Hz (matches model training)`
      );

      // Update chunkSize and DSP config with actual sample rate
      this.chunkSize = Math.floor(DEFAULT_DSP_CONFIG.windowSize * this.actualSampleRate);
      this.dspConfig = {
        ...DEFAULT_DSP_CONFIG,
        sampleRate: this.actualSampleRate,
        frequencyRange: [0, this.actualSampleRate / 2], // Update Nyquist frequency
      };

      logger.debug(
        `📊 DSP Config: sampleRate=${this.dspConfig.sampleRate}Hz, chunkSize=${this.chunkSize} samples, windowSize=${DEFAULT_DSP_CONFIG.windowSize}s`
      );

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

      // Initialize AudioWorklet Manager (always available at this point)
      this.audioWorkletManager = new AudioWorkletManager({
        bufferSize: this.chunkSize * 2,
        warmUpDuration: DEFAULT_SMART_START_CONFIG.warmUpDuration, // Use config as Single Source of Truth
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
          logger.info(`✅ Smart Start: Signal detected! RMS: ${rms.toFixed(4)}`);
          this.updateSmartStartStatus('Diagnose läuft');
          this.isProcessing = true; // Start processing incoming chunks
        },
        onSmartStartTimeout: () => {
          logger.warn('⏱️ Smart Start timeout - cleaning up resources');
          notify.warning('Bitte näher an die Maschine gehen und erneut versuchen.', {
            title: 'Kein Signal erkannt',
          });
          // CRITICAL FIX: Call cleanup() to properly release all resources
          this.cleanup();
          this.hideRecordingModal();
        },
      });

      // Initialize AudioWorklet
      await this.audioWorkletManager.init(this.audioContext, this.mediaStream);

      // Start Smart Start sequence
      this.audioWorkletManager.startSmartStart();

      logger.info('✅ Real-time diagnosis initialized!');
    } catch (error) {
      logger.error('Diagnosis error:', error);
      notify.error('Mikrofonzugriff fehlgeschlagen', error as Error, {
        title: 'Zugriff verweigert',
        duration: 0,
      });

      // Cleanup on error
      this.cleanup();
      this.hideRecordingModal();
    } finally {
      this.isStarting = false;
    }
  }

  /**
   * Cleanup resources (AudioContext, MediaStream, etc.)
   */
  private cleanup(): void {
    // Stop processing
    this.isProcessing = false;
    this.isStarting = false;

    // Reset state flags to prevent memory leaks
    this.hasValidMeasurement = false;
    this.lastProcessedScore = 0;
    this.lastProcessedStatus = 'UNKNOWN';
    this.lastDetectedState = 'UNKNOWN'; // MULTICLASS: Reset detected state
    this.scoreHistory.clear();
    this.labelHistory.clear(); // CRITICAL FIX: Clear label history

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

    // Close audio context with error handling to prevent leaks
    if (this.audioContext && this.audioContext.state !== 'closed') {
      try {
        this.audioContext.close();
      } catch (error) {
        logger.warn('⚠️ Error closing AudioContext:', error);
      } finally {
        // Always null the reference to prevent leaks
        this.audioContext = null;
      }
    }

    // Clean up dynamically created DOM elements to prevent memory leaks
    // CRITICAL FIX: Only remove elements within the recording modal to avoid affecting other UI
    const modal = document.getElementById('recording-modal');
    if (modal) {
      // Remove live display elements within modal only
      const liveDisplays = modal.querySelectorAll('.live-display');
      liveDisplays.forEach((element) => element.remove());

      // Remove smart start status elements within modal only
      const smartStartStatuses = modal.querySelectorAll('#smart-start-status');
      smartStartStatuses.forEach((element) => element.remove());
    }

    logger.debug('🧹 Cleanup complete');
  }

  /**
   * Process audio chunk directly (called from AudioWorklet)
   *
   * This is the NEW real-time processing pipeline using AudioWorklet.
   * Receives chunks directly from the audio thread.
   *
   * MULTICLASS MODE: Uses classifyDiagnosticState() to compare against all trained models.
   *
   * @param chunk - Audio chunk from AudioWorklet (4096 samples)
   */
  private processChunkDirectly(chunk: Float32Array): void {
    // Check if processing is active to prevent race conditions during cleanup
    if (!this.isProcessing) {
      return;
    }

    // Validate reference models exist
    if (!this.activeModels || this.activeModels.length === 0) {
      return;
    }

    try {
      // CRITICAL: Ensure chunk has minimum required samples for feature extraction
      // Required: this.chunkSize samples (330ms window = ~15840 samples at 48kHz, ~14553 at 44.1kHz)
      // If chunk is smaller, skip processing and wait for more data from AudioWorklet
      if (chunk.length < this.chunkSize) {
        logger.debug(
          `⏳ Chunk too small: ${chunk.length} < ${this.chunkSize} samples, waiting for more data`
        );
        return;
      }

      // Extract exactly chunkSize samples for feature extraction (discard excess if any)
      // This ensures consistent window sizes across all processing cycles
      const processingChunk = chunk.slice(0, this.chunkSize);

      // Step 1: Extract features (Energy Spectral Densities)
      // CRITICAL FIX: Use actual sample rate from dspConfig (not hardcoded DEFAULT_DSP_CONFIG)
      const featureVector = extractFeaturesFromChunk(processingChunk, this.dspConfig);

      // Step 2: MULTICLASS CLASSIFICATION
      // Compare against all trained models and find best match
      // CRITICAL: Pass actualSampleRate for validation against model's training sample rate
      const diagnosis = classifyDiagnosticState(
        this.activeModels,
        featureVector,
        this.actualSampleRate
      );

      // Step 3: Add score to history for filtering
      this.scoreHistory.addScore(diagnosis.healthScore);

      // CRITICAL FIX: Add label to history for majority voting
      const detectedState = diagnosis.metadata?.detectedState || 'UNKNOWN';
      this.labelHistory.addLabel(detectedState);

      // Step 4: Get filtered score (trimmed mean of last 10)
      const filteredScore = this.scoreHistory.getFilteredScore();

      // Step 5: Derive status from filtered score for consistency
      const filteredStatus = classifyHealthStatus(filteredScore);

      // Step 6: Update UI in real-time with detected state
      this.updateLiveDisplay(filteredScore, filteredStatus, detectedState);

      // Step 7: Store for final save (use filtered score/status for consistency)
      this.lastProcessedScore = filteredScore;
      this.lastProcessedStatus = filteredStatus;
      this.lastDetectedState = detectedState; // MULTICLASS: Store detected state (will be replaced by majority vote on save)
      this.hasValidMeasurement = true; // Mark that we have valid data

      // Debug log every 10th update
      if (this.scoreHistory.getAllScores().length % 10 === 0) {
        logger.debug(
          `📊 Live Score: ${filteredScore.toFixed(1)}% | State: ${detectedState} (${filteredStatus})`
        );
      }
    } catch (error) {
      logger.error('Chunk processing error:', error);

      // CRITICAL: Check for sample rate mismatch error
      if (error instanceof Error && error.message.includes('Sample Rate Mismatch')) {
        // Stop processing immediately
        this.isProcessing = false;

        // Show user-friendly error message
        notify.error(
          'Audio-Setup Fehler: Die Sample Rate Ihres Mikrofons ' +
            `(${this.actualSampleRate}Hz) stimmt nicht mit der Sample Rate des ` +
            'trainierten Modells überein. Bitte verwenden Sie das gleiche Audio-Setup ' +
            'wie beim Training oder erstellen Sie ein neues Referenzmodell.',
          error,
          {
            title: 'Inkompatible Sample Rate',
            duration: 0,
          }
        );

        // Clean up resources
        this.cleanup();
        this.hideRecordingModal();
      }
    }
  }

  /**
   * Update Smart Start status message
   *
   * Shows descriptive feedback during the extended settling time (5 seconds).
   * This helps the user understand that the system is waiting for OS audio
   * filters (AGC, noise cancellation) to stabilize.
   */
  private updateSmartStartStatus(message: string): void {
    const statusElement = document.getElementById('smart-start-status');
    if (statusElement) {
      // Enhance the message with more descriptive text
      let enhancedMessage = message;

      if (message.includes('Stabilisierung')) {
        enhancedMessage = `🎙️ ${message}\n(Mikrofon pegelt ein, OS-Filter werden stabilisiert...)`;
      } else if (message.includes('Warte')) {
        enhancedMessage = `🔍 ${message}`;
      }

      statusElement.textContent = enhancedMessage;

      // Hide once recording starts
      if (message.includes('läuft')) {
        statusElement.style.display = 'none';
      }
    }
  }

  /**
   * Update live display (HealthGauge)
   *
   * MULTICLASS: Shows detected state label (e.g., "Baseline", "Unwucht", etc.)
   */
  private updateLiveDisplay(score: number, status: string, detectedState?: string): void {
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
      // MULTICLASS: Show detected state in addition to status
      if (detectedState && detectedState !== 'UNKNOWN') {
        statusElement.textContent = `${status} | ${detectedState}`;
      } else {
        statusElement.textContent = status;
      }
      statusElement.className = `live-status status-${status.toLowerCase()}`;
    }
  }

  /**
   * Stop recording and save final result
   */
  private stopRecording(): void {
    logger.info('⏹️ Stopping diagnosis...');

    // CRITICAL FIX: Save ALL values BEFORE cleanup (cleanup resets them!)
    const hadValidMeasurement = this.hasValidMeasurement;
    const finalScore = this.lastProcessedScore;
    const finalStatus = this.lastProcessedStatus;
    const scoreHistoryCopy = this.scoreHistory.getAllScores().slice(); // Copy array
    // CRITICAL FIX: Use majority voting for final label instead of last chunk
    const finalDetectedState = this.labelHistory.getMajorityLabel();
    const labelHistoryCopy = this.labelHistory.getAllLabels().slice(); // Copy for debugging

    logger.info(
      `🗳️ Majority voting: ${finalDetectedState} (from ${labelHistoryCopy.length} chunks: ${labelHistoryCopy.slice(-5).join(', ')})`
    );

    // Cleanup resources
    this.cleanup();

    // Save final diagnosis ONLY if we have valid measurement data
    if (hadValidMeasurement) {
      this.saveFinalDiagnosis(finalScore, finalStatus, finalDetectedState, scoreHistoryCopy);
    } else {
      logger.warn('⚠️ No valid measurement data - skipping save');
      this.hideRecordingModal();
    }
  }

  /**
   * Save final diagnosis result
   *
   * MULTICLASS: Includes detected state in metadata
   *
   * CRITICAL FIX: Accepts values as parameters (saved before cleanup)
   *
   * @param finalScore - Health score before cleanup
   * @param finalStatus - Health status before cleanup
   * @param detectedState - Detected state before cleanup
   * @param scoreHistory - Score history array before cleanup
   */
  private async saveFinalDiagnosis(
    finalScore: number,
    finalStatus: 'healthy' | 'uncertain' | 'faulty' | 'UNKNOWN',
    detectedState: string,
    scoreHistory: number[]
  ): Promise<void> {
    try {
      // Validate machine data
      if (!this.machine || !this.machine.id) {
        throw new Error('Machine data is invalid or missing');
      }

      if (!this.machine.referenceModels || this.machine.referenceModels.length === 0) {
        throw new Error('No reference models available');
      }

      // Use the passed values (saved before cleanup)

      // Get classification details
      const classification = getClassificationDetails(finalScore);

      // MULTICLASS: Generate hint based on detected state
      let hint = classification.recommendation;
      if (detectedState !== 'UNKNOWN') {
        if (finalStatus === 'healthy') {
          hint = `Maschine läuft im Normalzustand "${detectedState}" (${finalScore.toFixed(1)}%). Keine Anomalien erkannt.`;
        } else if (finalStatus === 'faulty') {
          hint = `Fehlerzustand erkannt: "${detectedState}" (${finalScore.toFixed(1)}%). Sofortige Inspektion empfohlen.`;
        }
      }

      // Create diagnosis result
      // CRITICAL FIX: Add random suffix to prevent ID collisions
      // If multiple diagnoses are saved in the same millisecond, they would collide
      // without a random suffix (e.g., rapid automated testing or high-frequency monitoring)
      const randomSuffix = Math.random().toString(36).substring(2, 9);

      // CRITICAL FIX: Ensure status is valid for DiagnosisResult (never 'UNKNOWN')
      // If finalStatus is somehow still 'UNKNOWN', default to 'uncertain'
      const validStatus: 'healthy' | 'uncertain' | 'faulty' =
        finalStatus === 'UNKNOWN' ? 'uncertain' : finalStatus;

      const diagnosis: DiagnosisResult = {
        id: `diag-${Date.now()}-${randomSuffix}`,
        machineId: this.machine.id,
        timestamp: Date.now(),
        healthScore: finalScore,
        status: validStatus,
        confidence: classification.confidence,
        rawCosineSimilarity: 0, // Not stored for real-time
        metadata: {
          processingMode: 'real-time',
          totalScores: scoreHistory.length,
          scoreHistory: scoreHistory.slice(-10), // Use passed scoreHistory (saved before cleanup)
          detectedState, // MULTICLASS: Store detected state
          multiclassMode: true,
          evaluatedModels: this.machine.referenceModels.length,
        },
        analysis: {
          hint,
        },
      };

      logger.info(
        `💾 Saving final diagnosis: ${finalScore.toFixed(1)}% | State: ${detectedState} (${finalStatus})`
      );

      // Save to database
      await saveDiagnosis(diagnosis);

      // Hide modal
      this.hideRecordingModal();

      // Show results
      this.showResults(diagnosis);

      logger.info('✅ Diagnosis saved successfully!');
    } catch (error) {
      logger.error('Save error:', error);
      notify.error('Diagnose konnte nicht gespeichert werden', error as Error, {
        title: 'Speicherfehler',
        duration: 0,
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
      stopBtn.textContent = BUTTON_TEXT.STOP_DIAGNOSE;
      stopBtn.onclick = () => this.stopRecording();
    }

    // Update modal title
    const modalTitle = document.querySelector('#recording-modal .modal-header h3');
    if (modalTitle) {
      modalTitle.textContent = MODAL_TITLE.RECORDING_DIAGNOSE;
    }

    // Add Smart Start status and live score display
    const modalBody = document.querySelector('#recording-modal .modal-body');
    // CRITICAL FIX: Check within modal only to prevent conflicts with other UI elements
    if (modalBody && modal && !modal.querySelector('.live-display')) {
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

      // CRITICAL FIX: Clean up live display within modal only
      const liveDisplay = modal.querySelector('.live-display');
      if (liveDisplay) {
        liveDisplay.remove();
      }
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
      // MULTICLASS: Show detected state if available
      const detectedState = diagnosis.metadata?.detectedState;
      if (detectedState && detectedState !== 'UNKNOWN') {
        resultStatus.textContent = `${diagnosis.status} | ${detectedState}`;
      } else {
        resultStatus.textContent = diagnosis.status;
      }
      resultStatus.className = `result-status status-${diagnosis.status.toLowerCase()}`;
    }

    // Update confidence
    const resultConfidence = document.getElementById('result-confidence');
    if (resultConfidence) {
      resultConfidence.textContent = diagnosis.confidence.toFixed(1);
    }

    // Update analysis hint
    const analysisHint = document.getElementById('analysis-hint');
    if (analysisHint) {
      // MULTICLASS: Use diagnosis.analysis.hint if available (contains detected state info)
      if (diagnosis.analysis?.hint) {
        analysisHint.textContent = diagnosis.analysis.hint;
      } else {
        // Fallback to old method
        const classification = getClassificationDetails(diagnosis.healthScore);
        analysisHint.textContent = classification.recommendation;
      }
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

    // CRITICAL FIX: Remove event listener to prevent stacking on re-init
    if (this.diagnoseButtonClickHandler) {
      const diagnoseBtn = document.getElementById('diagnose-btn');
      if (diagnoseBtn) {
        diagnoseBtn.removeEventListener('click', this.diagnoseButtonClickHandler);
      }
      this.diagnoseButtonClickHandler = null;
    }

    // Destroy visualizer
    if (this.visualizer) {
      this.visualizer.destroy();
      this.visualizer = null;
    }

    // Clear score history
    this.scoreHistory.clear();
    this.labelHistory.clear(); // CRITICAL FIX: Clear label history
  }
}
