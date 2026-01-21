/**
 * ZANOBOT - PHASE 2: REFERENCE
 *
 * Training mode - Record healthy machine state.
 * Steps:
 * 1. Record audio (default 10s)
 * 2. Extract features
 * 3. Train GMIA model
 * 4. Save model to machine
 */

import { extractFeatures, DEFAULT_DSP_CONFIG } from '@core/dsp/features.js';
import { trainGMIA } from '@core/ml/gmia.js';
import { assessRecordingQuality } from '@core/ml/qualityCheck.js';
import { updateMachineModel } from '@data/db.js';
import { AudioVisualizer } from '@ui/components/AudioVisualizer.js';
import { getRawAudioStream, getSmartStartStatusMessage } from '@core/audio/audioHelper.js';
import { AudioWorkletManager, isAudioWorkletSupported } from '@core/audio/audioWorkletHelper.js';
import { notify } from '@utils/notifications.js';
import type { Machine, TrainingData, FeatureVector, QualityResult } from '@data/types.js';
import { logger } from '@utils/logger.js';
import { BUTTON_TEXT } from '@ui/constants.js';

export class ReferencePhase {
  private machine: Machine;
  private selectedDeviceId: string | undefined; // Selected microphone device ID
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private visualizer: AudioVisualizer | null = null;
  private recordingDuration: number = 15; // seconds (5s warmup + 10s actual recording)
  private warmUpDuration: number = 5; // seconds (settling time for OS audio filters)
  private audioWorkletManager: AudioWorkletManager | null = null;
  private isRecordingActive: boolean = false;
  private recordedBlob: Blob | null = null; // For reference audio export
  private useAudioWorklet: boolean = true;
  private recordingStartTime: number = 0; // Track when actual recording started
  private timerInterval: ReturnType<typeof setInterval> | null = null; // Track timer interval for cleanup
  private isRecordingStarting: boolean = false;
  private autoStopTimer: ReturnType<typeof setTimeout> | null = null;
  private smartStartWasUsed: boolean = false; // Track if Smart Start completed successfully

  // Phase 2: Review Modal State
  private currentAudioBuffer: AudioBuffer | null = null;
  private currentFeatures: FeatureVector[] = [];
  private currentQualityResult: QualityResult | null = null;
  private currentTrainingData: TrainingData | null = null;

  // CRITICAL FIX: Store event listener reference for proper cleanup
  private recordButtonClickHandler: (() => void) | null = null;

  constructor(machine: Machine, selectedDeviceId?: string) {
    this.machine = machine;
    this.selectedDeviceId = selectedDeviceId;
  }

  /**
   * Initialize the reference phase UI
   */
  public init(): void {
    const recordBtn = document.getElementById('record-btn');
    if (recordBtn) {
      // CRITICAL FIX: Store handler reference to enable cleanup in destroy()
      this.recordButtonClickHandler = () => this.startRecording();
      recordBtn.addEventListener('click', this.recordButtonClickHandler);
    }
  }

  /**
   * Start recording reference audio with Smart Start
   */
  private async startRecording(): Promise<void> {
    if (this.isRecordingStarting || this.isRecordingActive || this.mediaStream) {
      notify.warning('Eine Aufnahme läuft bereits.');
      return;
    }

    this.isRecordingStarting = true;

    try {
      logger.info('🎙️ Phase 2: Starting reference recording with Smart Start...');

      // Check AudioWorklet support
      this.useAudioWorklet = isAudioWorkletSupported();
      if (!this.useAudioWorklet) {
        logger.warn('⚠️ AudioWorklet not supported, Smart Start disabled');
      }

      // Request microphone access using central helper with selected device
      this.mediaStream = await getRawAudioStream(this.selectedDeviceId);

      if (typeof MediaRecorder === 'undefined') {
        notify.error(
          'Ihr Browser unterstützt keine Audioaufnahme. Bitte verwenden Sie einen aktuellen Browser.',
          new Error('MediaRecorder not supported'),
          { title: 'Browser nicht kompatibel', duration: 0 }
        );
        this.cleanup();
        return;
      }

      // Create audio context
      // CRITICAL FIX: Use 48000 Hz to match AUDIO_CONSTRAINTS.sampleRate
      // This prevents unnecessary browser resampling (48k hardware → 44.1k context)
      this.audioContext = new AudioContext({ sampleRate: 48000 });

      // CRITICAL FIX: Validate sample rate and adapt DSP config to actual rate
      // This ensures training and diagnosis use consistent feature extraction parameters
      const actualSampleRate = this.audioContext.sampleRate;
      if (actualSampleRate !== 48000) {
        logger.warn(
          `⚠️ AudioContext sample rate is ${actualSampleRate}Hz instead of requested 48000Hz`
        );
        logger.info(`✅ Feature extraction will use actual sample rate: ${actualSampleRate}Hz`);
      }

      // Show recording modal
      this.showRecordingModal();

      // Start visualizer
      const canvas = document.getElementById('waveform-canvas');
      if (canvas) {
        this.visualizer = new AudioVisualizer('waveform-canvas');
        this.visualizer.start(this.audioContext, this.mediaStream);
      }

      if (this.useAudioWorklet) {
        // CRITICAL FIX: Calculate proper buffer size based on actual sample rate
        // At 96kHz: chunkSize = 31680, so we need bufferSize >= 63360
        const chunkSize = Math.floor(0.33 * actualSampleRate);
        const bufferSize = Math.max(32768, chunkSize * 2);

        // Initialize AudioWorklet Manager
        this.audioWorkletManager = new AudioWorkletManager({
          bufferSize: bufferSize,
          warmUpDuration: this.warmUpDuration * 1000, // Convert seconds to milliseconds
          onSmartStartStateChange: (state) => {
            const statusMsg = getSmartStartStatusMessage(state);
            this.updateStatusMessage(statusMsg);
          },
          onSmartStartComplete: (rms) => {
            logger.info(`✅ Smart Start: Signal detected! RMS: ${rms.toFixed(4)}`);
            this.smartStartWasUsed = true; // Mark that Smart Start completed successfully
            this.updateStatusMessage('Aufnahme läuft');
            this.actuallyStartRecording();
          },
          onSmartStartTimeout: () => {
            logger.warn('⏱️ Smart Start timeout - cleaning up resources');
            this.smartStartWasUsed = false; // Ensure flag is false since Smart Start failed
            notify.warning('Bitte näher an die Maschine gehen und erneut versuchen.', {
              title: 'Kein Signal erkannt',
            });
            // CRITICAL FIX: Call cleanup() to properly release all resources
            // (AudioWorklet, MediaStream, Modal, Timer, etc.)
            this.cleanup();
            this.hideRecordingModal();
          },
        });

        // Initialize AudioWorklet
        await this.audioWorkletManager.init(this.audioContext, this.mediaStream);

        // Start Smart Start sequence
        this.audioWorkletManager.startSmartStart();
      } else {
        // Fallback: Start recording immediately without Smart Start
        logger.info('⏭️ Skipping Smart Start (AudioWorklet not supported)');
        this.updateStatusMessage('Aufnahme läuft');
        setTimeout(() => this.actuallyStartRecording(), 500);
      }
    } catch (error) {
      logger.error('Recording error:', error);
      notify.error('Mikrofonzugriff fehlgeschlagen', error as Error, {
        title: 'Zugriff verweigert',
        duration: 0,
      });

      // Cleanup on error
      this.cleanup();
      this.hideRecordingModal();
    }
  }

  /**
   * Cleanup resources (AudioContext, MediaStream, etc.)
   */
  private cleanup(): void {
    // Reset state flags to prevent memory leaks
    this.isRecordingActive = false;
    this.isRecordingStarting = false;
    this.smartStartWasUsed = false; // Reset Smart Start flag for next recording

    // Clear timer interval to prevent memory leaks
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.autoStopTimer !== null) {
      clearTimeout(this.autoStopTimer);
      this.autoStopTimer = null;
    }

    // Stop media recorder if active
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.ondataavailable = null;
      this.mediaRecorder.onstop = null;
      this.mediaRecorder.stop();
      this.mediaRecorder = null;
    }

    // Stop visualizer
    if (this.visualizer) {
      this.visualizer.stop();
    }

    // Cleanup AudioWorklet
    if (this.audioWorkletManager) {
      this.audioWorkletManager.cleanup();
      this.audioWorkletManager = null;
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

    logger.debug('🧹 Reference phase cleanup complete');
  }

  /**
   * Actually start recording after Smart Start completes
   *
   * Important: We record the FULL 15 seconds (including warmup) for debugging,
   * but only use the last 10 seconds (after warmup) for training.
   */
  private actuallyStartRecording(): void {
    if (!this.mediaStream) {
      return;
    }

    // Stop AudioWorklet Smart Start
    if (this.audioWorkletManager) {
      this.audioWorkletManager.stop();
    }

    // Setup media recorder with explicit mimeType
    // CRITICAL FIX: Detect supported MIME type to ensure Blob matches actual format
    let mimeType: string | undefined;
    if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
      mimeType = 'audio/webm;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
      mimeType = 'audio/ogg;codecs=opus';
    } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
      mimeType = 'audio/mp4';
    }
    logger.info(`🎙️ Using MediaRecorder MIME type: ${mimeType ?? 'browser default'}`);

    this.audioChunks = [];
    const mediaRecorderOptions = mimeType ? { mimeType } : undefined;
    this.mediaRecorder = mediaRecorderOptions
      ? new MediaRecorder(this.mediaStream, mediaRecorderOptions)
      : new MediaRecorder(this.mediaStream);
    this.isRecordingActive = true;
    this.isRecordingStarting = false;

    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        this.audioChunks.push(event.data);
      }
    };

    this.mediaRecorder.onstop = () => this.processRecording();

    // Set up onstart handler to ensure precise timing
    this.mediaRecorder.onstart = () => {
      // Record actual start time when recording actually begins
      this.recordingStartTime = Date.now();

      // Update timer (shows dual-phase UI)
      this.startTimer();

      // Auto-stop after full duration
      // CRITICAL FIX: If Smart Start was used, we only need 10s of recording (no warmup needed)
      // If Smart Start was NOT used, record 15s (first 5s = warmup, last 10s = training)
      const recordingDuration = this.smartStartWasUsed ? 10 : this.recordingDuration;
      this.autoStopTimer = setTimeout(() => {
        this.stopRecording();
      }, recordingDuration * 1000);
    };

    // Start recording (will trigger onstart event)
    this.mediaRecorder.start();
  }

  /**
   * Stop recording
   *
   * IMPORTANT: Only stops the MediaRecorder here. Cleanup is called later
   * in processRecording() after the audio has been decoded and processed.
   * This prevents closing the AudioContext before processRecording() needs it.
   */
  private stopRecording(): void {
    // Stop media recorder if active
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop(); // This triggers onstop -> processRecording()
      return;
    }

    // Handle Smart Start / waiting phase where MediaRecorder is inactive
    if (this.audioWorkletManager || this.isRecordingActive || this.isRecordingStarting) {
      if (this.audioWorkletManager) {
        this.audioWorkletManager.cleanup();
      }
      this.cleanup();
      this.hideRecordingModal();
    }
  }

  /**
   * Process recorded audio and show review modal
   *
   * PHASE 2 WORKFLOW:
   * 1. Extract features from post-warmup audio (seconds 5-15)
   * 2. Assess recording quality
   * 3. Show review modal with audio player and quality assessment
   * 4. Wait for user decision (Save or Discard)
   *
   * CRITICAL IMPLEMENTATION:
   * - File blob: Full 15 seconds (for playback and debugging)
   * - Feature extraction: Only seconds 5-15 (after OS audio filters have settled)
   * - Cleanup is called at the end to release AudioContext after processing
   */
  private async processRecording(): Promise<void> {
    try {
      if (!this.audioContext) {
        throw new Error('Audio context not initialized');
      }

      // Create blob from chunks (FULL 15 seconds for download)
      // CRITICAL FIX: Use actual MIME type from MediaRecorder to ensure correct format
      const mimeType = this.mediaRecorder?.mimeType || '';
      const blobOptions = mimeType ? { type: mimeType } : undefined;
      const blob = blobOptions
        ? new Blob(this.audioChunks, blobOptions)
        : new Blob(this.audioChunks);
      this.recordedBlob = blob; // Save for export
      logger.info(`📦 Created audio blob with MIME type: ${mimeType}`);

      // Convert to AudioBuffer
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      logger.info(`🎙️ Recording complete: ${audioBuffer.duration.toFixed(2)}s`);

      // CRITICAL FIX: Only slice audio buffer if Smart Start was NOT used
      // Smart Start already handled the 5-second warmup period, so we don't need to slice again
      const sampleRate = audioBuffer.sampleRate;
      const warmupSamples = this.smartStartWasUsed ? 0 : Math.floor(this.warmUpDuration * sampleRate);
      const totalSamples = audioBuffer.length;
      const trainingSamples = totalSamples - warmupSamples;

      if (this.smartStartWasUsed) {
        logger.info(`📊 Using full recording (Smart Start handled warmup):`);
        logger.info(`   Total duration: ${audioBuffer.duration.toFixed(2)}s - ALL USED FOR TRAINING`);
      } else {
        logger.info(`📊 Slicing audio buffer (fallback mode without Smart Start):`);
        logger.info(`   Total duration: ${audioBuffer.duration.toFixed(2)}s`);
        logger.info(
          `   Warmup period: ${this.warmUpDuration}s (${warmupSamples} samples) - DISCARDED`
        );
        logger.info(
          `   Training period: ${(trainingSamples / sampleRate).toFixed(2)}s (${trainingSamples} samples) - USED`
        );
      }

      // CRITICAL FIX: Validate that we have enough samples for training
      const MIN_TRAINING_DURATION = 2.0; // Minimum 2 seconds of training data
      const minTrainingSamples = Math.floor(MIN_TRAINING_DURATION * sampleRate);

      if (trainingSamples <= 0) {
        throw new Error(
          `Aufnahme zu kurz: ${audioBuffer.duration.toFixed(2)}s Gesamtdauer ist kürzer als die ${this.warmUpDuration}s Warmup-Phase. ` +
            `Mindestdauer: ${(this.warmUpDuration + MIN_TRAINING_DURATION).toFixed(1)}s`
        );
      }

      if (trainingSamples < minTrainingSamples) {
        throw new Error(
          `Trainings-Daten zu kurz: ${(trainingSamples / sampleRate).toFixed(2)}s (nach Warmup-Phase). ` +
            `Minimum erforderlich: ${MIN_TRAINING_DURATION}s. ` +
            `Bitte mindestens ${(this.warmUpDuration + MIN_TRAINING_DURATION).toFixed(1)}s aufnehmen.`
        );
      }

      // Create new AudioBuffer with only the training portion
      const trainingBuffer = this.audioContext.createBuffer(
        audioBuffer.numberOfChannels,
        trainingSamples,
        sampleRate
      );

      // Copy data from original buffer (starting at warmupSamples offset)
      for (let channel = 0; channel < audioBuffer.numberOfChannels; channel++) {
        const originalData = audioBuffer.getChannelData(channel);
        const trainingData = trainingBuffer.getChannelData(channel);

        // Copy samples from offset to end
        for (let i = 0; i < trainingSamples; i++) {
          trainingData[i] = originalData[warmupSamples + i];
        }
      }

      // CRITICAL FIX: Create DSP config with actual sample rate from AudioContext
      // This ensures training features match diagnosis features even if browser uses different sample rate
      const actualSampleRate = this.audioContext.sampleRate;
      const dspConfig = {
        ...DEFAULT_DSP_CONFIG,
        sampleRate: actualSampleRate,
        frequencyRange: [0, actualSampleRate / 2] as [number, number], // Update Nyquist frequency
      };

      logger.debug(
        `📊 DSP Config: sampleRate=${dspConfig.sampleRate}Hz, frequencyRange=[${dspConfig.frequencyRange[0]}, ${dspConfig.frequencyRange[1]}]Hz`
      );

      // Extract features from the SLICED buffer (only stable signal)
      logger.info('📊 Extracting features from stable signal...');
      const features = extractFeatures(trainingBuffer, dspConfig);
      logger.info(`   Extracted ${features.length} feature vectors`);

      // PHASE 2: Assess recording quality
      const qualityResult = assessRecordingQuality(features);

      // Prepare training data (but don't train yet - wait for user approval)
      // CRITICAL FIX: Store actual DSP config used for feature extraction
      const trainingData: TrainingData = {
        featureVectors: features.map((f) => f.features),
        machineId: this.machine.id,
        recordingId: `ref-${Date.now()}`,
        numSamples: features.length,
        config: dspConfig, // Use actual config with correct sample rate
      };

      // Store for later use
      this.currentAudioBuffer = audioBuffer;
      this.currentFeatures = features;
      this.currentQualityResult = qualityResult;
      this.currentTrainingData = trainingData;

      // Cleanup resources now that processing is complete
      // This releases AudioContext, MediaStream, timer, etc.
      this.cleanup();

      // Hide recording modal
      this.hideRecordingModal();

      // PHASE 2: Show review modal instead of saving directly
      this.showReviewModal();
    } catch (error) {
      logger.error('Processing error:', error);
      notify.error('Aufnahme konnte nicht verarbeitet werden', error as Error, {
        title: 'Verarbeitungsfehler',
        duration: 0,
      });

      // Cleanup on error
      this.cleanup();

      this.hideRecordingModal();
    }
  }

  /**
   * Show success message with reference audio export option
   */
  private showSuccessWithExport(): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);

    // CRITICAL FIX: Determine file extension based on actual MIME type
    let extension = 'webm';
    if (this.recordedBlob) {
      if (this.recordedBlob.type.includes('ogg')) {
        extension = 'ogg';
      } else if (this.recordedBlob.type.includes('mp4')) {
        extension = 'm4a';
      }
    }
    const filename = `${this.machine.id}_REF_${timestamp}.${extension}`;

    const shouldDownload = confirm(
      `✅ Referenzmodell erfolgreich trainiert!\n\n` +
        `Maschine: ${this.machine.name}\n\n` +
        `Möchten Sie die Referenz-Audiodatei herunterladen?\n` +
        `(Empfohlen für Backup)`
    );

    if (shouldDownload && this.recordedBlob) {
      this.exportReferenceAudio(filename);
    }
  }

  /**
   * Export reference audio as downloadable file
   */
  private exportReferenceAudio(filename: string): void {
    if (!this.recordedBlob) {
      notify.warning('Bitte zuerst eine Referenzaufnahme erstellen.', {
        title: 'Keine Audiodatei verfügbar',
      });
      return;
    }

    try {
      const url = URL.createObjectURL(this.recordedBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      logger.info(`📥 Reference audio exported: ${filename}`);
    } catch (error) {
      logger.error('Export error:', error);
      notify.error('Export fehlgeschlagen', error as Error, {
        title: 'Exportfehler',
      });
    }
  }

  /**
   * Update status message in UI
   */
  private updateStatusMessage(message: string): void {
    const statusElement = document.getElementById('recording-status');
    if (statusElement) {
      statusElement.textContent = message;
    }

    // Also update modal title if needed
    const modalTitle = document.querySelector('#recording-modal .modal-header h3');
    if (modalTitle && message.includes('Kalibrierung')) {
      modalTitle.textContent = 'Referenzaufnahme - Kalibrierung';
    } else if (modalTitle && message.includes('Warte')) {
      modalTitle.textContent = 'Referenzaufnahme - Warte auf Signal';
    } else if (modalTitle && message.includes('Aufnahme')) {
      modalTitle.textContent = 'Referenzaufnahme - Läuft';
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

    // Add status message element if it doesn't exist
    const modalBody = document.querySelector('#recording-modal .modal-body');
    if (modalBody && !document.getElementById('recording-status')) {
      const statusDiv = document.createElement('div');
      statusDiv.id = 'recording-status';
      statusDiv.className = 'recording-status';
      statusDiv.textContent = 'Initialisierung...';
      modalBody.insertBefore(statusDiv, modalBody.firstChild);
    }

    // Setup stop button
    const stopBtn = document.getElementById('stop-recording-btn');
    if (stopBtn) {
      // CRITICAL FIX: Reset button text using constant (Diagnose phase sets it to 'Stop & Save')
      // This prevents UI confusion when switching between phases
      stopBtn.textContent = BUTTON_TEXT.STOP_REFERENCE;
      stopBtn.onclick = () => this.stopRecording();
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

    const statusElement = document.getElementById('recording-status');
    if (statusElement) {
      statusElement.remove();
    }
  }

  /**
   * Start recording timer with dual-phase UI
   *
   * CRITICAL FIX: Timer behavior depends on whether Smart Start was used:
   * - Smart Start used: Show only recording phase (10s total)
   * - Smart Start NOT used: Show warmup + recording phases (5s + 10s = 15s total)
   *
   * Phase 1 (0-5s): "Stabilisierung..." (only if Smart Start NOT used)
   * Phase 2 (0-10s or 5-15s): "Aufnahme..." (actual recording used for training)
   */
  private startTimer(): void {
    let elapsed = 0;
    const timerElement = document.getElementById('recording-timer');
    const statusElement = document.getElementById('recording-status');

    // CRITICAL FIX: Determine total duration and warmup phase based on Smart Start usage
    const totalDuration = this.smartStartWasUsed ? 10 : this.recordingDuration;
    const warmupPhase = this.smartStartWasUsed ? 0 : this.warmUpDuration;

    // Store interval reference for cleanup
    this.timerInterval = setInterval(() => {
      elapsed++;

      // Update phase-specific UI
      if (!this.smartStartWasUsed && elapsed <= warmupPhase) {
        // Phase 1: Stabilisierung (0-5s) - only shown when Smart Start was NOT used
        if (statusElement) {
          const remaining = warmupPhase - elapsed + 1;
          statusElement.textContent = `Stabilisierung... ${remaining}s`;
        }
        if (timerElement) {
          timerElement.textContent = '--:--';
        }
      } else {
        // Phase 2: Aufnahme (0-10s if Smart Start, 5-15s if not)
        const recordingElapsed = this.smartStartWasUsed ? elapsed : elapsed - warmupPhase;
        const recordingTotal = this.smartStartWasUsed ? 10 : this.recordingDuration - warmupPhase;

        if (statusElement) {
          statusElement.textContent = `Aufnahme läuft...`;
        }
        if (timerElement) {
          const minutes = Math.floor(recordingElapsed / 60);
          const seconds = recordingElapsed % 60;
          timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} / ${Math.floor(
            recordingTotal / 60
          )
            .toString()
            .padStart(2, '0')}:${(recordingTotal % 60).toString().padStart(2, '0')}`;
        }
      }

      if (elapsed >= totalDuration) {
        if (this.timerInterval !== null) {
          clearInterval(this.timerInterval);
          this.timerInterval = null;
        }
      }
    }, 1000);
  }

  /**
   * PHASE 2: Show review modal with audio player and quality assessment
   */
  private showReviewModal(): void {
    if (!this.recordedBlob || !this.currentQualityResult) {
      logger.error('Cannot show review modal: missing data');
      return;
    }

    const modal = document.getElementById('review-modal');
    if (!modal) {
      logger.error('Review modal element not found');
      return;
    }

    // Setup audio player with proper null checks
    const audioElement = document.getElementById('review-audio') as HTMLAudioElement | null;
    const audioSource = document.getElementById('review-audio-source') as HTMLSourceElement | null;

    if (!audioElement || !audioSource) {
      logger.error('Audio player elements not found');
      return;
    }

    const audioUrl = URL.createObjectURL(this.recordedBlob);
    audioSource.src = audioUrl;
    audioSource.type = this.recordedBlob.type || 'audio/webm';
    audioElement.load();

    // Update quality indicator
    this.updateQualityIndicator(this.currentQualityResult);

    // Setup event listeners for buttons
    const discardBtn = document.getElementById('review-discard-btn');
    const saveBtn = document.getElementById('review-save-btn');

    if (discardBtn) {
      discardBtn.onclick = () => this.handleReviewDiscard();
    }

    if (saveBtn) {
      saveBtn.onclick = () => this.handleReviewSave();
    }

    // Show modal
    modal.style.display = 'flex';

    logger.info('🔍 Review modal displayed');
  }

  /**
   * Hide review modal
   */
  private hideReviewModal(): void {
    const modal = document.getElementById('review-modal');
    if (modal) {
      modal.style.display = 'none';
    }

    // Clean up audio URL
    const audioElement = document.getElementById('review-audio') as HTMLAudioElement;
    if (audioElement) {
      audioElement.pause();
      const audioSource = document.getElementById('review-audio-source') as HTMLSourceElement;
      if (audioSource && audioSource.src) {
        URL.revokeObjectURL(audioSource.src);
        audioSource.src = '';
      }
    }
  }

  /**
   * Update quality indicator UI based on assessment result
   */
  private updateQualityIndicator(qualityResult: QualityResult): void {
    // Update score
    const scoreElement = document.getElementById('quality-score');
    if (scoreElement) {
      scoreElement.textContent = qualityResult.score.toString();
    }

    // Update rating text and icon
    const ratingElement = document.getElementById('quality-rating-text');
    const iconElement = document.getElementById('quality-icon');

    if (ratingElement && iconElement) {
      // Clear existing classes and content
      ratingElement.className = 'quality-rating';
      iconElement.className = 'quality-icon';
      iconElement.innerHTML = '';

      switch (qualityResult.rating) {
        case 'GOOD':
          ratingElement.classList.add('good');
          ratingElement.textContent = '✓ Signal stabil';
          iconElement.classList.add('good');
          iconElement.innerHTML = '✓';
          break;

        case 'OK':
          ratingElement.classList.add('ok');
          ratingElement.textContent = '⚠ Leichte Unruhe';
          iconElement.classList.add('ok');
          iconElement.innerHTML = '⚠';
          break;

        case 'BAD':
          ratingElement.classList.add('bad');
          ratingElement.textContent = '✗ Warnung: Signal instabil!';
          iconElement.classList.add('bad');
          iconElement.innerHTML = '✗';
          break;
      }
    }

    // Show/hide issues
    const issuesContainer = document.getElementById('quality-issues');
    const issuesList = document.getElementById('quality-issues-list');

    if (issuesContainer && issuesList) {
      if (qualityResult.issues.length > 0) {
        // Clear existing issues
        issuesList.innerHTML = '';

        // Add each issue
        qualityResult.issues.forEach((issue) => {
          const li = document.createElement('li');
          li.textContent = issue;
          issuesList.appendChild(li);
        });

        issuesContainer.style.display = 'block';
      } else {
        issuesContainer.style.display = 'none';
      }
    }
  }

  /**
   * Handle "Discard" button click - discard recording and start over
   */
  private handleReviewDiscard(): void {
    logger.info('🗑️ User discarded recording');

    // Hide review modal
    this.hideReviewModal();

    // Clear stored data
    this.currentAudioBuffer = null;
    this.currentFeatures = [];
    this.currentQualityResult = null;
    this.currentTrainingData = null;
    this.recordedBlob = null;

    // Show info message
    notify.info('Sie können eine neue Referenzaufnahme starten.', { title: 'Aufnahme verworfen' });
  }

  /**
   * Handle "Save" button click - train model and save to database
   *
   * MULTICLASS WORKFLOW:
   * 1. First recording: Always labeled "Baseline" (healthy state)
   * 2. Additional recordings: User provides custom label (e.g., "Unwucht", "Lagerschaden")
   * 3. After save: Show list of trained states + "Train Another State" button
   *
   * IMPORTANT: If quality is BAD, show additional confirmation warning
   */
  private async handleReviewSave(): Promise<void> {
    // Validate machine data
    if (!this.machine || !this.machine.id) {
      logger.error('Cannot save: machine data is invalid or missing');
      notify.error('Maschinendaten fehlen', new Error('Machine ID missing'), {
        title: 'Fehler',
        duration: 0,
      });
      return;
    }

    if (!this.currentTrainingData || !this.currentQualityResult) {
      logger.error('Cannot save: missing training data or quality result');
      return;
    }

    // PHASE 2 REQUIREMENT: Block BAD quality recordings with very low scores
    if (this.currentQualityResult.rating === 'BAD' && this.currentQualityResult.score < 30) {
      logger.error('Recording quality too low for training - blocking save');
      notify.error(
        'Aufnahme zu schlecht für Training. Bitte in ruhiger Umgebung mit ' +
          'deutlichem Maschinensignal erneut aufnehmen.\n\n' +
          'Probleme:\n' +
          this.currentQualityResult.issues.map((issue) => `• ${issue}`).join('\n'),
        new Error('Quality too low'),
        { duration: 0 }
      );
      return;
    }

    // INTELLIGENT MAGNITUDE + QUALITY CHECK: Brown Noise Protection
    // Block if BOTH quality AND signal magnitude are insufficient
    // UPDATED: Magnitude now uses RMS amplitude (pre-standardization), typical: 0.01-0.5
    const magnitude = this.currentQualityResult.metadata?.signalMagnitude ?? 0.5; // Default to OK if not available
    const isNoiseDetected =
      (magnitude < 0.01 && this.currentQualityResult.score < 60) || // Very low magnitude + poor quality = pure noise
      (magnitude < 0.03 && this.currentQualityResult.score < 50);     // Low magnitude + bad quality = too risky

    if (isNoiseDetected) {
      logger.error('Brown noise or weak signal detected - blocking save');
      notify.error(
        'Signal zu schwach oder diffus (möglicherweise nur Rauschen).\n\n' +
          `Signal-Stärke (RMS): ${magnitude.toFixed(4)} (Minimum: 0.03)\n` +
          `Qualität: ${this.currentQualityResult.score}%\n\n` +
          'Bitte sicherstellen:\n' +
          '• Mikrofon ist nah genug an der Maschine (10-30cm)\n' +
          '• Maschine läuft mit ausreichend Lautstärke\n' +
          '• Kein reines Hintergrundrauschen wird aufgenommen\n\n' +
          'Probleme:\n' +
          this.currentQualityResult.issues.map((issue) => `• ${issue}`).join('\n'),
        new Error('Signal too weak or noisy'),
        { duration: 0, title: 'Ungeeignetes Signal' }
      );
      return;
    }

    // PHASE 2 REQUIREMENT: Show extra confirmation for BAD quality (score >= 30%)
    // This runs ONLY if not blocked by magnitude check above
    if (this.currentQualityResult.rating === 'BAD') {
      const confirmed = confirm(
        '⚠️ WARNUNG: Schlechte Aufnahmequalität\n\n' +
          'Die Qualität dieser Aufnahme ist schlecht. Das Training könnte unzuverlässig sein.\n\n' +
          'Probleme:\n' +
          this.currentQualityResult.issues.map((issue) => `• ${issue}`).join('\n') +
          '\n\n' +
          'Möchten Sie trotzdem speichern?'
      );

      if (!confirmed) {
        logger.info('User cancelled save due to bad quality warning');
        return;
      }
    }

    try {
      // MULTICLASS: Determine label and type based on number of existing models
      let label: string;
      let type: 'healthy' | 'faulty';

      // CRITICAL FIX: Store local reference to prevent race conditions
      // If this.machine.referenceModels changes between checks, we maintain consistency
      const existingModels = this.machine.referenceModels;

      // CRITICAL FIX: Check if referenceModels exists before accessing length
      if (!existingModels || existingModels.length === 0) {
        // First recording: Always "Baseline" (healthy state)
        label = 'Baseline';
        type = 'healthy';
        logger.info('First recording - using label: "Baseline", type: "healthy"');
      } else {
        // Additional recordings: Ask user for label and type
        const userLabel = prompt(
          'Geben Sie einen Namen für diesen Maschinenzustand ein:\n\n' +
            'Beispiele:\n' +
            '• Normale Betriebszustände: "Leerlauf", "Volllast", "Teillast"\n' +
            '• Fehler: "Unwucht simuliert", "Lagerschaden", "Lüfterfehler"',
          ''
        );

        if (!userLabel || userLabel.trim() === '') {
          logger.info('User cancelled - no label provided');
          notify.warning('Bitte einen Namen eingeben', { title: 'Abgebrochen' });
          return;
        }

        label = userLabel.trim();

        // Ask user for type: Is this a normal state or a fault?
        const isHealthy = confirm(
          `Zustand: "${label}"\n\n` +
            'Ist dies ein NORMALER Betriebszustand?\n\n' +
            '🟢 OK (Ja) → Normaler Zustand (z.B. "Leerlauf", "Volllast")\n' +
            '🔴 Abbrechen (Nein) → Bekannter Fehler (z.B. "Unwucht", "Lagerschaden")\n\n' +
            'Hinweis: Diese Wahl bestimmt, ob eine Diagnose als "gesund" oder "fehlerhaft" angezeigt wird.'
        );

        type = isHealthy ? 'healthy' : 'faulty';
        logger.info(`Additional recording - using label: "${label}", type: "${type}"`);
      }

      logger.info('💾 Saving reference model...');

      // Train GMIA model
      const model = trainGMIA(this.currentTrainingData, this.machine.id);

      // CRITICAL FIX: Validate model weight magnitude
      // UPDATED: Lowered threshold from 0.038 to 0.005 because absoluteFeatures
      // (from FFT magnitudes) have naturally small values (0.001-0.1 range)
      // We rely primarily on the intelligent Brown Noise Check (signalMagnitude from qualityCheck)
      // This check is mainly to catch extreme cases (pure silence, completely degenerate signals)
      const MIN_REFERENCE_MAGNITUDE = 0.005; // Lowered from 0.038
      let weightMagnitude = 0;
      for (const value of model.weightVector) {
        weightMagnitude += value * value;
      }
      weightMagnitude = Math.sqrt(weightMagnitude);

      if (weightMagnitude < MIN_REFERENCE_MAGNITUDE) {
        logger.error(
          `Model weight magnitude too low: ${weightMagnitude.toFixed(4)} < ${MIN_REFERENCE_MAGNITUDE}`
        );

        // DEBUGGING FEATURE: Calculate what the score would be WITHOUT magnitude rejection
        // This helps verify that the algorithm itself works, even if the signal is too weak
        const { calculateHealthScore } = await import('@core/ml/scoring.js');
        const theoreticalScore = calculateHealthScore(1.0, model.scalingConstant); // Assume perfect match
        const theoreticalScoreFormatted = theoreticalScore.toFixed(1);

        logger.warn(
          `⚠️ DEBUG INFO: Without magnitude check, this model would show ~${theoreticalScoreFormatted}% for matching signals (misleading!)`
        );

        notify.error(
          '⛔ REFERENZMODELL ABGELEHNT\n\n' +
            '❌ Dieses Modell würde bei der Live-Diagnose IMMER 0% anzeigen!\n' +
            '   (Grund: Magnitude-Filter verwirft zu schwache Referenzsignale)\n\n' +
            `📊 Signal-Stärke des Modells: ${(weightMagnitude * 100).toFixed(1)}%\n` +
            `   Minimum erforderlich: ${(MIN_REFERENCE_MAGNITUDE * 100).toFixed(1)}%\n\n` +
            `🔬 DEBUG-INFO (nur zur Verifikation):\n` +
            `   Ohne Magnitude-Filter würde das Modell ~${theoreticalScoreFormatted}% zeigen\n` +
            `   (irreführend, da Signal zu schwach!)\n\n` +
            '📋 Mögliche Ursachen:\n' +
            '   • Mikrofon zu weit von der Maschine entfernt (10-30cm empfohlen)\n' +
            '   • Maschine läuft zu leise oder ist ausgeschaltet\n' +
            '   • Nur Hintergrundrauschen wurde aufgenommen\n' +
            '   • Audio-Signal zu schwach (Mikrofonverstärkung prüfen)\n\n' +
            '✅ Lösung - Aufnahme wiederholen mit:\n' +
            '   • Näher an die Maschine herangehen\n' +
            '   • Sicherstellen, dass Maschine läuft und hörbar ist\n' +
            '   • Ruhigere Umgebung wählen (weniger Hintergrundrauschen)\n' +
            '   • Eventuell Mikrofonverstärkung erhöhen',
          new Error('Model weight magnitude too low'),
          { duration: 0, title: '⛔ Referenzmodell ungeeignet' }
        );
        return;
      }

      logger.info(
        `✅ Model weight magnitude OK: ${weightMagnitude.toFixed(4)} >= ${MIN_REFERENCE_MAGNITUDE}`
      );

      // Add label and type to model
      model.label = label;
      model.type = type;

      // Save model to database
      await updateMachineModel(this.machine.id, model);

      logger.info(`✅ Reference model "${label}" trained and saved!`);

      // Reload machine to get updated referenceModels array
      const { getMachine } = await import('@data/db.js');
      const updatedMachine = await getMachine(this.machine.id);
      if (updatedMachine) {
        this.machine = updatedMachine;
      }

      // Hide review modal
      this.hideReviewModal();

      // Show success with option to download reference audio
      this.showSuccessWithExport();

      // Show multiclass status (list of trained states + "Train Another" button)
      this.showMulticlassStatus();

      // Clear stored data
      this.currentAudioBuffer = null;
      this.currentFeatures = [];
      this.currentQualityResult = null;
      this.currentTrainingData = null;
    } catch (error) {
      logger.error('Save error:', error);
      notify.error('Speichern fehlgeschlagen', error as Error, {
        title: 'Fehler beim Speichern',
        duration: 0,
      });
    }
  }

  /**
   * Show multiclass training status
   *
   * Displays:
   * - List of all trained states (with labels and dates)
   * - "Train Another State" button
   */
  private showMulticlassStatus(): void {
    // Find or create status container
    let statusContainer = document.getElementById('multiclass-status');
    if (!statusContainer) {
      // Create container if it doesn't exist
      // CRITICAL FIX: Use correct class selector from HTML (container-content, not phase-content)
      const parentContainer = document.querySelector(
        '#record-reference-content .container-content'
      );
      if (!parentContainer) return;

      statusContainer = document.createElement('div');
      statusContainer.id = 'multiclass-status';
      statusContainer.className = 'multiclass-status';
      parentContainer.appendChild(statusContainer);
    }

    // Clear existing content
    statusContainer.innerHTML = '';

    // Title
    const title = document.createElement('h3');
    title.textContent = 'Trainierte Zustände';
    statusContainer.appendChild(title);

    // List of trained states
    const stateList = document.createElement('ul');
    stateList.className = 'state-list';

    // CRITICAL FIX: Store local reference to prevent race conditions
    // This ensures we iterate over the same snapshot even if this.machine.referenceModels changes
    const models = this.machine.referenceModels;

    // CRITICAL FIX: Check if referenceModels exists before iterating
    if (models && models.length > 0) {
      models.forEach((model) => {
        const li = document.createElement('li');
        li.className = 'state-item';

        const dateStr = model.trainingDate
          ? new Date(model.trainingDate).toLocaleString('de-DE', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })
          : 'unbekannt';

        // Use textContent instead of innerHTML to prevent XSS attacks
        const labelSpan = document.createElement('span');
        labelSpan.className = 'state-label';
        labelSpan.textContent = model.label;

        const dateSpan = document.createElement('span');
        dateSpan.className = 'state-date';
        dateSpan.textContent = dateStr;

        li.appendChild(labelSpan);
        li.appendChild(dateSpan);

        stateList.appendChild(li);
      });
    }

    statusContainer.appendChild(stateList);

    // "Train Another State" button
    const trainAnotherBtn = document.createElement('button');
    trainAnotherBtn.id = 'train-another-btn';
    trainAnotherBtn.className = 'btn btn-secondary';
    trainAnotherBtn.textContent = 'Weiteren Zustand trainieren';
    trainAnotherBtn.onclick = () => this.startRecording();
    statusContainer.appendChild(trainAnotherBtn);

    // Show container
    statusContainer.style.display = 'block';
  }

  /**
   * Destroy phase and cleanup all resources
   */
  public destroy(): void {
    this.cleanup();

    // CRITICAL FIX: Remove event listener to prevent stacking on re-init
    if (this.recordButtonClickHandler) {
      const recordBtn = document.getElementById('record-btn');
      if (recordBtn) {
        recordBtn.removeEventListener('click', this.recordButtonClickHandler);
      }
      this.recordButtonClickHandler = null;
    }

    // Destroy visualizer
    if (this.visualizer) {
      this.visualizer.destroy();
      this.visualizer = null;
    }

    // Clear audio chunks
    this.audioChunks = [];
    this.recordedBlob = null;
  }
}
