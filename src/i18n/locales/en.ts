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
    startDiagnosis: 'Check Status',
    analyze: 'Analyze',
    close: 'Close',
    cancel: 'Cancel',
    save: 'Save',
    discard: 'Discard',
    trainAnother: 'Train Another State',
    newMachine: 'New Machine',
    stopRecording: 'Stop Recording',
    saveReference: 'Save Reference',
  },

  // ============================================================================
  // BANNER
  // ============================================================================
  banner: {
    headline: 'Does the system sound normal?',
    subline: 'Check status in seconds – directly on the device, offline',
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
    databaseShared: 'Database Shared',
    databaseImported: 'Database Imported',
    databaseCleared: 'Database Cleared',
    nfcDiagnosisTitle: 'Check status?',
    nfcDiagnosisPrompt: 'Machine detected. Check status now?',
    closeDialog: 'Close dialog',
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
    quickAccessDescription: 'Quick access to recently used machines',
    recentlyUsed: 'Recently Used',
    overview: 'Overview',
    machineOverview: 'Machine Overview',
    history: 'History',
    noMeasurements: 'No measurements yet',
    noMachines: 'No machines available',
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

    warnings: {
      preferredMicrophoneUnavailable:
        'Preferred microphone is no longer available. Using the default microphone.',
    },

    messages: {
      codeRecognized: 'Code recognized: {{code}}',
      autoMachineName: 'Machine {{id}}',
      loadingMachine: 'Loading machine...',
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
    tenSecondRecording: '{{duration}}-second reference recording',
    noReferenceModel: 'No reference model available',
    trainedStates: 'Trained States',
    noModelsYet: 'No reference models available yet',
    existingModels: 'EXISTING MODELS:',
    statesTrainedCount: '{{count}} state(s) already trained',
    recordingStatusHighQuality: 'High audio quality detected',

    // State-based card UI (mirrors diagnose card)
    statesRecorded: '{{count}} state recorded',
    noReferenceYet: 'No reference yet',
    changeMachine: 'Change machine',
    noMachinesYet: 'No machines created yet.',
    noMachinesHint: 'Please create a new machine first.',

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
      // iOS Audio Blocked (watchdog detection)
      iosAudioBlocked: 'Microphone blocked',
      iosAudioBlockedMessage: 'The microphone is not providing audio data.\n\nPossible causes:\n• Another app is using the microphone\n• iOS is blocking microphone access\n• System volume is muted\n\nPlease close other apps and try again.',
      iosAudioBlockedRetry: 'Try again',
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
      baseline: 'Reference',
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
    liveAnalysis: 'Run live analysis',

    sampleRateError: 'Audio setup error: Your microphone runs at {{actual}}Hz, but no reference model was trained at this sample rate (Models: {{expected}}Hz). Please use the same audio setup as during training or create a new reference model with the current sample rate.',

    display: {
      referenceModels: 'REFERENCE MODEL(S):',
      statesTrainedCount: '{{count}} state(s) trained',
      debugValues: '🔍 DEBUG VALUES:',
      signalHint: 'Move phone closer to machine for optimal signal',
      match: 'Match',
      ghostHint: '👻 Move the phone until live image and reference image align',
      noCameraAvailable: 'No position image available',
      machineQuestion: 'Does the machine sound normal?',
      reference: 'Reference',
      waitingForSignal: 'Waiting for signal...',
    },

    smartStart: {
      stabilizing: '🎙️ {{message}}\n(Microphone leveling, OS filters stabilizing...)',
      waiting: '🔍 {{message}}',
    },

    debug: {
      weightMagnitude: 'weightMagnitude: {{value}}',
      featureMagnitude: 'featureMagnitude: {{value}}',
      magnitudeFactor: 'magnitudeFactor: {{value}}',
      cosine: 'cosine: {{value}}',
      adjustedCosine: 'adjustedCosine: {{value}}',
      scalingConstant: 'scalingConstant: {{value}}',
      rawScore: 'RAW SCORE: {{value}}%',
      rawScorePlaceholder: 'RAW SCORE: --',
    },

    analysis: {
      healthyMatch: 'Acoustic signature matches reference state "{{state}}" ({{score}}%). No abnormalities.',
      faultyMatch: 'Abnormality detected: Signature matches trained pattern "{{state}}" ({{score}}%). Inspection recommended.',
    },

    // State-based card UI (horizontal tiles)
    scanCode: 'Scan QR',
    selectExisting: 'Select machine',
    createNew: 'New machine',
    statesReady: '{{count}} state trained',
    noReference: 'No reference yet',
    changeMachine: 'Change machine',
    noMachinesYet: 'No machines created yet.',
    noMachinesHint: 'Create a new machine first.',
  },

  // ============================================================================
  // PHASE 4: SETTINGS
  // ============================================================================
  settings: {
    databaseNotAvailable: 'Database not available. Please allow IndexedDB in your browser settings or disable strict privacy mode.',
    exportError: 'Error exporting database',
    importError: 'Error importing',
    shareError: 'Error sharing database',

    import: {
      confirmMerge: 'Import database from: {{filename}}\n\nWould you like to MERGE the data?\n\nYES = Merge with existing data\nNO = REPLACE all existing data',
      confirmReplace: '⚠️ WARNING!\n\nAll existing data will be DELETED and replaced with the import data!\n\nDo you want to continue?',
      success: 'Machines: {{machines}}\nRecordings: {{recordings}}\nDiagnoses: {{diagnoses}}\n\nMode: {{mode}}',
      modeMerged: 'Merged',
      modeReplaced: 'Replaced',
      partialWarning: 'Machines: {{machinesImported}} imported, {{machinesSkipped}} skipped\nRecordings: {{recordingsImported}} imported, {{recordingsSkipped}} skipped\nDiagnoses: {{diagnosesImported}} imported, {{diagnosesSkipped}} skipped\n\n{{totalSkipped}} record(s) could not be imported.\nMode: {{mode}}',
      setupError: 'Error preparing import',
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

    share: {
      title: 'Zanobot database backup',
      text: 'Database backup: {{filename}}',
      success: 'Backup shared: {{filename}}',
      fallback: 'Sharing not available. Downloaded {{filename}} instead.',
      preparing: 'Export is being prepared... please wait a moment and try again.',
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
    hints: {
      matchesReference: 'Acoustic signature matches reference.',
      minorDeviations: 'Minor deviations within acceptable range.',
      moderateDeviation: 'Moderate deviation from reference pattern detected.',
      recommendInspection: 'Inspection recommended.',
      significantAnomaly: 'Significant anomaly detected.',
      immediateInspection: 'Immediate inspection recommended.',
    },
    multiclass: {
      noMatch: 'No match with trained states ({{score}}%). Signal unclear.',
      healthy: 'Baseline state "{{label}}" detected ({{score}}% match). Machine operating normally.',
      faulty: 'State "{{label}}" detected ({{score}}% match). Deviation from normal state.',
    },
  },

  // ============================================================================
  // HARDWARE CHECK
  // ============================================================================
  hardware: {
    suitable: 'Hardware suitable for machine diagnosis',
    voiceOptimized: 'Voice-optimized hardware filters machine sounds.',
    useStudioMic: 'Use a studio microphone or the built-in device microphone',
    headsetsOptimized: 'Headsets are optimized for voice frequencies',
    mayFilter: 'Machine sounds may be filtered or suppressed',
    lowSampleRate: 'Low sample rates cannot capture high-frequency machine signals',
    microphoneDenied: 'Microphone access denied or not available',
    iphoneBackMic: 'iPhone rear microphone',
    micReady: 'Microphone ready',
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
    or: 'or',
    ok: 'OK',
    loading: 'Loading...',
    initializing: 'Initializing...',
    unknown: 'unknown',
  },

  // ============================================================================
  // ROUTER / UI DESCRIPTIONS
  // ============================================================================
  router: {
    statesTrained: '{{count}} state{{plural}} trained (last: {{date}}) - Add more',
    referenceRequired: '{{duration}}-second reference recording (Required for diagnosis)',
    liveAnalysis: 'Run live analysis',
    lastCheck: 'Last check {{time}}',
  },

  viewLevels: {
    basic: 'Simple traffic light display for operators',
    advanced: 'Details for supervisors & maintenance staff',
    expert: 'Full technical view for engineers',
    basicLabel: 'Basic',
    basicDesc: 'Simple',
    advancedLabel: 'Advanced',
    advancedDesc: 'Details',
    expertLabel: 'Expert',
    expertDesc: 'Technical',
    viewModeTitle: 'View Mode',
    viewModeDescription: 'Adjust the complexity of the user interface to your needs.',
  },

  notifications: {
    confirmRequired: 'Confirmation required',
    closeNotification: 'Close notification',
  },

  errorBoundary: {
    unexpectedError: 'An unexpected error has occurred.',
    unexpectedErrorTitle: 'Unexpected Error',
    permissionDenied: 'Access denied',
    permissionHint: 'Please allow access to microphone/camera in your browser settings.',
    hardwareNotFound: 'Hardware not found',
    hardwareHint: 'Please make sure your microphone/camera is connected.',
    audioSystemError: 'Audio system error',
    audioSystemHint: 'Please reload the page. If the problem persists, use an up-to-date browser.',
    storageFull: 'Please delete old diagnoses or reference recordings.',
    networkError: 'Please check your internet connection.',
    technicalDetails: 'Technical details',
    noStackTrace: 'No stack trace available',
  },

  qualityCheck: {
    noFeatures: 'No features available',
    noAudioData: 'No audio data extracted (Frame Count 0)',
    highVariance: 'High spectral variance - Signal unstable',
    veryHighVariance: 'Very high variance - Please record in a quieter environment',
    outliers: '{{count}} outliers detected ({{ratio}}%) - Possible interference noise',
    weakSignal: 'Very weak/diffuse signal - Possibly just noise. Please move closer to the machine.',
    weakTonal: 'Weak tonal signal - Signal-to-noise ratio may be too low.',
    trainingSignalWeak: 'Signal too weak or inconsistent for training. Please ensure: microphone close to machine, machine is running, not just background noise. (Average cosine similarity: {{value}})',
    invalidSampleRate: 'Invalid sample rate: {{rate}}Hz. Expected: 8000-192000Hz (typical: 44100Hz or 48000Hz)',
  },


  healthGauge: {
    normal: 'NORMAL',
    deviation: 'DEVIATION',
    abnormal: 'ABNORMAL',
  },

  // Inspection View (Simplified PWA)
  inspection: {
    // Header
    mainQuestion: 'Does the machine sound normal?',
    subtitle: 'Inspection running – please stay close to the machine',
    subtitleInitializing: 'Preparing – please wait',
    // Status words (simple, non-technical)
    statusNormal: 'Normal',
    statusUncertain: 'Uncertain',
    statusDeviation: 'Deviation',
    // Reference info
    referenceState: 'Reference state',
    referenceDefault: 'Normal operation',
    // Dynamic hints for poor signal quality
    hintMoveCloser: 'Please move closer to the machine',
    hintChangePosition: 'Slightly change position',
    hintHoldSteady: 'Hold device steady',
    hintWaiting: 'Waiting for machine signal...',
    // Button
    stopButton: 'STOP',
  },


  audio: {
    ready: 'Ready',
    stabilizing: 'Acoustic stabilization... {{seconds}}s',
    waitingForSignal: 'Waiting for signal...',
    recordingRunning: 'Recording in progress',
  },

  settingsUI: {
    title: 'Settings',
    nfcWriterTitle: 'NFC tags',
    nfcWriterDescription: 'Write NFC tags for app access or a selected machine.',
    appearance: 'Appearance',
    audioSettings: 'Audio Settings',
    audioHardware: 'Audio Hardware',
    detectingMic: 'Detecting microphone...',
    detectingMicrophone: 'Detecting microphone...',
    initHardwareCheck: 'Initializing hardware check',
    changeMicrophone: 'Change microphone',
    confidenceThreshold: 'Confidence threshold',
    faultyThreshold: 'Anomaly threshold',
    recordingDuration: 'Recording duration',
    recordingDurationDesc:
      'Net recording time for training data. An additional 5 seconds of stabilization time is added for optimal audio quality.',
    seconds5: '5 seconds',
    seconds10: '10 seconds',
    seconds15: '15 seconds',
    seconds: 'seconds',
    frequencyAxis: 'Frequency axis',
    frequencyAxisDesc: 'Logarithmic (more detail in 20-500 Hz range)',
    frequencyLogDesc: 'Logarithmic (more detail in 20-500 Hz range)',
    amplitudeAxis: 'Y-axis / Amplitude',
    amplitudeAxisDesc: 'Logarithmic (dB) - emphasizes quiet signals',
    amplitudeLogDesc: 'Logarithmic (dB) - emphasizes quiet signals',
    disableAudioTriggerLabel: 'Disable Audio Trigger',
    disableAudioTriggerDesc: 'Starts the measurement immediately, even with very quiet signals, without waiting for a minimum level. For extremely quiet machines or environments.',
    analysisMethod: 'Analysis Method',
    analysisMethodDesc: 'Select the appropriate analysis method for your machine.',
    gmaiMethodDesc: 'GMIA (Generalized Mutual Interdependence Analysis) extracts the common, stable components from multiple time windows while suppressing device-specific effects. Ideal for structured, time-stable machine sounds.',
    level1Info: 'Level 1: Frequency and amplitude settings above are active',
    dataManagement: 'Data Management',
    exportDatabase: 'Export database',
    shareDatabase: 'Send database file',
    importDatabase: 'Import database',
    statistics: 'Statistics:',
    machines: 'Machines',
    recordings: 'Recordings',
    diagnoses: 'Diagnoses',
    clearAllData: 'Delete all data',
    deleteAllData: 'Delete all data',
    quickAccessDesc: 'Quick access to recently used machines',
    noMachines: 'No machines available',
    or: 'or',
    selectMicrophone: 'Select microphone',
    microphoneAdvice: 'Select the best microphone for machine diagnosis. Avoid headsets and Bluetooth devices as they are optimized for speech.',
    manualInput: 'Enter manually',
    machineIdInput: 'Enter machine ID',
    continue: 'Continue',
    qrHint: 'Hold QR code or barcode in the frame',
    codeRecognized: 'Code recognized!',
    // Banner settings
    bannerTitle: 'Banner Image',
    bannerDescription: 'Customize the banner image on the home screen. Each theme can have its own banner.',
    bannerUpload: 'Upload Banner',
    bannerReset: 'Reset to Default',
    bannerHint: 'Recommended: 1024×400 or 1024×500 pixels, PNG format. The left third remains free for text.',
    bannerFormatError: 'Format must be 1024×400 or 1024×500 PNG.',
    bannerUpdated: 'Banner has been updated.',
    bannerSaveError: 'Banner could not be saved.',
    bannerResetSuccess: 'Default banner restored.',
    bannerResetError: 'Error resetting the banner.',
    themeToggle: 'Toggle theme',
    closeSettings: 'Close settings',
  },

  // ============================================================================
  // ZERO-FRICTION RECORDING (Auto-Machine Creation)
  // ============================================================================
  zeroFriction: {
    // Auto-generated machine names
    autoMachineName: 'Machine {{number}}',
    // Success toast after silent save
    referenceCreatedToast: 'Reference for {{machineName}} created',
    // Edit button in toast/success screen
    editMachineName: 'Edit',
    // Prompt for editing machine name after creation
    editMachineNamePrompt: 'Enter new name for the machine:',
    // Success after renaming
    machineRenamed: 'Machine renamed to "{{newName}}"',
    // No machine selected hint (for when starting recording without machine)
    noMachineSelected: 'No machine selected – will be created automatically',
  },

  // ============================================================================
  // AUTO-DETECTION (Simplified "Check condition" Flow)
  // ============================================================================
  autoDetect: {
    // Primary CTA
    startButton: 'Check now',
    hint: 'The system automatically recognizes known machines',

    // Manual selection toggle
    showManualSelection: 'Select machine manually',
    hideManualSelection: 'Hide manual selection',

    // Listening modal
    listening: 'Listening...',
    waitingForSignal: 'Please hold microphone near the machine',
    initializing: 'Initializing...',
    analyzing: 'Analyzing sound...',

    // Fall A: Machine recognized (≥80%)
    machineRecognized: 'Machine recognized',
    matchConfidence: 'Match confidence',
    continueAnalysis: 'Continue analysis',
    differentMachine: 'Different machine',

    // Fall B: Uncertain match (40-79%)
    uncertainMatch: 'Which machine is this?',
    selectMachine: 'Please select the matching machine',

    // Fall C: No match (<40%)
    noMatch: "I don't recognize this sound yet",
    noMatchHint: 'Would you like to record a reference?',
    recordReference: 'Record reference',
    newMachine: 'Create new machine',
  },

  // ============================================================================
  // NFC WRITER
  // ============================================================================
  nfc: {
    title: 'Write NFC tag',
    description: 'Choose what information should be written to the NFC tag.',
    supportDetails: 'Secure context: {{secureContext}} · NDEFReader available: {{ndefReader}}',
    openWriter: 'Write NFC tag',
    writeButton: 'Write now',
    optionGeneric: 'App link (generic)',
    optionGenericDetail: 'Opens the app without a machine ID.',
    optionSpecific: 'Machine link',
    optionSpecificDetailDefault: 'Opens the app for the currently selected machine.',
    optionSpecificDetail: 'Opens the app for "{{name}}" (ID: {{id}}).',
    optionSpecificUnavailable: 'Select a machine first to write a specific link.',
    hint: 'Hold the NFC tag to the back of your device.',
    unavailableHint: 'NFC writing is only available in Chrome on Android.',
    statusWriting: 'Writing NFC tag...',
    statusSuccess: 'NFC tag written successfully.',
    statusCancelled: 'Write cancelled.',
    statusError: 'Could not write NFC tag.',
    unsupported: 'NFC writing is not supported on this device.',
    requiresSecureContext: 'NFC writing requires a secure (HTTPS) connection.',
    unsupportedBrowser: 'NFC writing requires Chrome on Android.',
    // Customer ID (Variant B)
    customerIdLabel: 'Customer ID (c)',
    customerIdDescription: 'This ID determines which reference data is loaded when scanning the NFC tag. The app automatically loads: https://gunterstruck.github.io/<CustomerID>/db-latest.json',
    customerIdPlaceholder: 'e.g. Customer_ID_1',
    customerIdRequired: 'Please enter a customer ID.',
    dbUrlPreview: 'Loaded DB URL: {{url}}',
    closeDialog: 'Close NFC dialog',
  },

  // ============================================================================
  // QR CODE GENERATOR
  // ============================================================================
  qrCode: {
    title: 'Create QR Code',
    description: 'Create a QR code to print or save. Simply attach it to the machine — done.',
    openGenerator: 'Create QR Code',
    optionGeneric: 'App link (generic)',
    optionGenericDetail: 'Opens the app without a machine ID.',
    optionSpecific: 'Machine link',
    optionSpecificDetailDefault: 'Opens the app for the currently selected machine.',
    optionSpecificDetail: 'Opens the app for "{{name}}" (ID: {{id}}).',
    optionSpecificUnavailable: 'Select a machine first to create a specific QR code.',
    customerIdLabel: 'Customer ID (c)',
    customerIdDescription: 'This ID determines which reference data is loaded when scanning.',
    customerIdPlaceholder: 'e.g. Customer_ID_1',
    customerIdRequired: 'Please enter a customer ID.',
    dbUrlPreview: 'Loaded DB URL: {{url}}',
    urlPreview: 'Link preview',
    downloadPng: 'Save as image',
    print: 'Print',
    closeDialog: 'Close QR code dialog',
    generatedFor: 'QR code for',
    machineLabel: 'Machine',
    machineIdLabel: 'ID',
    dateLabel: 'Created on',
    printTitle: 'Machine QR Code',
    printInstructions: 'Cut out QR code and attach to the machine.',
    genericLabel: 'App Access',
  },

  review: {
    title: 'Review Recording',
    subtitle: 'Quality Control',
    listenTitle: 'Listen to Recording',
    browserNoAudio: 'Your browser does not support audio playback.',
    recordingInfo: '{{total}} seconds recording (5s stabilization + {{duration}}s training)',
    positionImageTitle: 'Saved Position Image',
    savedPositionImage: 'Saved Position Image',
    positionImageCheck: 'Check if the image shows the correct position.',
    qualityTitle: 'Quality Assessment',
    quality: 'Quality',
    issuesTitle: 'Detected Issues:',
    discardNew: 'Discard / New',
    saveAsReference: 'Save as Reference',
  },

  diagnosisResults: {
    title: 'Diagnosis Results',
    fingerprintLabel: 'Fingerprint',
    confidenceScoreLabel: 'Confidence score',
    varianceTitle: 'Variance',
    frequencyAnomalyLabel: 'Frequency anomaly',
    analysisHintDefault: 'Hint: Slightly increased signal around 20 kHz',
    referenceQualityTitle: 'Reference Quality',
    referenceQualityStatusGood: 'GOOD',
    referenceQualityDescription: 'Reference recording meets recommended conditions',
    viewHistory: 'View History',
    closeDialog: 'Close diagnosis',
  },

  historyChart: {
    title: 'Machine History',
    machineName: 'Machine',
    dataPoints: 'Data Points',
    timeRange: 'Time Range',
    xAxisLabel: 'Time',
    yAxisLabel: 'Health Score (%)',
    noData: 'No history available yet',
    noDataMessage: 'No diagnoses have been saved for this machine yet.',
    errorMessage: 'Error loading history.',
    closeDialog: 'Close history',
  },

  // Work Point Ranking (Probability Distribution View)
  workPointRanking: {
    title: 'State Analysis',
    states: 'States',
    ariaLabel: 'Ranking of detected machine states',
    statusHealthy: 'Normal',
    statusFaulty: 'Fault',
    noData: 'No analysis data available',
    rank: 'Rank',
    probability: 'Probability',
    topMatch: 'Best match',
    sectionTitle: 'Detailed State Distribution',
    sectionDescription: 'Probability distribution of all trained machine states',
  },

  themes: {
    focusTitle: 'Steve Jobs',
    focusDescription: 'One action. No noise. Focus on what matters – everything else fades away.',
    focusDesc: 'One action. No noise. Clarity that works.',
    daylightTitle: 'Daylight',
    daylightDescription: 'Bright, glare-friendly theme for outdoor use. Clear contrast improves readability in sunlight.',
    daylightDesc: 'Bright, glare-friendly theme for outdoor use. Clear contrast improves readability in sunlight.',
    brandTitle: 'Zanobo',
    brandDescription: 'Light, friendly, trustworthy. AI you can trust.',
    brandDesc: 'Light, friendly, trustworthy. AI you can trust.',
    neonTitle: 'Neon Industrial',
    neonDescription: 'High-contrast neon palette for low-light environments. Accents guide attention to critical actions.',
    neonDesc: 'High-contrast neon palette for low-light environments. Accents guide attention to critical actions.',
  },


  // ============================================================================
  // MACHINE SETUP (NFC Deep Link - Status/Error Messages)
  // Note: Manual URL entry UI was removed - referenceDbUrl is now derived
  // from customerId via HashRouter.buildDbUrlFromCustomerId()
  // ============================================================================
  machineSetup: {
    // Validation errors (used by 1-Identify.ts for URL validation)
    urlEmpty: 'Please enter a reference DB link.',
    urlInvalid: 'The link does not appear to be a valid URL.',
    urlNotHttps: 'The link must start with https://.',
    urlNotOfficialSource: 'Only official data sources (gunterstruck.github.io) are accepted.',

    // Download status (used by HashRouter, 1-Identify.ts, ReferenceLoadingOverlay)
    downloadingReference: 'Loading reference data...',
    statusDownloading: 'Downloading reference data...',
    statusParsing: 'Processing data...',
    statusValidating: 'Validating format...',
    statusSaving: 'Saving locally...',
    statusComplete: 'Complete!',

    // Download errors (used by HashRouter, 1-Identify.ts)
    errorMachineNotFound: 'Machine not set up. Please contact the service technician.',
    errorNoReferenceUrl: 'No reference data configured. Please contact the service technician.',
    errorDownloadFailed: 'Download failed. Please check your internet connection.',
    errorInvalidFormat: 'The reference data has an invalid format.',
    errorInvalidStructure: 'The data structure is corrupted.',
    errorNoModels: 'No reference models found in the data.',
    errorInvalidModel: 'One or more reference models are corrupted.',
    errorUnknown: 'An unknown error occurred.',

    // Success messages (used by ReferenceLoadingOverlay)
    referenceLoaded: 'Reference data loaded successfully!',

    // Loading overlay (used by ReferenceLoadingOverlay)
    loadingTitle: 'Loading reference',
    loadingSubtitle: 'Please wait...',
    testingBlocked: 'Testing is only available after reference data is loaded.',
  },

  footer: {
    impressum: 'Legal Notice',
    privacy: 'Privacy Policy',
    about: 'About Zanobo',
    settings: 'Settings',
    closeImpressum: 'Close legal notice',
    closePrivacy: 'Close privacy policy',
    closeAbout: 'Close about Zanobo',
  },

  // ============================================================================
  // NFC IMPORT (Deep Link Import via ?importUrl=)
  // ============================================================================
  nfcImport: {
    // Modal
    modalTitle: 'NFC Backup Detected',
    warningOverwrite: 'Warning: Local database will be overwritten!',
    currentData: 'Current Data',
    newData: 'New Data',
    exportedAt: 'Exported on',
    confirmButton: 'Import Data',

    // Success
    success: 'Database imported successfully!',
    successTitle: 'Import Complete',

    // Errors
    error: 'Import failed',
    errorTitle: 'Import Failed',
    errorGitHubBlob: 'Error: Please use the "Raw" link from GitHub, not the web link.',
    errorFetchFailed: 'Download failed. Please check the URL.',
    errorNotJson: 'Error: The URL returns HTML instead of JSON.\n\nPlease use the "Raw" link from GitHub:\n1. Open the file on GitHub\n2. Click on "Raw"\n3. Copy the URL from the address bar',
    errorInvalidJson: 'Error: The file does not contain valid JSON format.',
    errorInvalidStructure: 'Error: The file does not have the expected backup format.',
    errorNetwork: 'Network error loading data. Please check your internet connection.',
  },

  // ============================================================================
  // URL IMPORT (Deep Link Import via #/import?url=)
  // ============================================================================
  urlImport: {
    // Status messages (loading overlay)
    statusFetching: 'Loading database...',
    statusValidating: 'Validating data...',
    statusImporting: 'Importing data...',

    // Success
    success: 'Database imported successfully!',
    successTitle: 'Import Complete',

    // Errors
    errorTitle: 'Import Failed',
    errorGeneric: 'Import failed.',
    errorInvalidUrl: 'Invalid URL.',
    errorFetchFailed: 'Download failed (HTTP {{status}}).',
    errorFileTooLarge: 'File too large. Maximum size: 50 MB.',
    errorNotJson: 'The URL returns HTML instead of JSON. Please check the link.',
    errorInvalidJson: 'The file does not contain valid JSON format.',
    errorInvalidStructure: 'The file does not have the expected database format.',
    errorNetwork: 'Network error loading data. Please check your internet connection.',
  },

  // ============================================================================
  // ONBOARDING TRACE (Debug Protocol)
  // ============================================================================
  trace: {
    // UI
    title: 'Debug Protocol',
    toggle: 'Toggle protocol',
    copyToClipboard: 'Copy protocol',
    copy: 'Copy',
    copied: 'Copied!',
    copyFailed: 'Error',
    noEntries: 'No entries yet',

    // Status
    statusRunning: 'Running...',
    statusComplete: 'Complete',
    statusFailed: 'Failed',

    // Step labels - these map to TraceStepId
    steps: {
      // Deep Link Processing
      deep_link_detected: 'Deep link detected',
      hash_parsed: 'Hash parsed',
      machine_id_extracted: 'Machine ID extracted',
      customer_id_extracted: 'Customer ID extracted',
      db_url_derived: 'DB URL derived',
      import_url_detected: 'Import URL detected',

      // Download Process
      download_started: 'Download started',
      download_complete: 'Download complete',
      download_failed: 'Download failed',

      // JSON Processing
      json_parse_started: 'JSON parse started',
      json_parse_complete: 'JSON parse successful',
      json_parse_failed: 'JSON parse failed',

      // Validation
      schema_validation_started: 'Schema validation started',
      schema_validation_complete: 'Schema validation successful',
      schema_validation_failed: 'Schema validation failed',

      // Database Operations
      db_reset_started: 'DB reset started',
      db_import_started: 'DB import started',
      db_import_complete: 'DB import complete',
      db_import_failed: 'DB import failed',

      // App State
      app_state_reload: 'App state reloaded',

      // Machine Operations
      machine_lookup: 'Looking up machine',
      machine_found: 'Machine found',
      machine_not_found: 'Machine not found',
      machine_created: 'Machine created',
      machine_selected: 'Machine selected',

      // Final Steps
      test_dialog_shown: 'Test dialog shown',
      process_complete: 'Process complete',
      process_failed: 'Process failed',
    },
  },

  // ============================================================================
  // BADGES (UI Hints)
  // ============================================================================
  badges: {
    recommended: 'Recommended',
    nextStep: 'Next Step',
  },

  // ============================================================================
  // DATABASE MIGRATION
  // ============================================================================
  migration: {
    title: 'Database Update',
    dataCleared:
      'The database was reset due to an update. All machines, recordings and diagnoses have been deleted.',
  },

  // ============================================================================
  // ABOUT MODAL
  // ============================================================================
  about: {
    title: 'About Zanobo',
    subtitle: 'Assistant for acoustic comparison of machine states',

    // Introduction
    intro: '<strong>Zanobo 2.0</strong> is a privacy-friendly Progressive Web App (PWA) designed for the comparative analysis of machine acoustics. The application allows users to record and compare machine sounds entirely <strong>offline</strong> – without cloud services, without external sensors, and without trained AI models.<br><br>Zanobo deliberately understands itself <strong>not as a diagnostic tool</strong>, but as a <strong>comparison and guidance instrument</strong> that supports human assessment.',

    // Core Features
    coreFeaturesTitle: 'Core Features',
    coreFeatures: {
      offlineFirst: '<strong>Offline-First:</strong> All recordings and calculations are performed locally in the browser.',
      similarityScore: '<strong>Similarity Score (0–100%):</strong> Zanobo computes a mathematical similarity (cosine similarity) between reference and comparison recording.',
      userThreshold: '<strong>User-defined Threshold:</strong> Users define themselves at which score a state counts as "normal" or "deviating".',
      visualFeedback: '<strong>Visual Spectrum Feedback:</strong> Real-time display of frequency spectrum and comparison result.',
      noDataLeaks: '<strong>Local Data Storage:</strong> All audio recordings and scores are stored exclusively in the device\'s local IndexedDB.',
    },

    // Legal Position
    legalTitle: 'Legal Position and IP Review',
    legalIntro: 'Zanobo was independently developed as a <strong>private, non-commercial open-source project</strong> under the <strong>MIT license</strong>. Its functionality is based on <strong>openly described mathematical procedures</strong> (e.g., frequency analysis and GMIA-like cosine comparisons) and incorporates <strong>no patented system logic</strong>, <strong>no classification mechanisms</strong>, and <strong>no learning models</strong>.',
    legalReview: 'Prior to release, a <strong>technical and content review</strong> was conducted to ensure that Zanobo does not conflict with existing patents or known industrial diagnostic approaches.',

    // IP Table
    ipTableTitle: 'Relevant IP and Technical Differentiation',
    ipTable: {
      headers: {
        reference: 'Reference / Title',
        source: 'Source & Status',
        protectedScope: 'Protected Scope',
        zanoboDiff: 'Differentiation from Zanobo',
      },
      rows: {
        '0': {
          reference: '<strong>PAPDEOTT005125</strong><br><em>Procedure for diagnosing machines</em>',
          source: 'Defensive publication, Siemens AG, 2016',
          protectedScope: 'Cloud-based diagnostic system using central databases and mobile sensors',
          zanoboDiff: 'Zanobo operates fully locally, without cloud, without central database, without diagnostics',
        },
        '1': {
          reference: '<strong>EP3701708B1</strong><br><em>Remote machine condition analysis</em>',
          source: 'European Patent, Siemens AG, 2022',
          protectedScope: 'ML-based remote diagnostics with trained models and sensors',
          zanoboDiff: 'Zanobo uses no machine learning, no cloud, no embedded diagnostic logic',
        },
        '2': {
          reference: '<strong>US9263041B2</strong><br><em>Channel detection in noise using GMIA</em>',
          source: 'Siemens Corp., 2016',
          protectedScope: 'Application of GMIA for speech and hearing systems',
          zanoboDiff: 'Zanobo uses GMIA-like mathematics exclusively for non-speech and local comparisons',
        },
        '3': {
          reference: '<strong>US9443201B2</strong><br><em>Learning of sensor signatures</em>',
          source: 'Siemens, 2016',
          protectedScope: 'Classification and model training of sensor signatures',
          zanoboDiff: 'Zanobo performs no classification and no model training',
        },
        '4': {
          reference: '<strong>US9602781B2</strong><br><em>Seismic signal deblending (GMIA)</em>',
          source: 'Schlumberger, 2017',
          protectedScope: 'Separation of seismic signals using GMIA',
          zanoboDiff: 'Different domain and signal type, unrelated',
        },
        '5': {
          reference: '<strong>ABB – Integration of Mobile Measurement</strong>',
          source: 'Public industry presentation, ABB, 2015',
          protectedScope: 'Mobile sensors for ad-hoc diagnostics with cloud and service integration',
          zanoboDiff: 'Zanobo avoids diagnostics, service workflows, and cloud connectivity, focusing on local comparison',
        },
      },
    },

    // Use Cases
    useCasesTitle: 'Use Cases',
    useCasesIntro: 'Zanobo enables two fundamental comparison scenarios that differ in their temporal and spatial structure:',

    // Serial Comparison
    serialComparisonTitle: 'a) Serial Comparison (Temporal Comparison / Trend)',
    serialComparisonPrinciple: '<strong>Principle:</strong> Comparison of a current recording with a previously created reference of <strong>the same machine</strong>.',
    serialComparisonGoal: '<strong>Goal:</strong> Making changes in the acoustic pattern visible over time.',
    serialComparisonApplication: '<strong>Application:</strong><ul><li>A reference recording is created at a time when the machine is assessed as "normal"</li><li>Later recordings are compared with this reference</li><li>Deviations from the original pattern are quantified (similarity score)</li></ul>',
    serialComparisonHint: '<strong>Note:</strong> Zanobo only shows <strong>whether and how strongly</strong> the current sound differs from the reference. The interpretation of whether a deviation is relevant is made by the user. The system makes no diagnosis and provides no prognosis.',

    // Parallel Comparison
    parallelComparisonTitle: 'b) Parallel Comparison (Comparison of Identical Machines / Fleet Check)',
    parallelComparisonPrinciple: '<strong>Principle:</strong> Comparison of multiple identical machines under similar operating conditions.',
    parallelComparisonGoal: '<strong>Goal:</strong> Identification of acoustic outliers within a group of identical machines.',
    parallelComparisonApplication: '<strong>Application:</strong><ul><li>Recordings of multiple identical machines (e.g., in a production hall) are created</li><li>Zanobo calculates the acoustic similarity between the machines</li><li>Machines whose sound signature significantly deviates from the group become visible</li></ul>',
    parallelComparisonSpecial: '<strong>Special feature:</strong> Works <strong>even without historical reference</strong>. The group itself forms the comparison basis.',
    parallelComparisonHint: '<strong>Note:</strong> Zanobo does not decide which machine is defective or which represents the "target state". It only shows <strong>relative deviations</strong> within the group. The assessment of whether a deviating machine should be further investigated is up to the user.',

    // NFC Section
    nfcTitle: 'NFC-based Instant Access and Context-based Comparison',
    nfcIntro: 'Zanobo supports the <strong>use of NFC tags</strong> on machines to simplify app access and optionally provide a machine-specific context.',

    nfcFunctionalityTitle: 'How it works',
    nfcTagDescription: '<strong>NFC tag on the machine:</strong> An NFC tag placed on the housing or access point can contain the following information:<ul><li>URL to the Zanobo PWA (direct app launch in browser)</li><li>Machine ID for automatic identification</li><li>Optional: Reference to customer-specific reference data (URL to a JSON file)</li></ul>',
    nfcInstantAccess: '<strong>Instant access without installation:</strong><ul><li>The user holds the smartphone to the NFC tag</li><li>The Zanobo PWA opens directly in the browser (no app store, no registration required)</li><li>Optional: The stored machine ID is automatically loaded</li></ul>',

    nfcReferenceDataTitle: 'Optional context-based reference data',
    nfcReferenceDataDescription: 'The NFC tag can additionally contain a <strong>URL to a reference database</strong>. This database is provided by the machine operator or service partner and can include:<ul><li><strong>Reference recordings</strong> for various operating states of the machine</li><li><strong>Machine-specific metadata</strong> (e.g., type, year of manufacture, location)</li><li><strong>Comparison parameters</strong> for fleet checks of identical machines</li></ul>',

    nfcAdvantageTitle: 'Advantage for new or external users',
    nfcAdvantageDescription: 'A service technician or operator checking the machine for the first time can:<ul><li><strong>Immediately perform an acoustic check</strong> without having to record a reference themselves</li><li><strong>Directly compare against existing reference data</strong> provided by the operator</li><li><strong>Without prior knowledge</strong> make an initial assessment of whether the current sound deviates from the stored reference</li></ul>',

    nfcDataPrivacyTitle: 'Data storage and privacy',
    nfcDataPrivacyImportant: '<strong>Important:</strong> The reference data is <strong>not stored in a Zanobo cloud</strong>. It is provided:<ul><li>In the operator\'s <strong>local network</strong> (e.g., intranet server)</li><li>In a <strong>customer-owned environment</strong> (e.g., GitHub Pages, own web server)</li><li>As a <strong>static JSON file</strong> accessible via an HTTPS URL</li></ul>',
    nfcDataPrivacyStorage: 'The reference database is downloaded on the first NFC scan and then stored <strong>locally on the device</strong> (IndexedDB). All further comparisons are performed offline.',

    nfcFocusTitle: 'Focus and distinction',
    nfcFocusDescription: 'The NFC-based access serves exclusively for <strong>accessibility and comparability</strong>. It enables:<ul><li>Quick start without manual configuration</li><li>Use of existing reference data without own recording</li><li>Consistent comparison basis for multiple users or locations</li></ul>',
    nfcNoFeatures: '<strong>Even when using NFC-based reference data, Zanobo:</strong><ul><li>Performs <strong>no diagnosis</strong> (no statement about damage cause or condition)</li><li>Performs <strong>no automation</strong> of decisions (no "good/bad" judgment)</li><li>Performs <strong>no cloud-based evaluation</strong> (all calculations are local)</li></ul>',
    nfcInterpretation: 'The interpretation of comparison results always remains with the user.',

    // Transparency
    transparencyTitle: 'Transparency and Intent',
    transparencyText1: 'Zanobo is <strong>not a diagnostic tool</strong> and makes <strong>no automated technical assessments</strong>. It provides exclusively a <strong>visual and mathematical comparison aid</strong>.',
    transparencyText2: 'All processing happens <strong>offline</strong>. <strong>No user data is transmitted, stored, or evaluated</strong>.',
    transparencyText3: 'This transparency expresses a conscious approach to responsibility, data protection, and third-party rights.',
    transparencyList: {
      noClassification: 'no state classification',
      noCauseAnalysis: 'no fault cause analysis',
      noRepairRecommendations: 'no repair recommendations',
    },

    // Public Instance
    publicInstance: 'Public instance:',
    publicInstanceUrl: 'https://zanobo.vercel.app',

    // Version Info
    version: 'Version:',
    versionNumber: '2.0.0 (2026)',
    developedBy: 'Developed by:',
    developerName: 'Günter Struck',
    license: 'License:',
    licenseType: 'MIT',
    stack: 'Technology Stack:',
    stackTech: 'TypeScript, Vite, Web Audio API',

    // Guiding Principle
    guidingPrincipleTitle: 'Guiding Principle',
    guidingPrincipleQuestion: 'Does the machine sound normal?',
    guidingPrincipleStatement: 'Smartphones hear machine sounds.',
  },
};
