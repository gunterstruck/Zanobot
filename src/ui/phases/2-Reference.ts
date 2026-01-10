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
import type { Machine, TrainingData } from '@data/types.js';

export class ReferencePhase {
  private machine: Machine;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private visualizer: AudioVisualizer | null = null;
  private recordingDuration: number = 10; // seconds

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
   * Start recording reference audio
   */
  private async startRecording(): Promise<void> {
    try {
      // Request microphone access
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: 44100,
        },
      });

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

      // Setup media recorder
      this.audioChunks = [];
      this.mediaRecorder = new MediaRecorder(this.mediaStream);

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
    } catch (error) {
      console.error('Recording error:', error);
      alert('Failed to access microphone. Please grant permission.');
    }
  }

  /**
   * Stop recording
   */
  private stopRecording(): void {
    if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
      this.mediaRecorder.stop();
    }

    if (this.visualizer) {
      this.visualizer.stop();
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
    }
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

      // Convert to AudioBuffer
      const arrayBuffer = await blob.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);

      console.log(`🎙️ Recording complete: ${audioBuffer.duration.toFixed(2)}s`);

      // Extract features
      console.log('📊 Extracting features...');
      const features = extractFeatures(audioBuffer, DEFAULT_DSP_CONFIG);
      console.log(`   Extracted ${features.length} feature vectors`);

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

      console.log('✅ Reference model trained and saved!');

      // Update UI
      this.hideRecordingModal();
      alert(`Reference model trained successfully!\nMachine: ${this.machine.name}`);
    } catch (error) {
      console.error('Processing error:', error);
      alert('Failed to process recording. Please try again.');
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
   * Cleanup
   */
  public destroy(): void {
    this.stopRecording();
    if (this.visualizer) {
      this.visualizer.destroy();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
