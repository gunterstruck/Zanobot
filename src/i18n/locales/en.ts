/**
 * ZANOBOT - English Translations
 */

import type { TranslationDict } from '../index.js';

export const en: TranslationDict = {
  // ============================================================================
  // BUTTONS
  // ============================================================================
  buttons: {
    stop: 'Stop',
    stopAndSave: 'Stop & Save',
    scan: 'Scan',
    create: 'Create',
    record: 'Record',
    startDiagnosis: 'Start Diagnosis',
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    discard: 'Discard',
    trainAnother: 'Train Another State',
    newMachine: 'New Machine',
  },

  // ============================================================================
  // STATUS
  // ============================================================================
  status: {
    healthy: 'Normal',
    uncertain: 'Deviation',
    faulty: 'Abnormal',
    unknown: 'Unknown',
    noData: 'No Data',
    notChecked: 'Not Yet Checked',
    ready: 'Ready',
    analyzing: 'ANALYZING...',
  },

  // ============================================================================
  // MODAL TITLES
  // ============================================================================
  modals: {
    referenceRecording: 'Reference Recording',
    liveDiagnosis: 'Live Diagnosis - Find Sweet Spot',
    qrScanner: 'QR/Barcode Scanner',
    databaseError: 'Database Error',
    browserIncompatible: 'Browser Not Compatible',
    accessDenied: 'Access Denied',
    processingError: 'Processing Error',
    saveError: 'Save Error',
    sampleRateMismatch: 'Incompatible Sample Rate',
    unsuitable: 'Unsuitable Signal',
    referenceUnsuitable: 'Reference Recording Unsuitable',
    recordingDiscarded: 'Recording Discarded',
    cameraOptional: 'Camera Optional',
    noSignalDetected: 'No Signal Detected',
    scanError: 'Scan Error',
    databaseExported: 'Database Exported',
    databaseImported: 'Database Imported',
    databaseCleared: 'Database Cleared',
  },

  // ============================================================================
  // PHASE 1: IDENTIFY (Machine Selection)
  // ============================================================================
  identify: {
    selectMachine: 'Select Machine',
    scanQrCode: 'Scan QR Code',
    scanQrDescription: 'Identify machine via QR code',
    manualEntry: 'Create Manually',
    manualEntryDescription: 'Create new machine with name',
    machineName: 'Machine Name',
    machineId: 'Machine ID (optional)',
    quickAccess: 'Quick Access',
    recentlyUsed: 'Recently Used',
    overview: 'Overview',
    machineOverview: 'Machine Overview',
    history: 'History',
    noMeasurements: 'No measurements yet',
    statesTrained: '{{count}} states trained',

    errors: {
      scannerStart: 'Error starting scanner',
      cameraAccessDenied: 'Camera access denied',
      cameraAccessHint: 'Please allow camera access in your browser settings',
      noCameraFound: 'No camera found',
      noCameraHint: 'Please make sure your device has a camera',
      qrProcessing: 'Error processing QR code',
      invalidCode: 'Invalid code scanned',
      codeProcessing: 'Error processing code',
      manualEntryLoad: 'Manual entry could not be loaded',
      invalidMachineId: 'Invalid machine ID',
      machineLoad: 'Error loading machine',
      machineNotFound: 'Machine not found. Please select again.',
      nameRequired: 'Please enter a machine name',
      nameWhitespace: 'Machine name cannot be only whitespace',
      nameTooLong: 'Machine name is too long (maximum 100 characters)',
      machineExists: 'A machine with this ID already exists',
      machineCreate: 'Error creating machine',
      idEmpty: 'Machine ID cannot be empty',
      idTooShort: 'Machine ID is too short',
      idTooLong: 'Machine ID is too long (maximum 100 characters)',
      idWhitespace: 'Machine ID cannot be only whitespace',
      microphoneLoad: 'Error loading microphones',
      microphoneSwitch: 'Error switching microphone',
    },

    success: {
      machineLoaded: 'Machine "{{name}}" loaded',
      machineCreated: 'Machine created: {{name}}',
      machineAutoCreated: 'New machine "{{name}}" automatically created.',
      microphoneOptimized: 'Microphone automatically set to "{{label}}" for best diagnosis',
      microphoneChanged: 'Microphone changed: {{label}}',
    },

    time: {
      justNow: 'just now',
      minutesAgo: '{{minutes}} min. ago',
      hoursAgo: '{{hours}} hrs. ago',
      dayAgo: '1 day ago',
      daysAgo: '{{days}} days ago',
      weekAgo: '1 week ago',
      weeksAgo: '{{weeks}} weeks ago',
    },
  },

  // ============================================================================
  // PHASE 2: REFERENCE (Training)
  // ============================================================================
  reference: {
    recordReference: 'Record Reference',
    noReferenceModel: 'No reference model available',
    trainedStates: 'Trained States',
    noModelsYet: 'No reference models available yet',
    existingModels: 'EXISTING MODELS:',
    statesTrainedCount: '{{count}} state(s) already trained',

    recording: {
      alreadyRunning: 'A recording is already in progress.',
      cameraNotAvailable: 'Camera not available. Recording will continue without position image.',
      browserNotCompatible: 'Your browser does not support audio recording. Please use a modern browser.',
      stabilizing: 'Stabilizing...',
      waitingForSignal: 'Waiting for signal',
      recording: 'Recording in progress',
      microphoneFailed: 'Microphone access failed',
      processingFailed: 'Recording could not be processed',
      noSignal: 'Please move closer to the machine and try again.',
      positionImage: '📷 Position image will be captured automatically',
      instruction: 'Hold the microphone 10-30 cm in front of the machine.',
    },

    quality: {
      signalStable: '✓ Signal stable',
      slightUnrest: '⚠ Slight instability',
      signalUnstable: '✗ Warning: Signal unstable!',
    },

    errors: {
      tooShort: 'Recording too short: {{duration}}s total duration is shorter than the {{warmup}}s warmup phase. Minimum duration: {{minDuration}}s',
      trainingTooShort: 'Training data too short: {{duration}}s (after warmup phase). Minimum required: {{minDuration}}s. Please record at least {{totalDuration}}s.',
      qualityTooLow: 'Recording quality too poor for training. Please record again in a quiet environment with a clear machine signal.\n\nIssues:\n{{issues}}',
      signalTooWeak: 'Signal too weak or diffuse (possibly just noise).\n\nSignal strength (RMS): {{magnitude}} (Minimum: 0.03)\nQuality: {{quality}}%\n\nPlease ensure:\n• Microphone is close enough to the machine (10-30cm)\n• Machine is running at sufficient volume\n• Not recording pure background noise\n\nIssues:\n{{issues}}',
      qualityWarning: '⚠️ WARNING: Poor recording quality\n\nThe quality of this recording is poor. Training may be unreliable.\n\nIssues:\n{{issues}}\n\nDo you still want to save?',
      baselineTooLow: 'Reference recording too unclear or noisy.\n\nSelf-recognition score: {{score}}%\nMinimum required: {{minScore}}%\n\nPossible causes:\n• Signal too weak or unstable\n• Too much background noise\n• Machine not running consistently\n\nPlease repeat recording under better conditions:\n• Microphone closer to machine (10-30cm)\n• Quiet environment\n• Machine running steadily throughout recording',
      noAudioFile: 'Please create a reference recording first.',
      exportFailed: 'Export failed',
      saveFailed: 'Save failed',
      machineDataMissing: 'Machine data missing',
    },

    success: {
      modelTrained: '✅ Reference model successfully trained!\n\nMachine: {{name}}\n\nWould you like to download the reference audio file?\n(Recommended for backup)',
      canStartNew: 'You can start a new reference recording.',
    },

    labels: {
      prompt: 'Enter a name for this machine state:\n\nExamples:\n• Normal operating states: "Idle", "Full Load", "Partial Load"\n• Faults: "Imbalance simulated", "Bearing damage", "Fan error"',
      confirmType: 'State: "{{label}}"\n\nIs this a NORMAL operating state?\n\n🟢 OK (Yes) → Normal state (e.g., "Idle", "Full Load")\n🔴 Cancel (No) → Known fault (e.g., "Imbalance", "Bearing damage")\n\nNote: This choice determines whether a diagnosis is shown as "healthy" or "faulty".',
      enterName: 'Please enter a name',
      cancelled: 'Cancelled',
    },
  },

  // ============================================================================
  // PHASE 3: DIAGNOSE (Real-time)
  // ============================================================================
  diagnose: {
    alreadyRunning: 'A diagnosis is already in progress.',
    noReferenceModel: 'No reference model found. Please create a reference recording first.',
    browserNotCompatible: 'Your browser does not support real-time diagnosis. Please use Chrome, Edge, or Safari.',
    noValidSampleRate: 'No reference model with valid sample rate found.',
    cameraNotAvailable: 'Camera not available. Diagnosis will continue without position guide.',
    diagnosisRunning: 'Diagnosis running',
    saveFailed: 'Diagnosis could not be saved',

    sampleRateError: 'Audio setup error: Your microphone runs at {{actual}}Hz, but no reference model was trained at this sample rate (Models: {{expected}}Hz). Please use the same audio setup as during training or create a new reference model with the current sample rate.',

    display: {
      referenceModels: 'REFERENCE MODEL(S):',
      statesTrainedCount: '{{count}} state(s) trained',
      debugValues: '🔍 DEBUG VALUES:',
      signalHint: 'Move phone closer to machine for optimal signal',
      match: 'Match',
      ghostHint: '👻 Move the phone until live image and reference image align',
    },

    analysis: {
      healthyMatch: 'Acoustic signature matches reference state "{{state}}" ({{score}}%). No abnormalities.',
      faultyMatch: 'Abnormality detected: Signature matches trained pattern "{{state}}" ({{score}}%). Inspection recommended.',
    },
  },

  // ============================================================================
  // PHASE 4: SETTINGS
  // ============================================================================
  settings: {
    databaseNotAvailable: 'Database not available. Please allow IndexedDB in your browser settings or disable strict privacy mode.',
    exportError: 'Error exporting database',
    importError: 'Error importing',

    import: {
      confirmMerge: 'Import database from: {{filename}}\n\nWould you like to MERGE the data?\n\nYES = Merge with existing data\nNO = REPLACE all existing data',
      confirmReplace: '⚠️ WARNING!\n\nAll existing data will be DELETED and replaced with the import data!\n\nDo you want to continue?',
      success: 'Machines: {{machines}}\nRecordings: {{recordings}}\nDiagnoses: {{diagnoses}}\n\nMode: {{mode}}',
      modeMerged: 'Merged',
      modeReplaced: 'Replaced',
    },

    clear: {
      confirmFirst: '⚠️ WARNING!\n\nAll data will be PERMANENTLY deleted:\n- All machines\n- All reference models\n- All recordings\n- All diagnoses\n\nDo you want to continue?',
      confirmSecond: 'Are you ABSOLUTELY SURE?\n\nThis action CANNOT be undone!',
      success: 'All data has been deleted',
      error: 'Error deleting data',
    },

    export: {
      success: 'File: {{filename}}\n\nMachines: {{machines}}\nRecordings: {{recordings}}\nDiagnoses: {{diagnoses}}',
    },
  },

  // ============================================================================
  // MAIN APP / STARTUP
  // ============================================================================
  app: {
    browserNotSupported: 'Your browser is not compatible with Zanobo.\n\nMissing features:\n{{features}}\n\nPlease use a modern browser such as Chrome, Edge, Firefox, or Safari.',
    uiLoadFailed: 'User interface could not be loaded',
    fatalError: 'Fatal Error',
    browserNotSupportedTitle: 'Browser Not Supported',
  },

  // ============================================================================
  // CORE ML / SCORING
  // ============================================================================
  scoring: {
    matchesReference: 'Acoustic signature matches the reference. No abnormalities.',
    moderateDeviation: 'Moderate deviation from reference pattern. Review recommended.',
    significantDeviation: 'Significant deviation from reference pattern detected. Inspection recommended.',
    noMatch: 'Significant deviation from reference pattern ({{score}}%). Signal does not match any trained state. Inspection recommended.',
  },

  // ============================================================================
  // HARDWARE CHECK
  // ============================================================================
  hardware: {
    suitable: 'Hardware suitable for machine diagnosis',
    voiceOptimized: 'Voice-optimized hardware filters machine sounds.',
    useStudioMic: 'Use a studio microphone or the built-in device microphone',
    mayFilter: 'Machine sounds may be filtered or suppressed',
    lowSampleRate: 'Low sample rates cannot capture high-frequency machine signals',
    microphoneDenied: 'Microphone access denied or not available',
    iphoneBackMic: 'iPhone rear microphone',
  },

  // ============================================================================
  // DETECTION MODE
  // ============================================================================
  detectionMode: {
    stationary: 'For continuously running machines like fans, pumps, compressors',
    cyclic: 'For machines with recurring cycles like packaging machines, assembly lines',
    referenceComparison: 'Reference Run Comparison',
  },

  // ============================================================================
  // COMMON
  // ============================================================================
  common: {
    machine: 'Machine',
    error: 'Error',
    warning: 'Warning',
    info: 'Info',
    success: 'Success',
    yes: 'Yes',
    no: 'No',
    ok: 'OK',
    loading: 'Loading...',
    initializing: 'Initializing...',
    unknown: 'unknown',
  },
};
