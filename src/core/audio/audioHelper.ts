/**
 * ZANOBOT - AUDIO HELPER
 *
 * Centralized audio configuration and utilities for Phase 5.
 *
 * Features:
 * - Global audio constraints (disable AGC, echo cancellation, noise suppression)
 * - Smart Start logic (warm-up + signal trigger)
 * - Ensures identical audio parameters across Phase 2 and Phase 3
 */

import { logger } from '@utils/logger.js';

/**
 * Standard audio constraints for raw, unprocessed audio
 *
 * These settings disable all OS-level audio processing to ensure
 * that we capture the pure acoustic signal from the machine.
 */
export const AUDIO_CONSTRAINTS = {
  audio: {
    echoCancellation: { exact: false },
    autoGainControl: { exact: false },
    noiseSuppression: { exact: false },
    channelCount: 1, // Mono is more robust
    sampleRate: 48000, // High quality audio (matches config.json)
  },
};

/**
 * Build audio constraints with optional device ID
 *
 * @param deviceId - Optional specific device ID to use
 * @returns Audio constraints object
 */
export function buildAudioConstraints(deviceId?: string): MediaStreamConstraints {
  // CRITICAL FIX: Deep copy to prevent mutation of global AUDIO_CONSTRAINTS
  // Shallow copy ({ ...AUDIO_CONSTRAINTS }) would leave the nested 'audio' object as a reference
  const baseConstraints: MediaStreamConstraints = {
    audio: {
      ...AUDIO_CONSTRAINTS.audio, // Deep copy of nested audio object
    },
  };

  if (deviceId) {
    (baseConstraints.audio as any).deviceId = { exact: deviceId };
  }

  return baseConstraints;
}

/**
 * Fallback constraints if exact: false throws errors
 * Some browsers don't support the exact syntax
 */
export const AUDIO_CONSTRAINTS_FALLBACK = {
  audio: {
    echoCancellation: false,
    autoGainControl: false,
    noiseSuppression: false,
    channelCount: 1,
    sampleRate: 48000, // High quality audio (matches config.json)
  },
};

/**
 * Smart Start configuration
 */
export interface SmartStartConfig {
  /** Warm-up duration in milliseconds (discard initial audio) */
  warmUpDuration: number;
  /** Signal trigger threshold (RMS level, 0-1) */
  signalThreshold: number;
  /** Maximum wait time for signal in milliseconds */
  maxWaitTime: number;
}

/**
 * Default Smart Start configuration
 */
export const DEFAULT_SMART_START_CONFIG: SmartStartConfig = {
  // ⚠️ DO NOT CHANGE: Physical settling time for OS audio filters (AGC, noise cancellation)
  // 5 seconds warmup is REQUIRED to discard initial unstable samples.
  // This is not a timing bug - it's a deliberate delay for signal stabilization.
  warmUpDuration: 5000, // 5 seconds (extended settling time for OS audio filters)
  signalThreshold: 0.02, // RMS threshold
  maxWaitTime: 30000, // 30 seconds max wait
};

/**
 * Smart Start state
 *
 * CRITICAL: This interface is shared between audioHelper and audioWorkletHelper.
 * All properties except 'phase' are optional to support both implementations.
 */
export interface SmartStartState {
  phase: 'idle' | 'warmup' | 'waiting' | 'recording';
  remainingWarmUp?: number;
  signalDetected?: boolean;
}

/**
 * Get optimized audio stream with raw, unprocessed audio
 *
 * Attempts to use exact constraints first, falls back to simple booleans
 * if the browser doesn't support exact syntax.
 *
 * @param deviceId - Optional specific device ID to use
 * @returns MediaStream with raw audio
 */
export async function getRawAudioStream(deviceId?: string): Promise<MediaStream> {
  try {
    // Build constraints with optional device ID
    const constraints = buildAudioConstraints(deviceId);

    // Try exact constraints first
    return await navigator.mediaDevices.getUserMedia(constraints);
  } catch (error) {
    logger.warn('⚠️ Exact constraints failed, using fallback:', error);

    try {
      // CRITICAL FIX: Deep copy to prevent mutation of global AUDIO_CONSTRAINTS_FALLBACK
      // Shallow copy ({ ...AUDIO_CONSTRAINTS_FALLBACK }) would leave the nested 'audio' object as a reference
      const fallbackConstraints: MediaStreamConstraints = {
        audio: {
          ...AUDIO_CONSTRAINTS_FALLBACK.audio, // Deep copy of nested audio object
        },
      };
      // CRITICAL FIX: In fallback, don't use 'exact' for deviceId
      // If first attempt failed with exact, fallback should use simple deviceId (browser picks best match)
      if (deviceId) {
        (fallbackConstraints.audio as any).deviceId = deviceId;
      }
      return await navigator.mediaDevices.getUserMedia(fallbackConstraints);
    } catch (fallbackError) {
      logger.error('❌ Failed to get audio stream:', fallbackError);
      throw new Error(
        'Failed to access microphone. Please grant permission and ensure no other app is using it.'
      );
    }
  }
}

/**
 * Get actual hardware sample rate from MediaStream
 *
 * @param stream - MediaStream from getUserMedia
 * @returns Actual sample rate (fallback 48000)
 */
export function getRealSampleRate(stream: MediaStream): number {
  const audioTracks = stream.getAudioTracks();
  const sampleRate = audioTracks[0]?.getSettings().sampleRate;

  if (sampleRate) {
    logger.debug(`🎚️ Detected hardware sample rate: ${sampleRate}Hz`);
    return sampleRate;
  }

  logger.debug('⚠️ Hardware sample rate unavailable, falling back to 48000Hz');
  return 48000;
}

/**
 * Calculate RMS (Root Mean Square) level of audio samples
 *
 * This represents the "loudness" or "power" of the audio signal.
 * Used for signal trigger detection.
 *
 * @param samples - Audio samples
 * @returns RMS level (0-1), or 0 if samples array is empty
 */
export function calculateRMS(samples: Float32Array): number {
  // Guard against empty samples to prevent NaN
  if (samples.length === 0) {
    return 0;
  }

  let sum = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i];
  }
  return Math.sqrt(sum / samples.length);
}

/**
 * Smart Start Manager
 *
 * Handles warm-up period and signal trigger logic.
 * Ensures identical recording conditions for Phase 2 and Phase 3.
 */
export class SmartStartManager {
  private config: SmartStartConfig;
  private state: SmartStartState;
  private warmUpStartTime: number = 0;
  private waitStartTime: number = 0;
  private onStateChange?: (state: SmartStartState) => void;
  private onRecordingStart?: () => void;
  private onTimeout?: () => void;

  constructor(
    config: SmartStartConfig = DEFAULT_SMART_START_CONFIG,
    callbacks?: {
      onStateChange?: (state: SmartStartState) => void;
      onRecordingStart?: () => void;
      onTimeout?: () => void;
    }
  ) {
    this.config = config;
    this.state = {
      phase: 'idle',
    };

    if (callbacks) {
      this.onStateChange = callbacks.onStateChange;
      this.onRecordingStart = callbacks.onRecordingStart;
      this.onTimeout = callbacks.onTimeout;
    }
  }

  /**
   * Start the Smart Start sequence
   */
  public start(): void {
    logger.info('🚀 Smart Start: Beginning warm-up period...');
    this.warmUpStartTime = Date.now();
    this.state = {
      phase: 'warmup',
      remainingWarmUp: this.config.warmUpDuration,
      signalDetected: false,
    };
    this.notifyStateChange();
  }

  /**
   * Process incoming audio samples
   *
   * Call this continuously with new audio data.
   *
   * @param samples - Audio samples from microphone
   * @returns true if recording should proceed, false if still waiting
   */
  public processAudio(samples: Float32Array): boolean {
    const now = Date.now();

    if (this.state.phase === 'idle') {
      return false;
    }

    // Phase 1: Warm-up period (discard audio)
    if (this.state.phase === 'warmup') {
      const elapsed = now - this.warmUpStartTime;
      this.state.remainingWarmUp = Math.max(0, this.config.warmUpDuration - elapsed);

      if (elapsed >= this.config.warmUpDuration) {
        logger.info('✅ Warm-up complete. Waiting for signal...');
        this.state.phase = 'waiting';
        this.waitStartTime = now;
        this.notifyStateChange();
        return false; // Phase changed, wait for next processAudio() call
      } else {
        this.notifyStateChange();
        return false; // Still warming up
      }
    }

    // Phase 2: Wait for signal trigger
    if (this.state.phase === 'waiting') {
      const waitElapsed = now - this.waitStartTime;

      // Check for timeout
      if (waitElapsed >= this.config.maxWaitTime) {
        logger.warn('⏱️ Signal timeout - no signal detected');
        this.state = { phase: 'idle' };
        this.notifyStateChange();
        if (this.onTimeout) {
          this.onTimeout();
        }
        return false;
      }

      // Check signal level
      const rms = calculateRMS(samples);

      if (rms >= this.config.signalThreshold) {
        logger.info(
          `🎯 Signal detected! RMS: ${rms.toFixed(4)} (threshold: ${this.config.signalThreshold})`
        );
        this.state.phase = 'recording';
        this.state.signalDetected = true;
        this.notifyStateChange();

        if (this.onRecordingStart) {
          this.onRecordingStart();
        }

        return true; // Start recording!
      }

      this.notifyStateChange();
      return false; // Still waiting for signal
    }

    // Phase 3: Recording in progress
    return this.state.phase === 'recording';
  }

  /**
   * Get current state
   */
  public getState(): SmartStartState {
    return { ...this.state };
  }

  /**
   * Reset to initial state
   */
  public reset(): void {
    this.state = {
      phase: 'idle',
    };
    this.warmUpStartTime = 0;
    this.waitStartTime = 0;
  }

  /**
   * Notify state change to callback
   */
  private notifyStateChange(): void {
    if (this.onStateChange) {
      this.onStateChange(this.getState());
    }
  }

  /**
   * Skip warm-up and signal trigger (for manual start)
   */
  public skipToRecording(): void {
    logger.info('⏭️ Skipping to recording phase');
    this.state = {
      phase: 'recording',
      remainingWarmUp: 0,
      signalDetected: true,
    };
    this.notifyStateChange();

    if (this.onRecordingStart) {
      this.onRecordingStart();
    }
  }
}

/**
 * Get user-friendly status message for UI
 */
export function getSmartStartStatusMessage(state: SmartStartState): string {
  switch (state.phase) {
    case 'idle':
      return 'Bereit';
    case 'warmup': {
      // CRITICAL FIX: Handle optional remainingWarmUp field
      const seconds = state.remainingWarmUp ? Math.ceil(state.remainingWarmUp / 1000) : 0;
      return `Akustische Stabilisierung... ${seconds}s`;
    }
    case 'waiting':
      return 'Warte auf Signal...';
    case 'recording':
      return 'Aufnahme läuft';
    default:
      return 'Bereit';
  }
}
