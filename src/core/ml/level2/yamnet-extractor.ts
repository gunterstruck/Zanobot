/**
 * ZANOBOT Level 2 - YAMNet Feature Extractor
 *
 * Extracts 1024-dimensional embeddings from audio using Google's YAMNet model.
 * Implements Singleton pattern to avoid multiple model loads (6MB model).
 *
 * The YAMNet model is loaded directly from TensorFlow Hub.
 *
 * CRITICAL: Uses tf.tidy() for memory management!
 */

import * as tf from '@tensorflow/tfjs';
import type { GraphModel } from '@tensorflow/tfjs';

/**
 * YAMNet model URL from TensorFlow Hub
 * This model outputs 1024-dimensional embeddings
 */
const YAMNET_MODEL_URL =
  'https://www.kaggle.com/models/google/yamnet/TfJs/classification-tflite/1';

// Alternative URL from tfhub.dev (may have different format)
const YAMNET_TFHUB_URL =
  'https://tfhub.dev/google/tfjs-model/yamnet/classification/1/default/1';

/**
 * YAMNet Feature Extractor - Singleton Pattern
 *
 * Loads YAMNet model once and caches it.
 * Uses WebGPU for maximum performance with fallbacks.
 */
export class YAMNetExtractor {
  private static instance: YAMNetExtractor | null = null;
  private static initPromise: Promise<YAMNetExtractor> | null = null;
  private model: GraphModel | null = null;
  private isInitialized = false;
  private backendUsed: 'webgpu' | 'webgl' | 'cpu' = 'webgl';
  private embeddingSize = 1024;

  // Private constructor for Singleton
  private constructor() {}

  /**
   * Get Singleton Instance
   * Model is loaded only once on first call
   *
   * CRITICAL: Uses Promise caching to prevent race conditions
   * when multiple callers request getInstance() simultaneously.
   */
  static async getInstance(): Promise<YAMNetExtractor> {
    if (!YAMNetExtractor.initPromise) {
      YAMNetExtractor.initPromise = (async () => {
        const instance = new YAMNetExtractor();
        await instance.initialize();
        YAMNetExtractor.instance = instance;
        return instance;
      })();
    }
    return YAMNetExtractor.initPromise;
  }

  /**
   * Check if instance exists without initializing
   */
  static hasInstance(): boolean {
    return YAMNetExtractor.instance !== null && YAMNetExtractor.instance.isInitialized;
  }

  /**
   * Initialize with robust backend fallback
   */
  private async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log('🚀 Initializing YAMNet Extractor...');

    // CRITICAL: Robust backend fallback chain
    await this.initializeBackend();

    // Load YAMNet model from TensorFlow Hub
    await this.loadModel();

    this.isInitialized = true;
    console.log(`✅ YAMNet initialized with ${this.backendUsed} backend`);
  }

  /**
   * Initialize TensorFlow.js backend with fallbacks
   * WebGPU → WebGL → CPU
   */
  private async initializeBackend(): Promise<void> {
    // Try WebGPU first (fastest on modern browsers)
    try {
      await tf.setBackend('webgpu');
      await tf.ready();
      this.backendUsed = 'webgpu';
      console.log('✅ Using WebGPU backend (fastest)');
      return;
    } catch (error) {
      console.warn('⚠️ WebGPU not available:', (error as Error).message);
    }

    // Fallback to WebGL (widely supported)
    try {
      await tf.setBackend('webgl');
      await tf.ready();
      this.backendUsed = 'webgl';
      console.log('✅ Using WebGL backend');
      return;
    } catch (error) {
      console.warn('⚠️ WebGL not available:', (error as Error).message);
    }

    // Last resort: CPU (slow but works everywhere)
    try {
      await tf.setBackend('cpu');
      await tf.ready();
      this.backendUsed = 'cpu';
      console.warn('⚠️ Using CPU backend (slow - consider upgrading browser)');
    } catch (error) {
      throw new Error('Failed to initialize any TensorFlow.js backend');
    }
  }

  /**
   * Load YAMNet model from TensorFlow Hub
   *
   * Note: If the TensorFlow Hub model is not accessible, this will use a
   * fallback approach with custom feature extraction.
   */
  private async loadModel(): Promise<void> {
    console.log('📦 Loading YAMNet model from TensorFlow Hub...');

    try {
      // Try loading from TensorFlow Hub
      this.model = await tf.loadGraphModel(YAMNET_TFHUB_URL, {
        fromTFHub: true,
      });
      console.log('✅ YAMNet model loaded from TensorFlow Hub');
    } catch (hubError) {
      console.warn('⚠️ TensorFlow Hub model not available, using fallback');
      console.warn('Error:', (hubError as Error).message);

      // Fallback: We'll use a custom embedding approach
      // This generates embeddings using spectral analysis
      this.model = null;
      console.log('✅ Using fallback spectral embedding extractor');
    }
  }

  /**
   * Extract 1024-dimensional embeddings from audio
   *
   * If YAMNet model is loaded, uses it for feature extraction.
   * Otherwise, falls back to spectral-based embedding generation.
   *
   * CRITICAL: Uses tf.tidy() for memory management!
   *
   * @param audioBuffer - Audio data to analyze
   * @returns Float32Array with 1024 values (mean embedding over time)
   */
  async extractEmbeddings(audioBuffer: AudioBuffer): Promise<Float32Array> {
    console.time('⏱️ Feature Extraction');

    // STEP 1: Resample to 16kHz (standard for audio ML models)
    const resampled = await this.resampleTo16kHz(audioBuffer);

    let embeddings: Float32Array;

    if (this.model) {
      // Use YAMNet model
      embeddings = this.extractWithYAMNet(resampled);
    } else {
      // Use fallback spectral embedding
      embeddings = this.extractSpectralEmbeddings(resampled);
    }

    console.timeEnd('⏱️ Feature Extraction');

    return embeddings;
  }

  /**
   * Extract embeddings using YAMNet model
   *
   * PERFORMANCE: Uses Float32Array directly without Array.from() conversion
   * SAFETY: Validates YAMNet output structure before accessing
   */
  private extractWithYAMNet(audioData: Float32Array): Float32Array {
    return tf.tidy(() => {
      // Prepare input tensor (YAMNet expects [batch, samples] or [samples])
      // PERFORMANCE FIX: Pass Float32Array directly - no Array.from() needed
      const inputTensor = tf.tensor1d(audioData);

      // Run inference
      const output = this.model!.predict(inputTensor) as tf.Tensor | tf.Tensor[];

      // Get embeddings (may need to select correct output)
      let embeddings: tf.Tensor;
      if (Array.isArray(output)) {
        // YAMNet returns [scores, embeddings, spectrogram]
        // SAFETY FIX: Validate output structure
        if (output.length < 2) {
          throw new Error(
            `Unexpected YAMNet output structure: expected at least 2 tensors (scores, embeddings), got ${output.length}`
          );
        }
        embeddings = output[1];
      } else {
        embeddings = output;
      }

      // Average over time dimension
      const meanEmbedding = embeddings.mean(0);

      // TYPE SAFETY FIX: dataSync() returns TypedArray, explicitly convert to Float32Array
      const syncedData = meanEmbedding.dataSync();
      return new Float32Array(syncedData);
    });
  }

  /**
   * Fallback: Extract spectral-based embeddings
   *
   * This method generates 1024-dimensional embeddings using:
   * 1. STFT for time-frequency analysis
   * 2. Mel filterbank application
   * 3. Statistics extraction across time
   *
   * PERFORMANCE FIX: Uses Float32Array directly without Array.from() conversion
   */
  private extractSpectralEmbeddings(audioData: Float32Array): Float32Array {
    return tf.tidy(() => {
      // PERFORMANCE FIX: Pass Float32Array directly - no Array.from() needed
      const signal = tf.tensor1d(audioData);

      // Parameters
      const fftSize = 2048;
      const hopSize = 512;
      const numMelBins = 128;

      // STFT
      const stft = tf.signal.stft(signal, fftSize, hopSize, fftSize, tf.signal.hannWindow);

      // Magnitude spectrum
      const magnitude = tf.abs(stft);

      // Log-scale (for better dynamic range)
      const logMag = tf.log(magnitude.add(1e-10));

      // Extract statistics across time dimension
      const mean = logMag.mean(0);
      const std = tf.moments(logMag, 0).variance.sqrt();
      const max = logMag.max(0);
      const min = logMag.min(0);

      // Concatenate statistics
      const features = tf.concat([mean, std, max, min]);

      // Resize to target embedding size (1024)
      const currentSize = features.shape[0];
      let embedding: tf.Tensor1D;

      if (currentSize >= this.embeddingSize) {
        // Take first 1024 elements
        embedding = features.slice(0, this.embeddingSize) as tf.Tensor1D;
      } else {
        // Pad with repetition
        const repeats = Math.ceil(this.embeddingSize / currentSize);
        const repeated = tf.tile(features, [repeats]);
        embedding = repeated.slice(0, this.embeddingSize) as tf.Tensor1D;
      }

      // Normalize
      const normalized = embedding.div(embedding.norm().add(1e-10));

      // TYPE SAFETY FIX: dataSync() returns TypedArray, explicitly convert to Float32Array
      const syncedData = normalized.dataSync();
      return new Float32Array(syncedData);
    });
  }

  /**
   * Extract embeddings from raw Float32Array audio samples
   *
   * @param samples - Raw audio samples at 16kHz
   * @returns Float32Array with 1024 values
   */
  async extractEmbeddingsFromSamples(samples: Float32Array): Promise<Float32Array> {
    if (this.model) {
      return this.extractWithYAMNet(samples);
    } else {
      return this.extractSpectralEmbeddings(samples);
    }
  }

  /**
   * CRITICAL PERFORMANCE BOOST:
   * Uses OfflineAudioContext for native resampling (C++ speed)
   *
   * Problem: Microphone delivers 44.1kHz or 48kHz
   * ML models need: 16kHz
   * Solution: Native browser resampling instead of JS loops
   */
  private async resampleTo16kHz(buffer: AudioBuffer): Promise<Float32Array> {
    const targetSampleRate = 16000;

    // Shortcut if already at target rate
    if (buffer.sampleRate === targetSampleRate) {
      return buffer.getChannelData(0);
    }

    console.log(`🔄 Resampling: ${buffer.sampleRate}Hz → ${targetSampleRate}Hz`);

    // OfflineAudioContext = Native C++ Resampling = FAST
    const offlineCtx = new OfflineAudioContext(
      1, // Mono
      Math.ceil(buffer.duration * targetSampleRate),
      targetSampleRate
    );

    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const resampled = await offlineCtx.startRendering();
    return resampled.getChannelData(0);
  }

  /**
   * Get current backend information
   */
  getBackendInfo(): { backend: string; isGPU: boolean; hasYAMNet: boolean } {
    return {
      backend: this.backendUsed,
      isGPU: this.backendUsed === 'webgpu' || this.backendUsed === 'webgl',
      hasYAMNet: this.model !== null,
    };
  }

  /**
   * Check if model is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Check if YAMNet model is loaded (vs fallback)
   */
  hasYAMNetModel(): boolean {
    return this.model !== null;
  }

  /**
   * Memory cleanup (call on app shutdown)
   *
   * CRITICAL: Also resets initPromise to allow re-initialization
   */
  dispose(): void {
    if (this.model) {
      this.model.dispose();
      this.model = null;
    }
    tf.disposeVariables();
    this.isInitialized = false;
    YAMNetExtractor.instance = null;
    YAMNetExtractor.initPromise = null; // Reset promise to allow re-initialization
    console.log('🧹 YAMNet resources disposed');
  }

  /**
   * Get memory info for debugging
   */
  getMemoryInfo(): { numTensors: number; numBytes: number } {
    const memory = tf.memory();
    return {
      numTensors: memory.numTensors,
      numBytes: memory.numBytes,
    };
  }
}
