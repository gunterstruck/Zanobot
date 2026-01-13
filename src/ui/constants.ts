/**
 * ZANOBOT - UI CONSTANTS
 *
 * Centralized UI text constants to avoid magic strings and improve maintainability.
 */

/**
 * Button text constants
 * Used across different phases to ensure consistency
 */
export const BUTTON_TEXT = {
  // Recording modal buttons
  STOP_REFERENCE: 'Stop',
  STOP_DIAGNOSE: 'Stop & Save',

  // Phase buttons
  SCAN: 'Scannen',
  CREATE_MACHINE: 'Erstellen',
  RECORD: 'Aufnehmen',
  DIAGNOSE: 'Diagnose starten',

  // Modal actions
  CLOSE: 'Schließen',
  CANCEL: 'Abbrechen',
  SAVE: 'Speichern',
  DISCARD: 'Verwerfen',
} as const;

/**
 * Status text constants
 */
export const STATUS_TEXT = {
  HEALTHY: 'healthy',
  UNCERTAIN: 'uncertain',
  FAULTY: 'faulty',
  UNKNOWN: 'UNKNOWN',
} as const;

/**
 * Modal title constants
 */
export const MODAL_TITLE = {
  RECORDING_REFERENCE: 'Referenzaufnahme',
  RECORDING_DIAGNOSE: 'Live Diagnosis - Find Sweet Spot',
  SCANNER: 'QR/Barcode Scanner',
} as const;
