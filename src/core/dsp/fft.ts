/**
 * ZANOBOT - FFT (Fast Fourier Transform)
 *
 * Implements FFT for audio signal processing.
 * Based on Cooley-Tukey radix-2 algorithm.
 *
 * Reference: Technical Report Section 2.2 (Signal Processing)
 */

/**
 * Complex number representation
 */
interface Complex {
  real: number;
  imag: number;
}

/**
 * Perform FFT on real-valued input signal
 *
 * @param signal - Input time-domain signal (must be power of 2 length)
 * @returns Complex frequency-domain representation
 */
export function fft(signal: Float32Array): Complex[] {
  const n = signal.length;

  // Ensure input length is power of 2
  if (!isPowerOfTwo(n)) {
    throw new Error(`FFT input length must be power of 2, got ${n}`);
  }

  // Convert real signal to complex
  const complex: Complex[] = Array.from(signal, (real) => ({ real, imag: 0 }));

  // Perform FFT
  return fftRecursive(complex);
}

/**
 * Recursive FFT implementation (Cooley-Tukey)
 */
function fftRecursive(x: Complex[]): Complex[] {
  const n = x.length;

  // Base case
  if (n === 1) {
    return x;
  }

  // Divide
  const even: Complex[] = [];
  const odd: Complex[] = [];

  for (let i = 0; i < n; i++) {
    if (i % 2 === 0) {
      even.push(x[i]);
    } else {
      odd.push(x[i]);
    }
  }

  // Conquer
  const fftEven = fftRecursive(even);
  const fftOdd = fftRecursive(odd);

  // Combine
  const result: Complex[] = new Array(n);

  for (let k = 0; k < n / 2; k++) {
    // Twiddle factor: e^(-2πik/n)
    const angle = (-2 * Math.PI * k) / n;
    const twiddle: Complex = {
      real: Math.cos(angle),
      imag: Math.sin(angle),
    };

    // Complex multiplication: twiddle * fftOdd[k]
    const t: Complex = complexMultiply(twiddle, fftOdd[k]);

    // Butterfly operation
    result[k] = complexAdd(fftEven[k], t);
    result[k + n / 2] = complexSubtract(fftEven[k], t);
  }

  return result;
}

/**
 * Calculate magnitude (absolute value) of FFT output
 *
 * @param fftResult - Complex FFT output
 * @returns Magnitude spectrum (real values)
 */
export function getMagnitude(fftResult: Complex[]): Float64Array {
  const magnitude = new Float64Array(fftResult.length);

  for (let i = 0; i < fftResult.length; i++) {
    const { real, imag } = fftResult[i];
    magnitude[i] = Math.sqrt(real * real + imag * imag);
  }

  return magnitude;
}

/**
 * Calculate power spectrum (magnitude squared)
 *
 * @param fftResult - Complex FFT output
 * @returns Power spectrum
 */
export function getPowerSpectrum(fftResult: Complex[]): Float64Array {
  const power = new Float64Array(fftResult.length);

  for (let i = 0; i < fftResult.length; i++) {
    const { real, imag } = fftResult[i];
    power[i] = real * real + imag * imag;
  }

  return power;
}

/**
 * Apply Hanning window to reduce spectral leakage
 *
 * @param signal - Input signal
 * @returns Windowed signal
 */
export function applyHanningWindow(signal: Float32Array): Float32Array {
  const n = signal.length;
  const windowed = new Float32Array(n);

  for (let i = 0; i < n; i++) {
    const windowValue = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (n - 1)));
    windowed[i] = signal[i] * windowValue;
  }

  return windowed;
}

/**
 * Pad signal to next power of 2 length
 *
 * @param signal - Input signal
 * @returns Zero-padded signal
 */
export function padToPowerOfTwo(signal: Float32Array): Float32Array {
  const n = signal.length;
  const nextPower = nextPowerOfTwo(n);

  if (n === nextPower) {
    return signal;
  }

  const padded = new Float32Array(nextPower);
  padded.set(signal);

  return padded;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function complexAdd(a: Complex, b: Complex): Complex {
  return {
    real: a.real + b.real,
    imag: a.imag + b.imag,
  };
}

function complexSubtract(a: Complex, b: Complex): Complex {
  return {
    real: a.real - b.real,
    imag: a.imag - b.imag,
  };
}

function complexMultiply(a: Complex, b: Complex): Complex {
  return {
    real: a.real * b.real - a.imag * b.imag,
    imag: a.real * b.imag + a.imag * b.real,
  };
}

function isPowerOfTwo(n: number): boolean {
  return n > 0 && (n & (n - 1)) === 0;
}

function nextPowerOfTwo(n: number): number {
  return Math.pow(2, Math.ceil(Math.log2(n)));
}
