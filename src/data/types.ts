/**
 * ZANOBOT - TYPE DEFINITIONS
 *
 * Core TypeScript interfaces for the entire application.
 * Based on GMIA specifications.
 */

/**
 * Machine Identification
 */
export interface Machine {
  id: string; // Unique identifier (from barcode/QR or user-generated)
  name: string; // Human-readable name
  createdAt: number; // Timestamp
  lastDiagnosisAt?: number; // Last diagnosis timestamp
  referenceModels: GMIAModel[]; // Trained reference models (multiclass diagnosis)
  referenceImage?: Blob; // Optional reference image for visual positioning (Ghost Image Overlay)

  // NFC/Service Technician Setup Fields
  referenceDbUrl?: string; // Google Drive direct download URL for reference database
  location?: string; // Machine location (e.g., "Halle 3, Linie 2")
  notes?: string; // Additional notes for service technicians
  referenceDbVersion?: string; // Version of the downloaded reference database
  referenceDbLoaded?: boolean; // Whether the reference DB has been downloaded
}

/**
 * GMIA Model - Trained reference for a machine
 */
export interface GMIAModel {
  machineId: string;
  label: string; // State label (e.g., "Baseline", "Lagerschaden", "Unwucht")
  type: 'healthy' | 'faulty'; // State type: healthy = normal operation, faulty = known failure mode
  weightVector: Float64Array; // w_p vector from GMIA training
  regularization: number; // λ (lambda) = 10^9
  scalingConstant: number; // C for tanh scaling
  featureDimension: number; // Number of frequency bins (default: 512)
  trainingDate: number; // Timestamp
  trainingDuration: number; // Recording duration in seconds
  sampleRate: number; // Audio sample rate (Hz)
  baselineScore?: number; // Self-recognition score (model tested against its own training data)
  metadata: {
    meanCosineSimilarity: number; // μ for C calculation
    targetScore: number; // Target score (e.g., 0.9)
    weightMagnitude?: number; // L2 norm of weight vector (for signal quality validation)
    featureMode?: FeatureMode; // "baseline" or "deviceInvariant"
    featureModeDetails?: {
      method: DeviceInvariantMethod;
      lifterK: number;
      zNorm: boolean;
    };
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
  features: Float64Array; // Relative features (sum = 1 in baseline mode)
  normalizedFeatures?: Float64Array; // Alias for relative features (backward/forward compatibility)
  absoluteFeatures: Float64Array; // Absolute energy values
  bins: number; // Number of frequency bins
  frequencyRange: [number, number]; // [min, max] Hz
  rmsAmplitude?: number; // RMS amplitude BEFORE standardization (preserves signal strength) - OPTIONAL for backward compatibility
}

/**
 * Recording Quality Assessment Result
 * Used to evaluate reference recordings before saving
 */
export interface QualityResult {
  score: number; // 0-100 (higher is better)
  rating: 'GOOD' | 'OK' | 'BAD'; // Qualitative rating
  issues: string[]; // List of detected issues (empty if GOOD)
  metadata?: {
    variance: number; // Spectral variance across time
    stability: number; // Signal stability metric
    outlierCount: number; // Number of outlier frames detected
    signalMagnitude?: number; // L2 norm of mean feature vector (used for brown noise detection)
    frameSimilarity?: number; // Median cosine similarity to median frame
    signalSnr?: number; // Peak-to-median ratio of mean spectrum
  };
}

/**
 * Diagnosis Result
 */
export interface DiagnosisResult {
  id: string;
  machineId: string;
  timestamp: number;
  healthScore: number; // 0-100%
  status: 'healthy' | 'uncertain' | 'faulty'; // Strict type for proper type checking
  confidence: number; // 0-100% (model quality indicator)
  rawCosineSimilarity?: number; // Raw cosine value (optional for real-time)
  metadata?: Record<string, unknown>; // Flexible metadata
  analysis?: {
    frequencyAnomalies?: Array<{ frequency: number; deviation: number }>;
    hint?: string;
  };
}

/**
 * DSP Processing Configuration
 */
export interface DSPConfig {
  sampleRate: number; // Default: 44100 Hz
  windowSize: number; // 0.330s (330ms)
  hopSize: number; // 0.066s (66ms)
  fftSize: number; // Calculated from windowSize
  frequencyBins: number; // Default: 512
  frequencyRange: [number, number]; // [0, 22050] Hz (Nyquist)
  deviceInvariant?: DeviceInvariantConfig;
}

export type FeatureMode = 'baseline' | 'deviceInvariant';

export type DeviceInvariantMethod = 'dctLifter' | 'smoothSubtract';

export interface DeviceInvariantConfig {
  mode: FeatureMode;
  method: DeviceInvariantMethod;
  lifterK: number;
  zNorm: boolean;
}

/**
 * Audio Chunk - Processed sub-signal
 */
export interface AudioChunk {
  samples: Float32Array;
  startTime: number; // Offset in seconds
  duration: number; // Chunk duration (0.330s)
  normalized: boolean; // Whether standardization was applied
}

/**
 * Training Data - Collection of feature vectors
 */
export interface TrainingData {
  featureVectors: Float64Array[]; // Each row is a feature vector
  machineId: string;
  recordingId: string;
  numSamples: number; // Number of chunks
  config: DSPConfig;
}

/**
 * Detection Mode (Level 1 vs Level 2)
 */
export type DetectionMode = 'STATIONARY' | 'CYCLIC';

/**
 * Settings & Configuration
 */
export interface AppSettings {
  recordingDuration: number; // Default: 10 seconds
  confidenceThreshold: number; // Default: 75%
  theme: 'light' | 'dark' | 'brand';
  debugMode: boolean;
  detectionMode: DetectionMode; // Default: 'STATIONARY' (Level 1)
}

/**
 * Reference Database File Format - Official format for Google Drive files
 *
 * This is the expected format for reference database files stored in Google Drive.
 * Contains metadata about the database version and origin.
 *
 * Example:
 * {
 *   "db_meta": {
 *     "db_version": "1.0.0",
 *     "created_by": "service",
 *     "created_at": "2025-01-15",
 *     "description": "Normalbetrieb 50 Hz"
 *   },
 *   "models": [...],
 *   "references": [...]
 * }
 */
export interface ReferenceDbMeta {
  db_version: string; // Semantic version (e.g., "1.0.0")
  created_by: string; // Creator identifier (e.g., "service")
  created_at: string; // ISO date string (YYYY-MM-DD)
  description?: string; // Optional description of the database
}

export interface ReferenceDbFile {
  db_meta: ReferenceDbMeta;
  models: GMIAModel[]; // Official reference models
  references?: unknown[]; // Additional reference data (for future use)
  // Legacy fields (for backward compatibility)
  referenceModels?: GMIAModel[];
  machineName?: string;
  location?: string;
  notes?: string;
  config?: Record<string, unknown>;
}

/**
 * Reference Database - Local storage format for downloaded reference data
 * Contains pre-trained reference models and machine configuration
 */
export interface ReferenceDatabase {
  machineId: string; // Links to Machine.id
  version: string; // Database version for update checking (from db_meta.db_version)
  downloadedAt: number; // Timestamp when downloaded
  sourceUrl: string; // Original download URL
  dbMeta?: ReferenceDbMeta; // Original metadata from the file
  data: {
    // Reference models that can be imported
    referenceModels?: GMIAModel[];
    // Machine metadata
    machineName?: string;
    location?: string;
    notes?: string;
    // Any additional configuration
    config?: Record<string, unknown>;
  };
  // Track locally added references (by user)
  localModels?: GMIAModel[]; // Models added locally after initial download
  localModelsUpdatedAt?: number; // Timestamp of last local modification
}

/**
 * Database Schema for IndexedDB
 */
export interface DBSchema {
  machines: {
    key: string; // Machine ID
    value: Machine;
    indexes: {
      'by-name': string;
      'by-created': number;
    };
  };
  recordings: {
    key: string; // Recording ID
    value: Recording;
    indexes: {
      'by-machine': string;
      'by-timestamp': number;
    };
  };
  diagnoses: {
    key: string; // Diagnosis ID
    value: DiagnosisResult;
    indexes: {
      'by-machine': string;
      'by-timestamp': number;
    };
  };
}
