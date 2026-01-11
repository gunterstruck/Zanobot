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
 * Get classification details for a health score
 *
 * @param score - Health score [0, 100]
 * @returns Classification details with confidence and recommendation
 */
export function getClassificationDetails(score: number): {
  status: 'healthy' | 'uncertain' | 'faulty';
  confidence: number;
  recommendation: string;
} {
  const status = classifyHealthStatus(score);

  let confidence: number;
  let recommendation: string;

  if (status === 'healthy') {
    confidence = Math.min(100, 70 + (score - 75) * 1.2);
    recommendation = 'Machine is operating normally. Continue regular monitoring.';
  } else if (status === 'uncertain') {
    confidence = 50 + (score - 50) * 0.8;
    recommendation = 'Machine shows some deviation. Schedule inspection to verify condition.';
  } else {
    confidence = Math.max(20, 50 - (50 - score) * 0.6);
    recommendation = 'Machine shows significant deviation. Immediate inspection recommended.';
  }

  return {
    status,
    confidence: Math.round(confidence),
    recommendation,
  };
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

  // Generate unique ID with timestamp + random suffix to prevent collisions
  const uniqueId = `diag-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  return {
    id: uniqueId,
    machineId,
    timestamp: Date.now(),
    healthScore: Math.round(healthScore * 10) / 10, // Round to 1 decimal
    rawCosineSimilarity: Math.round(avgCosine * 10000) / 10000, // Round to 4 decimals
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

/**
 * Score history buffer size for filtering
 * As specified in Technical Report (p.12)
 */
export const SCORE_HISTORY_SIZE = 10;

/**
 * UI Post-Processing Filter for score smoothing
 *
 * Implements the filtering strategy from Technical Report (p.12):
 * 1. Take last 10 calculated scores
 * 2. Sort by value
 * 3. Remove 2 highest values
 * 4. Remove 2 lowest values
 * 5. Calculate mean of remaining 6 values
 *
 * This prevents display "jitter" and provides stable readings.
 *
 * @param scores - Array of recent health scores (should contain at least SCORE_HISTORY_SIZE values)
 * @returns Filtered (smoothed) health score
 */
export function filterHealthScoreForDisplay(scores: number[]): number {
  // Need at least SCORE_HISTORY_SIZE scores for proper filtering
  if (scores.length < SCORE_HISTORY_SIZE) {
    // Fallback: return mean of available scores
    if (scores.length === 0) return 0;
    return scores.reduce((sum, val) => sum + val, 0) / scores.length;
  }

  // Take last SCORE_HISTORY_SIZE scores
  const lastN = scores.slice(-SCORE_HISTORY_SIZE);

  // Sort ascending
  const sorted = [...lastN].sort((a, b) => a - b);

  // Remove 2 lowest (indices 0, 1) and 2 highest (indices 8, 9)
  const trimmed = sorted.slice(2, 8);

  // Calculate mean of remaining 6 values
  const mean = trimmed.reduce((sum, val) => sum + val, 0) / trimmed.length;

  return Math.round(mean * 10) / 10; // Round to 1 decimal
}

/**
 * Score History Manager
 *
 * Manages a rolling buffer of health scores for filtering.
 */
export class ScoreHistory {
  private scores: number[] = [];
  private maxSize: number = SCORE_HISTORY_SIZE;

  /**
   * Add a new score to the history
   *
   * @param score - Health score to add
   */
  addScore(score: number): void {
    this.scores.push(score);

    // Keep only last maxSize scores
    if (this.scores.length > this.maxSize) {
      this.scores.shift();
    }
  }

  /**
   * Get filtered score for display
   *
   * @returns Filtered health score
   */
  getFilteredScore(): number {
    return filterHealthScoreForDisplay(this.scores);
  }

  /**
   * Get all scores
   *
   * @returns Array of all scores
   */
  getAllScores(): number[] {
    return [...this.scores];
  }

  /**
   * Clear all scores
   */
  clear(): void {
    this.scores = [];
  }

  /**
   * Check if history has enough scores for reliable filtering
   *
   * @returns True if >= SCORE_HISTORY_SIZE scores available
   */
  hasFullHistory(): boolean {
    return this.scores.length >= SCORE_HISTORY_SIZE;
  }
}
