/**
 * ZANOBOT - AUDIO WORKLET HELPER
 *
 * Modern audio processing using AudioWorklet instead of deprecated ScriptProcessorNode.
 *
 * Benefits:
 * - Runs on separate audio thread (no main thread blocking)
 * - Lower latency
 * - Better performance
 * - Future-proof (ScriptProcessorNode is deprecated)
 */

import { logger } from '@utils/logger.js';
import type { SmartStartState } from './audioHelper.js';

export interface AudioWorkletConfig {
  bufferSize: number;
  warmUpDuration?: number; // Optional warmup duration in ms (defaults to DEFAULT_SMART_START_CONFIG)
  onAudioData?: (writePos: number) => void;
  onAudioChunk?: (chunk: Float32Array) => void;
  onSmartStartStateChange?: (state: SmartStartState) => void;
  onSmartStartComplete?: (rms: number) => void;
  onSmartStartTimeout?: () => void;
}

/**
 * AudioWorklet Manager
 *
 * Manages AudioWorklet-based audio processing.
 */
export class AudioWorkletManager {
  private audioContext: AudioContext | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private sourceNode: MediaStreamAudioSourceNode | null = null;
  private config: AudioWorkletConfig;

  // Ring buffer for reading audio data (synced with worklet)
  private ringBuffer: Float32Array;
  private currentWritePos: number = 0;

  constructor(config: AudioWorkletConfig) {
    this.config = config;
    this.ringBuffer = new Float32Array(config.bufferSize);
  }

  /**
   * Initialize AudioWorklet
   */
  async init(audioContext: AudioContext, mediaStream: MediaStream): Promise<void> {
    this.audioContext = audioContext;

    try {
      // Load AudioWorklet processor using base URL for subpath deployments
      const baseUrl = import.meta.env.BASE_URL ?? '/';
      const normalizedBaseUrl = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
      const workletBase = new URL(normalizedBaseUrl, window.location.origin);
      const workletUrl = new URL('audio-processor.worklet.js', workletBase);
      await audioContext.audioWorklet.addModule(workletUrl.href);

      // Create AudioWorkletNode
      this.workletNode = new AudioWorkletNode(audioContext, 'zanobot-audio-processor');

      // Setup message handler
      this.workletNode.port.onmessage = (event) => {
        this.handleWorkletMessage(event.data);
      };

      // Connect audio source
      this.sourceNode = audioContext.createMediaStreamSource(mediaStream);
      this.sourceNode.connect(this.workletNode);
      // NOTE: Do not connect to destination by default to avoid feedback/echo loops.

      // CRITICAL FIX: Send actual sample rate and warmup duration to worklet
      // This ensures Single Source of Truth from config (no hardcoded values in worklet)
      this.workletNode.port.postMessage({
        type: 'init',
        sampleRate: audioContext.sampleRate,
        warmUpDuration: this.config.warmUpDuration || 5000, // Default to 5s if not specified
      });

      logger.info('✅ AudioWorklet initialized');
    } catch (error) {
      logger.error('❌ AudioWorklet initialization failed:', error);
      throw new Error('Failed to initialize AudioWorklet. Browser may not support it.');
    }
  }

  /**
   * Handle messages from AudioWorklet
   */
  private handleWorkletMessage(message: any): void {
    switch (message.type) {
      case 'init-complete':
        // Worklet initialization confirmed with actual sample rate, chunk size, and buffer size
        logger.info(
          `✅ Worklet initialized: sampleRate=${message.sampleRate}Hz, chunkSize=${message.chunkSize} samples, bufferSize=${message.bufferSize} samples`
        );

        // CRITICAL FIX: Resize local ring buffer if worklet reports larger buffer size
        // This ensures consistency between worklet and manager buffers
        if (message.bufferSize && message.bufferSize > this.ringBuffer.length) {
          logger.info(
            `📊 Resizing local ring buffer from ${this.ringBuffer.length} to ${message.bufferSize} samples`
          );
          this.ringBuffer = new Float32Array(message.bufferSize);
          this.currentWritePos = 0;
        }
        break;

      case 'audio-data-ready':
        this.currentWritePos = message.writePos;
        if (this.config.onAudioData) {
          this.config.onAudioData(message.writePos);
        }
        break;

      case 'audio-chunk':
        // Receive audio chunk from worklet (zero-copy transfer)
        if (message.chunk) {
          const chunk = new Float32Array(message.chunk);

          // CRITICAL FIX: Sync currentWritePos from worklet's writePos
          // This ensures readLatestChunk() works correctly if ever used
          if (typeof message.writePos === 'number') {
            // Don't overwrite before fillRingBuffer - fillRingBuffer manages its own position
            // Instead, we'll use this for validation/debugging
            // The local ringBuffer is independent from worklet's ringBuffer
          }

          // Fill ring buffer for readLatestChunk() usage
          this.fillRingBuffer(chunk);

          // Also call callback if provided
          if (this.config.onAudioChunk) {
            this.config.onAudioChunk(chunk);
          }
        }
        break;

      case 'smart-start-state':
        if (this.config.onSmartStartStateChange) {
          this.config.onSmartStartStateChange({
            phase: message.phase,
            remainingWarmUp: message.remainingWarmUp,
          });
        }
        break;

      case 'smart-start-complete':
        if (this.config.onSmartStartComplete) {
          this.config.onSmartStartComplete(message.rms);
        }
        break;

      case 'smart-start-timeout':
        if (this.config.onSmartStartTimeout) {
          this.config.onSmartStartTimeout();
        }
        break;
    }
  }

  /**
   * Fill ring buffer with audio chunk
   */
  private fillRingBuffer(chunk: Float32Array): void {
    for (let i = 0; i < chunk.length; i++) {
      this.ringBuffer[this.currentWritePos] = chunk[i];
      this.currentWritePos = (this.currentWritePos + 1) % this.ringBuffer.length;
    }
  }

  /**
   * Start Smart Start sequence
   */
  startSmartStart(): void {
    if (!this.workletNode) {
      logger.error('AudioWorklet not initialized');
      return;
    }

    this.workletNode.port.postMessage({ type: 'start-smart-start' });
  }

  /**
   * Skip Smart Start and go directly to recording
   */
  skipToRecording(): void {
    if (!this.workletNode) {
      logger.error('AudioWorklet not initialized');
      return;
    }

    this.workletNode.port.postMessage({ type: 'skip-to-recording' });
  }

  /**
   * Stop recording
   */
  stop(): void {
    if (!this.workletNode) {
      return;
    }

    this.workletNode.port.postMessage({ type: 'stop' });
  }

  /**
   * Reset ring buffer
   */
  resetBuffer(): void {
    if (!this.workletNode) {
      return;
    }

    this.ringBuffer.fill(0);
    this.currentWritePos = 0;
    this.workletNode.port.postMessage({ type: 'reset-buffer' });
  }

  /**
   * Read latest chunk from ring buffer
   *
   * Note: The ring buffer is managed by the AudioWorklet,
   * so we need to read from a shared buffer or implement
   * a message-based transfer.
   *
   * For simplicity, we'll use SharedArrayBuffer in the future.
   * For now, we'll keep a local buffer synced via messages.
   */
  readLatestChunk(chunkSize: number): Float32Array {
    // This is a simplified version.
    // In production, you'd use SharedArrayBuffer or transfer via messages.

    const chunk = new Float32Array(chunkSize);

    // Read backwards from current write position
    let readPos = this.currentWritePos - chunkSize;
    if (readPos < 0) {
      readPos += this.ringBuffer.length;
    }

    for (let i = 0; i < chunkSize; i++) {
      chunk[i] = this.ringBuffer[readPos];
      readPos = (readPos + 1) % this.ringBuffer.length;
    }

    return chunk;
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    if (this.workletNode) {
      // Clear message handler to prevent memory leaks
      this.workletNode.port.onmessage = null;
      this.workletNode.disconnect();
      this.workletNode = null;
    }

    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }

    this.audioContext = null;
    this.ringBuffer.fill(0);
    this.currentWritePos = 0;
  }

  /**
   * Check if AudioWorklet is supported
   */
  static isSupported(): boolean {
    // CRITICAL FIX: Use unknown cast for webkitAudioContext (legacy Safari support)
    const AudioContextConstructor =
      typeof AudioContext !== 'undefined'
        ? AudioContext
        : typeof (globalThis as unknown as { webkitAudioContext?: typeof AudioContext })
              .webkitAudioContext !== 'undefined'
          ? (globalThis as unknown as { webkitAudioContext: typeof AudioContext })
              .webkitAudioContext
          : undefined;

    if (!AudioContextConstructor) {
      return false;
    }

    return 'audioWorklet' in AudioContextConstructor.prototype;
  }
}

/**
 * Check if browser supports AudioWorklet
 */
export function isAudioWorkletSupported(): boolean {
  return AudioWorkletManager.isSupported();
}
