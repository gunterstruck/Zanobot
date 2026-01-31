import type { DeviceInvariantConfig, GMIAModel } from '@data/types.js';
import {
  getStrengthForK,
  type DeviceInvariantDetails,
} from './deviceInvariantSettings.js';

export interface FeatureModeSummary {
  details: DeviceInvariantDetails;
  hasMixedDetails: boolean;
}

export function getFeatureModeDetailsFromModel(model: GMIAModel): DeviceInvariantDetails {
  const featureMode = model.metadata?.featureMode ?? 'baseline';
  const details = model.metadata?.featureModeDetails;

  return {
    featureMode,
    method: details?.method ?? 'dctLifter',
    lifterK: details?.lifterK ?? 6,
    zNorm: details?.zNorm ?? true,
  };
}

export function getFeatureModeDetailsFromConfig(
  config: DeviceInvariantConfig
): DeviceInvariantDetails {
  return {
    featureMode: config.mode,
    method: config.method,
    lifterK: config.lifterK,
    zNorm: config.zNorm,
  };
}

export function getFeatureModeSummary(models: GMIAModel[]): FeatureModeSummary | null {
  if (!models || models.length === 0) {
    return null;
  }

  const first = getFeatureModeDetailsFromModel(models[0]);
  const hasMixedDetails = models.some((model) => {
    const details = getFeatureModeDetailsFromModel(model);
    return (
      details.featureMode !== first.featureMode ||
      details.method !== first.method ||
      details.lifterK !== first.lifterK ||
      details.zNorm !== first.zNorm
    );
  });

  return { details: first, hasMixedDetails };
}

export function isFeatureModeMatch(
  config: DeviceInvariantConfig,
  details: DeviceInvariantDetails
): boolean {
  return (
    config.mode === details.featureMode &&
    config.method === details.method &&
    config.lifterK === details.lifterK &&
    config.zNorm === details.zNorm
  );
}

export function formatFeatureModeDetails(
  details: DeviceInvariantDetails,
  translate: (key: string, params?: Record<string, string>) => string
): string {
  const modeLabel =
    details.featureMode === 'baseline'
      ? translate('settingsUI.deviceInvariantModeBaseline')
      : translate('settingsUI.deviceInvariantModeDim');
  const methodLabel =
    details.method === 'smoothSubtract'
      ? translate('settingsUI.deviceInvariantMethodSmooth')
      : translate('settingsUI.deviceInvariantMethodDct');
  const strength = getStrengthForK(details.lifterK);
  const strengthKey =
    strength === 'low'
      ? 'settingsUI.deviceInvariantStrengthLow'
      : strength === 'high'
        ? 'settingsUI.deviceInvariantStrengthHigh'
        : 'settingsUI.deviceInvariantStrengthMedium';
  const strengthLabel = translate(strengthKey);
  const zNormLabel = details.zNorm
    ? translate('settingsUI.deviceInvariantZNormOn')
    : translate('settingsUI.deviceInvariantZNormOff');

  return translate('diagnosisResults.featureModeValue', {
    mode: modeLabel,
    method: methodLabel,
    strength: strengthLabel,
    zNorm: zNormLabel,
  });
}
