/**
 * ZANOBOT - TYPE DEFINITIONS
 *
 * Core TypeScript interfaces for the entire application.
 * Based on GMIA Technical Report specifications.
 */

/**
 * Machine Identification
 */
export interface Machine {
  id: string;                    // Unique identifier (from barcode/QR or user-generated)
  name: string;                  // Human-readable name
  createdAt: number;             // Timestamp
  lastDiagnosisAt?: number;      // Last diagnosis timestamp
  referenceModel?: GMIAModel;    // Trained reference model (if exists)
}

/**
 * GMIA Model - Trained reference for a machine
 */
export interface GMIAModel {
  machineId: string;
  weightVector: Float64Array;    // w_p vector from GMIA training
  regularization: number;        // λ (lambda) = 10^9
  scalingConstant: number;       // C for tanh scaling
  featureDimension: number;      // Number of frequency bins (default: 512)
  trainingDate: number;          // Timestamp
  trainingDuration: number;      // Recording duration in seconds
  sampleRate: number;            // Audio sample rate (Hz)
  metadata: {
    meanCosineSimilarity: number; // μ for C calculation
    targetScore: number;          // Target score (e.g., 0.9)
  };
}

/**
 * Audio Recording
 */
export interface Recording {
  id: string;
  machineId: string;
  type: 'reference' | 'diagnosis';
  audioBuffer: AudioBuffer;
  timestamp: number;
  duration: number;
  sampleRate: number;
}

/**
 * Feature Vector - Energy Spectral Densities
 */
export interface FeatureVector {
  features: Float64Array;        // Relative features (sum = 1)
  absoluteFeatures: Float64Array; // Absolute energy values
  bins: number;                  // Number of frequency bins
  frequencyRange: [number, number]; // [min, max] Hz
}

/**
 * Diagnosis Result
 */
export interface DiagnosisResult {
  machineId: string;
  timestamp: number;
  healthScore: number;           // 0-100%
  cosineSimilarity: number;      // Raw cosine value
  confidence: number;            // 0-100% (model quality indicator)
  status: 'healthy' | 'uncertain' | 'faulty';
  analysis?: {
    frequencyAnomalies?: Array<{ frequency: number; deviation: number }>;
    hint?: string;
  };
}

/**
 * DSP Processing Configuration
 */
export interface DSPConfig {
  sampleRate: number;            // Default: 44100 Hz
  windowSize: number;            // 0.330s (330ms)
  hopSize: number;               // 0.066s (66ms)
  fftSize: number;               // Calculated from windowSize
  frequencyBins: number;         // Default: 512
  frequencyRange: [number, number]; // [0, 22050] Hz (Nyquist)
}

/**
 * Audio Chunk - Processed sub-signal
 */
export interface AudioChunk {
  samples: Float32Array;
  startTime: number;             // Offset in seconds
  duration: number;              // Chunk duration (0.330s)
  normalized: boolean;           // Whether standardization was applied
}

/**
 * Training Data - Collection of feature vectors
 */
export interface TrainingData {
  featureVectors: Float64Array[]; // Each row is a feature vector
  machineId: string;
  recordingId: string;
  numSamples: number;            // Number of chunks
  config: DSPConfig;
}

/**
 * Settings & Configuration
 */
export interface AppSettings {
  recordingDuration: number;     // Default: 10 seconds
  confidenceThreshold: number;   // Default: 75%
  theme: 'light' | 'dark' | 'brand';
  debugMode: boolean;
}

/**
 * Database Schema for IndexedDB
 */
export interface DBSchema {
  machines: {
    key: string;                 // Machine ID
    value: Machine;
    indexes: {
      'by-name': string;
      'by-created': number;
    };
  };
  recordings: {
    key: string;                 // Recording ID
    value: Recording;
    indexes: {
      'by-machine': string;
      'by-timestamp': number;
    };
  };
  diagnoses: {
    key: string;                 // Diagnosis ID
    value: DiagnosisResult;
    indexes: {
      'by-machine': string;
      'by-timestamp': number;
    };
  };
}
