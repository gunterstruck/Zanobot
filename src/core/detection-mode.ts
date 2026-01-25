/**
 * ZANOBOT - Detection Mode Router (Strategy Pattern)
 *
 * Enables clean switching between Level 1 (GMIA) and Level 2 (YAMNet) modes.
 * Implements Strategy Pattern for mode-agnostic detection interface.
 *
 * IMPORTANT: This file bridges Level 1 and Level 2 without modifying either!
 */

import type { DetectionMode } from './ml/level2/types.js';

/**
 * Detection result interface (unified for both modes)
 */
export interface DetectionResult {
  score: number; // Health score (0-100)
  status: 'healthy' | 'warning' | 'critical' | 'uncertain' | 'faulty';
  confidence: number; // Confidence level (0-100)
  message: string; // Human-readable status message
  mode: DetectionMode; // Which detection mode was used
  timestamp: number;
  metadata?: Record<string, unknown>;
}

/**
 * Detection Strategy Interface
 * Both Level 1 and Level 2 can implement this interface
 */
export interface DetectionStrategy {
  mode: DetectionMode;
  isReady(): boolean;
  initialize(): Promise<void>;
  hasReference(): boolean;
  createReference(audioBuffer: AudioBuffer, machineId: string, label?: string): Promise<void>;
  analyze(audioBuffer: AudioBuffer): Promise<DetectionResult>;
  loadReference(machineId: string): Promise<boolean>;
  dispose(): void;
}

/**
 * Storage key for detection mode preference
 */
const DETECTION_MODE_KEY = 'zanobo-detection-mode';

/**
 * Get current detection mode from storage
 */
export function getDetectionMode(): DetectionMode {
  try {
    const stored = localStorage.getItem(DETECTION_MODE_KEY);
    if (stored === 'STATIONARY' || stored === 'CYCLIC') {
      return stored;
    }
  } catch {
    // localStorage not available
  }
  return 'STATIONARY'; // Default to Level 1 (GMIA)
}

/**
 * Save detection mode to storage
 */
export function setDetectionMode(mode: DetectionMode): void {
  try {
    localStorage.setItem(DETECTION_MODE_KEY, mode);
  } catch {
    // localStorage not available
  }
}

/**
 * Detection Mode Configuration
 */
export interface DetectionModeConfig {
  mode: DetectionMode;
  name: string;
  description: string;
  icon: string;
  features: string[];
}

/**
 * Available detection modes with descriptions
 */
export const DETECTION_MODES: Record<DetectionMode, DetectionModeConfig> = {
  STATIONARY: {
    mode: 'STATIONARY',
    name: 'Level 1: Stationäre Geräusche (GMIA)',
    description: 'Für kontinuierlich laufende Maschinen wie Ventilatoren, Pumpen, Kompressoren',
    icon: '📊',
    features: [
      'Frequenzanalyse mit FFT',
      'Gaussian Model für statistische Erkennung',
      'Schnelle lokale Verarbeitung',
      'Keine ML-Bibliothek erforderlich',
    ],
  },
  CYCLIC: {
    mode: 'CYCLIC',
    name: 'Level 2: Zyklische Geräusche (ML)',
    description:
      'Für Maschinen mit wiederkehrenden Abläufen wie Verpackungsmaschinen, Montagelinien',
    icon: '🔄',
    features: [
      'YAMNet Deep Learning Model',
      'Referenzlauf-Vergleich',
      'Mel-Spektrogramm Visualisierung',
      'WebGPU-beschleunigte Inferenz',
    ],
  },
};

/**
 * Check if Level 2 is available (TensorFlow.js loaded)
 */
export async function isLevel2Available(): Promise<boolean> {
  try {
    // Dynamic import to check availability
    await import('@tensorflow/tfjs');
    return true;
  } catch {
    return false;
  }
}

/**
 * Mode Change Event
 */
export type ModeChangeCallback = (newMode: DetectionMode, oldMode: DetectionMode) => void;

/**
 * Detection Mode Manager
 *
 * Manages mode switching and notifies listeners
 */
export class DetectionModeManager {
  private currentMode: DetectionMode;
  private listeners: Set<ModeChangeCallback> = new Set();

  constructor() {
    this.currentMode = getDetectionMode();
  }

  /**
   * Get current detection mode
   */
  getMode(): DetectionMode {
    return this.currentMode;
  }

  /**
   * Set detection mode
   */
  setMode(mode: DetectionMode): void {
    if (mode === this.currentMode) return;

    const oldMode = this.currentMode;
    this.currentMode = mode;
    setDetectionMode(mode);

    // Notify listeners
    this.listeners.forEach((callback) => {
      try {
        callback(mode, oldMode);
      } catch (error) {
        console.error('Mode change listener error:', error);
      }
    });
  }

  /**
   * Toggle between modes
   */
  toggleMode(): DetectionMode {
    const newMode = this.currentMode === 'STATIONARY' ? 'CYCLIC' : 'STATIONARY';
    this.setMode(newMode);
    return newMode;
  }

  /**
   * Subscribe to mode changes
   */
  onModeChange(callback: ModeChangeCallback): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Get mode configuration
   */
  getModeConfig(): DetectionModeConfig {
    return DETECTION_MODES[this.currentMode];
  }

  /**
   * Check if current mode is Level 2
   */
  isLevel2(): boolean {
    return this.currentMode === 'CYCLIC';
  }

  /**
   * Check if current mode is Level 1
   */
  isLevel1(): boolean {
    return this.currentMode === 'STATIONARY';
  }
}

/**
 * Singleton instance
 */
let modeManagerInstance: DetectionModeManager | null = null;

/**
 * Get the global DetectionModeManager instance
 */
export function getDetectionModeManager(): DetectionModeManager {
  if (!modeManagerInstance) {
    modeManagerInstance = new DetectionModeManager();
  }
  return modeManagerInstance;
}
