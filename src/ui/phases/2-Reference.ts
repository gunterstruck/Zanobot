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
import type { Machine, TrainingData } from '@data/types.js';
import { logger } from '@utils/logger.js';

export class ReferencePhase {
  private machine: Machine;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private visualizer: AudioVisualizer | null = null;
  private recordingDuration: number = 10; // seconds
  private audioWorkletManager: AudioWorkletManager | null = null;
  private isRecordingActive: boolean = false;
  private recordedBlob: Blob | null = null; // For reference audio export
  private useAudioWorklet: boolean = true;

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
            notify.warning('Kein Signal erkannt', 'Bitte näher an die Maschine gehen und erneut versuchen.');
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

    // Close audio context
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }

    logger.debug('🧹 Reference phase cleanup complete');
  }

  /**
   * Actually start recording after Smart Start completes
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

    // Start recording
    this.mediaRecorder.start();

    // Update timer
    this.startTimer();

    // Auto-stop after duration
    setTimeout(() => {
      this.stopRecording();
    }, this.recordingDuration * 1000);
  }

  /**
   * Stop recording
   */
  private stopRecording(): void {
    this.cleanup();
  }

  /**
   * Process recorded audio and train model
   */
  private async processRecording(): Promise<void> {
    try {
      if (!this.audioContext) {
        throw new Error('Audio context not initialized');
      }

      // Create blob from chunks
      const blob = new Blob(this.audioChunks, { type: 'audio/webm' });
      this.recordedBlob = blob; // Save for export

      // Convert to AudioBuffer
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      logger.info(`🎙️ Recording complete: ${audioBuffer.duration.toFixed(2)}s`);

      // Extract features
      logger.info('📊 Extracting features...');
      const features = extractFeatures(audioBuffer, DEFAULT_DSP_CONFIG);
      logger.info(`   Extracted ${features.length} feature vectors`);

      // Prepare training data
      const trainingData: TrainingData = {
        featureVectors: features.map((f) => f.features),
        machineId: this.machine.id,
        recordingId: `ref-${Date.now()}`,
        numSamples: features.length,
        config: DEFAULT_DSP_CONFIG,
      };

      // Train GMIA model
      const model = trainGMIA(trainingData, this.machine.id);

      // Save model to database
      await updateMachineModel(this.machine.id, model);

      logger.info('✅ Reference model trained and saved!');

      // Update UI
      this.hideRecordingModal();

      // Show success with option to download reference audio
      this.showSuccessWithExport();
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
      notify.warning('Keine Audiodatei verfügbar', 'Bitte zuerst eine Referenzaufnahme erstellen.');
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
   * Start recording timer
   */
  private startTimer(): void {
    let elapsed = 0;
    const timerElement = document.getElementById('recording-timer');

    const interval = setInterval(() => {
      elapsed++;

      if (timerElement) {
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
      }

      if (elapsed >= this.recordingDuration) {
        clearInterval(interval);
      }
    }, 1000);
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
