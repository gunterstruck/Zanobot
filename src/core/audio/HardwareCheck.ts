/**
 * ZANOBOT - AUDIO HARDWARE INTELLIGENCE
 *
 * Detects problematic microphones (Jabra, Headsets, Bluetooth)
 * that might filter out machine sounds and cause poor training quality.
 *
 * Features:
 * - Hardware label analysis (keyword detection)
 * - Sample rate validation
 * - Real-time device enumeration
 */

import { logger } from '@utils/logger.js';

/**
 * Audio Quality Report
 * Represents the assessment of current audio hardware
 */
export interface AudioQualityReport {
  status: 'good' | 'warning';
  reason: string;
  deviceLabel: string;
  sampleRate: number;
  recommendations?: string[];
}

/**
 * Device Info for selection UI
 */
export interface AudioDeviceInfo {
  deviceId: string;
  label: string;
  kind: MediaDeviceKind;
  groupId: string;
}

/**
 * HardwareCheck - Audio Hardware Intelligence
 *
 * Analyzes microphone quality and provides recommendations.
 */
export class HardwareCheck {
  // Known problematic keywords in device labels
  private static readonly PROBLEMATIC_KEYWORDS = [
    'jabra',
    'plantronics',
    'sennheiser',
    'hands-free',
    'handsfree',
    'headset',
    'airpods',
    'bluetooth',
    'bt audio',
    'wireless',
  ];

  // Minimum recommended sample rate (44.1 kHz)
  private static readonly MIN_SAMPLE_RATE = 44100;

  /**
   * Analyze current audio device
   *
   * @param label - Device label from MediaDeviceInfo or getUserMedia
   * @param sampleRate - Sample rate in Hz
   * @returns Audio quality report with status and recommendations
   */
  public static analyzeCurrentDevice(
    label: string,
    sampleRate: number
  ): AudioQualityReport {
    const report: AudioQualityReport = {
      status: 'good',
      reason: 'Hardware geeignet für Maschinendiagnose',
      deviceLabel: label,
      sampleRate,
      recommendations: [],
    };

    // Check 1: Device label for problematic keywords
    const lowerLabel = label.toLowerCase();
    const foundKeyword = this.PROBLEMATIC_KEYWORDS.find((keyword) =>
      lowerLabel.includes(keyword)
    );

    if (foundKeyword) {
      report.status = 'warning';
      report.reason = 'Sprach-optimierte Hardware filtert Maschinengeräusche.';
      report.recommendations = [
        'Verwenden Sie ein Studio-Mikrofon oder das eingebaute Geräte-Mikrofon',
        'Headsets und Bluetooth-Geräte sind für Sprachanrufe optimiert',
        'Maschinengeräusche könnten gefiltert oder unterdrückt werden',
      ];

      logger.warn(
        `⚠️ Problematic audio hardware detected: "${label}" (keyword: "${foundKeyword}")`
      );
      return report;
    }

    // Check 2: Sample rate validation
    if (sampleRate < this.MIN_SAMPLE_RATE) {
      report.status = 'warning';
      report.reason = `Sample Rate zu niedrig (${sampleRate} Hz < 44.1 kHz).`;
      report.recommendations = [
        `Aktuelle Sample Rate: ${sampleRate} Hz`,
        `Empfohlen: ${this.MIN_SAMPLE_RATE} Hz oder höher`,
        'Niedrige Sample Rates können hochfrequente Maschinensignale nicht erfassen',
      ];

      logger.warn(
        `⚠️ Low sample rate detected: ${sampleRate} Hz (recommended: ${this.MIN_SAMPLE_RATE} Hz)`
      );
      return report;
    }

    // All checks passed
    logger.info(`✅ Audio hardware check passed: "${label}" @ ${sampleRate} Hz`);
    return report;
  }

  /**
   * Get all available audio input devices
   *
   * @returns List of audio input devices
   */
  public static async getAvailableDevices(): Promise<AudioDeviceInfo[]> {
    try {
      // Request permissions first (required for device labels)
      await navigator.mediaDevices.getUserMedia({ audio: true });

      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter((device) => device.kind === 'audioinput')
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Mikrofon ${device.deviceId.substring(0, 8)}`,
          kind: device.kind,
          groupId: device.groupId,
        }));

      logger.info(`Found ${audioInputs.length} audio input devices`);
      return audioInputs;
    } catch (error) {
      logger.error('Failed to enumerate audio devices:', error);
      throw new Error('Mikrofonzugriff verweigert oder nicht verfügbar');
    }
  }

  /**
   * Get current active audio device info
   *
   * Requires an active MediaStream to determine the current device.
   *
   * @param stream - Active MediaStream
   * @returns Device info or null if not determinable
   */
  public static async getCurrentDevice(
    stream: MediaStream
  ): Promise<AudioDeviceInfo | null> {
    try {
      const tracks = stream.getAudioTracks();
      if (tracks.length === 0) {
        logger.warn('No audio tracks in stream');
        return null;
      }

      const settings = tracks[0].getSettings();
      const deviceId = settings.deviceId;

      if (!deviceId) {
        logger.warn('No deviceId in track settings');
        return null;
      }

      const devices = await this.getAvailableDevices();
      const currentDevice = devices.find((device) => device.deviceId === deviceId);

      return currentDevice || null;
    } catch (error) {
      logger.error('Failed to get current device:', error);
      return null;
    }
  }

  /**
   * Check if device label suggests it's a built-in microphone
   *
   * Built-in mics are usually good for machine diagnosis.
   *
   * @param label - Device label
   * @returns True if likely built-in
   */
  public static isLikelyBuiltIn(label: string): boolean {
    const lowerLabel = label.toLowerCase();
    const builtInKeywords = [
      'built-in',
      'internal',
      'integriert',
      'eingebaut',
      'default',
      'array',
      'macbook',
      'imac',
    ];

    return builtInKeywords.some((keyword) => lowerLabel.includes(keyword));
  }
}
