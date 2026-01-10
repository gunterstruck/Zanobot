/**
 * ZANOBOT - SCORING TESTS
 *
 * Tests for health score calculation and classification
 */

import { describe, it, expect } from 'vitest';
import {
  calculateHealthScore,
  classifyHealthStatus,
  getClassificationDetails,
  calculateConfidence,
  filterHealthScoreForDisplay,
  ScoreHistory,
  calculateScoreStatistics,
  calculateDegradation,
} from './scoring.js';
import type { GMIAModel } from '@data/types.js';

describe('Health Scoring', () => {
  const mockModel: GMIAModel = {
    machineId: 'test-machine',
    weightVector: new Float64Array([1, 2, 3]),
    regularization: 1e9,
    scalingConstant: 2.5,
    featureDimension: 3,
    trainingDate: Date.now(),
    trainingDuration: 10,
    sampleRate: 44100,
    metadata: {
      meanCosineSimilarity: 0.95,
      targetScore: 0.9,
    },
  };

  describe('calculateHealthScore()', () => {
    it('should calculate score using tanh formula', () => {
      const cosineSimilarity = 0.9;
      const scalingConstant = 2.5;

      const score = calculateHealthScore(cosineSimilarity, scalingConstant);

      // Score = 100 * (tanh(2.5 * 0.9))^2
      const expected = Math.pow(Math.tanh(2.5 * 0.9), 2) * 100;

      expect(score).toBeCloseTo(expected, 2);
    });

    it('should return 100 for perfect similarity', () => {
      const score = calculateHealthScore(1.0, 2.5);

      expect(score).toBeGreaterThan(95);
      expect(score).toBeLessThanOrEqual(100);
    });

    it('should handle negative similarity (squared tanh)', () => {
      const score = calculateHealthScore(-0.5, 2.5);

      // Note: tanh(-x)^2 = tanh(x)^2, so negative similarity still produces positive score
      // This is correct behavior for the GMIA algorithm
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(100);
    });

    it('should clamp score to [0, 100]', () => {
      const highScore = calculateHealthScore(10, 10); // Extreme values
      const lowScore = calculateHealthScore(-10, 10);

      expect(highScore).toBeLessThanOrEqual(100);
      expect(lowScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('classifyHealthStatus()', () => {
    it('should classify score >= 75 as healthy', () => {
      expect(classifyHealthStatus(75)).toBe('healthy');
      expect(classifyHealthStatus(85)).toBe('healthy');
      expect(classifyHealthStatus(100)).toBe('healthy');
    });

    it('should classify score 50-75 as uncertain', () => {
      expect(classifyHealthStatus(50)).toBe('uncertain');
      expect(classifyHealthStatus(60)).toBe('uncertain');
      expect(classifyHealthStatus(74)).toBe('uncertain');
    });

    it('should classify score < 50 as faulty', () => {
      expect(classifyHealthStatus(0)).toBe('faulty');
      expect(classifyHealthStatus(25)).toBe('faulty');
      expect(classifyHealthStatus(49)).toBe('faulty');
    });
  });

  describe('getClassificationDetails()', () => {
    it('should provide healthy classification with recommendation', () => {
      const details = getClassificationDetails(85);

      expect(details.status).toBe('healthy');
      expect(details.confidence).toBeGreaterThan(70);
      expect(details.recommendation).toContain('normal');
    });

    it('should provide uncertain classification', () => {
      const details = getClassificationDetails(60);

      expect(details.status).toBe('uncertain');
      expect(details.recommendation).toContain('inspection');
    });

    it('should provide faulty classification', () => {
      const details = getClassificationDetails(30);

      expect(details.status).toBe('faulty');
      expect(details.recommendation).toContain('Immediate');
    });
  });

  describe('calculateConfidence()', () => {
    it('should return higher confidence for consistent readings', () => {
      const consistentReadings = [0.9, 0.91, 0.89, 0.9, 0.92];

      const confidence = calculateConfidence(mockModel, consistentReadings);

      expect(confidence).toBeGreaterThan(70);
    });

    it('should return lower confidence for inconsistent readings', () => {
      const inconsistentReadings = [0.1, 0.9, 0.2, 0.8, 0.3];

      const confidence = calculateConfidence(mockModel, inconsistentReadings);

      expect(confidence).toBeLessThan(50);
    });

    it('should penalize old models', () => {
      const oldModel = {
        ...mockModel,
        trainingDate: Date.now() - 365 * 24 * 60 * 60 * 1000, // 1 year ago
      };

      const readings = [0.9, 0.9, 0.9];
      const confidence = calculateConfidence(oldModel, readings);

      expect(confidence).toBeLessThan(80);
    });
  });

  describe('filterHealthScoreForDisplay()', () => {
    it('should filter scores using trimmed mean (remove 2 min, 2 max)', () => {
      const scores = [50, 55, 60, 65, 70, 75, 80, 85, 90, 95];
      // After removing 2 min (50, 55) and 2 max (90, 95): [60, 65, 70, 75, 80, 85]
      // Mean: (60+65+70+75+80+85)/6 = 72.5

      const filtered = filterHealthScoreForDisplay(scores);

      expect(filtered).toBeCloseTo(72.5, 1);
    });

    it('should return mean if less than 10 scores', () => {
      const scores = [70, 80, 90];
      const filtered = filterHealthScoreForDisplay(scores);

      expect(filtered).toBeCloseTo(80, 1);
    });

    it('should handle empty array', () => {
      const filtered = filterHealthScoreForDisplay([]);

      expect(filtered).toBe(0);
    });
  });

  describe('ScoreHistory', () => {
    it('should maintain rolling buffer of scores', () => {
      const history = new ScoreHistory();

      for (let i = 1; i <= 15; i++) {
        history.addScore(i * 10);
      }

      const scores = history.getAllScores();

      expect(scores.length).toBe(10); // Max 10 scores
      expect(scores[0]).toBe(60); // First score after 5 dropped
      expect(scores[9]).toBe(150); // Last score
    });

    it('should provide filtered score', () => {
      const history = new ScoreHistory();

      for (let i = 1; i <= 10; i++) {
        history.addScore(i * 10);
      }

      const filtered = history.getFilteredScore();

      // Removes 10, 20, 90, 100, mean of rest
      expect(filtered).toBeGreaterThan(40);
      expect(filtered).toBeLessThan(70);
    });

    it('should clear all scores', () => {
      const history = new ScoreHistory();
      history.addScore(50);
      history.addScore(60);

      history.clear();

      expect(history.getAllScores().length).toBe(0);
    });

    it('should track if history is full', () => {
      const history = new ScoreHistory();

      expect(history.hasFullHistory()).toBe(false);

      for (let i = 0; i < 10; i++) {
        history.addScore(50);
      }

      expect(history.hasFullHistory()).toBe(true);
    });
  });

  describe('calculateScoreStatistics()', () => {
    it('should calculate statistics correctly', () => {
      const scores = [70, 75, 80, 85, 90];

      const stats = calculateScoreStatistics(scores);

      expect(stats.mean).toBeCloseTo(80, 1);
      expect(stats.min).toBe(70);
      expect(stats.max).toBe(90);
      expect(stats.stdDev).toBeGreaterThan(5);
    });

    it('should handle empty array', () => {
      const stats = calculateScoreStatistics([]);

      expect(stats.mean).toBe(0);
      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
      expect(stats.stdDev).toBe(0);
    });
  });

  describe('calculateDegradation()', () => {
    it('should calculate positive degradation for declining scores', () => {
      const degradation = calculateDegradation(90, 70);

      expect(degradation).toBe(20); // 90 - 70 = 20
    });

    it('should calculate negative degradation for improving scores', () => {
      const degradation = calculateDegradation(70, 90);

      expect(degradation).toBe(-20); // 70 - 90 = -20
    });

    it('should return zero for unchanged scores', () => {
      const degradation = calculateDegradation(80, 80);

      expect(degradation).toBe(0);
    });
  });
});
