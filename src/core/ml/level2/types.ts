/**
 * ZANOBOT Level 2 - Type Definitions
 *
 * TypeScript interfaces for Level 2 (ML-based cyclic machine analysis)
 */

import type { HealthStatusResult } from './similarity-calculator.js';

/**
 * Level 2 Reference Model
 * Stored reference for a machine's healthy state
 */
export interface Level2Reference {
  machineId: string;
  label: string; // State label (e.g., "Healthy Baseline", "Operating Mode A")
  embedding: Float32Array; // 1024-dimensional YAMNet embedding
  createdAt: number; // Timestamp
  duration: number; // Recording duration in seconds
  sampleRate: number; // Original sample rate before resampling
  metadata?: {
    backendUsed?: string; // TensorFlow backend used
    modelVersion?: string; // YAMNet model version
    notes?: string; // User notes
  };
}

/**
 * Level 2 Analysis Result
 */
export interface Level2AnalysisResult {
  similarity: number; // Cosine similarity (0.0 to 1.0)
  percentage: number; // Similarity as percentage (0-100)
  status: HealthStatusResult; // Health status classification
  spectrogram: number[][]; // Mel-spectrogram for visualization
  analysisTime: number; // Time taken for analysis in ms
  timestamp: number; // Analysis timestamp
}

/**
 * Serializable Level 2 Reference for IndexedDB
 * Float32Array must be converted to regular array for storage
 */
export interface Level2ReferenceStored {
  machineId: string;
  label: string;
  embedding: number[]; // Serialized Float32Array
  createdAt: number;
  duration: number;
  sampleRate: number;
  metadata?: {
    backendUsed?: string;
    modelVersion?: string;
    notes?: string;
  };
}

/**
 * Convert Level2Reference to storable format
 */
export function serializeReference(ref: Level2Reference): Level2ReferenceStored {
  return {
    ...ref,
    embedding: Array.from(ref.embedding),
  };
}

/**
 * Convert stored format back to Level2Reference
 */
export function deserializeReference(stored: Level2ReferenceStored): Level2Reference {
  return {
    ...stored,
    embedding: new Float32Array(stored.embedding),
  };
}

/**
 * Level 2 Detector State
 */
export type Level2DetectorState =
  | 'uninitialized'
  | 'initializing'
  | 'ready'
  | 'recording'
  | 'analyzing'
  | 'error';

/**
 * Level 2 Detector Events
 */
export interface Level2DetectorEvents {
  onStateChange?: (state: Level2DetectorState) => void;
  onProgress?: (progress: number, message: string) => void;
  onError?: (error: Error) => void;
  onAnalysisComplete?: (result: Level2AnalysisResult) => void;
  onReferenceCreated?: (reference: Level2Reference) => void;
}

/**
 * Detection Mode (Level 1 vs Level 2)
 */
export type DetectionMode = 'STATIONARY' | 'CYCLIC';

/**
 * Extended App Settings with detection mode
 */
export interface Level2AppSettings {
  detectionMode: DetectionMode;
  level2: {
    healthyThreshold: number; // Default: 0.85
    warningThreshold: number; // Default: 0.70
    recordingDuration: number; // Default: 10 seconds
    autoLoadReference: boolean; // Auto-load last reference on startup
  };
}

/**
 * Default Level 2 settings
 */
export const DEFAULT_LEVEL2_SETTINGS: Level2AppSettings['level2'] = {
  healthyThreshold: 0.85,
  warningThreshold: 0.7,
  recordingDuration: 10,
  autoLoadReference: true,
};
