import { describe, it, expect } from 'vitest';
import { dctII, idctIII, smoothSubtract, zNormalize } from './deviceInvariant.js';

describe('Device-Invariant DSP utilities', () => {
  it('should roundtrip DCT-II and IDCT-III', () => {
    const input = new Float64Array(32);
    for (let i = 0; i < input.length; i++) {
      input[i] = Math.sin(i / 3) + Math.cos(i / 5);
    }

    const coeffs = dctII(input);
    const output = idctIII(coeffs);

    for (let i = 0; i < input.length; i++) {
      expect(output[i]).toBeCloseTo(input[i], 6);
    }
  });

  it('should z-normalize to mean≈0 and std≈1', () => {
    const input = new Float64Array([1, 2, 3, 4, 5]);
    const normalized = zNormalize(input);
    const mean = normalized.reduce((sum, v) => sum + v, 0) / normalized.length;
    const variance = normalized.reduce((sum, v) => sum + (v - mean) ** 2, 0) / normalized.length;
    const stdDev = Math.sqrt(variance);

    expect(mean).toBeCloseTo(0, 6);
    expect(stdDev).toBeCloseTo(1, 6);
  });

  it('should smooth-subtract a flat curve to near-zero', () => {
    const input = new Float64Array(64).fill(2);
    const output = smoothSubtract(input, 31);
    const maxAbs = output.reduce((max, v) => Math.max(max, Math.abs(v)), 0);

    expect(maxAbs).toBeLessThan(1e-8);
  });
});
