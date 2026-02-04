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
import { isIOS } from '@utils/platform.js';
import type { SmartStartState } from './audioHelper.js';

export interface AudioWorkletConfig {
  bufferSize: number;
  warmUpDuration?: number; // Optional warmup duration in ms (defaults to DEFAULT_SMART_START_CONFIG)
  onAudioData?: (writePos: number) => void;
  onAudioChunk?: (chunk: Float32Array) => void;
  onSmartStartStateChange?: (state: SmartStartState) => void;
  onSmartStartComplete?: (rms: number) => void;
  onSmartStartTimeout?: () => void;
  /** Called when iOS audio is blocked (mic permission issue or suspended context) */
  onAudioBlocked?: () => void;
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
  private isInitialized = false;
  private initResolve: (() => void) | null = null;
  private initReject: ((reason?: Error) => void) | null = null;
  private initPromise: Promise<void> | null = null;

  // Ring buffer for reading audio data (synced with worklet)
  private ringBuffer: Float32Array;
  private currentWritePos: number = 0;

  // iOS Audio Freeze Watchdog
  // Detects when AudioWorklet receives no data (iOS suspended context issue)
  private watchdogTimer: ReturnType<typeof setTimeout> | null = null;
  private lastWarmupUpdate: number = 0;
  private warmupStartTime: number = 0;
  private hasReceivedAudioData: boolean = false;

  constructor(config: AudioWorkletConfig) {
    this.config = config;
    this.ringBuffer = new Float32Array(config.bufferSize);
  }

  /**
   * Initialize AudioWorklet
   *
   * iOS CRITICAL: AudioContext may start in "suspended" state and requires explicit resume().
   * This is the root cause of the "5 seconds freeze" bug on iOS - without resume(),
   * the AudioWorklet never receives samples and the countdown cannot progress.
   */
  async init(audioContext: AudioContext, mediaStream: MediaStream): Promise<void> {
    this.audioContext = audioContext;

    try {
      this.isInitialized = false;
      this.initPromise = new Promise<void>((resolve, reject) => {
        this.initResolve = resolve;
        this.initReject = reject;
      });

      // ============================================
      // iOS CRITICAL FIX: Resume suspended AudioContext
      // ============================================
      // On iOS Safari/PWA, AudioContext starts in "suspended" state and MUST be
      // resumed via user gesture. Without this, the AudioWorklet receives no data
      // and the warmup countdown freezes at "5 seconds".
      //
      // Even though we're called from a click handler (user gesture), iOS may still
      // require an explicit resume() call. This is safe to call multiple times.
      if (audioContext.state === 'suspended') {
        logger.info('🔇 AudioContext is suspended, attempting resume...');
        try {
          await audioContext.resume();
          logger.info(`✅ AudioContext resumed: state=${audioContext.state}`);
        } catch (resumeError) {
          logger.warn('⚠️ AudioContext resume failed:', resumeError);
          // Continue anyway - some browsers may still work
        }
      }

      // iOS: Add state change listener for debugging and recovery
      if (isIOS()) {
        audioContext.onstatechange = () => {
          logger.info(`🎵 AudioContext state changed: ${audioContext.state}`);
          if (audioContext.state === 'suspended') {
            logger.warn('⚠️ AudioContext became suspended - iOS may have interrupted audio');
            // Attempt auto-resume (may fail without user gesture)
            audioContext.resume().catch(() => {
              logger.warn('⚠️ Auto-resume failed - user interaction required');
            });
          }
        };
      }

      // Load AudioWorklet processor using document location for correct path resolution
      // CRITICAL FIX: Use window.location.href as base (not origin) to handle subpath deployments correctly
      // This ensures the worklet is loaded from the same directory as the HTML document
      const workletUrl = new URL('audio-processor.worklet.js', window.location.href);

      logger.info(`Loading AudioWorklet from: ${workletUrl.href}`);
      await audioContext.audioWorklet.addModule(workletUrl.href);

      // Create AudioWorkletNode
      this.workletNode = new AudioWorkletNode(audioContext, 'zanobot-audio-processor');

      // Setup message handler
      this.workletNode.port.onmessage = (event) => {
        this.handleWorkletMessage(event.data);
      };

      // CRITICAL: Do NOT use GainNode in AudioWorklet signal chain!
      // Reason: Training (Phase 2) uses MediaRecorder which captures UNAMPLIFIED signal
      // If we amplify here, diagnosis features (Phase 3) won't match training features
      // Result: False positive/negative diagnoses due to incompatible feature magnitudes
      //
      // GainNode is ONLY used in AudioVisualizer for better visualization,
      // NOT in the feature extraction pipeline!

      // Connect audio source WITHOUT gain amplification
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

      await this.waitUntilReady();
      logger.info('✅ AudioWorklet initialized');
    } catch (error) {
      this.initReject?.(error as Error);
      this.initReject = null;
      this.initResolve = null;
      logger.error('❌ AudioWorklet initialization failed:', error);
      throw new Error('Failed to initialize AudioWorklet. Browser may not support it.');
    }
  }

  /**
   * Handle messages from AudioWorklet
   */
  private handleWorkletMessage(message:
    | { type: 'init-complete'; sampleRate: number; chunkSize: number; bufferSize: number }
    | { type: 'audio-data-ready'; writePos: number }
    | { type: 'audio-chunk'; chunk: Float32Array; chunkIndex: number; writePos: number }
    | { type: 'smart-start-state'; state: string; phase: 'idle' | 'warmup' | 'waiting' | 'recording'; remainingWarmUp: number }
    | { type: 'smart-start-complete'; rms: number }
    | { type: 'smart-start-timeout' }
    | { type: 'debug-rms'; rms: number; threshold: number }
    | { type: 'ios-audio-blocked'; samplesProcessed: number; nonZeroSamples: number; nonZeroRatio: number }
  ): void {
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
        this.isInitialized = true;
        if (this.initResolve) {
          this.initResolve();
          this.initResolve = null;
          this.initReject = null;
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
        // Track warmup progress for iOS watchdog
        if (message.phase === 'warmup') {
          this.hasReceivedAudioData = true;
          this.lastWarmupUpdate = Date.now();
        }

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

      case 'debug-rms':
        // DEBUG: Log RMS values to help diagnose signal issues
        logger.debug(
          `🎙️ Signal RMS: ${message.rms.toFixed(4)} (threshold: ${message.threshold.toFixed(4)})`
        );
        break;

      case 'ios-audio-blocked':
        // iOS WATCHDOG: Worklet detected all-silent audio during warmup
        // This typically means iOS is blocking the microphone at OS level
        logger.error(
          `❌ iOS Audio Blocked: Only ${(message.nonZeroRatio * 100).toFixed(1)}% of samples have signal ` +
          `(${message.nonZeroSamples}/${message.samplesProcessed})`
        );
        logger.error(
          '   This usually means iOS is blocking the microphone. Possible causes:\n' +
          '   - Another app is using the microphone\n' +
          '   - iOS "Voice Processing Mode" is muting the input\n' +
          '   - Microphone permission was granted but iOS is blocking at OS level'
        );

        // Clear watchdog since worklet already detected the issue
        if (this.watchdogTimer) {
          clearInterval(this.watchdogTimer);
          this.watchdogTimer = null;
        }

        // Notify the UI layer
        if (this.config.onAudioBlocked) {
          this.config.onAudioBlocked();
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
   *
   * iOS WATCHDOG: Starts a timer to detect if audio processing freezes.
   * If no warmup updates are received within 2 seconds, triggers onAudioBlocked
   * callback to allow the UI to show an appropriate error/retry option.
   *
   * IMPORTANT: The watchdog is ONLY active on iOS devices to avoid false positives
   * on Android in quiet environments where background noise is below the threshold.
   */
  startSmartStart(): void {
    if (!this.workletNode) {
      logger.error('AudioWorklet not initialized');
      return;
    }

    // Reset watchdog state
    this.hasReceivedAudioData = false;
    this.warmupStartTime = Date.now();
    this.lastWarmupUpdate = Date.now();

    // Clear any existing watchdog timer
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }

    // Send platform info to worklet so it knows whether to run iOS-specific checks
    // This prevents false positives on Android in quiet environments
    const runningOnIOS = isIOS();
    this.workletNode.port.postMessage({
      type: 'set-platform',
      isIOS: runningOnIOS,
    });

    // ============================================
    // iOS WATCHDOG: Detect frozen audio processing
    // ============================================
    // IMPORTANT: Only run on iOS devices!
    // On Android, this can cause false positives in quiet environments
    // because the watchdog checks for non-zero samples during warmup.
    //
    // On iOS, even after AudioContext.resume(), the audio pipeline may not
    // deliver samples if:
    // 1. Mic permission was granted but iOS is blocking at OS level
    // 2. Another app is using the microphone
    // 3. iOS "Voice Processing Mode" is muting the input
    //
    // The watchdog checks every 500ms if warmup updates are being received.
    // If no updates for 2 seconds during warmup phase, trigger onAudioBlocked.
    if (runningOnIOS) {
      const WATCHDOG_CHECK_INTERVAL_MS = 500;
      const WATCHDOG_TIMEOUT_MS = 2000;

      this.watchdogTimer = setInterval(() => {
        const now = Date.now();
        const timeSinceStart = now - this.warmupStartTime;
        const timeSinceLastUpdate = now - this.lastWarmupUpdate;

        // Only check during warmup phase (first ~5 seconds)
        // After warmup, the 'waiting' phase has its own 30-second timeout
        const warmUpDuration = this.config.warmUpDuration || 5000;
        if (timeSinceStart > warmUpDuration) {
          // Warmup phase passed, stop watchdog
          if (this.watchdogTimer) {
            clearInterval(this.watchdogTimer);
            this.watchdogTimer = null;
          }
          return;
        }

        // Check if we've received any audio data
        if (!this.hasReceivedAudioData && timeSinceStart > WATCHDOG_TIMEOUT_MS) {
          logger.error('❌ iOS Audio Watchdog: No audio data received for 2 seconds');
          logger.error(`   AudioContext state: ${this.audioContext?.state}`);

          // Clear watchdog
          if (this.watchdogTimer) {
            clearInterval(this.watchdogTimer);
            this.watchdogTimer = null;
          }

          // Attempt one more resume (iOS sometimes needs multiple attempts)
          if (this.audioContext && this.audioContext.state !== 'running') {
            logger.info('🔄 Attempting AudioContext resume (watchdog recovery)...');
            this.audioContext.resume()
              .then(() => {
                logger.info(`✅ AudioContext resumed: state=${this.audioContext?.state}`);
                // Give it another chance - restart the watchdog for 2 more seconds
                this.hasReceivedAudioData = false;
                this.lastWarmupUpdate = Date.now();
                this.warmupStartTime = Date.now();
                this.watchdogTimer = setInterval(() => {
                  if (!this.hasReceivedAudioData && Date.now() - this.warmupStartTime > WATCHDOG_TIMEOUT_MS) {
                    // Still no data after retry - give up and notify
                    if (this.watchdogTimer) {
                      clearInterval(this.watchdogTimer);
                      this.watchdogTimer = null;
                    }
                    if (this.config.onAudioBlocked) {
                      this.config.onAudioBlocked();
                    }
                  }
                }, WATCHDOG_CHECK_INTERVAL_MS);
              })
              .catch(() => {
                // Resume failed, notify immediately
                if (this.config.onAudioBlocked) {
                  this.config.onAudioBlocked();
                }
              });
          } else {
            // AudioContext is running but still no data - mic is blocked at OS level
            if (this.config.onAudioBlocked) {
              this.config.onAudioBlocked();
            }
          }
          return;
        }

        // Check for stalled warmup updates (receiving some data but then it stopped)
        if (this.hasReceivedAudioData && timeSinceLastUpdate > WATCHDOG_TIMEOUT_MS) {
          logger.warn('⚠️ iOS Audio Watchdog: Warmup updates stalled');
          // This might be normal if warmup completed and transitioned to waiting phase
          // Don't trigger onAudioBlocked, just log for debugging
        }
      }, WATCHDOG_CHECK_INTERVAL_MS);
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

    if (chunkSize > this.ringBuffer.length) {
      throw new Error(
        `Chunk size (${chunkSize}) exceeds ring buffer length (${this.ringBuffer.length}).`
      );
    }

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
    // Clear iOS watchdog timer
    if (this.watchdogTimer) {
      clearInterval(this.watchdogTimer);
      this.watchdogTimer = null;
    }

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

    // Clear iOS state change listener
    if (this.audioContext) {
      this.audioContext.onstatechange = null;
    }

    this.audioContext = null;
    this.ringBuffer.fill(0);
    this.currentWritePos = 0;
    this.isInitialized = false;
    this.initResolve = null;
    this.initReject = null;
    this.initPromise = null;

    // Reset watchdog state
    this.hasReceivedAudioData = false;
    this.warmupStartTime = 0;
    this.lastWarmupUpdate = 0;
  }

  /**
   * Check if the AudioWorklet has completed initialization.
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Wait until the AudioWorklet signals initialization complete.
   */
  private async waitUntilReady(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (!this.initPromise) {
      throw new Error('AudioWorklet initialization was not started.');
    }

    const timeoutMs = 2000;
    await Promise.race([
      this.initPromise,
      new Promise<void>((_, reject) => {
        setTimeout(() => {
          reject(new Error('AudioWorklet init-complete timeout.'));
        }, timeoutMs);
      }),
    ]);
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
