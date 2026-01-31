import type {
  DeviceInvariantConfig,
  DeviceInvariantMethod,
  FeatureMode,
} from '@data/types.js';

export type DeviceInvariantStrength = 'low' | 'medium' | 'high';

export interface DeviceInvariantSettings {
  enabled: boolean;
  method: DeviceInvariantMethod;
  strength: DeviceInvariantStrength;
  lifterK: number;
  zNorm: boolean;
}

export interface DeviceInvariantMismatchRecord {
  details: DeviceInvariantDetails;
  source: 'import' | 'model';
  timestamp: number;
}

export interface DeviceInvariantDetails {
  featureMode: FeatureMode;
  method: DeviceInvariantMethod;
  lifterK: number;
  zNorm: boolean;
}

const STORAGE_KEY = 'zanobot.deviceInvariant.settings';
const MISMATCH_KEY = 'zanobot.deviceInvariant.mismatch';

const STRENGTH_TO_K: Record<DeviceInvariantStrength, number> = {
  low: 3,
  medium: 6,
  high: 10,
};

const DEFAULT_SETTINGS: DeviceInvariantSettings = {
  enabled: false,
  method: 'dctLifter',
  strength: 'medium',
  lifterK: STRENGTH_TO_K.medium,
  zNorm: true,
};

export function getStrengthForK(lifterK: number): DeviceInvariantStrength {
  const entries = Object.entries(STRENGTH_TO_K) as Array<[DeviceInvariantStrength, number]>;
  let closest: DeviceInvariantStrength = 'medium';
  let bestDistance = Number.POSITIVE_INFINITY;

  for (const [strength, k] of entries) {
    const distance = Math.abs(k - lifterK);
    if (distance < bestDistance) {
      bestDistance = distance;
      closest = strength;
    }
  }

  return closest;
}

function normalizeSettings(raw?: Partial<DeviceInvariantSettings>): DeviceInvariantSettings {
  if (!raw) {
    return { ...DEFAULT_SETTINGS };
  }

  const method: DeviceInvariantMethod =
    raw.method === 'smoothSubtract' || raw.method === 'dctLifter'
      ? raw.method
      : DEFAULT_SETTINGS.method;
  const strength: DeviceInvariantStrength =
    raw.strength === 'low' || raw.strength === 'high' || raw.strength === 'medium'
      ? raw.strength
      : DEFAULT_SETTINGS.strength;
  const lifterK =
    typeof raw.lifterK === 'number' && Number.isFinite(raw.lifterK)
      ? Math.max(0, Math.round(raw.lifterK))
      : STRENGTH_TO_K[strength];

  return {
    enabled: typeof raw.enabled === 'boolean' ? raw.enabled : DEFAULT_SETTINGS.enabled,
    method,
    strength,
    lifterK,
    zNorm: typeof raw.zNorm === 'boolean' ? raw.zNorm : DEFAULT_SETTINGS.zNorm,
  };
}

export function getDeviceInvariantSettings(): DeviceInvariantSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...DEFAULT_SETTINGS };
    }
    const parsed = JSON.parse(raw) as Partial<DeviceInvariantSettings>;
    return normalizeSettings(parsed);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export function setDeviceInvariantSettings(
  update: Partial<DeviceInvariantSettings>
): DeviceInvariantSettings {
  const current = getDeviceInvariantSettings();
  const merged = normalizeSettings({ ...current, ...update });

  const strength = update.strength ?? merged.strength;
  if (update.strength) {
    merged.lifterK = STRENGTH_TO_K[strength];
  } else if (update.lifterK !== undefined) {
    merged.strength = getStrengthForK(merged.lifterK);
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // Ignore storage errors (private mode)
  }

  return merged;
}

export function getDeviceInvariantConfig(): DeviceInvariantConfig {
  const settings = getDeviceInvariantSettings();
  return {
    mode: settings.enabled ? 'deviceInvariant' : 'baseline',
    method: settings.method,
    lifterK: settings.lifterK,
    zNorm: settings.zNorm,
  };
}

export function getDeviceInvariantDetailsFromSettings(): DeviceInvariantDetails {
  const settings = getDeviceInvariantSettings();
  return {
    featureMode: settings.enabled ? 'deviceInvariant' : 'baseline',
    method: settings.method,
    lifterK: settings.lifterK,
    zNorm: settings.zNorm,
  };
}

export function applyDeviceInvariantDetails(details: DeviceInvariantDetails): DeviceInvariantSettings {
  return setDeviceInvariantSettings({
    enabled: details.featureMode === 'deviceInvariant',
    method: details.method,
    lifterK: details.lifterK,
    strength: getStrengthForK(details.lifterK),
    zNorm: details.zNorm,
  });
}

export function setDeviceInvariantMismatch(
  details: DeviceInvariantDetails,
  source: DeviceInvariantMismatchRecord['source']
): void {
  const payload: DeviceInvariantMismatchRecord = {
    details,
    source,
    timestamp: Date.now(),
  };

  try {
    localStorage.setItem(MISMATCH_KEY, JSON.stringify(payload));
  } catch {
    // Ignore storage errors
  }
}

export function getDeviceInvariantMismatch(): DeviceInvariantMismatchRecord | null {
  try {
    const raw = localStorage.getItem(MISMATCH_KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as DeviceInvariantMismatchRecord;
    if (!parsed?.details) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearDeviceInvariantMismatch(): void {
  try {
    localStorage.removeItem(MISMATCH_KEY);
  } catch {
    // Ignore storage errors
  }
}
