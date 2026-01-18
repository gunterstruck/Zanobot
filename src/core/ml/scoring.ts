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

import type { GMIAModel, DiagnosisResult, FeatureVector } from '@data/types.js';
import { inferGMIA } from './gmia.js';

/**
 * Thresholds for health status classification
 */
const HEALTH_THRESHOLDS = {
  healthy: 75, // >= 75% = Healthy
  uncertain: 50, // 50-75% = Uncertain
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
export function calculateHealthScore(cosineSimilarity: number, scalingConstant: number): number {
  // Apply tanh transformation
  const clampedCosine = Math.max(0, cosineSimilarity);
  const tanhValue = Math.tanh(scalingConstant * clampedCosine);

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
export function calculateConfidence(model: GMIAModel, cosineSimilarities: number[]): number {
  // Guard against empty array (would cause NaN)
  if (cosineSimilarities.length === 0) {
    return 0;
  }

  // Base confidence from mean cosine similarity
  const meanCosine =
    cosineSimilarities.reduce((sum, val) => sum + val, 0) / cosineSimilarities.length;
  // Clamp negative values to 0 (negative cosine = poor match = low confidence)
  const baseConfidence = Math.max(0, meanCosine) * 100;

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
  // Guard against empty array (would cause NaN)
  if (cosineSimilarities.length === 0) {
    throw new Error('Cannot generate diagnosis result with empty cosine similarities array');
  }

  // Average cosine similarity
  const avgCosine =
    cosineSimilarities.reduce((sum, val) => sum + val, 0) / cosineSimilarities.length;

  // Calculate health score
  const healthScore = calculateHealthScore(avgCosine, model.scalingConstant);

  // Classify status
  const status = classifyHealthStatus(healthScore);

  // Calculate confidence
  const confidence = calculateConfidence(model, cosineSimilarities);

  // Generate unique ID with timestamp + random suffix to prevent collisions
  const uniqueId = `diag-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

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

  // Guard against empty array (should not happen, but prevents division by zero)
  if (trimmed.length === 0) {
    return sorted.reduce((sum, val) => sum + val, 0) / sorted.length;
  }

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

/**
 * Label History Manager
 *
 * Manages a rolling buffer of detected state labels for majority voting.
 * Prevents inconsistent diagnoses where filtered score indicates healthy
 * but label comes from a single noisy chunk.
 */
export class LabelHistory {
  private labels: string[] = [];
  private maxSize: number = SCORE_HISTORY_SIZE; // Use same buffer size as scores

  /**
   * Add a new label to the history
   *
   * @param label - State label to add
   */
  addLabel(label: string): void {
    this.labels.push(label);

    // Keep only last maxSize labels
    if (this.labels.length > this.maxSize) {
      this.labels.shift();
    }
  }

  /**
   * Get most frequent label (majority voting)
   *
   * @returns Most common label, or 'UNKNOWN' if no labels available
   */
  getMajorityLabel(): string {
    if (this.labels.length === 0) {
      return 'UNKNOWN';
    }

    // Count occurrences of each label
    const counts = new Map<string, number>();
    for (const label of this.labels) {
      counts.set(label, (counts.get(label) || 0) + 1);
    }

    // Find label with highest count
    let maxCount = 0;
    let majorityLabel = 'UNKNOWN';
    // OPTIMIZATION: Direct iteration without intermediate array allocation
    // Using for...of with counts.entries() is more efficient than Array.from().forEach()
    for (const [label, count] of counts.entries()) {
      if (count > maxCount) {
        maxCount = count;
        majorityLabel = label;
      }
    }

    return majorityLabel;
  }

  /**
   * Get all labels
   *
   * @returns Array of all labels
   */
  getAllLabels(): string[] {
    return [...this.labels];
  }

  /**
   * Clear all labels
   */
  clear(): void {
    this.labels = [];
  }

  /**
   * Check if history has enough labels for reliable voting
   *
   * @returns True if >= SCORE_HISTORY_SIZE labels available
   */
  hasFullHistory(): boolean {
    return this.labels.length >= SCORE_HISTORY_SIZE;
  }
}

/**
 * Uncertainty threshold for multiclass diagnosis
 * Scores below this threshold indicate an unknown anomaly
 */
const UNCERTAINTY_THRESHOLD = 70;

/**
 * Multiclass Diagnosis - Classify machine state across multiple trained models
 *
 * Algorithm:
 * 1. Loop through all trained models
 * 2. For each model: Calculate cosine similarity → health score
 * 3. Find model with highest score
 * 4. Check uncertainty threshold (< 70% = UNKNOWN anomaly)
 * 5. Return diagnosis with best matching state
 *
 * CRITICAL: Validates sample rate compatibility before inference.
 * All models must have been trained at the same sample rate as the test data.
 *
 * @param models - Array of trained GMIA models (each representing a machine state)
 * @param featureVector - Feature vector from test audio
 * @param testSampleRate - Sample rate of the test audio (required for validation)
 * @returns Diagnosis result with identified state
 * @throws Error if sample rates don't match between models and test data
 */
export function classifyDiagnosticState(
  models: GMIAModel[],
  featureVector: FeatureVector,
  testSampleRate: number
): DiagnosisResult {
  if (models.length === 0) {
    throw new Error('No reference models available for classification');
  }

  // Initialize tracking variables
  let bestScore = 0;
  let bestLabel = 'UNKNOWN';
  let bestModel: GMIAModel | null = null;
  let bestCosine = 0;

  // Loop through all models to find best match
  for (const model of models) {
    // Step 1: Calculate cosine similarity using existing GMIA inference
    // CRITICAL: Pass testSampleRate for validation
    const cosineSimilarities = inferGMIA(model, [featureVector], testSampleRate);
    const cosine = cosineSimilarities[0];

    // Step 2: Adjust similarity using magnitude to avoid low-energy false matches
    //
    // CRITICAL ENHANCEMENT (not in original GMIA paper):
    // Multiply cosine similarity by magnitude ratio to prevent false positives
    // when test signal is much quieter than training signal (e.g., machine off,
    // microphone too far away, background noise only).
    //
    // Physics: Cosine similarity is normalized (ignores vector magnitude).
    // A very quiet signal with random noise can have high cosine similarity
    // by chance, leading to incorrect "healthy" classification.
    //
    // Solution: Scale down the similarity if ||test|| << ||reference||
    // Formula: adjustedCosine = cos(α) · min(1, ||f|| / ||w||)
    //
    // See: MAGNITUDE_FACTOR_ANALYSIS.md for detailed explanation
    const magnitudeFactor = calculateMagnitudeFactor(model.weightVector, featureVector.features);
    const adjustedCosine = cosine * magnitudeFactor;

    // Step 3: Calculate health score using existing scoring function
    const score = calculateHealthScore(adjustedCosine, model.scalingConstant);

    // Step 4: Check if this is the best match so far
    if (score > bestScore) {
      bestScore = score;
      bestLabel = model.label;
      bestModel = model;
      bestCosine = adjustedCosine;
    }
  }

  // Step 5: Uncertainty check - is the best score too low?
  let status: DiagnosisResult['status'];
  if (bestScore < UNCERTAINTY_THRESHOLD || bestModel === null) {
    // Anomaly detected, but doesn't match any known pattern
    // OR all scores were zero/negative (bestModel remains null)
    status = 'uncertain';
    bestLabel = 'UNKNOWN';
  } else {
    // Matched a known state - use model's type directly
    // This allows multiple healthy states (e.g., "Idle", "Full Load") and multiple faults
    status = bestModel.type; // 'healthy' or 'faulty' from the winning model
  }

  // Generate diagnosis result
  const diagnosis: DiagnosisResult = {
    id: `diag-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`,
    machineId: bestModel?.machineId || models[0].machineId,
    timestamp: Date.now(),
    healthScore: Math.round(bestScore * 10) / 10,
    status,
    confidence: calculateConfidenceFromScore(bestScore),
    rawCosineSimilarity: Math.round(bestCosine * 10000) / 10000,
    metadata: {
      detectedState: bestLabel,
      multiclassMode: true,
      evaluatedModels: models.length,
    },
    analysis: {
      hint: generateMulticlassHint(bestScore, bestLabel, status),
    },
  };

  return diagnosis;
}

/**
 * Calculate magnitude ratio between test features and model weights.
 *
 * IMPORTANT: This is an EXTENSION of the original GMIA algorithm (not in paper).
 *
 * Purpose: Prevent false positives when test signal has much lower energy than
 * the reference model (e.g., machine turned off, microphone too far away).
 *
 * Mathematical Background:
 * - Cosine similarity is normalized: cos(α) = (w·f) / (||w|| · ||f||)
 * - This makes it magnitude-invariant (same score for loud and quiet signals)
 * - Problem: Silent noise can randomly match patterns → false positive
 *
 * Solution:
 * - Calculate energy ratio: ||test|| / ||reference||
 * - If test is quieter: Apply proportional penalty
 * - If test is louder: No penalty (clamped to 1.0)
 *
 * Formula: factor = min(1, ||featureVector|| / ||weightVector||)
 *
 * Example:
 *   Reference magnitude: 100
 *   Test magnitude: 10
 *   → factor = 0.1
 *   → adjustedCosine = cosine * 0.1 (90% penalty)
 *
 * See MAGNITUDE_FACTOR_ANALYSIS.md for comprehensive analysis.
 *
 * @param weightVector - Model weight vector (reference)
 * @param featureVector - Test feature vector
 * @returns Magnitude ratio clamped to [0, 1]
 */
function calculateMagnitudeFactor(weightVector: Float64Array, featureVector: Float64Array): number {
  const featureMagnitude = vectorMagnitude(featureVector);
  const weightMagnitude = vectorMagnitude(weightVector);

  if (!isFinite(featureMagnitude) || !isFinite(weightMagnitude) || weightMagnitude === 0) {
    return 0;
  }

  return Math.min(1, featureMagnitude / weightMagnitude);
}

/**
 * Calculate vector magnitude (L2 norm).
 *
 * @param vector - Vector to measure
 * @returns Magnitude
 */
function vectorMagnitude(vector: Float64Array): number {
  let sumSquares = 0;
  for (const value of vector) {
    sumSquares += value * value;
  }
  return Math.sqrt(sumSquares);
}

/**
 * Calculate confidence from score for multiclass diagnosis
 *
 * @param score - Health score [0, 100]
 * @returns Confidence [0, 100]
 */
function calculateConfidenceFromScore(score: number): number {
  // Higher scores = higher confidence
  // Use exponential curve to emphasize high scores
  const normalized = score / 100;
  const confidence = Math.pow(normalized, 0.8) * 100;
  return Math.round(confidence * 10) / 10;
}

/**
 * Generate analysis hint for multiclass diagnosis
 *
 * @param score - Health score
 * @param label - Detected state label
 * @param status - Status category
 * @returns Hint text
 */
function generateMulticlassHint(
  score: number,
  label: string,
  status: DiagnosisResult['status']
): string {
  if (status === 'uncertain') {
    return `Unbekannte Anomalie erkannt (${score.toFixed(1)}%). Das Signal weicht vom Normalzustand ab, passt aber zu keinem trainierten Zustand. Weitere Inspektion empfohlen.`;
  }

  if (status === 'healthy') {
    return `Maschine läuft im Normalzustand "${label}" (${score.toFixed(1)}%). Keine Anomalien erkannt.`;
  }

  // status === 'faulty'
  return `Fehlerzustand erkannt: "${label}" (${score.toFixed(1)}%). Sofortige Inspektion empfohlen.`;
}
