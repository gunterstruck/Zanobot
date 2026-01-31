/**
 * ZANOBOT - Device-Invariant Feature Transformation
 *
 * Optional preprocessing applied after FFT magnitude binning and before GMIA.
 * Designed to reduce linear device/microphone coloration without ML.
 */

import type { DeviceInvariantConfig } from '@data/types.js';

const COS_TABLE_CACHE = new Map<number, Float64Array>();
const DEFAULT_LOG_EPS = 1e-10;
const DEFAULT_SMOOTH_WINDOW = 31;

function getCosTable(size: number): Float64Array {
  const cached = COS_TABLE_CACHE.get(size);
  if (cached) {
    return cached;
  }

  const table = new Float64Array(size * size);
  const factor = Math.PI / size;

  for (let k = 0; k < size; k++) {
    const offset = k * size;
    for (let n = 0; n < size; n++) {
      table[offset + n] = Math.cos(factor * (n + 0.5) * k);
    }
  }

  COS_TABLE_CACHE.set(size, table);
  return table;
}

export function dctII(input: Float64Array): Float64Array {
  const n = input.length;
  const output = new Float64Array(n);
  const table = getCosTable(n);
  const scale = Math.sqrt(2 / n);

  for (let k = 0; k < n; k++) {
    let sum = 0;
    const offset = k * n;
    for (let i = 0; i < n; i++) {
      sum += input[i] * table[offset + i];
    }
    output[k] = sum * scale;
  }

  // Orthonormal scaling for k=0
  output[0] = output[0] / Math.sqrt(2);

  return output;
}

export function idctIII(coeffs: Float64Array): Float64Array {
  const n = coeffs.length;
  const output = new Float64Array(n);
  const table = getCosTable(n);
  const scale = Math.sqrt(2 / n);
  const c0 = coeffs[0] / Math.sqrt(2);

  for (let i = 0; i < n; i++) {
    let sum = c0;
    for (let k = 1; k < n; k++) {
      sum += coeffs[k] * table[k * n + i];
    }
    output[i] = sum * scale;
  }

  return output;
}

export function smoothSubtract(input: Float64Array, windowBins: number): Float64Array {
  const n = input.length;
  const output = new Float64Array(n);
  const window = Math.max(1, windowBins | 0);
  const half = Math.floor(window / 2);

  const prefix = new Float64Array(n + 1);
  for (let i = 0; i < n; i++) {
    prefix[i + 1] = prefix[i] + input[i];
  }

  for (let i = 0; i < n; i++) {
    const start = Math.max(0, i - half);
    const end = Math.min(n - 1, i + half);
    const count = end - start + 1;
    const mean = (prefix[end + 1] - prefix[start]) / count;
    output[i] = input[i] - mean;
  }

  return output;
}

export function zNormalize(input: Float64Array): Float64Array {
  const n = input.length;
  const output = new Float64Array(n);
  let sum = 0;

  for (let i = 0; i < n; i++) {
    sum += input[i];
  }

  const mean = sum / n;
  let varianceSum = 0;

  for (let i = 0; i < n; i++) {
    const diff = input[i] - mean;
    varianceSum += diff * diff;
  }

  const stdDev = Math.sqrt(varianceSum / n);
  if (stdDev < 1e-8) {
    return output;
  }

  for (let i = 0; i < n; i++) {
    output[i] = (input[i] - mean) / stdDev;
  }

  return output;
}

export function applyDeviceInvariantTransform(
  magnitude: Float64Array,
  config: DeviceInvariantConfig,
  options: { logEps?: number; smoothWindowBins?: number } = {}
): Float64Array {
  if (config.mode !== 'deviceInvariant') {
    return magnitude;
  }

  const n = magnitude.length;
  const logEps = options.logEps ?? DEFAULT_LOG_EPS;
  const logMag = new Float64Array(n);

  for (let i = 0; i < n; i++) {
    logMag[i] = Math.log(magnitude[i] + logEps);
  }

  let transformed: Float64Array;

  if (config.method === 'smoothSubtract') {
    transformed = smoothSubtract(logMag, options.smoothWindowBins ?? DEFAULT_SMOOTH_WINDOW);
  } else {
    const coeffs = dctII(logMag);
    const lifterK = Math.max(0, Math.min(config.lifterK, coeffs.length - 1));
    for (let k = 0; k <= lifterK; k++) {
      coeffs[k] = 0;
    }
    transformed = idctIII(coeffs);
  }

  if (config.zNorm) {
    return zNormalize(transformed);
  }

  return transformed;
}
