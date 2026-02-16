/**
 * ZANOBOT - OPERATING POINT METRICS
 *
 * Parallel metrics for the Expert Mode "Betriebspunkt-Monitor".
 * These metrics provide transparency about operating conditions
 * WITHOUT modifying the existing DSP pipeline, GMIA, or scoring.
 *
 * All metrics are purely informational context data that complement
 * the existing Similarity Score.
 *
 * ARCHITECTURE: Reads from the same data the existing pipeline produces.
 * No additional DSP pass, no changes to features.ts, gmia.ts, or scoring.ts.
 */

import { logger } from '@utils/logger.js';

/**
 * Ampel status for a single metric
 */
export type TrafficLight = 'green' | 'yellow' | 'red';

/**
 * Single operating point metric result
 */
export interface OperatingPointMetric {
  /** Metric value (number for display) */
  value: number;
  /** Formatted display string (e.g. "+2.8 dB", "93%", "-1.2%") */
  displayValue: string;
  /** Traffic light status */
  status: TrafficLight;
  /** Short label (2-3 words) */
  shortLabel: string;
  /** One-sentence explanation */
  description: string;
}

/**
 * Complete operating point monitor result
 */
export interface OperatingPointResult {
  /** Similarity P10 - short-term minimum */
  similarityP10: OperatingPointMetric;
  /** Energy delta - RMS difference to reference in dB */
  energyDelta: OperatingPointMetric;
  /** Frequency delta - spectral centroid shift */
  frequencyDelta: OperatingPointMetric;
  /** Signal stability - percentage of stable frames */
  stability: OperatingPointMetric;
  /** Whether operating point has changed significantly */
  operatingPointChanged: boolean;
}

// ---------------------------------------------------------------------------
// Configuration constants
// ---------------------------------------------------------------------------

/** Rolling window size for stability calculation */
const STABILITY_WINDOW = 10;

/** EMA smoothing factor for energy delta */
const ENERGY_SMOOTHING_ALPHA = 0.3;

/** EMA smoothing factor for centroid */
const CENTROID_SMOOTHING_ALPHA = 0.25;

/** Band limits for robust centroid calculation (Hz) */
const CENTROID_BAND_MIN_HZ = 50;
const CENTROID_BAND_MAX_HZ = 8000;

// Thresholds ------------------------------------------------------------------

const ENERGY_THRESHOLD_GREEN = 2; // dB
const ENERGY_THRESHOLD_YELLOW = 4; // dB

const FREQ_THRESHOLD_GREEN = 5; // %
const FREQ_THRESHOLD_YELLOW = 15; // %

const STABILITY_THRESHOLD_GREEN = 85; // %
const STABILITY_THRESHOLD_YELLOW = 60; // %

const P10_THRESHOLD_GREEN = 90; // %
const P10_THRESHOLD_YELLOW = 75; // %

/**
 * Operating Point Metrics Calculator
 *
 * Instantiated once per diagnosis session.
 * Call `update()` with each new chunk's data, then read `getResult()`.
 */
export class OperatingPointMetrics {
  // Reference baselines (set once at start)
  private referenceRms: number = 0;
  private referenceCentroid: number = 0;
  private hasReference: boolean = false;

  // DSP config
  private sampleRate: number;
  private fftSize: number;
  private frequencyBins: number;

  // Smoothed live values
  private smoothedEnergyDeltaDb: number = 0;
  private smoothedCentroid: number = 0;
  private isFirstUpdate: boolean = true;

  // Rolling frame buffer for stability
  private previousFeatures: Float64Array | null = null;
  private frameSimilarities: number[] = [];

  // Latest result (cached)
  private lastResult: OperatingPointResult | null = null;

  constructor(sampleRate: number, fftSize: number = 2048, frequencyBins: number = 512) {
    this.sampleRate = sampleRate;
    this.fftSize = fftSize;
    this.frequencyBins = frequencyBins;
  }

  /**
   * Set reference baselines from the first few seconds of live audio.
   * Called once when the first valid chunk arrives.
   */
  public setReferenceFromLive(rmsAmplitude: number, features: Float64Array): void {
    this.referenceRms = rmsAmplitude;
    this.referenceCentroid = this.calculateBandLimitedCentroid(features);
    this.hasReference = true;

    logger.debug(
      `[OpPoint] Reference set: RMS=${rmsAmplitude.toFixed(6)}, Centroid=${this.referenceCentroid.toFixed(1)}Hz`
    );
  }

  /**
   * Update metrics with a new chunk's data.
   *
   * @param features      - Normalised feature vector (512 bins, sum ≈ 1)
   * @param rmsAmplitude  - RMS amplitude BEFORE standardisation
   * @param scoreHistory  - Current score history array (raw scores)
   */
  public update(
    features: Float64Array,
    rmsAmplitude: number,
    scoreHistory: number[]
  ): void {
    // Auto-initialise reference from first valid chunk
    if (!this.hasReference && rmsAmplitude > 1e-8) {
      this.setReferenceFromLive(rmsAmplitude, features);
      this.smoothedCentroid = this.referenceCentroid;
      this.smoothedEnergyDeltaDb = 0;
      this.isFirstUpdate = false;
      this.previousFeatures = new Float64Array(features);
      this.lastResult = this.buildResult(scoreHistory);
      return;
    }

    // --- 1. Energy Delta (dB) ---
    const rawDeltaDb = this.calculateEnergyDeltaDb(rmsAmplitude);
    if (this.isFirstUpdate) {
      this.smoothedEnergyDeltaDb = rawDeltaDb;
    } else {
      this.smoothedEnergyDeltaDb =
        ENERGY_SMOOTHING_ALPHA * rawDeltaDb +
        (1 - ENERGY_SMOOTHING_ALPHA) * this.smoothedEnergyDeltaDb;
    }

    // --- 2. Frequency Delta (Spectral Centroid) ---
    const currentCentroid = this.calculateBandLimitedCentroid(features);
    if (this.isFirstUpdate) {
      this.smoothedCentroid = currentCentroid;
    } else {
      this.smoothedCentroid =
        CENTROID_SMOOTHING_ALPHA * currentCentroid +
        (1 - CENTROID_SMOOTHING_ALPHA) * this.smoothedCentroid;
    }

    // --- 3. Stability (frame-to-frame cosine) ---
    if (this.previousFeatures) {
      const sim = this.cosineSim(this.previousFeatures, features);
      this.frameSimilarities.push(sim);
      if (this.frameSimilarities.length > STABILITY_WINDOW) {
        this.frameSimilarities.shift();
      }
    }
    this.previousFeatures = new Float64Array(features);

    this.isFirstUpdate = false;
    this.lastResult = this.buildResult(scoreHistory);
  }

  /**
   * Get the latest computed metrics.
   */
  public getResult(): OperatingPointResult | null {
    return this.lastResult;
  }

  /**
   * Reset all state (call when diagnosis stops).
   */
  public reset(): void {
    this.hasReference = false;
    this.referenceRms = 0;
    this.referenceCentroid = 0;
    this.smoothedEnergyDeltaDb = 0;
    this.smoothedCentroid = 0;
    this.isFirstUpdate = true;
    this.previousFeatures = null;
    this.frameSimilarities = [];
    this.lastResult = null;
  }

  // ---------------------------------------------------------------------------
  // Internal calculations
  // ---------------------------------------------------------------------------

  private buildResult(scoreHistory: number[]): OperatingPointResult {
    const p10 = this.calculateP10(scoreHistory);
    const energyDb = this.smoothedEnergyDeltaDb;
    const freqDeltaPercent = this.calculateFrequencyDeltaPercent();
    const stabilityPercent = this.calculateStabilityPercent();

    const energyAbs = Math.abs(energyDb);

    const similarityP10: OperatingPointMetric = {
      value: p10,
      displayValue: `${p10.toFixed(0)}%`,
      status: p10 > P10_THRESHOLD_GREEN ? 'green' : p10 >= P10_THRESHOLD_YELLOW ? 'yellow' : 'red',
      shortLabel: 'similarityP10.shortLabel',
      description: 'similarityP10.description',
    };

    const energyDelta: OperatingPointMetric = {
      value: energyDb,
      displayValue: `${energyDb >= 0 ? '+' : ''}${energyDb.toFixed(1)} dB`,
      status: energyAbs < ENERGY_THRESHOLD_GREEN ? 'green' : energyAbs <= ENERGY_THRESHOLD_YELLOW ? 'yellow' : 'red',
      shortLabel: 'energyDelta.shortLabel',
      description: 'energyDelta.description',
    };

    const frequencyDelta: OperatingPointMetric = {
      value: freqDeltaPercent,
      displayValue: `${freqDeltaPercent >= 0 ? '+' : ''}${freqDeltaPercent.toFixed(1)}%`,
      status:
        Math.abs(freqDeltaPercent) < FREQ_THRESHOLD_GREEN
          ? 'green'
          : Math.abs(freqDeltaPercent) <= FREQ_THRESHOLD_YELLOW
            ? 'yellow'
            : 'red',
      shortLabel: 'frequencyDelta.shortLabel',
      description: 'frequencyDelta.description',
    };

    const stability: OperatingPointMetric = {
      value: stabilityPercent,
      displayValue: `${stabilityPercent.toFixed(0)}%`,
      status:
        stabilityPercent >= STABILITY_THRESHOLD_GREEN
          ? 'green'
          : stabilityPercent >= STABILITY_THRESHOLD_YELLOW
            ? 'yellow'
            : 'red',
      shortLabel: 'stability.shortLabel',
      description: 'stability.description',
    };

    // Operating point considered "changed" when energy OR frequency is red,
    // or both are yellow.
    const operatingPointChanged =
      energyDelta.status === 'red' ||
      frequencyDelta.status === 'red' ||
      (energyDelta.status === 'yellow' && frequencyDelta.status === 'yellow');

    return {
      similarityP10,
      energyDelta,
      frequencyDelta,
      stability,
      operatingPointChanged,
    };
  }

  /**
   * Calculate P10 (10th percentile) of the score history.
   * Represents the short-term minimum similarity.
   */
  private calculateP10(scoreHistory: number[]): number {
    const valid = scoreHistory.filter((s) => isFinite(s) && s >= 0 && s <= 100);
    if (valid.length === 0) return 0;

    const sorted = [...valid].sort((a, b) => a - b);
    // 10th percentile index
    const idx = Math.max(0, Math.floor(sorted.length * 0.1));
    return sorted[idx];
  }

  /**
   * Calculate energy difference to reference in dB.
   */
  private calculateEnergyDeltaDb(currentRms: number): number {
    if (this.referenceRms <= 0 || currentRms <= 0) return 0;
    return 20 * Math.log10(currentRms / this.referenceRms);
  }

  /**
   * Calculate band-limited spectral centroid from normalised features.
   * Restricts to CENTROID_BAND_MIN_HZ – CENTROID_BAND_MAX_HZ to avoid
   * random high-frequency peaks biasing the result.
   */
  private calculateBandLimitedCentroid(features: Float64Array): number {
    const nyquist = this.sampleRate / 2;
    const binWidth = nyquist / this.frequencyBins;

    const minBin = Math.max(0, Math.floor(CENTROID_BAND_MIN_HZ / binWidth));
    const maxBin = Math.min(this.frequencyBins - 1, Math.ceil(CENTROID_BAND_MAX_HZ / binWidth));

    let weightedSum = 0;
    let magnitudeSum = 0;

    for (let i = minBin; i <= maxBin; i++) {
      const freq = (i + 0.5) * binWidth; // centre frequency of bin
      const mag = features[i];
      weightedSum += freq * mag;
      magnitudeSum += mag;
    }

    if (magnitudeSum < 1e-12) return 0;
    return weightedSum / magnitudeSum;
  }

  /**
   * Calculate relative frequency delta in percent.
   */
  private calculateFrequencyDeltaPercent(): number {
    if (this.referenceCentroid <= 0) return 0;
    return ((this.smoothedCentroid - this.referenceCentroid) / this.referenceCentroid) * 100;
  }

  /**
   * Calculate stability as percentage of stable frame transitions.
   * A frame pair is "stable" when cosine similarity > 0.95.
   */
  private calculateStabilityPercent(): number {
    if (this.frameSimilarities.length === 0) return 100; // No data yet → assume stable
    const stableCount = this.frameSimilarities.filter((s) => s > 0.95).length;
    return (stableCount / this.frameSimilarities.length) * 100;
  }

  /**
   * Cosine similarity between two feature vectors.
   * Lightweight implementation to avoid importing mathUtils
   * (which operates on Float64Array internally).
   */
  private cosineSim(a: Float64Array, b: Float64Array): number {
    const len = Math.min(a.length, b.length);
    let dot = 0;
    let magA = 0;
    let magB = 0;

    for (let i = 0; i < len; i++) {
      dot += a[i] * b[i];
      magA += a[i] * a[i];
      magB += b[i] * b[i];
    }

    const denom = Math.sqrt(magA) * Math.sqrt(magB);
    if (denom < 1e-12) return 0;
    return dot / denom;
  }
}
