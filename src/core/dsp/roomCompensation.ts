/**
 * ZANOBOT - Room Compensation (Pipeline-Stufe 3.5)
 *
 * Optionale Vorverarbeitung zur Kompensation konvolutiver
 * Raumakustik-Störungen (Nachhall / Reverberation).
 *
 * Zwei Stufen:
 * 1. CMN (Cepstral Mean Normalization) - entfernt systematischen spektralen Bias
 * 2. T60-basierte Late Reverberation Subtraction - entfernt geschätzte Nachhallenergie
 *    (Phase 2 – derzeit nicht implementiert)
 *
 * WICHTIG: Diese Funktionen werden NUR aufgerufen wenn die Einstellung aktiv ist.
 * Sie operieren auf den BEREITS EXTRAHIERTEN FeatureVector-Arrays und geben
 * modifizierte FeatureVector-Arrays zurück.
 */

import type { FeatureVector } from '@data/types.js';
import { logger } from '@utils/logger.js';

// ============================================================================
// INTERFACES
// ============================================================================

export interface T60Estimate {
  broadband: number;                // T60 in Sekunden (z.B. 0.8)
  subbands: Map<number, number>;    // centerFreq → T60
  timestamp: number;                // Wann gemessen
}

export interface RoomCompSettings {
  enabled: boolean;            // Master-Toggle (Standard: false)
  cmnEnabled: boolean;         // CMN aktiv (Standard: true wenn enabled)
  t60Enabled: boolean;         // T60-Entzerrung aktiv (Standard: false, braucht Kalibrierung)
  beta: number;                // Over-Subtraction Factor (0.5–2.0, Standard: 1.0)
  spectralFloor: number;       // Spectral Floor ε (0.01–0.1, Standard: 0.05)
  calibrationMode: 'none' | 'chirp' | 'blind'; // Standard: 'none'
}

export const DEFAULT_ROOM_COMP_SETTINGS: RoomCompSettings = {
  enabled: false,
  cmnEnabled: true,
  t60Enabled: false,
  beta: 1.0,
  spectralFloor: 0.05,
  calibrationMode: 'none',
};

// ============================================================================
// CONSTANTS
// ============================================================================

/** Spectral floor to prevent log(0) */
const EPSILON = 1e-10;

// ============================================================================
// PHASE 1: CEPSTRAL MEAN NORMALIZATION (CMN)
// ============================================================================

/**
 * Apply Cepstral Mean Normalization to feature vectors.
 *
 * CMN removes the average spectral shape (room transfer function) by:
 * 1. Converting absoluteFeatures to log domain
 * 2. Computing the mean log-spectrum across all frames
 * 3. Subtracting the mean from each frame
 * 4. Converting back to linear domain
 *
 * This compensates for the systematic spectral "coloring" introduced by
 * room acoustics (convolutive distortion: Y = S * h(t)).
 *
 * IMPORTANT: Original FeatureVectors are NOT mutated (immutable operation).
 *
 * @param features - Array of FeatureVectors from extractFeatures()
 * @returns New array of CMN-normalized FeatureVectors
 */
export function applyCMN(features: FeatureVector[]): FeatureVector[] {
  if (features.length === 0) {
    return [];
  }

  const numBins = features[0].absoluteFeatures.length;
  const numFrames = features.length;

  // Step 1: Compute mean log-spectrum across all frames
  const meanLogSpectrum = new Float64Array(numBins);

  for (let n = 0; n < numFrames; n++) {
    const abs = features[n].absoluteFeatures;
    for (let k = 0; k < numBins; k++) {
      meanLogSpectrum[k] += Math.log(abs[k] + EPSILON);
    }
  }

  for (let k = 0; k < numBins; k++) {
    meanLogSpectrum[k] /= numFrames;
  }

  // Step 2: Subtract mean and convert back to linear domain for each frame
  const result: FeatureVector[] = new Array(numFrames);

  for (let n = 0; n < numFrames; n++) {
    const abs = features[n].absoluteFeatures;
    const newAbsolute = new Float64Array(numBins);

    for (let k = 0; k < numBins; k++) {
      const logVal = Math.log(abs[k] + EPSILON) - meanLogSpectrum[k];
      newAbsolute[k] = Math.exp(logVal);
    }

    // Re-normalize: features (sum = 1)
    const newFeatures = normalizeToSum1(newAbsolute);

    result[n] = {
      features: newFeatures,
      normalizedFeatures: newFeatures,
      absoluteFeatures: newAbsolute,
      bins: features[n].bins,
      frequencyRange: features[n].frequencyRange,
      rmsAmplitude: features[n].rmsAmplitude,
    };
  }

  logger.info(`🔧 CMN applied to ${numFrames} frames (${numBins} bins)`);
  return result;
}

// ============================================================================
// PHASE 2 STUBS (T60 – nicht implementiert, vorbereitet)
// ============================================================================

/**
 * Generate a logarithmic sine sweep (chirp) signal.
 * Phase 2 – not yet implemented.
 *
 * @param _sampleRate - Sample rate in Hz
 * @param _duration - Duration in seconds (default: 0.06)
 * @returns Chirp signal as Float32Array
 */
export function generateChirp(_sampleRate: number, _duration: number = 0.06): Float32Array {
  // Phase 2: Logarithmic sweep 200 Hz → 8000 Hz
  throw new Error('generateChirp() is not yet implemented (Phase 2)');
}

/**
 * Estimate T60 reverberation time from a played chirp signal.
 * Phase 2 – not yet implemented.
 *
 * @param _playedChirp - The known chirp signal
 * @param _recordedAudio - The recorded audio containing chirp + room response
 * @param _sampleRate - Sample rate in Hz
 * @returns T60 estimate or null if measurement failed
 */
export function estimateT60FromChirp(
  _playedChirp: Float32Array,
  _recordedAudio: AudioBuffer,
  _sampleRate: number
): T60Estimate | null {
  // Phase 2: Cross-correlation → RIR → Schroeder integration → T60
  throw new Error('estimateT60FromChirp() is not yet implemented (Phase 2)');
}

/**
 * Apply late reverberation subtraction to feature vectors.
 * Phase 2 – not yet implemented.
 *
 * @param _features - Input feature vectors
 * @param _t60 - T60 estimate from chirp measurement
 * @param _settings - Room compensation settings
 * @returns New array of processed FeatureVectors
 */
export function applyLateReverbSubtraction(
  _features: FeatureVector[],
  _t60: T60Estimate,
  _settings: RoomCompSettings
): FeatureVector[] {
  // Phase 2: Spectral subtraction of late reverberation energy
  throw new Error('applyLateReverbSubtraction() is not yet implemented (Phase 2)');
}

// ============================================================================
// REAL-TIME CMN (for Diagnose phase – single-frame streaming)
// ============================================================================

/**
 * Maintains a running mean of the log-spectrum for real-time CMN.
 *
 * In the Diagnose phase, feature vectors arrive one at a time (330ms chunks).
 * Batch CMN cannot be applied to a single frame (subtracting the frame's own
 * mean would flatten everything to 1.0). Instead, this class accumulates
 * a running mean across frames and applies it to each new frame.
 *
 * After ~5 frames (≈1.5s with 330ms windows and 66ms hop), the mean stabilizes
 * and CMN becomes effective at removing the room transfer function.
 *
 * Usage:
 *   const rtCmn = new RealtimeCMN(512);
 *   // For each incoming chunk:
 *   const compensated = rtCmn.process(featureVector);
 */
export class RealtimeCMN {
  private numBins: number;
  private meanLogSpectrum: Float64Array;
  private frameCount: number = 0;

  /** Minimum frames required before CMN is applied (avoids unstable early mean) */
  private static readonly MIN_FRAMES = 3;

  constructor(numBins: number) {
    this.numBins = numBins;
    this.meanLogSpectrum = new Float64Array(numBins);
  }

  /**
   * Process a single feature vector with running CMN.
   *
   * Updates the running mean and returns a CMN-normalized copy of the input.
   * For the first few frames (< MIN_FRAMES), returns the input unchanged
   * because the mean is not yet stable.
   *
   * @param fv - Single FeatureVector from extractFeaturesFromChunk()
   * @returns New FeatureVector with CMN applied (or unchanged if too few frames)
   */
  process(fv: FeatureVector): FeatureVector {
    const abs = fv.absoluteFeatures;

    // Update running mean (incremental: newMean = oldMean + (newVal - oldMean) / n)
    this.frameCount++;
    for (let k = 0; k < this.numBins; k++) {
      const logVal = Math.log(abs[k] + EPSILON);
      this.meanLogSpectrum[k] += (logVal - this.meanLogSpectrum[k]) / this.frameCount;
    }

    // Don't apply CMN until mean is stable
    if (this.frameCount < RealtimeCMN.MIN_FRAMES) {
      return fv;
    }

    // Apply CMN: subtract running mean in log domain, convert back
    const newAbsolute = new Float64Array(this.numBins);
    for (let k = 0; k < this.numBins; k++) {
      const logVal = Math.log(abs[k] + EPSILON) - this.meanLogSpectrum[k];
      newAbsolute[k] = Math.exp(logVal);
    }

    const newFeatures = normalizeToSum1(newAbsolute);

    return {
      features: newFeatures,
      normalizedFeatures: newFeatures,
      absoluteFeatures: newAbsolute,
      bins: fv.bins,
      frequencyRange: fv.frequencyRange,
      rmsAmplitude: fv.rmsAmplitude,
    };
  }

  /**
   * Reset the running mean (e.g., when starting a new diagnosis session).
   */
  reset(): void {
    this.meanLogSpectrum.fill(0);
    this.frameCount = 0;
  }
}

// ============================================================================
// MAIN WRAPPER
// ============================================================================

/**
 * Apply room compensation to feature vectors based on settings.
 *
 * This is the main entry point called from Reference and Diagnose phases.
 * Depending on settings, it applies:
 * - CMN only (Phase 1)
 * - Late reverberation subtraction + CMN (Phase 2, when T60 available)
 * - Nothing (if disabled)
 *
 * @param features - Array of FeatureVectors from extractFeatures()
 * @param settings - Room compensation settings from localStorage
 * @param t60 - Optional T60 estimate (Phase 2)
 * @returns Processed FeatureVectors (new array, originals untouched)
 */
export function applyRoomCompensation(
  features: FeatureVector[],
  settings: RoomCompSettings,
  t60?: T60Estimate
): FeatureVector[] {
  if (!settings.enabled) {
    return features;
  }

  let processed = features;

  // Phase 2: Apply late reverberation subtraction if T60 is available
  if (settings.t60Enabled && t60) {
    processed = applyLateReverbSubtraction(processed, t60, settings);
  }

  // Phase 1: Apply CMN
  if (settings.cmnEnabled) {
    processed = applyCMN(processed);
  }

  return processed;
}

// ============================================================================
// SETTINGS PERSISTENCE
// ============================================================================

const STORAGE_KEY = 'zanobot-room-comp-settings';

/**
 * Read room compensation settings from localStorage.
 * Returns defaults if nothing is stored or parsing fails.
 */
export function getRoomCompSettings(): RoomCompSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_ROOM_COMP_SETTINGS, ...JSON.parse(stored) };
    }
  } catch {
    /* ignore parse errors */
  }
  return { ...DEFAULT_ROOM_COMP_SETTINGS };
}

/**
 * Write (merge) room compensation settings to localStorage.
 */
export function setRoomCompSettings(settings: Partial<RoomCompSettings>): void {
  const current = getRoomCompSettings();
  const merged = { ...current, ...settings };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
}

// ============================================================================
// HELPERS
// ============================================================================

/**
 * Normalize a Float64Array so that all values sum to 1.
 * Used to recreate relative features after CMN or spectral subtraction.
 */
function normalizeToSum1(values: Float64Array): Float64Array {
  const n = values.length;
  let total = 0;
  for (let i = 0; i < n; i++) {
    total += values[i];
  }

  const normalized = new Float64Array(n);
  if (total > 0) {
    for (let i = 0; i < n; i++) {
      normalized[i] = values[i] / total;
    }
  }
  return normalized;
}
