/**
 * ZANOBOT - RECORDING QUALITY ASSESSMENT
 *
 * Analyzes recording quality before saving reference data.
 * Checks for signal stability, outliers, and noise.
 *
 * Phase 2: Professional Reference Recording
 */

import type { FeatureVector, QualityResult } from '@data/types.js';
import { logger } from '@utils/logger.js';

/**
 * Assess recording quality based on extracted features
 *
 * This function analyzes the feature vectors from a reference recording
 * to determine if the signal is stable enough for training.
 *
 * Input: Feature vectors (only from second 5 onwards - after settling period)
 * Output: Quality assessment with score, rating, and issues
 *
 * Quality Criteria:
 * - GOOD (>90%): Stationary signal, minimal variance
 * - OK (75-90%): Slight noise but stable overall
 * - BAD (<75%): Strong outliers (e.g., door slam, unstable signal)
 *
 * @param features - Feature vectors from recording (post-settling period)
 * @returns Quality assessment result
 */
export function assessRecordingQuality(features: FeatureVector[]): QualityResult {
  logger.info('🔍 Assessing recording quality...');

  if (features.length === 0) {
    return {
      score: 0,
      rating: 'BAD',
      issues: ['Keine Features vorhanden'],
      metadata: {
        variance: 0,
        stability: 0,
        outlierCount: 0,
      },
    };
  }

  // Extract feature matrices for analysis
  const featureMatrix = features.map((f) => Array.from(f.features));
  const numFrames = featureMatrix.length;
  const numBins = featureMatrix[0]?.length || 0;

  // SAFETY CHECK: Prevent division by zero and undefined access
  if (numFrames === 0 || numBins === 0) {
    return {
      score: 0,
      rating: 'BAD',
      issues: ['Keine Audiodaten extrahiert (Frame Count 0)'],
      metadata: {
        variance: 0,
        stability: 0,
        outlierCount: 0,
      },
    };
  }

  logger.debug(`   Analyzing ${numFrames} frames with ${numBins} frequency bins`);

  // 1. Calculate spectral variance across time
  const variance = calculateSpectralVariance(featureMatrix);

  // 2. Detect outliers (frames with unusual spectral content)
  const outliers = detectOutliers(featureMatrix);
  const outlierCount = outliers.length;

  // 3. Calculate stability metric (inverse of variance, normalized)
  const stability = calculateStability(variance, outlierCount, numFrames);

  // 4. Calculate final quality score (0-100)
  const score = calculateQualityScore(variance, stability, outlierCount, numFrames);

  // 5. Determine rating and issues
  const { rating, issues } = determineRating(score, variance, outlierCount, numFrames);

  logger.info(`   Quality Score: ${score.toFixed(1)}% - Rating: ${rating}`);
  if (issues.length > 0) {
    logger.warn(`   Issues detected: ${issues.join(', ')}`);
  }

  return {
    score: Math.round(score),
    rating,
    issues,
    metadata: {
      variance,
      stability,
      outlierCount,
    },
  };
}

/**
 * Calculate spectral variance across time
 *
 * Measures how much the spectrum changes over time.
 * Low variance = stable signal (good for reference)
 * High variance = unstable/noisy signal (bad for reference)
 *
 * @param featureMatrix - Matrix of feature vectors [frames x bins]
 * @returns Average variance across all frequency bins
 */
function calculateSpectralVariance(featureMatrix: number[][]): number {
  const numFrames = featureMatrix.length;
  const numBins = featureMatrix[0].length;

  if (numFrames < 2) {
    return 0;
  }

  // For each frequency bin, calculate variance across time
  let totalVariance = 0;

  for (let bin = 0; bin < numBins; bin++) {
    // Extract time series for this bin
    const binValues = featureMatrix.map((frame) => frame[bin]);

    // Calculate mean
    const mean = binValues.reduce((sum, val) => sum + val, 0) / numFrames;

    // Calculate variance
    const variance =
      binValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / numFrames;

    totalVariance += variance;
  }

  // Average variance across all bins
  const avgVariance = totalVariance / numBins;

  return avgVariance;
}

/**
 * Detect outlier frames using statistical methods
 *
 * An outlier is a frame whose spectral content deviates significantly
 * from the mean (e.g., sudden loud noise, door slam, etc.)
 *
 * Method: Modified Z-score using median absolute deviation (MAD)
 * This is more robust to outliers than standard deviation
 *
 * @param featureMatrix - Matrix of feature vectors [frames x bins]
 * @returns Array of outlier frame indices
 */
function detectOutliers(featureMatrix: number[][]): number[] {
  const numFrames = featureMatrix.length;

  // Calculate total energy per frame (sum across all bins)
  const frameEnergies = featureMatrix.map((frame) =>
    frame.reduce((sum, val) => sum + val, 0)
  );

  // Calculate median
  const sortedEnergies = [...frameEnergies].sort((a, b) => a - b);
  const median = sortedEnergies[Math.floor(numFrames / 2)];

  // Calculate MAD (Median Absolute Deviation)
  const absoluteDeviations = frameEnergies.map((energy) => Math.abs(energy - median));
  const sortedDeviations = [...absoluteDeviations].sort((a, b) => a - b);
  const mad = sortedDeviations[Math.floor(numFrames / 2)];

  // Modified Z-score threshold (typically 3.5 for outlier detection)
  const threshold = 3.5;

  // Detect outliers
  const outliers: number[] = [];

  if (mad > 0) {
    for (let i = 0; i < numFrames; i++) {
      const modifiedZScore = (0.6745 * (frameEnergies[i] - median)) / mad;
      if (Math.abs(modifiedZScore) > threshold) {
        outliers.push(i);
      }
    }
  }

  return outliers;
}

/**
 * Calculate stability metric (0-1, higher is better)
 *
 * Combines variance and outlier information into a single metric.
 *
 * @param variance - Spectral variance
 * @param outlierCount - Number of outlier frames
 * @param numFrames - Total number of frames
 * @returns Stability metric (0-1)
 */
function calculateStability(
  variance: number,
  outlierCount: number,
  numFrames: number
): number {
  // Penalize based on variance (exponential decay)
  // Typical good variance is around 1e-6 to 1e-5
  // Bad variance is > 1e-4
  const variancePenalty = Math.exp(-variance * 10000);

  // Penalize based on outlier percentage
  const outlierRatio = outlierCount / numFrames;
  const outlierPenalty = 1 - Math.min(outlierRatio * 5, 1); // Cap at 1

  // Combine penalties (geometric mean for balance)
  const stability = Math.sqrt(variancePenalty * outlierPenalty);

  return stability;
}

/**
 * Calculate final quality score (0-100)
 *
 * Weighted combination of stability and other factors.
 *
 * @param variance - Spectral variance
 * @param stability - Stability metric (0-1)
 * @param outlierCount - Number of outlier frames
 * @param numFrames - Total number of frames
 * @returns Quality score (0-100)
 */
function calculateQualityScore(
  variance: number,
  stability: number,
  outlierCount: number,
  numFrames: number
): number {
  // Base score from stability (0-100)
  let score = stability * 100;

  // Additional penalty for high outlier count
  const outlierRatio = outlierCount / numFrames;
  if (outlierRatio > 0.1) {
    // More than 10% outliers is very bad
    score *= 0.5; // 50% penalty
  } else if (outlierRatio > 0.05) {
    // More than 5% outliers is bad
    score *= 0.75; // 25% penalty
  }

  // Ensure score is in valid range
  return Math.max(0, Math.min(100, score));
}

/**
 * Determine quality rating and identify specific issues
 *
 * @param score - Quality score (0-100)
 * @param variance - Spectral variance
 * @param outlierCount - Number of outlier frames
 * @param numFrames - Total number of frames
 * @returns Rating and list of issues
 */
function determineRating(
  score: number,
  variance: number,
  outlierCount: number,
  numFrames: number
): { rating: 'GOOD' | 'OK' | 'BAD'; issues: string[] } {
  const issues: string[] = [];

  // Check for specific issues
  const outlierRatio = outlierCount / numFrames;

  if (variance > 0.0001) {
    issues.push('Hohe Spektralvarianz - Signal instabil');
  }

  if (outlierCount > 0) {
    issues.push(
      `${outlierCount} Ausreißer erkannt (${(outlierRatio * 100).toFixed(1)}%) - Mögliche Störgeräusche`
    );
  }

  if (variance > 0.0005) {
    issues.push('Sehr hohe Varianz - Bitte in ruhigerer Umgebung aufnehmen');
  }

  // Determine rating based on score
  let rating: 'GOOD' | 'OK' | 'BAD';

  if (score >= 90) {
    rating = 'GOOD';
    // Clear issues array for GOOD rating (only minor issues allowed)
    if (outlierRatio < 0.02 && variance < 0.00005) {
      issues.length = 0; // No issues for excellent quality
    }
  } else if (score >= 75) {
    rating = 'OK';
  } else {
    rating = 'BAD';
  }

  return { rating, issues };
}
