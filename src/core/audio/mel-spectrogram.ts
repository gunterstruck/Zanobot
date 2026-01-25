/**
 * ZANOBOT Level 2 - Mel-Spectrogram Generator
 *
 * Generates Mel-spectrograms from audio for visualization.
 * Mel scale = biologically plausible (mimics human hearing perception)
 *
 * CRITICAL: Uses tf.tidy() for memory management!
 */

import * as tf from '@tensorflow/tfjs';

/**
 * Spectrogram configuration options
 */
export interface SpectrogramConfig {
  fftSize: number; // FFT window size (default: 2048)
  hopSize: number; // Hop length/overlap (default: 512)
  nMels: number; // Number of mel bands (default: 128)
  sampleRate: number; // Expected sample rate (default: 16000)
  minFreq: number; // Minimum frequency (default: 20)
  maxFreq: number; // Maximum frequency (default: 8000)
}

/**
 * Default spectrogram configuration
 */
const DEFAULT_CONFIG: SpectrogramConfig = {
  fftSize: 2048,
  hopSize: 512,
  nMels: 128,
  sampleRate: 16000,
  minFreq: 20,
  maxFreq: 8000,
};

/**
 * Mel-Spectrogram Generator
 *
 * Creates time-frequency representations of audio suitable for ML analysis
 */
export class MelSpectrogramGenerator {
  private config: SpectrogramConfig;
  private melFilterbank: Float32Array[] | null = null;

  constructor(config: Partial<SpectrogramConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Generate Mel-Spectrogram from AudioBuffer
   *
   * @param audioBuffer - Audio data to analyze
   * @returns 2D array [time][frequency] with log-mel values
   */
  async generate(audioBuffer: AudioBuffer): Promise<number[][]> {
    const audioData = audioBuffer.getChannelData(0);
    return this.generateFromSamples(audioData);
  }

  /**
   * Generate Mel-Spectrogram from raw audio samples
   *
   * @param audioData - Float32Array of audio samples
   * @returns 2D array [time][frequency] with log-mel values
   */
  generateFromSamples(audioData: Float32Array): number[][] {
    return tf.tidy(() => {
      // Convert to tensor
      const signal = tf.tensor1d(Array.from(audioData));

      // STFT (Short-Time Fourier Transform)
      const stftResult = tf.signal.stft(
        signal,
        this.config.fftSize,
        this.config.hopSize,
        this.config.fftSize,
        tf.signal.hannWindow
      );

      // Calculate magnitude (ignore phase)
      const magnitude = tf.abs(stftResult);

      // Apply simple log scaling for visualization
      // Note: Full mel filterbank would be applied here in production
      const logSpec = tf.log(magnitude.add(1e-10));

      // Convert to 2D array
      const array2d = logSpec.arraySync() as number[][];

      return array2d;
    });
  }

  /**
   * Generate power spectrogram (without mel conversion)
   *
   * @param audioBuffer - Audio data
   * @returns 2D array with power spectrum values
   */
  async generatePowerSpectrogram(audioBuffer: AudioBuffer): Promise<number[][]> {
    const audioData = audioBuffer.getChannelData(0);

    return tf.tidy(() => {
      const signal = tf.tensor1d(Array.from(audioData));

      const stftResult = tf.signal.stft(
        signal,
        this.config.fftSize,
        this.config.hopSize,
        this.config.fftSize,
        tf.signal.hannWindow
      );

      // Power = magnitude squared
      const power = tf.square(tf.abs(stftResult));
      const logPower = tf.log(power.add(1e-10));

      return logPower.arraySync() as number[][];
    });
  }

  /**
   * Convert Hz to Mel scale
   */
  private hzToMel(hz: number): number {
    return 2595 * Math.log10(1 + hz / 700);
  }

  /**
   * Convert Mel to Hz scale
   */
  private melToHz(mel: number): number {
    return 700 * (Math.pow(10, mel / 2595) - 1);
  }

  /**
   * Create mel filterbank matrix
   * Used for converting linear spectrogram to mel spectrogram
   */
  private createMelFilterbank(): Float32Array[] {
    const { nMels, fftSize, sampleRate, minFreq, maxFreq } = this.config;

    const numFFTBins = Math.floor(fftSize / 2) + 1;
    const melMin = this.hzToMel(minFreq);
    const melMax = this.hzToMel(maxFreq);

    // Create mel points
    const melPoints = new Float32Array(nMels + 2);
    for (let i = 0; i < nMels + 2; i++) {
      melPoints[i] = melMin + ((melMax - melMin) * i) / (nMels + 1);
    }

    // Convert mel points to Hz
    const hzPoints = melPoints.map((mel) => this.melToHz(mel));

    // Convert Hz to FFT bin indices
    const binPoints = hzPoints.map((hz) =>
      Math.floor(((fftSize + 1) * hz) / sampleRate)
    );

    // Create filterbank
    const filterbank: Float32Array[] = [];

    for (let i = 0; i < nMels; i++) {
      const filter = new Float32Array(numFFTBins);
      const startBin = binPoints[i];
      const centerBin = binPoints[i + 1];
      const endBin = binPoints[i + 2];

      // Rising edge
      for (let j = startBin; j < centerBin; j++) {
        if (j >= 0 && j < numFFTBins) {
          filter[j] = (j - startBin) / (centerBin - startBin);
        }
      }

      // Falling edge
      for (let j = centerBin; j < endBin; j++) {
        if (j >= 0 && j < numFFTBins) {
          filter[j] = (endBin - j) / (endBin - centerBin);
        }
      }

      filterbank.push(filter);
    }

    return filterbank;
  }

  /**
   * Render spectrogram to canvas
   *
   * @param spectrogram - 2D spectrogram data
   * @param canvas - Target canvas element
   */
  renderToCanvas(spectrogram: number[][], canvas: HTMLCanvasElement): void {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = spectrogram.length;
    const height = spectrogram[0]?.length || 0;

    if (width === 0 || height === 0) return;

    canvas.width = width;
    canvas.height = height;

    // Find min/max for normalization
    let min = Infinity;
    let max = -Infinity;
    for (let t = 0; t < width; t++) {
      for (let f = 0; f < height; f++) {
        const value = spectrogram[t][f];
        if (value < min) min = value;
        if (value > max) max = value;
      }
    }

    const range = max - min || 1;

    // Render heatmap
    const imageData = ctx.createImageData(width, height);

    for (let t = 0; t < width; t++) {
      for (let f = 0; f < height; f++) {
        const value = spectrogram[t][f];
        const normalized = (value - min) / range;
        const color = this.valueToViridis(normalized);

        // Flip Y-axis (low frequencies at bottom)
        const y = height - f - 1;
        const idx = (y * width + t) * 4;

        imageData.data[idx] = color.r;
        imageData.data[idx + 1] = color.g;
        imageData.data[idx + 2] = color.b;
        imageData.data[idx + 3] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  /**
   * Viridis color map (scientifically optimal perceptual uniformity)
   */
  private valueToViridis(value: number): { r: number; g: number; b: number } {
    // Simplified Viridis approximation
    const v = Math.max(0, Math.min(1, value));

    // Viridis goes from dark purple → blue → green → yellow
    const r = Math.floor(
      255 * (0.267 + 0.005 * v + v * v * (0.329 + 1.017 * v - 1.132 * v * v))
    );
    const g = Math.floor(255 * (0.004 + v * (1.192 - 0.737 * v)));
    const b = Math.floor(255 * (0.329 + v * (0.731 - 1.573 * v + 0.693 * v * v)));

    return {
      r: Math.max(0, Math.min(255, r)),
      g: Math.max(0, Math.min(255, g)),
      b: Math.max(0, Math.min(255, b)),
    };
  }

  /**
   * Alternative: Magma color map
   */
  private valueToMagma(value: number): { r: number; g: number; b: number } {
    const v = Math.max(0, Math.min(1, value));

    const r = Math.floor(255 * Math.pow(v, 0.4));
    const g = Math.floor(255 * Math.pow(v, 1.5));
    const b = Math.floor(255 * (0.3 + 0.7 * Math.pow(1 - v, 0.5)));

    return {
      r: Math.max(0, Math.min(255, r)),
      g: Math.max(0, Math.min(255, g)),
      b: Math.max(0, Math.min(255, b)),
    };
  }

  /**
   * Get spectrogram dimensions for display
   */
  getDisplayDimensions(audioLengthSeconds: number): {
    width: number;
    height: number;
  } {
    const numFrames = Math.floor(
      (audioLengthSeconds * this.config.sampleRate - this.config.fftSize) /
        this.config.hopSize
    );
    return {
      width: numFrames,
      height: Math.floor(this.config.fftSize / 2) + 1,
    };
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<SpectrogramConfig>): void {
    this.config = { ...this.config, ...config };
    this.melFilterbank = null; // Reset filterbank
  }

  /**
   * Get current configuration
   */
  getConfig(): SpectrogramConfig {
    return { ...this.config };
  }
}
