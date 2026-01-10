/**
 * ZANOBOT - PHASE 3: DIAGNOSE
 *
 * Operation mode - Diagnose current machine state.
 * Steps:
 * 1. Record audio
 * 2. Extract features
 * 3. Compare with reference model (GMIA inference)
 * 4. Calculate health score
 * 5. Display results
 */

import { extractFeatures, DEFAULT_DSP_CONFIG } from '@core/dsp/features.js';
import { inferGMIA } from '@core/ml/gmia.js';
import { generateDiagnosisResult } from '@core/ml/scoring.js';
import { saveDiagnosis } from '@data/db.js';
import { AudioVisualizer } from '@ui/components/AudioVisualizer.js';
import { HealthGauge } from '@ui/components/HealthGauge.js';
import type { Machine } from '@data/types.js';

export class DiagnosePhase {
  private machine: Machine;
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private visualizer: AudioVisualizer | null = null;
  private healthGauge: HealthGauge | null = null;
  private recordingDuration: number = 10; // seconds

  constructor(machine: Machine) {
    this.machine = machine;
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
   * Start diagnosis recording
   */
  private async startDiagnosis(): Promise<void> {
    try {
      // Check if machine has reference model
      if (!this.machine.referenceModel) {
        alert('No reference model found. Please record a reference first.');
        return;
      }

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
      console.error('Diagnosis error:', error);
      alert('Failed to start diagnosis. Please check microphone permissions.');
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
   * Process recorded audio and perform diagnosis
   */
  private async processRecording(): Promise<void> {
    try {
      if (!this.audioContext || !this.machine.referenceModel) {
        throw new Error('Audio context or reference model not available');
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

      // Perform inference
      console.log('🧠 Running GMIA inference...');
      const cosineSimilarities = inferGMIA(this.machine.referenceModel, features);
      console.log(`   Cosine similarities calculated`);

      // Generate diagnosis result
      const diagnosis = generateDiagnosisResult(
        this.machine.referenceModel,
        cosineSimilarities,
        this.machine.id
      );

      console.log(`✅ Diagnosis complete:`);
      console.log(`   Health Score: ${diagnosis.healthScore}%`);
      console.log(`   Status: ${diagnosis.status}`);
      console.log(`   Confidence: ${diagnosis.confidence}%`);

      // Save to database
      await saveDiagnosis(diagnosis);

      // Hide recording modal
      this.hideRecordingModal();

      // Show results
      this.showResults(diagnosis);
    } catch (error) {
      console.error('Processing error:', error);
      alert('Failed to process recording. Please try again.');
      this.hideRecordingModal();
    }
  }

  /**
   * Show diagnosis results
   */
  private showResults(diagnosis: any): void {
    const modal = document.getElementById('diagnosis-modal');
    if (!modal) return;

    // Update modal content
    const machineBarcode = document.getElementById('machine-barcode');
    if (machineBarcode) {
      machineBarcode.textContent = this.machine.id;
    }

    const resultStatus = document.getElementById('result-status');
    if (resultStatus) {
      resultStatus.textContent = diagnosis.status.toUpperCase();
      resultStatus.className = `result-status status-${diagnosis.status}`;
    }

    const resultConfidence = document.getElementById('result-confidence');
    if (resultConfidence) {
      resultConfidence.textContent = Math.round(diagnosis.healthScore).toString();
    }

    const analysisHint = document.getElementById('analysis-hint');
    if (analysisHint && diagnosis.analysis?.hint) {
      analysisHint.textContent = diagnosis.analysis.hint;
    }

    // Show modal
    modal.style.display = 'flex';

    // Setup health gauge
    const gaugeCanvas = document.getElementById('health-gauge-canvas');
    if (gaugeCanvas) {
      this.healthGauge = new HealthGauge('health-gauge-canvas');
      this.healthGauge.updateScore(diagnosis.healthScore, true);
    }

    // Close button
    const closeBtn = document.getElementById('close-diagnosis-modal');
    if (closeBtn) {
      closeBtn.onclick = () => {
        modal.style.display = 'none';
        if (this.healthGauge) {
          this.healthGauge.destroy();
        }
      };
    }
  }

  /**
   * Show recording modal
   */
  private showRecordingModal(): void {
    const modal = document.getElementById('recording-modal');
    if (!modal) return;

    modal.style.display = 'flex';

    // Update modal title
    const modalHeader = modal.querySelector('.modal-header h3');
    if (modalHeader) {
      modalHeader.textContent = 'Diagnose läuft...';
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
    if (this.healthGauge) {
      this.healthGauge.destroy();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
  }
}
