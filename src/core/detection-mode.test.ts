/**
 * ZANOBOT - Detection Mode Tests
 *
 * Unit tests for detection mode management and switching.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  getDetectionMode,
  setDetectionMode,
  DETECTION_MODES,
  DetectionModeManager,
  getDetectionModeManager,
} from './detection-mode.js';

describe('Detection Mode', () => {
  // Mock localStorage
  const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  beforeEach(() => {
    // Setup localStorage mock
    Object.defineProperty(global, 'localStorage', { value: localStorageMock });
    localStorageMock.clear();
  });

  afterEach(() => {
    localStorageMock.clear();
  });

  describe('getDetectionMode', () => {
    it('should return STATIONARY as default', () => {
      const mode = getDetectionMode();
      expect(mode).toBe('STATIONARY');
    });

    it('should return stored value if valid', () => {
      localStorageMock.setItem('zanobo-detection-mode', 'CYCLIC');
      const mode = getDetectionMode();
      expect(mode).toBe('CYCLIC');
    });

    it('should return default for invalid stored value', () => {
      localStorageMock.setItem('zanobo-detection-mode', 'INVALID');
      const mode = getDetectionMode();
      expect(mode).toBe('STATIONARY');
    });
  });

  describe('setDetectionMode', () => {
    it('should store STATIONARY mode', () => {
      setDetectionMode('STATIONARY');
      expect(localStorageMock.getItem('zanobo-detection-mode')).toBe('STATIONARY');
    });

    it('should store CYCLIC mode', () => {
      setDetectionMode('CYCLIC');
      expect(localStorageMock.getItem('zanobo-detection-mode')).toBe('CYCLIC');
    });
  });

  describe('DETECTION_MODES', () => {
    it('should have STATIONARY configuration', () => {
      const config = DETECTION_MODES.STATIONARY;
      expect(config.mode).toBe('STATIONARY');
      expect(config.name).toBeTruthy();
      expect(config.description).toBeTruthy();
      expect(config.icon).toBeTruthy();
      expect(config.features.length).toBeGreaterThan(0);
    });

    it('should have CYCLIC configuration', () => {
      const config = DETECTION_MODES.CYCLIC;
      expect(config.mode).toBe('CYCLIC');
      expect(config.name).toBeTruthy();
      expect(config.description).toBeTruthy();
      expect(config.icon).toBeTruthy();
      expect(config.features.length).toBeGreaterThan(0);
    });

    it('should have different icons for each mode', () => {
      expect(DETECTION_MODES.STATIONARY.icon).not.toBe(DETECTION_MODES.CYCLIC.icon);
    });
  });

  describe('DetectionModeManager', () => {
    let manager: DetectionModeManager;

    beforeEach(() => {
      localStorageMock.clear();
      manager = new DetectionModeManager();
    });

    it('should initialize with default mode', () => {
      expect(manager.getMode()).toBe('STATIONARY');
    });

    it('should initialize with stored mode', () => {
      localStorageMock.setItem('zanobo-detection-mode', 'CYCLIC');
      const newManager = new DetectionModeManager();
      expect(newManager.getMode()).toBe('CYCLIC');
    });

    it('should set mode and persist', () => {
      manager.setMode('CYCLIC');
      expect(manager.getMode()).toBe('CYCLIC');
      expect(localStorageMock.getItem('zanobo-detection-mode')).toBe('CYCLIC');
    });

    it('should not trigger change for same mode', () => {
      const callback = vi.fn();
      manager.onModeChange(callback);

      manager.setMode('STATIONARY'); // Same as default
      expect(callback).not.toHaveBeenCalled();
    });

    it('should trigger change callback', () => {
      const callback = vi.fn();
      manager.onModeChange(callback);

      manager.setMode('CYCLIC');
      expect(callback).toHaveBeenCalledWith('CYCLIC', 'STATIONARY');
    });

    it('should unsubscribe from changes', () => {
      const callback = vi.fn();
      const unsubscribe = manager.onModeChange(callback);

      manager.setMode('CYCLIC');
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();

      manager.setMode('STATIONARY');
      expect(callback).toHaveBeenCalledTimes(1); // Still 1
    });

    it('should toggle mode', () => {
      expect(manager.getMode()).toBe('STATIONARY');

      const newMode = manager.toggleMode();
      expect(newMode).toBe('CYCLIC');
      expect(manager.getMode()).toBe('CYCLIC');

      const nextMode = manager.toggleMode();
      expect(nextMode).toBe('STATIONARY');
      expect(manager.getMode()).toBe('STATIONARY');
    });

    it('should return correct mode config', () => {
      const config = manager.getModeConfig();
      expect(config).toEqual(DETECTION_MODES.STATIONARY);

      manager.setMode('CYCLIC');
      const cyclicConfig = manager.getModeConfig();
      expect(cyclicConfig).toEqual(DETECTION_MODES.CYCLIC);
    });

    it('should correctly identify Level 1', () => {
      expect(manager.isLevel1()).toBe(true);
      expect(manager.isLevel2()).toBe(false);
    });

    it('should correctly identify Level 2', () => {
      manager.setMode('CYCLIC');
      expect(manager.isLevel1()).toBe(false);
      expect(manager.isLevel2()).toBe(true);
    });
  });

  describe('getDetectionModeManager', () => {
    it('should return singleton instance', () => {
      const manager1 = getDetectionModeManager();
      const manager2 = getDetectionModeManager();
      expect(manager1).toBe(manager2);
    });
  });
});
