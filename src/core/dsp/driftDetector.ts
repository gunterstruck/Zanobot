/**
 * ZANOBOT - DRIFT DETECTOR (Global Drift + Local Residual Index)
 *
 * Separates spectral changes into two components:
 * - Global Drift: Smooth, broadband changes (room/environment/microphone position)
 * - Local Residual: Narrowband structural changes (machine condition)
 *
 * Physical model:
 *   Y(f) = S(f) · H(f)  →  log Y(f) = log S(f) + log H(f)
 *   S(f) = machine signal, H(f) = room transfer function
 *
 * The room produces smooth spectral coloring (reverb, resonances).
 * The machine produces local, narrowband peaks (rotational frequencies, harmonics, bearing frequencies).
 *
 * By separating the log-spectrum into smooth (≈ room) and structural (≈ machine) parts,
 * we can tell which one changed between reference and measurement.
 *
 * IMPORTANT: This is purely diagnostic. It does NOT modify features, scores, or GMIA training.
 */

import { logger } from '@utils/logger.js';
import { t } from '../../i18n/index.js';

// ════════════════════════════════════════════════════════════
// Constants
// ════════════════════════════════════════════════════════════

const LOG_EPSILON = 1e-12;

/** Moving-Average window width (bins). 32 bins ≈ 1.5 kHz smoothing. */
const DEFAULT_SMOOTH_WINDOW = 32;

/** Default thresholds (configurable via Settings) */
export const DEFAULT_DRIFT_SETTINGS: DriftDetectorSettings = {
  enabled: false, // Default OFF – activated via Settings
  smoothWindow: DEFAULT_SMOOTH_WINDOW,
  globalWarning: 0.3,
  globalCritical: 0.6,
  localWarning: 0.15,
  localCritical: 0.30,
};

// ════════════════════════════════════════════════════════════
// Interfaces
// ════════════════════════════════════════════════════════════

export interface DriftDetectorSettings {
  enabled: boolean;
  smoothWindow: number; // Moving-Average window width (bins)
  globalWarning: number; // D_global → warning threshold
  globalCritical: number; // D_global → critical threshold
  localWarning: number; // D_local → warning threshold
  localCritical: number; // D_local → critical threshold
}

export interface DriftResult {
  globalDrift: number; // D_global (0 = identical, higher = more room drift)
  localDrift: number; // D_local  (0 = identical, higher = more machine change)
  localDriftNormalized: number | null; // D_local / σ_ref_mean (machine-independent, null if no σ_ref)

  globalSeverity: 'ok' | 'warning' | 'critical';
  localSeverity: 'ok' | 'warning' | 'critical';

  interpretation:
    | 'all_ok'
    | 'room_change'
    | 'machine_change'
    | 'both'
    | 'uncertain';

  // Human-readable messages (localized)
  globalMessage: string;
  localMessage: string;
  overallMessage: string;
  recommendation: string;

  // Debug data (for Expert-View)
  smoothRef: Float64Array; // Smoothed reference spectrum
  smoothMeas: Float64Array; // Smoothed measurement spectrum
  residualRef: Float64Array; // Residual reference
  residualMeas: Float64Array; // Residual measurement
}

// ════════════════════════════════════════════════════════════
// Settings Persistence
// ════════════════════════════════════════════════════════════

const STORAGE_KEY = 'zanobot-drift-detector-settings';

export function getDriftSettings(): DriftDetectorSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return { ...DEFAULT_DRIFT_SETTINGS, ...JSON.parse(stored) };
    }
  } catch (e) {
    logger.warn('Drift-Settings Load Error:', e);
  }
  return { ...DEFAULT_DRIFT_SETTINGS };
}

export function setDriftSettings(
  partial: Partial<DriftDetectorSettings>
): void {
  const current = getDriftSettings();
  const updated = { ...current, ...partial };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (e) {
    logger.warn('Drift-Settings Save Error:', e);
  }
}

// ════════════════════════════════════════════════════════════
// Core Algorithm
// ════════════════════════════════════════════════════════════

/**
 * Moving Average smoothing of a log-spectrum.
 * Extracts the "smooth" part = room influence.
 *
 * @param spectrum - Log-spectrum (512 bins)
 * @param windowSize - Window width (default: 32 bins)
 * @returns Smoothed spectrum (same length)
 */
export function smoothSpectrum(
  spectrum: Float64Array,
  windowSize: number
): Float64Array {
  const K = spectrum.length;
  const result = new Float64Array(K);
  const halfW = Math.floor(windowSize / 2);

  for (let k = 0; k < K; k++) {
    let sum = 0;
    let count = 0;
    const start = Math.max(0, k - halfW);
    const end = Math.min(K - 1, k + halfW);
    for (let j = start; j <= end; j++) {
      sum += spectrum[j];
      count++;
    }
    result[k] = sum / count;
  }

  return result;
}

/**
 * Compute drift index between reference and measurement.
 *
 * @param muRef - Log-spectral mean of reference (512 bins).
 *   From Machine object: new Float64Array(machine.refLogMean)
 * @param muMeas - Log-spectral mean of current measurement (512 bins).
 *   From RealtimeDriftDetector or manually computed.
 * @param settings - Thresholds and configuration
 * @param sigmaRef - Optional: Standard deviation of reference (512 bins).
 *   From Machine object: new Float64Array(machine.refLogStd).
 *   If present, D_local is normalized → machine-independent thresholds.
 * @returns DriftResult with both indices, interpretation and messages
 */
export function computeDrift(
  muRef: Float64Array,
  muMeas: Float64Array,
  settings: DriftDetectorSettings,
  sigmaRef?: Float64Array
): DriftResult {
  const K = muRef.length;

  // Step 1: Smooth
  const smoothRef = smoothSpectrum(muRef, settings.smoothWindow);
  const smoothMeas = smoothSpectrum(muMeas, settings.smoothWindow);

  // Step 2: Global Drift Index
  let globalSum = 0;
  for (let k = 0; k < K; k++) {
    globalSum += Math.abs(smoothMeas[k] - smoothRef[k]);
  }
  const globalDrift = globalSum / K;

  // Step 3: Residuals + Local Drift Index
  const residualRef = new Float64Array(K);
  const residualMeas = new Float64Array(K);
  let localSum = 0;

  for (let k = 0; k < K; k++) {
    residualRef[k] = muRef[k] - smoothRef[k];
    residualMeas[k] = muMeas[k] - smoothMeas[k];
    localSum += Math.abs(residualMeas[k] - residualRef[k]);
  }
  const localDrift = localSum / K;

  // Step 3b: Normalization to reference variance
  let localDriftNormalized: number | null = null;
  if (sigmaRef && sigmaRef.length === K) {
    let sigmaSum = 0;
    for (let k = 0; k < K; k++) sigmaSum += sigmaRef[k];
    const sigmaMean = sigmaSum / K;
    if (sigmaMean > LOG_EPSILON) {
      localDriftNormalized = localDrift / sigmaMean;
    }
  }

  // For severity: use normalized values if available
  const localForSeverity = localDriftNormalized ?? localDrift;

  // Step 4: Severity
  const globalSeverity = classifySeverity(
    globalDrift,
    settings.globalWarning,
    settings.globalCritical
  );
  const localSeverity = classifySeverity(
    localForSeverity,
    settings.localWarning,
    settings.localCritical
  );

  // Step 5: Interpretation
  const interpretation = interpretDrift(globalSeverity, localSeverity);

  // Step 6: Human-readable messages
  const {
    globalMessage,
    localMessage,
    overallMessage,
    recommendation,
  } = generateDriftMessages(globalSeverity, localSeverity, interpretation);

  return {
    globalDrift,
    localDrift,
    localDriftNormalized,
    globalSeverity,
    localSeverity,
    interpretation,
    globalMessage,
    localMessage,
    overallMessage,
    recommendation,
    smoothRef,
    smoothMeas,
    residualRef,
    residualMeas,
  };
}

// ════════════════════════════════════════════════════════════
// Helper Functions
// ════════════════════════════════════════════════════════════

function classifySeverity(
  value: number,
  warningThreshold: number,
  criticalThreshold: number
): 'ok' | 'warning' | 'critical' {
  if (value >= criticalThreshold) return 'critical';
  if (value >= warningThreshold) return 'warning';
  return 'ok';
}

function interpretDrift(
  globalSev: 'ok' | 'warning' | 'critical',
  localSev: 'ok' | 'warning' | 'critical'
): 'all_ok' | 'room_change' | 'machine_change' | 'both' | 'uncertain' {
  const gOk = globalSev === 'ok';
  const lOk = localSev === 'ok';

  if (gOk && lOk) return 'all_ok';
  if (!gOk && lOk) return 'room_change';
  if (gOk && !lOk) return 'machine_change';
  // Both not ok
  if (globalSev === 'critical' && localSev === 'critical') return 'both';
  return 'uncertain';
}

function generateDriftMessages(
  globalSev: 'ok' | 'warning' | 'critical',
  localSev: 'ok' | 'warning' | 'critical',
  interpretation: string
): {
  globalMessage: string;
  localMessage: string;
  overallMessage: string;
  recommendation: string;
} {
  // Global message
  let globalMessage: string;
  switch (globalSev) {
    case 'ok':
      globalMessage = t('drift.globalOk');
      break;
    case 'warning':
      globalMessage = t('drift.globalWarning');
      break;
    case 'critical':
      globalMessage = t('drift.globalCritical');
      break;
  }

  // Local message
  let localMessage: string;
  switch (localSev) {
    case 'ok':
      localMessage = t('drift.localOk');
      break;
    case 'warning':
      localMessage = t('drift.localWarning');
      break;
    case 'critical':
      localMessage = t('drift.localCritical');
      break;
  }

  // Overall message + recommendation
  let overallMessage: string;
  let recommendation: string;

  switch (interpretation) {
    case 'all_ok':
      overallMessage = t('drift.allOk');
      recommendation = '';
      break;
    case 'room_change':
      overallMessage = t('drift.roomChange');
      recommendation = t('drift.recommendRoom');
      break;
    case 'machine_change':
      overallMessage = t('drift.machineChange');
      recommendation = t('drift.recommendMachine');
      break;
    case 'both':
      overallMessage = t('drift.both');
      recommendation = t('drift.recommendBoth');
      break;
    default:
      overallMessage = t('drift.uncertain');
      recommendation = t('drift.recommendUncertain');
  }

  return { globalMessage, localMessage, overallMessage, recommendation };
}

// ════════════════════════════════════════════════════════════
// Realtime Variant for Live Diagnosis
// ════════════════════════════════════════════════════════════

/** Minimum RMS level (linear) below which drift is not computed.
 *  Prevents false alarms with very quiet machines or silence.
 *  Approximately -72 dBFS. */
const MIN_RMS_FOR_DRIFT = 0.00025;

/** First N frames are ignored (AGC settling, microphone warmup).
 *  Frames are counted but NOT fed into the Welford mean. */
const SKIP_INITIAL_FRAMES = 5;

/** Minimum accumulated frames (after skip) before drift is computed. */
const MIN_ACCUMULATED_FRAMES = 15;

/**
 * Builds the measurement mean incrementally and computes
 * drift index periodically (not per frame – too expensive for UI).
 */
export class RealtimeDriftDetector {
  private readonly muRef: Float64Array;
  private readonly sigmaRef: Float64Array | null;
  private muMeas: Float64Array;
  private totalFrameCount: number = 0; // All frames (incl. skipped)
  private accumulatedFrames: number = 0; // Frames in Welford mean
  private readonly K: number;
  private settings: DriftDetectorSettings;
  private lastResult: DriftResult | null = null;
  private lowSnrCount: number = 0; // Consecutive low-SNR frames

  /** Drift is recomputed every N frames */
  private readonly updateInterval: number = 10; // Every ~660ms at 66ms hop

  /**
   * @param refLogMean - Log-spectral mean of reference (512 bins)
   * @param settings - Drift detector settings
   * @param refLogStd - Optional: Standard deviation of reference (512 bins).
   *   If present, D_local is normalized → machine-independent thresholds.
   */
  constructor(
    refLogMean: Float64Array,
    settings: DriftDetectorSettings,
    refLogStd?: Float64Array
  ) {
    this.K = refLogMean.length;
    this.muRef = refLogMean;
    this.sigmaRef = refLogStd ?? null;
    this.muMeas = new Float64Array(this.K);
    this.settings = settings;
  }

  /**
   * Feed a new measurement frame.
   * Returns DriftResult when an update is due, otherwise null.
   */
  processFrame(absoluteFeatures: Float64Array): DriftResult | null {
    this.totalFrameCount++;

    // SNR Guard: At very low signals, residuals become unstable → false alarms.
    let rmsSum = 0;
    for (let k = 0; k < this.K; k++)
      rmsSum += absoluteFeatures[k] * absoluteFeatures[k];
    const rms = Math.sqrt(rmsSum / this.K);

    if (rms < MIN_RMS_FOR_DRIFT) {
      this.lowSnrCount++;
      // After 30 consecutive low-SNR frames: keep last result
      if (this.lowSnrCount > 30 && this.lastResult) {
        return this.lastResult;
      }
      return null; // Ignore frame, no update
    }
    this.lowSnrCount = 0;

    // Skip first frames (AGC settling, microphone warmup)
    if (this.totalFrameCount <= SKIP_INITIAL_FRAMES) {
      return null; // Don't include in mean
    }

    // Running Mean Update (Welford)
    this.accumulatedFrames++;
    for (let k = 0; k < this.K; k++) {
      const logVal = Math.log(absoluteFeatures[k] + LOG_EPSILON);
      this.muMeas[k] += (logVal - this.muMeas[k]) / this.accumulatedFrames;
    }

    // Need enough frames for stable mean
    if (this.accumulatedFrames < MIN_ACCUMULATED_FRAMES) return null;

    // Only update every N frames (performance)
    if (this.accumulatedFrames % this.updateInterval !== 0)
      return this.lastResult;

    this.lastResult = computeDrift(
      this.muRef,
      this.muMeas,
      this.settings,
      this.sigmaRef ?? undefined
    );
    return this.lastResult;
  }

  get currentResult(): DriftResult | null {
    return this.lastResult;
  }

  get isReady(): boolean {
    return this.accumulatedFrames >= MIN_ACCUMULATED_FRAMES;
  }

  get statusText(): string {
    if (this.totalFrameCount <= SKIP_INITIAL_FRAMES) {
      return `initializing (${this.totalFrameCount}/${SKIP_INITIAL_FRAMES})`;
    }
    if (this.accumulatedFrames < MIN_ACCUMULATED_FRAMES) {
      return `warming up (${this.accumulatedFrames}/${MIN_ACCUMULATED_FRAMES})`;
    }
    if (this.lowSnrCount > 10) return 'low signal';
    return 'active';
  }

  reset(): void {
    this.totalFrameCount = 0;
    this.accumulatedFrames = 0;
    this.lowSnrCount = 0;
    this.muMeas.fill(0);
    this.lastResult = null;
  }
}
