/**
 * ZANOBOT Level 2 - Similarity Calculator
 *
 * Calculates cosine similarity between embedding vectors.
 * Used to compare current machine audio against reference recordings.
 *
 * CRITICAL: All tensor operations wrapped in tf.tidy() for memory safety!
 */

import * as tf from '@tensorflow/tfjs';
import { t } from '../../../i18n/index.js';

/**
 * Health status classification
 */
export type HealthStatus = 'HEALTHY' | 'WARNING' | 'CRITICAL';

/**
 * Health status result with visual information
 */
export interface HealthStatusResult {
  status: HealthStatus;
  color: string;
  message: string;
  icon: string;
}

/**
 * Similarity Calculator
 *
 * Provides memory-safe similarity calculations using TensorFlow.js
 */
export class SimilarityCalculator {
  /**
   * Calculate Cosine Similarity between two vectors
   *
   * Formula: similarity = (A · B) / (||A|| × ||B||)
   * Range: -1.0 (opposite) to 1.0 (identical)
   *
   * CRITICAL: Uses tf.tidy() for memory safety!
   *
   * @param reference - Reference embedding vector
   * @param current - Current embedding vector to compare
   * @returns Similarity value (0.0 to 1.0 for normalized vectors)
   */
  calculateCosineSimilarity(reference: Float32Array, current: Float32Array): number {
    if (reference.length !== current.length) {
      throw new Error(
        `Vector dimensions must match. Reference: ${reference.length}, Current: ${current.length}`
      );
    }

    // ALL tensors wrapped in tf.tidy
    return tf.tidy(() => {
      const refTensor = tf.tensor1d(reference);
      const currTensor = tf.tensor1d(current);

      // Dot Product: A · B
      const dotProduct = tf.dot(refTensor, currTensor);

      // Norms: ||A|| and ||B||
      const refNorm = tf.norm(refTensor);
      const currNorm = tf.norm(currTensor);

      // Cosine Similarity
      const similarity = dotProduct.div(refNorm.mul(currNorm));

      // CRITICAL: dataSync() BEFORE tf.tidy ends
      return similarity.dataSync()[0];
    });
  }

  /**
   * Calculate Euclidean Distance between two vectors
   *
   * Alternative metric for embedding comparison
   *
   * @param reference - Reference embedding vector
   * @param current - Current embedding vector to compare
   * @returns Euclidean distance (lower = more similar)
   */
  calculateEuclideanDistance(reference: Float32Array, current: Float32Array): number {
    if (reference.length !== current.length) {
      throw new Error('Vector dimensions must match');
    }

    return tf.tidy(() => {
      const refTensor = tf.tensor1d(reference);
      const currTensor = tf.tensor1d(current);

      const distance = tf.norm(refTensor.sub(currTensor));
      return distance.dataSync()[0];
    });
  }

  /**
   * Calculate Manhattan Distance (L1 Norm)
   *
   * @param reference - Reference embedding vector
   * @param current - Current embedding vector to compare
   * @returns Manhattan distance
   */
  calculateManhattanDistance(reference: Float32Array, current: Float32Array): number {
    if (reference.length !== current.length) {
      throw new Error('Vector dimensions must match');
    }

    return tf.tidy(() => {
      const refTensor = tf.tensor1d(reference);
      const currTensor = tf.tensor1d(current);

      const distance = tf.sum(tf.abs(refTensor.sub(currTensor)));
      return distance.dataSync()[0];
    });
  }

  /**
   * Map similarity value to health status
   *
   * Thresholds:
   * - >= 0.85: HEALTHY (green) - Machine runs normally
   * - >= 0.70: WARNING (yellow) - Slight deviation detected
   * - < 0.70: CRITICAL (red) - Significant deviation, maintenance recommended
   *
   * @param similarity - Cosine similarity value (0.0 to 1.0)
   * @returns Health status with visual information
   */
  getHealthStatus(similarity: number): HealthStatusResult {
    // Clamp similarity to valid range
    const clampedSimilarity = Math.max(0, Math.min(1, similarity));

    if (clampedSimilarity >= 0.85) {
      return {
        status: 'HEALTHY',
        color: '#10b981', // Green
        message: t('level2Diagnose.machineNormal'),
        icon: '✅',
      };
    } else if (clampedSimilarity >= 0.7) {
      return {
        status: 'WARNING',
        color: '#f59e0b', // Yellow/Orange
        message: t('level2Diagnose.warningDeviation'),
        icon: '⚠️',
      };
    } else {
      return {
        status: 'CRITICAL',
        color: '#ef4444', // Red
        message: t('level2Diagnose.criticalDeviation'),
        icon: '🚨',
      };
    }
  }

  /**
   * Get health status with custom thresholds
   *
   * @param similarity - Cosine similarity value
   * @param healthyThreshold - Threshold for HEALTHY status (default: 0.85)
   * @param warningThreshold - Threshold for WARNING status (default: 0.70)
   */
  getHealthStatusWithThresholds(
    similarity: number,
    healthyThreshold = 0.85,
    warningThreshold = 0.7
  ): HealthStatusResult {
    const clampedSimilarity = Math.max(0, Math.min(1, similarity));

    if (clampedSimilarity >= healthyThreshold) {
      return {
        status: 'HEALTHY',
        color: '#10b981',
        message: t('level2Diagnose.machineNormal'),
        icon: '✅',
      };
    } else if (clampedSimilarity >= warningThreshold) {
      return {
        status: 'WARNING',
        color: '#f59e0b',
        message: t('level2Diagnose.warningDeviation'),
        icon: '⚠️',
      };
    } else {
      return {
        status: 'CRITICAL',
        color: '#ef4444',
        message: t('level2Diagnose.criticalDeviation'),
        icon: '🚨',
      };
    }
  }

  /**
   * Convert similarity to percentage (0-100)
   */
  similarityToPercentage(similarity: number): number {
    return Math.round(Math.max(0, Math.min(1, similarity)) * 100 * 10) / 10;
  }

  /**
   * Batch similarity calculation for multiple embeddings
   *
   * Useful for comparing against multiple reference models
   *
   * @param reference - Reference embedding
   * @param currents - Array of current embeddings to compare
   * @returns Array of similarity values
   */
  calculateBatchSimilarity(reference: Float32Array, currents: Float32Array[]): number[] {
    return currents.map((current) => this.calculateCosineSimilarity(reference, current));
  }

  /**
   * Find best match from multiple references
   *
   * @param current - Current embedding to match
   * @param references - Array of reference embeddings with labels
   * @returns Best matching reference with similarity score
   */
  findBestMatch(
    current: Float32Array,
    references: Array<{ label: string; embedding: Float32Array }>
  ): { label: string; similarity: number; status: HealthStatusResult } | null {
    if (references.length === 0) return null;

    let bestMatch = {
      label: references[0].label,
      similarity: this.calculateCosineSimilarity(references[0].embedding, current),
    };

    for (let i = 1; i < references.length; i++) {
      const similarity = this.calculateCosineSimilarity(references[i].embedding, current);
      if (similarity > bestMatch.similarity) {
        bestMatch = {
          label: references[i].label,
          similarity,
        };
      }
    }

    return {
      ...bestMatch,
      status: this.getHealthStatus(bestMatch.similarity),
    };
  }
}
