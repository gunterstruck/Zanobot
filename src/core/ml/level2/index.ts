/**
 * ZANOBOT Level 2 - Module Exports
 *
 * Re-exports all Level 2 components for convenient importing
 */

// Main detector
export { Level2Detector } from './level2-detector.js';

// Core components
export { YAMNetExtractor } from './yamnet-extractor.js';
export { SimilarityCalculator } from './similarity-calculator.js';

// Types
export type {
  Level2Reference,
  Level2ReferenceStored,
  Level2AnalysisResult,
  Level2DetectorState,
  Level2DetectorEvents,
  DetectionMode,
  Level2AppSettings,
} from './types.js';

export type { HealthStatus, HealthStatusResult } from './similarity-calculator.js';

// Utilities
export {
  serializeReference,
  deserializeReference,
  DEFAULT_LEVEL2_SETTINGS,
} from './types.js';
