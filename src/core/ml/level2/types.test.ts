/**
 * ZANOBOT - Level 2 Types Tests
 *
 * Unit tests for type utilities and serialization functions.
 */

import { describe, it, expect } from 'vitest';
import {
  serializeReference,
  deserializeReference,
  DEFAULT_LEVEL2_SETTINGS,
  type Level2Reference,
  type Level2ReferenceStored,
} from './types.js';

describe('Level 2 Types', () => {
  describe('serializeReference', () => {
    it('should convert Float32Array to number array', () => {
      const reference: Level2Reference = {
        machineId: 'machine-1',
        label: 'Baseline',
        embedding: new Float32Array([1.0, 2.0, 3.0, 4.0, 5.0]),
        createdAt: Date.now(),
        duration: 10,
        sampleRate: 48000,
      };

      const serialized = serializeReference(reference);

      expect(Array.isArray(serialized.embedding)).toBe(true);
      expect(serialized.embedding).toEqual([1.0, 2.0, 3.0, 4.0, 5.0]);
      expect(serialized.machineId).toBe('machine-1');
      expect(serialized.label).toBe('Baseline');
    });

    it('should preserve all other fields', () => {
      const reference: Level2Reference = {
        machineId: 'machine-2',
        label: 'Test',
        embedding: new Float32Array([1, 2, 3]),
        createdAt: 1234567890,
        duration: 15,
        sampleRate: 44100,
        metadata: {
          backendUsed: 'webgl',
          notes: 'Test notes',
        },
      };

      const serialized = serializeReference(reference);

      expect(serialized.machineId).toBe('machine-2');
      expect(serialized.label).toBe('Test');
      expect(serialized.createdAt).toBe(1234567890);
      expect(serialized.duration).toBe(15);
      expect(serialized.sampleRate).toBe(44100);
      expect(serialized.metadata?.backendUsed).toBe('webgl');
      expect(serialized.metadata?.notes).toBe('Test notes');
    });
  });

  describe('deserializeReference', () => {
    it('should convert number array back to Float32Array', () => {
      const stored: Level2ReferenceStored = {
        machineId: 'machine-1',
        label: 'Baseline',
        embedding: [1.0, 2.0, 3.0, 4.0, 5.0],
        createdAt: Date.now(),
        duration: 10,
        sampleRate: 48000,
      };

      const deserialized = deserializeReference(stored);

      expect(deserialized.embedding instanceof Float32Array).toBe(true);
      expect(Array.from(deserialized.embedding)).toEqual([1.0, 2.0, 3.0, 4.0, 5.0]);
    });

    it('should preserve all other fields', () => {
      const stored: Level2ReferenceStored = {
        machineId: 'machine-3',
        label: 'Recovery',
        embedding: [0.5, 0.5],
        createdAt: 9876543210,
        duration: 20,
        sampleRate: 16000,
        metadata: {
          modelVersion: '1.0',
        },
      };

      const deserialized = deserializeReference(stored);

      expect(deserialized.machineId).toBe('machine-3');
      expect(deserialized.label).toBe('Recovery');
      expect(deserialized.createdAt).toBe(9876543210);
      expect(deserialized.duration).toBe(20);
      expect(deserialized.sampleRate).toBe(16000);
      expect(deserialized.metadata?.modelVersion).toBe('1.0');
    });
  });

  describe('roundtrip serialization', () => {
    it('should preserve data through serialize/deserialize', () => {
      const original: Level2Reference = {
        machineId: 'test-machine',
        label: 'Original',
        embedding: new Float32Array([0.1, 0.2, 0.3, 0.4, 0.5]),
        createdAt: Date.now(),
        duration: 10,
        sampleRate: 48000,
        metadata: {
          backendUsed: 'webgpu',
          notes: 'Round trip test',
        },
      };

      const serialized = serializeReference(original);
      const deserialized = deserializeReference(serialized);

      expect(deserialized.machineId).toBe(original.machineId);
      expect(deserialized.label).toBe(original.label);
      expect(deserialized.createdAt).toBe(original.createdAt);
      expect(deserialized.duration).toBe(original.duration);
      expect(deserialized.sampleRate).toBe(original.sampleRate);
      expect(Array.from(deserialized.embedding)).toEqual(Array.from(original.embedding));
      expect(deserialized.metadata).toEqual(original.metadata);
    });

    it('should handle large embeddings (1024 dimensions)', () => {
      const largeEmbedding = new Float32Array(1024);
      for (let i = 0; i < 1024; i++) {
        largeEmbedding[i] = Math.random();
      }

      const original: Level2Reference = {
        machineId: 'large-test',
        label: 'Large',
        embedding: largeEmbedding,
        createdAt: Date.now(),
        duration: 10,
        sampleRate: 48000,
      };

      const serialized = serializeReference(original);
      const deserialized = deserializeReference(serialized);

      expect(deserialized.embedding.length).toBe(1024);
      for (let i = 0; i < 1024; i++) {
        expect(deserialized.embedding[i]).toBeCloseTo(original.embedding[i], 5);
      }
    });
  });

  describe('DEFAULT_LEVEL2_SETTINGS', () => {
    it('should have correct default values', () => {
      expect(DEFAULT_LEVEL2_SETTINGS.healthyThreshold).toBe(0.85);
      expect(DEFAULT_LEVEL2_SETTINGS.warningThreshold).toBe(0.7);
      expect(DEFAULT_LEVEL2_SETTINGS.recordingDuration).toBe(10);
      expect(DEFAULT_LEVEL2_SETTINGS.autoLoadReference).toBe(true);
    });

    it('should have valid threshold ordering', () => {
      expect(DEFAULT_LEVEL2_SETTINGS.healthyThreshold).toBeGreaterThan(
        DEFAULT_LEVEL2_SETTINGS.warningThreshold
      );
    });
  });
});
