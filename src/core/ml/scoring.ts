/**
 * ZANOBOT - HEALTH SCORE CALCULATION
 *
 * Converts cosine similarity to health score (0-100%).
 * Uses hyperbolic tangent scaling for non-linear transformation.
 *
 * Reference: Technical Report Pages 31-32, Equation 4
 * Formula: Score = 100 * (tanh(C * cos(α)))^2
 *
 * Where:
 * - C: Scaling constant (calculated during training)
 * - cos(α): Cosine similarity between test and reference
 */

import type { GMIAModel, DiagnosisResult } from '@data/types.js';

/**
 * Thresholds for health status classification
 */
const HEALTH_THRESHOLDS = {
  healthy: 75,    // >= 75% = Healthy
  uncertain: 50,  // 50-75% = Uncertain
  // < 50% = Faulty
};

/**
 * Calculate health score from cosine similarity
 *
 * Applies tanh scaling: Score = 100 * (tanh(C * cosine))^2
 *
 * @param cosineSimilarity - Cosine similarity value [-1, 1]
 * @param scalingConstant - C from model training
 * @returns Health score [0, 100]
 */
export function calculateHealthScore(
  cosineSimilarity: number,
  scalingConstant: number
): number {
  // Apply tanh transformation
  const tanhValue = Math.tanh(scalingConstant * cosineSimilarity);

  // Square and convert to percentage
  const score = Math.pow(tanhValue, 2) * 100;

  // Clamp to [0, 100]
  return Math.max(0, Math.min(100, score));
}

/**
 * Classify health status based on score
 *
 * @param score - Health score [0, 100]
 * @returns Status category
 */
export function classifyHealthStatus(score: number): 'healthy' | 'uncertain' | 'faulty' {
  if (score >= HEALTH_THRESHOLDS.healthy) {
    return 'healthy';
  } else if (score >= HEALTH_THRESHOLDS.uncertain) {
    return 'uncertain';
  } else {
    return 'faulty';
  }
}

/**
 * Calculate confidence score based on model quality
 *
 * Higher confidence when:
 * - More training samples
 * - Recent model training
 * - Consistent cosine values
 *
 * @param model - GMIA model
 * @param cosineSimilarities - Array of cosine values from test
 * @returns Confidence score [0, 100]
 */
export function calculateConfidence(
  model: GMIAModel,
  cosineSimilarities: number[]
): number {
  // Base confidence from mean cosine similarity
  const meanCosine = cosineSimilarities.reduce((sum, val) => sum + val, 0) / cosineSimilarities.length;
  const baseConfidence = Math.abs(meanCosine) * 100;

  // Penalty for high variance (inconsistent readings)
  const variance = calculateVariance(cosineSimilarities);
  const consistencyFactor = Math.exp(-variance * 10); // Lower variance = higher consistency

  // Age penalty (model older than 30 days)
  const ageInDays = (Date.now() - model.trainingDate) / (1000 * 60 * 60 * 24);
  const ageFactor = Math.max(0.7, 1 - ageInDays / 365); // Gradual decline over a year

  // Combined confidence
  const confidence = baseConfidence * consistencyFactor * ageFactor;

  return Math.max(0, Math.min(100, confidence));
}

/**
 * Generate complete diagnosis result
 *
 * @param model - Trained GMIA model
 * @param cosineSimilarities - Cosine similarities from inference
 * @param machineId - Machine identifier
 * @returns Complete diagnosis result
 */
export function generateDiagnosisResult(
  model: GMIAModel,
  cosineSimilarities: number[],
  machineId: string
): DiagnosisResult {
  // Average cosine similarity
  const avgCosine = cosineSimilarities.reduce((sum, val) => sum + val, 0) / cosineSimilarities.length;

  // Calculate health score
  const healthScore = calculateHealthScore(avgCosine, model.scalingConstant);

  // Classify status
  const status = classifyHealthStatus(healthScore);

  // Calculate confidence
  const confidence = calculateConfidence(model, cosineSimilarities);

  return {
    machineId,
    timestamp: Date.now(),
    healthScore: Math.round(healthScore * 10) / 10, // Round to 1 decimal
    cosineSimilarity: Math.round(avgCosine * 10000) / 10000, // Round to 4 decimals
    confidence: Math.round(confidence * 10) / 10,
    status,
    analysis: generateAnalysisHints(healthScore, status),
  };
}

/**
 * Generate analysis hints based on results
 *
 * @param healthScore - Calculated health score
 * @param status - Health status
 * @returns Analysis object with hints
 */
function generateAnalysisHints(
  healthScore: number,
  status: 'healthy' | 'uncertain' | 'faulty'
): DiagnosisResult['analysis'] {
  const hints: string[] = [];

  if (status === 'healthy') {
    hints.push('Machine operates within normal parameters.');
    if (healthScore < 85) {
      hints.push('Minor deviations detected. Consider monitoring more frequently.');
    }
  } else if (status === 'uncertain') {
    hints.push('Acoustic signature shows moderate deviation from reference.');
    hints.push('Recommendation: Perform visual inspection or repeat measurement.');
  } else {
    hints.push('Significant acoustic anomaly detected.');
    hints.push('Immediate inspection recommended.');
  }

  return {
    hint: hints.join(' '),
  };
}

/**
 * Calculate variance of array
 *
 * @param values - Input values
 * @returns Variance
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0;

  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;

  return variance;
}

/**
 * Calculate health score statistics for multiple measurements
 *
 * @param scores - Array of health scores
 * @returns Statistics object
 */
export function calculateScoreStatistics(scores: number[]): {
  mean: number;
  min: number;
  max: number;
  stdDev: number;
} {
  if (scores.length === 0) {
    return { mean: 0, min: 0, max: 0, stdDev: 0 };
  }

  const mean = scores.reduce((sum, val) => sum + val, 0) / scores.length;
  const min = Math.min(...scores);
  const max = Math.max(...scores);

  const variance = calculateVariance(scores);
  const stdDev = Math.sqrt(variance);

  return {
    mean: Math.round(mean * 10) / 10,
    min: Math.round(min * 10) / 10,
    max: Math.round(max * 10) / 10,
    stdDev: Math.round(stdDev * 10) / 10,
  };
}

/**
 * Compare two health scores to detect degradation
 *
 * @param previousScore - Previous health score
 * @param currentScore - Current health score
 * @returns Degradation percentage (positive = getting worse)
 */
export function calculateDegradation(previousScore: number, currentScore: number): number {
  const degradation = previousScore - currentScore;
  return Math.round(degradation * 10) / 10;
}
