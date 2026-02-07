export type RecordingSettings = {
  recordingDuration: number; // in seconds
  confidenceThreshold: number; // 0-100 percentage
};

export const RECORDING_SETTINGS_EVENT = 'zanobot:recording-settings-change';

const STORAGE_KEY = 'zanobot.recording.settings';

const defaultSettings: RecordingSettings = {
  recordingDuration: 10,
  confidenceThreshold: 75,
};

const readFromStorage = (): RecordingSettings => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { ...defaultSettings };
    }
    const parsed = JSON.parse(raw) as Partial<RecordingSettings>;
    return {
      recordingDuration: validateRecordingDuration(parsed.recordingDuration),
      confidenceThreshold: validateConfidenceThreshold(parsed.confidenceThreshold),
    };
  } catch {
    return { ...defaultSettings };
  }
};

const validateRecordingDuration = (value: number | undefined): number => {
  if (value === undefined) return defaultSettings.recordingDuration;
  // Only allow 5, 10, or 15 seconds
  if (value === 5 || value === 10 || value === 15) return value;
  return defaultSettings.recordingDuration;
};

const validateConfidenceThreshold = (value: number | undefined): number => {
  if (value === undefined) return defaultSettings.confidenceThreshold;
  // Ensure value is between 0 and 100
  const clamped = Math.max(0, Math.min(100, value));
  return clamped;
};

export const getRecordingSettings = (): RecordingSettings => readFromStorage();

export const setRecordingSettings = (
  updates: Partial<RecordingSettings>
): RecordingSettings => {
  const current = readFromStorage();
  const next: RecordingSettings = {
    recordingDuration: updates.recordingDuration !== undefined
      ? validateRecordingDuration(updates.recordingDuration)
      : current.recordingDuration,
    confidenceThreshold: updates.confidenceThreshold !== undefined
      ? validateConfidenceThreshold(updates.confidenceThreshold)
      : current.confidenceThreshold,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));

    // Only dispatch event if localStorage save was successful
    window.dispatchEvent(
      new CustomEvent<RecordingSettings>(RECORDING_SETTINGS_EVENT, { detail: next })
    );

    return next;
  } catch (error) {
    // Re-throw the error so the caller knows the save failed
    throw new Error(`Failed to save recording settings: ${error instanceof Error ? error.message : 'localStorage not available'}`);
  }
};
