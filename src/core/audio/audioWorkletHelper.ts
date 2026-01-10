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

export interface AudioWorkletConfig {
  bufferSize: number;
  onAudioData?: (writePos: number) => void;
  onAudioChunk?: (chunk: Float32Array) => void;
  onSmartStartStateChange?: (state: SmartStartState) => void;
  onSmartStartComplete?: (rms: number) => void;
  onSmartStartTimeout?: () => void;
}

export interface SmartStartState {
  phase: 'idle' | 'warmup' | 'waiting' | 'recording';
  remainingWarmUp?: number;
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
      // Load AudioWorklet processor
      await audioContext.audioWorklet.addModule('/audio-processor.worklet.js');

      // Create AudioWorkletNode
      this.workletNode = new AudioWorkletNode(audioContext, 'zanobot-audio-processor');

      // Setup message handler
      this.workletNode.port.onmessage = (event) => {
        this.handleWorkletMessage(event.data);
      };

      // Connect audio source
      this.sourceNode = audioContext.createMediaStreamSource(mediaStream);
      this.sourceNode.connect(this.workletNode);

      // Connect to destination for monitoring (optional)
      this.workletNode.connect(audioContext.destination);

      console.log('✅ AudioWorklet initialized');
    } catch (error) {
      console.error('❌ AudioWorklet initialization failed:', error);
      throw new Error('Failed to initialize AudioWorklet. Browser may not support it.');
    }
  }

  /**
   * Handle messages from AudioWorklet
   */
  private handleWorkletMessage(message: any): void {
    switch (message.type) {
      case 'audio-data-ready':
        this.currentWritePos = message.writePos;
        if (this.config.onAudioData) {
          this.config.onAudioData(message.writePos);
        }
        break;

      case 'audio-chunk':
        // Receive audio chunk from worklet (zero-copy transfer)
        if (message.chunk && this.config.onAudioChunk) {
          const chunk = new Float32Array(message.chunk);
          this.config.onAudioChunk(chunk);
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
   * Start Smart Start sequence
   */
  startSmartStart(): void {
    if (!this.workletNode) {
      console.error('AudioWorklet not initialized');
      return;
    }

    this.workletNode.port.postMessage({ type: 'start-smart-start' });
  }

  /**
   * Skip Smart Start and go directly to recording
   */
  skipToRecording(): void {
    if (!this.workletNode) {
      console.error('AudioWorklet not initialized');
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
    return typeof AudioWorklet !== 'undefined' && typeof AudioWorkletNode !== 'undefined';
  }
}

/**
 * Check if browser supports AudioWorklet
 */
export function isAudioWorkletSupported(): boolean {
  return AudioWorkletManager.isSupported();
}
