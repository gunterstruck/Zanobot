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
import {
  getRawAudioStream,
  getSmartStartStatusMessage,
} from '@core/audio/audioHelper.js';
import {
  AudioWorkletManager,
  isAudioWorkletSupported,
} from '@core/audio/audioWorkletHelper.js';
import { notify } from '@utils/notifications.js';
import type { Machine, TrainingData, FeatureVector, QualityResult } from '@data/types.js';
import { logger } from '@utils/logger.js';

export class ReferencePhase {
  private machine: Machine;
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

  // Phase 2: Review Modal State
  private currentAudioBuffer: AudioBuffer | null = null;
  private currentFeatures: FeatureVector[] = [];
  private currentQualityResult: QualityResult | null = null;
  private currentTrainingData: TrainingData | null = null;

  constructor(machine: Machine) {
    this.machine = machine;
  }

  /**
   * Initialize the reference phase UI
   */
  public init(): void {
    const recordBtn = document.getElementById('record-btn');
    if (recordBtn) {
      recordBtn.addEventListener('click', () => this.startRecording());
    }
  }

  /**
   * Start recording reference audio with Smart Start
   */
  private async startRecording(): Promise<void> {
    try {
      logger.info('🎙️ Phase 2: Starting reference recording with Smart Start...');

      // Check AudioWorklet support
      this.useAudioWorklet = isAudioWorkletSupported();
      if (!this.useAudioWorklet) {
        logger.warn('⚠️ AudioWorklet not supported, Smart Start disabled');
      }

      // Request microphone access using central helper
      this.mediaStream = await getRawAudioStream();

      // Create audio context
      this.audioContext = new AudioContext({ sampleRate: 44100 });

      // Validate sample rate (some browsers may use different rate)
      if (this.audioContext.sampleRate !== 44100) {
        logger.warn(`⚠️ AudioContext sample rate is ${this.audioContext.sampleRate}Hz instead of requested 44100Hz`);
        logger.warn('   This may cause slight differences in feature extraction.');
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
        // Initialize AudioWorklet Manager
        this.audioWorkletManager = new AudioWorkletManager({
          bufferSize: 16384,
          onSmartStartStateChange: (state) => {
            const statusMsg = getSmartStartStatusMessage(state);
            this.updateStatusMessage(statusMsg);
          },
          onSmartStartComplete: (rms) => {
            logger.info(`✅ Smart Start: Signal detected! RMS: ${rms.toFixed(4)}`);
            this.updateStatusMessage('Aufnahme läuft');
            this.actuallyStartRecording();
          },
          onSmartStartTimeout: () => {
            notify.warning('Bitte näher an die Maschine gehen und erneut versuchen.', { title: 'Kein Signal erkannt' });
            this.stopRecording();
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
    // Reset state flags to prevent memory leaks
    this.isRecordingActive = false;

    // Stop media recorder if active
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
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

    // Setup media recorder
    this.audioChunks = [];
    this.mediaRecorder = new MediaRecorder(this.mediaStream);
    this.isRecordingActive = true;

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

      // Auto-stop after full duration (15 seconds)
      // Using setTimeout here ensures timer starts AFTER recording actually started
      setTimeout(() => {
        this.stopRecording();
      }, this.recordingDuration * 1000);
    };

    // Start recording (will trigger onstart event)
    this.mediaRecorder.start();
  }

  /**
   * Stop recording
   */
  private stopRecording(): void {
    this.cleanup();
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
   */
  private async processRecording(): Promise<void> {
    try {
      if (!this.audioContext) {
        throw new Error('Audio context not initialized');
      }

      // Create blob from chunks (FULL 15 seconds for download)
      const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
      this.recordedBlob = blob; // Save for export

      // Convert to AudioBuffer
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      logger.info(`🎙️ Recording complete: ${audioBuffer.duration.toFixed(2)}s`);

      // IMPORTANT: Slice audio buffer to remove warmup period
      // We only want to train on the stable signal (after 5 seconds)
      const sampleRate = audioBuffer.sampleRate;
      const warmupSamples = Math.floor(this.warmUpDuration * sampleRate);
      const totalSamples = audioBuffer.length;
      const trainingSamples = totalSamples - warmupSamples;

      logger.info(`📊 Slicing audio buffer:`);
      logger.info(`   Total duration: ${audioBuffer.duration.toFixed(2)}s`);
      logger.info(`   Warmup period: ${this.warmUpDuration}s (${warmupSamples} samples) - DISCARDED`);
      logger.info(`   Training period: ${(trainingSamples / sampleRate).toFixed(2)}s (${trainingSamples} samples) - USED`);

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

      // Extract features from the SLICED buffer (only stable signal)
      logger.info('📊 Extracting features from stable signal...');
      const features = extractFeatures(trainingBuffer, DEFAULT_DSP_CONFIG);
      logger.info(`   Extracted ${features.length} feature vectors`);

      // PHASE 2: Assess recording quality
      const qualityResult = assessRecordingQuality(features);

      // Prepare training data (but don't train yet - wait for user approval)
      const trainingData: TrainingData = {
        featureVectors: features.map((f) => f.features),
        machineId: this.machine.id,
        recordingId: `ref-${Date.now()}`,
        numSamples: features.length,
        config: DEFAULT_DSP_CONFIG,
      };

      // Store for later use
      this.currentAudioBuffer = audioBuffer;
      this.currentFeatures = features;
      this.currentQualityResult = qualityResult;
      this.currentTrainingData = trainingData;

      // Hide recording modal
      this.hideRecordingModal();

      // PHASE 2: Show review modal instead of saving directly
      this.showReviewModal();
    } catch (error) {
      logger.error('Processing error:', error);
      notify.error('Aufnahme konnte nicht verarbeitet werden', error as Error, {
        title: 'Verarbeitungsfehler',
        duration: 0
      });
      this.hideRecordingModal();
    }
  }

  /**
   * Show success message with reference audio export option
   */
  private showSuccessWithExport(): void {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `${this.machine.id}_REF_${timestamp}.webm`;

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
      notify.warning('Bitte zuerst eine Referenzaufnahme erstellen.', { title: 'Keine Audiodatei verfügbar' });
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
  }

  /**
   * Start recording timer with dual-phase UI
   *
   * Phase 1 (0-5s): "Stabilisierung..." (warmup, audio saved but not used for training)
   * Phase 2 (5-15s): "Aufnahme..." (actual recording used for training)
   */
  private startTimer(): void {
    let elapsed = 0;
    const timerElement = document.getElementById('recording-timer');
    const statusElement = document.getElementById('recording-status');

    const interval = setInterval(() => {
      elapsed++;

      // Update phase-specific UI
      if (elapsed <= this.warmUpDuration) {
        // Phase 1: Stabilisierung (0-5s)
        if (statusElement) {
          const remaining = this.warmUpDuration - elapsed + 1;
          statusElement.textContent = `Stabilisierung... ${remaining}s`;
        }
        if (timerElement) {
          timerElement.textContent = '--:--';
        }
      } else {
        // Phase 2: Aufnahme (5-15s)
        const recordingElapsed = elapsed - this.warmUpDuration;
        const recordingTotal = this.recordingDuration - this.warmUpDuration;

        if (statusElement) {
          statusElement.textContent = `Aufnahme läuft...`;
        }
        if (timerElement) {
          const minutes = Math.floor(recordingElapsed / 60);
          const seconds = recordingElapsed % 60;
          timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')} / ${Math.floor(recordingTotal / 60).toString().padStart(2, '0')}:${(recordingTotal % 60).toString().padStart(2, '0')}`;
        }
      }

      if (elapsed >= this.recordingDuration) {
        clearInterval(interval);
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

    // Setup audio player
    const audioElement = document.getElementById('review-audio') as HTMLAudioElement;
    const audioSource = document.getElementById('review-audio-source') as HTMLSourceElement;

    if (audioElement && audioSource) {
      const audioUrl = URL.createObjectURL(this.recordedBlob);
      audioSource.src = audioUrl;
      audioElement.load();
    }

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
        duration: 0
      });
      return;
    }

    if (!this.currentTrainingData || !this.currentQualityResult) {
      logger.error('Cannot save: missing training data or quality result');
      return;
    }

    // PHASE 2 REQUIREMENT: Show extra confirmation for BAD quality
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

      if (this.machine.referenceModels.length === 0) {
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
        duration: 0
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
      const parentContainer = document.querySelector('.phase-content');
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

    this.machine.referenceModels.forEach((model, index) => {
      const li = document.createElement('li');
      li.className = 'state-item';

      const date = new Date(model.trainingDate);
      const dateStr = date.toLocaleDateString('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

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
