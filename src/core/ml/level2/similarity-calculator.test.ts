/**
 * ZANOBOT - Level 2 Similarity Calculator Tests
 *
 * Unit tests for cosine similarity calculations and health status mapping.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SimilarityCalculator } from './similarity-calculator.js';

describe('SimilarityCalculator', () => {
  let calculator: SimilarityCalculator;

  beforeEach(() => {
    calculator = new SimilarityCalculator();
  });

  describe('calculateCosineSimilarity', () => {
    it('should return 1.0 for identical vectors', () => {
      const vec = new Float32Array([1, 2, 3, 4, 5]);
      const similarity = calculator.calculateCosineSimilarity(vec, vec);
      expect(similarity).toBeCloseTo(1.0, 5);
    });

    it('should return 0.0 for orthogonal vectors', () => {
      const vec1 = new Float32Array([1, 0, 0]);
      const vec2 = new Float32Array([0, 1, 0]);
      const similarity = calculator.calculateCosineSimilarity(vec1, vec2);
      expect(similarity).toBeCloseTo(0.0, 5);
    });

    it('should return -1.0 for opposite vectors', () => {
      const vec1 = new Float32Array([1, 2, 3]);
      const vec2 = new Float32Array([-1, -2, -3]);
      const similarity = calculator.calculateCosineSimilarity(vec1, vec2);
      expect(similarity).toBeCloseTo(-1.0, 5);
    });

    it('should return same value regardless of magnitude', () => {
      const vec1 = new Float32Array([1, 2, 3]);
      const vec2 = new Float32Array([2, 4, 6]); // Same direction, different magnitude
      const similarity = calculator.calculateCosineSimilarity(vec1, vec2);
      expect(similarity).toBeCloseTo(1.0, 5);
    });

    it('should throw error for mismatched dimensions', () => {
      const vec1 = new Float32Array([1, 2, 3]);
      const vec2 = new Float32Array([1, 2]);
      expect(() => calculator.calculateCosineSimilarity(vec1, vec2)).toThrow(
        'Vector dimensions must match'
      );
    });

    it('should handle large vectors (1024 dimensions)', () => {
      const vec1 = new Float32Array(1024);
      const vec2 = new Float32Array(1024);
      for (let i = 0; i < 1024; i++) {
        vec1[i] = Math.random();
        vec2[i] = vec1[i]; // Same values
      }
      const similarity = calculator.calculateCosineSimilarity(vec1, vec2);
      expect(similarity).toBeCloseTo(1.0, 5);
    });

    it('should return value between -1 and 1', () => {
      const vec1 = new Float32Array(100).map(() => Math.random() - 0.5);
      const vec2 = new Float32Array(100).map(() => Math.random() - 0.5);
      const similarity = calculator.calculateCosineSimilarity(vec1, vec2);
      expect(similarity).toBeGreaterThanOrEqual(-1);
      expect(similarity).toBeLessThanOrEqual(1);
    });
  });

  describe('calculateEuclideanDistance', () => {
    it('should return 0 for identical vectors', () => {
      const vec = new Float32Array([1, 2, 3]);
      const distance = calculator.calculateEuclideanDistance(vec, vec);
      expect(distance).toBeCloseTo(0, 5);
    });

    it('should return correct distance for known vectors', () => {
      const vec1 = new Float32Array([0, 0, 0]);
      const vec2 = new Float32Array([3, 4, 0]);
      const distance = calculator.calculateEuclideanDistance(vec1, vec2);
      expect(distance).toBeCloseTo(5, 5); // 3-4-5 triangle
    });

    it('should be symmetric', () => {
      const vec1 = new Float32Array([1, 2, 3]);
      const vec2 = new Float32Array([4, 5, 6]);
      const dist1 = calculator.calculateEuclideanDistance(vec1, vec2);
      const dist2 = calculator.calculateEuclideanDistance(vec2, vec1);
      expect(dist1).toBeCloseTo(dist2, 5);
    });
  });

  describe('calculateManhattanDistance', () => {
    it('should return 0 for identical vectors', () => {
      const vec = new Float32Array([1, 2, 3]);
      const distance = calculator.calculateManhattanDistance(vec, vec);
      expect(distance).toBeCloseTo(0, 5);
    });

    it('should return correct distance for known vectors', () => {
      const vec1 = new Float32Array([0, 0, 0]);
      const vec2 = new Float32Array([1, 2, 3]);
      const distance = calculator.calculateManhattanDistance(vec1, vec2);
      expect(distance).toBeCloseTo(6, 5); // 1 + 2 + 3
    });
  });

  describe('getHealthStatus', () => {
    it('should return HEALTHY for similarity >= 0.85', () => {
      const status = calculator.getHealthStatus(0.9);
      expect(status.status).toBe('HEALTHY');
      expect(status.color).toBe('#10b981');
      expect(status.icon).toBe('✅');
    });

    it('should return HEALTHY for exactly 0.85', () => {
      const status = calculator.getHealthStatus(0.85);
      expect(status.status).toBe('HEALTHY');
    });

    it('should return WARNING for similarity >= 0.70 and < 0.85', () => {
      const status = calculator.getHealthStatus(0.75);
      expect(status.status).toBe('WARNING');
      expect(status.color).toBe('#f59e0b');
      expect(status.icon).toBe('⚠️');
    });

    it('should return WARNING for exactly 0.70', () => {
      const status = calculator.getHealthStatus(0.7);
      expect(status.status).toBe('WARNING');
    });

    it('should return CRITICAL for similarity < 0.70', () => {
      const status = calculator.getHealthStatus(0.5);
      expect(status.status).toBe('CRITICAL');
      expect(status.color).toBe('#ef4444');
      expect(status.icon).toBe('🚨');
    });

    it('should clamp values above 1.0', () => {
      const status = calculator.getHealthStatus(1.5);
      expect(status.status).toBe('HEALTHY');
    });

    it('should clamp negative values', () => {
      const status = calculator.getHealthStatus(-0.5);
      expect(status.status).toBe('CRITICAL');
    });

    it('should include a message', () => {
      const status = calculator.getHealthStatus(0.9);
      expect(status.message).toBeTruthy();
      expect(typeof status.message).toBe('string');
    });
  });

  describe('getHealthStatusWithThresholds', () => {
    it('should use custom thresholds', () => {
      // With default thresholds, 0.82 would be WARNING
      const statusDefault = calculator.getHealthStatus(0.82);
      expect(statusDefault.status).toBe('WARNING');

      // With custom thresholds, 0.82 can be HEALTHY
      const statusCustom = calculator.getHealthStatusWithThresholds(0.82, 0.8, 0.6);
      expect(statusCustom.status).toBe('HEALTHY');
    });
  });

  describe('similarityToPercentage', () => {
    it('should convert 1.0 to 100%', () => {
      const percentage = calculator.similarityToPercentage(1.0);
      expect(percentage).toBe(100);
    });

    it('should convert 0.5 to 50%', () => {
      const percentage = calculator.similarityToPercentage(0.5);
      expect(percentage).toBe(50);
    });

    it('should convert 0.0 to 0%', () => {
      const percentage = calculator.similarityToPercentage(0.0);
      expect(percentage).toBe(0);
    });

    it('should clamp values above 1.0', () => {
      const percentage = calculator.similarityToPercentage(1.5);
      expect(percentage).toBe(100);
    });

    it('should clamp negative values', () => {
      const percentage = calculator.similarityToPercentage(-0.5);
      expect(percentage).toBe(0);
    });

    it('should round to one decimal place', () => {
      const percentage = calculator.similarityToPercentage(0.8567);
      expect(percentage).toBe(85.7);
    });
  });

  describe('calculateBatchSimilarity', () => {
    it('should calculate similarity for multiple vectors', () => {
      const reference = new Float32Array([1, 0, 0]);
      const currents = [
        new Float32Array([1, 0, 0]), // Same
        new Float32Array([0, 1, 0]), // Orthogonal
        new Float32Array([0.5, 0.5, 0]), // 45 degrees
      ];

      const results = calculator.calculateBatchSimilarity(reference, currents);

      expect(results.length).toBe(3);
      expect(results[0]).toBeCloseTo(1.0, 5);
      expect(results[1]).toBeCloseTo(0.0, 5);
      expect(results[2]).toBeGreaterThan(0);
      expect(results[2]).toBeLessThan(1);
    });
  });

  describe('findBestMatch', () => {
    it('should find the best matching reference', () => {
      const current = new Float32Array([1, 0, 0]);
      const references = [
        { label: 'A', embedding: new Float32Array([0, 1, 0]) },
        { label: 'B', embedding: new Float32Array([1, 0, 0]) }, // Best match
        { label: 'C', embedding: new Float32Array([0, 0, 1]) },
      ];

      const result = calculator.findBestMatch(current, references);

      expect(result).not.toBeNull();
      expect(result!.label).toBe('B');
      expect(result!.similarity).toBeCloseTo(1.0, 5);
    });

    it('should return null for empty references', () => {
      const current = new Float32Array([1, 0, 0]);
      const result = calculator.findBestMatch(current, []);
      expect(result).toBeNull();
    });

    it('should include health status in result', () => {
      const current = new Float32Array([1, 0, 0]);
      const references = [{ label: 'A', embedding: new Float32Array([1, 0, 0]) }];

      const result = calculator.findBestMatch(current, references);

      expect(result!.status).toBeDefined();
      expect(result!.status.status).toBe('HEALTHY');
    });
  });
});
