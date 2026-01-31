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
  MIN_CONFIDENT_MATCH_SCORE,
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
import { applyDeviceInvariantDetails, getDeviceInvariantConfig } from '@utils/deviceInvariantSettings.js';
import {
  formatFeatureModeDetails,
  getFeatureModeDetailsFromConfig,
  getFeatureModeSummary,
  isFeatureModeMatch,
} from '@utils/featureMode.js';
import type { Machine, DiagnosisResult, GMIAModel } from '@data/types.js';
import { logger } from '@utils/logger.js';
import { BUTTON_TEXT, MODAL_TITLE } from '@ui/constants.js';
import { t, getLanguage } from '../../i18n/index.js';

export class DiagnosePhase {
  private machine: Machine;
  private selectedDeviceId: string | undefined; // Selected microphone device ID
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private cameraStream: MediaStream | null = null; // VISUAL POSITIONING: Camera stream for ghost overlay
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
  private isSaving: boolean = false; // CRITICAL FIX: Prevent duplicate save calls

  // DEBUG: Store last calculation values for UI display
  private lastDebugValues: {
    weightMagnitude: number;
    featureMagnitude: number;
    magnitudeFactor: number;
    cosine: number;
    adjustedCosine: number;
    scalingConstant: number;
    rawScore: number;
  } | null = null;

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

    // DEBUG LOGGING: Show which machine is being used for diagnosis
    logger.debug('🔬 DiagnosePhase Constructor:', {
      machineId: machine.id,
      machineName: machine.name,
      numModels: machine.referenceModels?.length || 0,
    });

    // Initialize with default config (will be updated when AudioContext is created)
    this.chunkSize = Math.floor(DEFAULT_DSP_CONFIG.windowSize * this.requestedSampleRate);
    this.dspConfig = { ...DEFAULT_DSP_CONFIG };

    // Initialize score history for filtering
    this.scoreHistory = new ScoreHistory();
    // CRITICAL FIX: Initialize label history for majority voting
    this.labelHistory = new LabelHistory();
  }

  /**
   * Update machine data (e.g., after new reference model is added)
   */
  public setMachine(machine: Machine): void {
    this.machine = machine;
    logger.debug('🔄 Machine updated in DiagnosePhase:', {
      machineId: machine.id,
      machineName: machine.name,
      numModels: machine.referenceModels?.length || 0,
    });
  }

  /**
   * Initialize the diagnose phase UI
   */
  public init(): void {
    this.applyAppShellLayout();
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
      notify.warning(t('diagnose.alreadyRunning'));
      return;
    }

    try {
      // Refresh machine data to ensure latest reference models are loaded
      const latestMachine = await getMachine(this.machine.id);
      if (latestMachine) {
        this.machine = latestMachine;
      } else {
        notify.error(t('identify.errors.machineNotFound'));
        return;
      }

      // DEBUG LOGGING: Show which machine and models are loaded
      logger.debug('🤖 Diagnosis Start Debug:', {
        machineId: this.machine.id,
        machineName: this.machine.name,
        numModels: this.machine.referenceModels?.length || 0,
        models: this.machine.referenceModels?.map(m => ({
          label: m.label,
          trainingDate: new Date(m.trainingDate).toLocaleString(),
          sampleRate: m.sampleRate,
          weightMagnitude: m.metadata?.weightMagnitude?.toFixed(6) || 'N/A',
        })) || [],
      });

      // Check if machine has reference models (multiclass)
      if (!this.machine.referenceModels || this.machine.referenceModels.length === 0) {
        notify.error(t('diagnose.noReferenceModel'));
        return;
      }

      const modeSummary = getFeatureModeSummary(this.machine.referenceModels);
      if (modeSummary) {
        const currentConfig = getDeviceInvariantConfig();
        if (!isFeatureModeMatch(currentConfig, modeSummary.details)) {
          const shouldApply = await notify.confirm(
            t('settingsUI.deviceInvariantMismatchPrompt', {
              dbMode: formatFeatureModeDetails(modeSummary.details, t),
              appMode: formatFeatureModeDetails(getFeatureModeDetailsFromConfig(currentConfig), t),
            }),
            t('settingsUI.deviceInvariantMismatchTitle')
          );

          if (!shouldApply) {
            this.isStarting = false;
            return;
          }

          applyDeviceInvariantDetails(modeSummary.details);
        }
      }

      logger.info('🔴 Starting REAL-TIME diagnosis with Smart Start...');

      // Check AudioWorklet support - CRITICAL for real-time processing
      this.useAudioWorklet = isAudioWorkletSupported();
      if (!this.useAudioWorklet) {
        logger.error('❌ AudioWorklet not supported - Real-time diagnosis requires AudioWorklet');
        notify.error(
          t('diagnose.browserNotCompatible'),
          new Error('AudioWorklet not supported'),
          { title: t('modals.browserIncompatible'), duration: 0 }
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

      // CRITICAL FIX: Validate sample rate compatibility BEFORE creating any resources
      // This prevents allocating AudioContext/MediaStream that must be immediately destroyed
      const expectedSampleRate = this.machine.referenceModels[0]?.sampleRate;
      if (!expectedSampleRate) {
        notify.error(t('diagnose.noValidSampleRate'));
        this.isStarting = false;
        return;
      }

      // Check if all models have the same sample rate
      const uniqueRates = [...new Set(this.machine.referenceModels.map(m => m.sampleRate))];
      if (uniqueRates.length > 1) {
        logger.warn(`⚠️ Multiple sample rates in models: ${uniqueRates.join(', ')}Hz`);
      }

      // Request microphone access using central helper with selected device
      this.mediaStream = await getRawAudioStream(this.selectedDeviceId);

      // VISUAL POSITIONING: Request camera access for ghost overlay
      // Non-blocking: If camera access fails, continue with audio only
      try {
        this.cameraStream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }, // Prefer back camera on mobile
          audio: false,
        });
        logger.info('📷 Camera access granted for ghost overlay');
      } catch (cameraError) {
        logger.warn('⚠️ Camera access denied or not available - continuing without ghost overlay', cameraError);
        notify.info(t('diagnose.cameraNotAvailable'), {
          title: t('modals.cameraOptional'),
        });
        this.cameraStream = null;
      }

      // Create audio context with the expected sample rate
      // Note: Browser may still override this based on hardware capabilities
      this.audioContext = new AudioContext({ sampleRate: expectedSampleRate });

      // CRITICAL FIX: Update configuration with actual sample rate
      this.actualSampleRate = this.audioContext.sampleRate;

      if (this.actualSampleRate !== expectedSampleRate) {
        logger.warn(
          `⚠️ AudioContext sample rate is ${this.actualSampleRate}Hz instead of requested ${expectedSampleRate}Hz`
        );
        logger.warn(
          `⚠️ This indicates hardware does not support ${expectedSampleRate}Hz - sample rate mismatch!`
        );
      }

      // CRITICAL: Validate sample rate compatibility with trained models
      // This check now happens AFTER we know the actual hardware rate
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
          t('diagnose.sampleRateError', { actual: String(this.actualSampleRate), expected: rateList }),
          new Error('Sample Rate Mismatch'),
          {
            title: t('modals.sampleRateMismatch'),
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
        deviceInvariant: getDeviceInvariantConfig(),
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
          this.updateSmartStartStatus(t('diagnose.diagnosisRunning'));
          this.isProcessing = true; // Start processing incoming chunks
        },
        onSmartStartTimeout: () => {
          logger.warn('⏱️ Smart Start timeout - cleaning up resources');
          notify.warning(t('reference.recording.noSignal'), {
            title: t('modals.noSignalDetected'),
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
      notify.error(t('reference.recording.microphoneFailed'), error as Error, {
        title: t('modals.accessDenied'),
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

    // VISUAL POSITIONING: Stop camera stream
    if (this.cameraStream) {
      this.cameraStream.getTracks().forEach((track) => track.stop());
      this.cameraStream = null;
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

    // CRITICAL FIX: Comprehensive chunk validation to prevent runtime errors
    try {
      // Validate chunk exists and is correct type
      if (!chunk || !(chunk instanceof Float32Array)) {
        logger.error('❌ Invalid chunk received: not a Float32Array');
        return;
      }

      // Validate chunk is not empty
      if (chunk.length === 0) {
        logger.debug('⏳ Empty chunk received, skipping');
        return;
      }

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
      const detectedState = (typeof diagnosis.metadata?.detectedState === 'string'
        ? diagnosis.metadata.detectedState
        : 'UNKNOWN');
      this.labelHistory.addLabel(detectedState);

      // Step 4: Get filtered score (trimmed mean of last 10)
      const filteredScore = this.scoreHistory.getFilteredScore();

      // Step 5: Derive status from filtered score for consistency
      const filteredStatus = classifyHealthStatus(filteredScore);

      // Step 6: Store debug values from diagnosis metadata
      if (diagnosis.metadata?.debug) {
        const debug = diagnosis.metadata.debug as {
          weightMagnitude: number;
          featureMagnitude: number;
          magnitudeFactor: number;
          cosine: number;
          adjustedCosine: number;
          scalingConstant: number;
          rawScore: number;
        };
        this.lastDebugValues = debug;
        logger.debug('✅ Debug values stored:', this.lastDebugValues);
      } else {
        logger.warn('⚠️ No debug values in diagnosis.metadata!', diagnosis.metadata);
      }

      // Step 7: Update UI in real-time with detected state and debug values
      this.updateLiveDisplay(filteredScore, filteredStatus, detectedState);
      this.updateDebugDisplay();

      // Step 8: Store for final save (use filtered score/status for consistency)
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
          t('diagnose.sampleRateError', { actual: String(this.actualSampleRate), expected: '?' }),
          error,
          {
            title: t('modals.sampleRateMismatch'),
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
        enhancedMessage = t('diagnose.smartStart.stabilizing', { message });
      } else if (message.includes('Warte')) {
        enhancedMessage = t('diagnose.smartStart.waiting', { message });
      }

      statusElement.textContent = enhancedMessage;

      // Hide once recording starts
      if (message.includes('läuft')) {
        statusElement.style.display = 'none';
      }
    }
  }

  /**
   * Update debug display with calculation values
   */
  private updateDebugDisplay(): void {
    if (!this.lastDebugValues) {
      logger.warn('⚠️ updateDebugDisplay: No debug values available!');
      return;
    }

    logger.debug('🔧 Updating debug display with values:', this.lastDebugValues);
    const v = this.lastDebugValues;

    const updateElement = (id: string, text: string, highlight: boolean = false) => {
      const el = document.getElementById(id);
      if (el) {
        el.textContent = text;
        if (highlight) {
          el.style.color = '#ff8800';
          el.style.fontWeight = '700';
        }
        logger.debug(`  ✓ Updated ${id}: ${text}`);
      } else {
        logger.error(`  ✗ Element not found: ${id}`);
      }
    };

    updateElement(
      'debug-weight-magnitude',
      t('diagnose.debug.weightMagnitude', { value: v.weightMagnitude.toFixed(6) })
    );
    updateElement(
      'debug-feature-magnitude',
      t('diagnose.debug.featureMagnitude', { value: v.featureMagnitude.toFixed(6) })
    );
    updateElement(
      'debug-magnitude-factor',
      t('diagnose.debug.magnitudeFactor', { value: v.magnitudeFactor.toFixed(4) }),
      v.magnitudeFactor < 0.5
    );
    updateElement('debug-cosine', t('diagnose.debug.cosine', { value: v.cosine.toFixed(4) }));
    updateElement(
      'debug-adjusted-cosine',
      t('diagnose.debug.adjustedCosine', { value: v.adjustedCosine.toFixed(4) })
    );
    updateElement(
      'debug-scaling-constant',
      t('diagnose.debug.scalingConstant', { value: v.scalingConstant.toFixed(4) })
    );
    updateElement(
      'debug-raw-score',
      t('diagnose.debug.rawScore', { value: v.rawScore.toFixed(1) }),
      v.rawScore === 0
    );
  }

  /**
   * Update live display (HealthGauge)
   *
   * MULTICLASS: Shows detected state label (e.g., "Baseline", "Unwucht", etc.)
   * UX FIX: Hide detected state if score < 70% to avoid confusing display
   */
  private updateLiveDisplay(score: number, status: string, detectedState?: string): void {
    if (this.healthGauge) {
      this.healthGauge.draw(score, status);
    }

    // Update score display if visible in modal
    const scoreElement = document.getElementById('live-health-score');
    if (scoreElement) {
      // Only update the numeric value (% symbol is in HTML)
      const scoreValue = score.toFixed(1);
      const unitSpan = scoreElement.querySelector('.live-score-unit');
      if (unitSpan) {
        scoreElement.childNodes[0].textContent = scoreValue;
      } else {
        scoreElement.textContent = `${scoreValue}%`;
      }
    }

    // Update the score display container with color class based on score
    const scoreDisplay = document.getElementById('live-score-display');
    if (scoreDisplay) {
      // Remove existing score color classes
      scoreDisplay.classList.remove('score-healthy', 'score-uncertain', 'score-faulty');

      // Add appropriate color class based on score thresholds
      if (score >= 75) {
        scoreDisplay.classList.add('score-healthy');
      } else if (score >= 50) {
        scoreDisplay.classList.add('score-uncertain');
      } else {
        scoreDisplay.classList.add('score-faulty');
      }
    }

    const statusElement = document.getElementById('live-status');
    if (statusElement) {
      const normalizedStatus = status.toLowerCase();
      const localizedStatus = normalizedStatus === 'healthy'
        ? t('status.healthy')
        : normalizedStatus === 'uncertain'
          ? t('status.uncertain')
          : normalizedStatus === 'faulty'
            ? t('status.faulty')
            : status;

      // UX FIX: Only show detected state if score meets confident match threshold
      // Below threshold the match is uncertain, showing the label would be confusing
      const shouldShowState = score >= MIN_CONFIDENT_MATCH_SCORE && detectedState && detectedState !== 'UNKNOWN';
      const displayState = detectedState === 'Baseline' ? t('reference.labels.baseline') : detectedState;

      if (shouldShowState) {
        statusElement.textContent = `${localizedStatus} | ${displayState}`;
      } else {
        statusElement.textContent = localizedStatus;
      }
      statusElement.className = `live-status status-${normalizedStatus}`;
    }
  }

  /**
   * Stop recording and save final result
   */
  private stopRecording(): void {
    // CRITICAL FIX: Prevent duplicate calls (e.g., user clicking Stop button twice)
    // This prevents saving the same diagnosis multiple times
    if (this.isSaving) {
      logger.warn('⚠️ Stop already in progress, ignoring duplicate call');
      return;
    }

    this.isSaving = true;
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

      const latestMachine = await getMachine(this.machine.id);
      if (!latestMachine) {
        throw new Error(`Machine not found: ${this.machine.id}`);
      }
      this.machine = latestMachine;

      if (!this.machine.referenceModels || this.machine.referenceModels.length === 0) {
        throw new Error('No reference models available');
      }

      // Use the passed values (saved before cleanup)

      // Get classification details
      const classification = getClassificationDetails(finalScore);

      // UX FIX: Hide detected state if score below confident match threshold
      const effectiveDetectedState = finalScore >= MIN_CONFIDENT_MATCH_SCORE ? detectedState : 'UNKNOWN';

      // MULTICLASS: Generate hint based on detected state
      let hint = classification.recommendation;
      if (effectiveDetectedState !== 'UNKNOWN') {
        if (finalStatus === 'healthy') {
          hint = t('diagnose.analysis.healthyMatch', { state: effectiveDetectedState, score: finalScore.toFixed(1) });
        } else if (finalStatus === 'faulty') {
          hint = t('diagnose.analysis.faultyMatch', { state: effectiveDetectedState, score: finalScore.toFixed(1) });
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
          detectedState: effectiveDetectedState, // MULTICLASS: Store detected state (UNKNOWN if score < 70%)
          multiclassMode: true,
          evaluatedModels: this.activeModels.length,
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
      notify.error(t('diagnose.saveFailed'), error as Error, {
        title: t('modals.saveError'),
        duration: 0,
      });
      this.hideRecordingModal();
    } finally {
      // CRITICAL FIX: Reset flag after save completes (success or error)
      // This allows future diagnoses to be saved
      this.isSaving = false;
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

    // CRITICAL FIX: Update machine name in modal subtitle
    // This was showing hardcoded "MACHINE 002" from index.html instead of selected machine
    const machineIdElement = document.getElementById('machine-id');
    if (machineIdElement) {
      machineIdElement.textContent = this.machine.name;
      logger.debug('✅ Modal machine name updated:', this.machine.name);
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
      // Get reference model info for display
      const dateLocale = getLanguage() === 'de' ? 'de-DE' : getLanguage() === 'fr' ? 'fr-FR' : getLanguage() === 'es' ? 'es-ES' : getLanguage() === 'zh' ? 'zh-CN' : 'en-US';
      const refModelInfo = this.activeModels.length > 0
        ? this.activeModels.map(m => {
            const trainingDate = new Date(m.trainingDate).toLocaleString(dateLocale, {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            return `${m.label} (${trainingDate})`;
          }).join(', ')
        : t('reference.noModelsYet');

      const liveDisplay = document.createElement('div');
      liveDisplay.className = 'live-display';
      liveDisplay.innerHTML = `
        <div id="smart-start-status" class="smart-start-status">${t('common.initializing')}</div>
        <div class="reference-model-info" style="background: rgba(0, 212, 255, 0.1); border-left: 3px solid var(--primary-color); padding: 8px 12px; margin: 12px 0; border-radius: 4px;">
          <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">${t('diagnose.display.referenceModels')}</div>
          <div style="font-size: 0.85rem; color: var(--text-primary); font-weight: 500;">${refModelInfo}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 4px;">${t('diagnose.display.statesTrainedCount', { count: String(this.activeModels.length) })}</div>
        </div>
        <div class="debug-info" data-view-level="expert" style="background: rgba(255, 136, 0, 0.1); border-left: 3px solid #ff8800; padding: 8px 12px; margin: 12px 0; border-radius: 4px; font-family: monospace; font-size: 0.75rem;">
          <div style="color: var(--text-muted); margin-bottom: 4px; font-weight: 600;">${t('diagnose.display.debugValues')}</div>
          <div id="debug-weight-magnitude" style="color: var(--text-primary);">${t('diagnose.debug.weightMagnitude', { value: '--' })}</div>
          <div id="debug-feature-magnitude" style="color: var(--text-primary);">${t('diagnose.debug.featureMagnitude', { value: '--' })}</div>
          <div id="debug-magnitude-factor" style="color: var(--text-primary);">${t('diagnose.debug.magnitudeFactor', { value: '--' })}</div>
          <div id="debug-cosine" style="color: var(--text-primary);">${t('diagnose.debug.cosine', { value: '--' })}</div>
          <div id="debug-adjusted-cosine" style="color: var(--text-primary);">${t('diagnose.debug.adjustedCosine', { value: '--' })}</div>
          <div id="debug-scaling-constant" style="color: var(--text-primary);">${t('diagnose.debug.scalingConstant', { value: '--' })}</div>
          <div id="debug-raw-score" style="color: var(--text-primary); font-weight: 600; margin-top: 4px;">${t('diagnose.debug.rawScorePlaceholder')}</div>
        </div>
        <div class="live-score-container">
          <p class="live-hint">${t('diagnose.display.signalHint')}</p>
          <div id="live-score-display" class="live-score-display is-active">
            <div class="live-score-ring"></div>
            <p class="live-score-label">${t('diagnose.display.match')}</p>
            <p id="live-health-score" class="live-score">--<span class="live-score-unit">%</span></p>
          </div>
          <p id="live-status" class="live-status">${t('status.analyzing')}</p>
        </div>
      `;
      modalBody.appendChild(liveDisplay);
    }

    // VISUAL POSITIONING: Add ghost overlay if camera and reference image are available
    if (this.cameraStream && this.machine.referenceImage && modalBody) {
      // Create container for ghost overlay
      const ghostContainer = document.createElement('div');
      ghostContainer.id = 'ghost-overlay-container';
      ghostContainer.className = 'ghost-overlay-container';
      ghostContainer.style.cssText = `
        position: relative;
        width: 100%;
        max-width: 300px;
        margin: 12px auto;
        border-radius: 8px;
        overflow: hidden;
        border: 2px solid var(--primary-color);
      `;

      // Create video element (live feed)
      const video = document.createElement('video');
      video.id = 'diagnosis-video';
      video.autoplay = true;
      video.playsInline = true;
      video.muted = true;
      video.style.cssText = `
        width: 100%;
        height: auto;
        display: block;
      `;
      video.srcObject = this.cameraStream;

      // Create ghost image overlay (reference image)
      const ghostImage = document.createElement('img');
      ghostImage.id = 'ghost-overlay-image';
      ghostImage.className = 'ghost-overlay-image';
      ghostImage.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        opacity: 0.5;
        pointer-events: none;
        z-index: 10;
      `;

      // Convert Blob to URL for image src
      const imageUrl = URL.createObjectURL(this.machine.referenceImage);
      ghostImage.src = imageUrl;

      // Add hint text
      const hint = document.createElement('p');
      hint.className = 'ghost-overlay-hint';
      hint.style.cssText = `
        font-size: 0.75rem;
        color: var(--text-muted);
        text-align: center;
        margin-top: 8px;
      `;
      hint.textContent = t('diagnose.display.ghostHint');

      // Assemble elements
      ghostContainer.appendChild(video);
      ghostContainer.appendChild(ghostImage);

      // Insert at top of modal body
      modalBody.insertBefore(ghostContainer, modalBody.firstChild);
      modalBody.insertBefore(hint, ghostContainer.nextSibling);

      logger.info('✅ Ghost overlay added to diagnosis modal');
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
      // Note: .reference-model-info is inside .live-display, so removing
      // .live-display automatically removes .reference-model-info as well
      const liveDisplay = modal.querySelector('.live-display');
      if (liveDisplay) {
        liveDisplay.remove();
      }

      // VISUAL POSITIONING: Clean up ghost overlay elements
      const ghostContainer = modal.querySelector('#ghost-overlay-container');
      if (ghostContainer) {
        // Revoke blob URL to prevent memory leaks
        const ghostImage = ghostContainer.querySelector('#ghost-overlay-image') as HTMLImageElement | null;
        if (ghostImage && ghostImage.src) {
          URL.revokeObjectURL(ghostImage.src);
        }
        ghostContainer.remove();
      }
      const ghostHint = modal.querySelector('.ghost-overlay-hint');
      if (ghostHint) {
        ghostHint.remove();
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
      if (this.healthGauge) {
        this.healthGauge.destroy();
      }
      this.healthGauge = new HealthGauge('health-gauge-canvas');
      this.healthGauge.draw(diagnosis.healthScore, diagnosis.status);
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

    const resultFeatureMode = document.getElementById('result-feature-mode');
    if (resultFeatureMode) {
      const summary = getFeatureModeSummary(this.activeModels.length > 0 ? this.activeModels : this.machine.referenceModels);
      if (summary) {
        resultFeatureMode.textContent = formatFeatureModeDetails(summary.details, t);
      }
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

  private applyAppShellLayout(): void {
    const modal = document.getElementById('diagnosis-modal');
    if (!modal) return;

    const modalContent = modal.querySelector('.modal-content');
    if (!modalContent) return;

    modalContent.classList.add('app-shell-container');
    modalContent.querySelector('.modal-header')?.classList.add('shell-header');
    modalContent.querySelector('.modal-body')?.classList.add('shell-content');
    modalContent.querySelector('.modal-actions')?.classList.add('shell-footer');
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

    // Cleanup health gauge instance to prevent leaks
    if (this.healthGauge) {
      this.healthGauge.destroy();
      this.healthGauge = null;
    }

    // Clear score history
    this.scoreHistory.clear();
    this.labelHistory.clear(); // CRITICAL FIX: Clear label history
  }
}
