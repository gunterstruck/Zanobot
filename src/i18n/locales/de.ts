/**
 * ZANOBOT - German (Deutsch) Translations
 *
 * This is the primary language file containing all original German strings.
 */

import type { TranslationDict } from '../index.js';

export const de: TranslationDict = {
  // ============================================================================
  // BUTTONS
  // ============================================================================
  buttons: {
    stop: 'Stop',
    stopAndSave: 'Stop & Save',
    scan: 'Scannen',
    create: 'Erstellen',
    record: 'Aufnehmen',
    startDiagnosis: 'Zustand prüfen',
    analyze: 'Analysieren',
    close: 'Schließen',
    cancel: 'Abbrechen',
    save: 'Speichern',
    discard: 'Verwerfen',
    trainAnother: 'Weiteren Zustand trainieren',
    newMachine: 'Neue Maschine',
    stopRecording: 'Aufnahme stoppen',
    saveReference: 'Referenz speichern',
  },

  // ============================================================================
  // BANNER
  // ============================================================================
  banner: {
    headline: 'Hört sich die Anlage normal an?',
    subline: 'Zustand in Sekunden prüfen – direkt am Gerät, offline',
  },

  // ============================================================================
  // STATUS
  // ============================================================================
  status: {
    healthy: 'Unauffällig',
    uncertain: 'Abweichung',
    faulty: 'Auffällig',
    unknown: 'Unbekannt',
    noData: 'Keine Daten',
    notChecked: 'Noch nicht geprüft',
    ready: 'Bereit',
    analyzing: 'ANALYSIERE...',
  },

  // ============================================================================
  // MODAL TITLES
  // ============================================================================
  modals: {
    referenceRecording: 'Referenzaufnahme',
    liveDiagnosis: 'Live Diagnosis - Find Sweet Spot',
    qrScanner: 'QR/Barcode Scanner',
    databaseError: 'Datenbank-Fehler',
    browserIncompatible: 'Browser nicht kompatibel',
    accessDenied: 'Zugriff verweigert',
    processingError: 'Verarbeitungsfehler',
    saveError: 'Speicherfehler',
    sampleRateMismatch: 'Inkompatible Sample Rate',
    unsuitable: 'Ungeeignetes Signal',
    referenceUnsuitable: 'Referenzaufnahme ungeeignet',
    recordingDiscarded: 'Aufnahme verworfen',
    cameraOptional: 'Kamera optional',
    noSignalDetected: 'Kein Signal erkannt',
    scanError: 'Scanfehler',
    databaseExported: 'Datenbank exportiert',
    databaseShared: 'Datenbank versendet',
    databaseImported: 'Datenbank importiert',
    databaseCleared: 'Datenbank geleert',
    nfcDiagnosisTitle: 'Zustand prüfen?',
    nfcDiagnosisPrompt: 'Maschine erkannt. Zustand jetzt prüfen?',
  },

  // ============================================================================
  // PHASE 1: IDENTIFY (Machine Selection)
  // ============================================================================
  identify: {
    selectMachine: 'Maschine auswählen',
    scanQrCode: 'QR-Code scannen',
    scanQrDescription: 'Identifiziere Maschine via QR-Code',
    manualEntry: 'Manuell anlegen',
    manualEntryDescription: 'Neue Maschine mit Namen erstellen',
    machineName: 'Maschinenname',
    machineId: 'Maschinen-ID (optional)',
    quickAccess: 'Schnellwahl',
    recentlyUsed: 'Zuletzt verwendet',
    overview: 'Übersicht',
    machineOverview: 'Maschinenübersicht',
    history: 'Verlauf',
    noMeasurements: 'Noch keine Messungen vorhanden',
    noMachines: 'Keine Maschinen vorhanden',
    statesTrained: '{{count}} Zustände trainiert',

    errors: {
      scannerStart: 'Fehler beim Starten des Scanners',
      cameraAccessDenied: 'Kamerazugriff wurde verweigert',
      cameraAccessHint: 'Bitte erlauben Sie den Kamerazugriff in Ihren Browser-Einstellungen',
      noCameraFound: 'Keine Kamera gefunden',
      noCameraHint: 'Bitte stellen Sie sicher, dass Ihr Gerät eine Kamera hat',
      qrProcessing: 'Fehler beim Verarbeiten des QR-Codes',
      invalidCode: 'Ungültiger Code gescannt',
      codeProcessing: 'Fehler beim Verarbeiten des Codes',
      manualEntryLoad: 'Manuelle Eingabe konnte nicht geladen werden',
      invalidMachineId: 'Ungültige Maschinen-ID',
      machineLoad: 'Fehler beim Laden der Maschine',
      machineNotFound: 'Maschine nicht gefunden. Bitte neu auswählen.',
      nameRequired: 'Bitte geben Sie einen Maschinennamen ein',
      nameWhitespace: 'Maschinenname darf nicht nur aus Leerzeichen bestehen',
      nameTooLong: 'Maschinenname ist zu lang (maximal 100 Zeichen)',
      machineExists: 'Eine Maschine mit dieser ID existiert bereits',
      machineCreate: 'Fehler beim Erstellen der Maschine',
      idEmpty: 'Maschinen-ID darf nicht leer sein',
      idTooShort: 'Maschinen-ID ist zu kurz',
      idTooLong: 'Maschinen-ID ist zu lang (maximal 100 Zeichen)',
      idWhitespace: 'Maschinen-ID darf nicht nur aus Leerzeichen bestehen',
      microphoneLoad: 'Fehler beim Laden der Mikrofone',
      microphoneSwitch: 'Fehler beim Wechseln des Mikrofons',
    },

    success: {
      machineLoaded: 'Maschine "{{name}}" geladen',
      machineCreated: 'Maschine erstellt: {{name}}',
      machineAutoCreated: 'Neue Maschine "{{name}}" automatisch angelegt.',
      microphoneOptimized: 'Mikrofon automatisch auf "{{label}}" optimiert für beste Diagnose',
      microphoneChanged: 'Mikrofon gewechselt: {{label}}',
    },

    warnings: {
      preferredMicrophoneUnavailable:
        'Bevorzugtes Mikrofon ist nicht mehr verfügbar. Es wird das Standardmikrofon verwendet.',
    },

    messages: {
      codeRecognized: 'Code erkannt: {{code}}',
      autoMachineName: 'Maschine {{id}}',
      loadingMachine: 'Maschine wird geladen...',
    },

    time: {
      justNow: 'gerade eben',
      minutesAgo: 'vor {{minutes}} Min.',
      hoursAgo: 'vor {{hours}} Std.',
      dayAgo: 'vor 1 Tag',
      daysAgo: 'vor {{days}} Tagen',
      weekAgo: 'vor 1 Woche',
      weeksAgo: 'vor {{weeks}} Wochen',
    },
  },

  // ============================================================================
  // PHASE 2: REFERENCE (Training)
  // ============================================================================
  reference: {
    recordReference: 'Referenz aufnehmen',
    tenSecondRecording: '10-Sekunden Referenzaufnahme',
    noReferenceModel: 'Kein Referenzmodell vorhanden',
    trainedStates: 'Trainierte Zustände',
    noModelsYet: 'Noch keine Referenzmodelle vorhanden',
    existingModels: 'VORHANDENE MODELLE:',
    statesTrainedCount: '{{count}} Zustand(e) bereits trainiert',
    recordingStatusHighQuality: 'Hohe Audioqualität erkannt',
    fingerprintQualityLabel: 'Fingerprint-Qualität:',
    fingerprintQualityConfident: 'SICHER',

    // State-based card UI (mirrors diagnose card)
    statesRecorded: '{{count}} Zustand aufgenommen',
    noReferenceYet: 'Noch keine Referenz',
    changeMachine: 'Maschine wechseln',
    noMachinesYet: 'Noch keine Maschinen angelegt.',
    noMachinesHint: 'Legen Sie zuerst eine neue Maschine an.',

    recording: {
      alreadyRunning: 'Eine Aufnahme läuft bereits.',
      cameraNotAvailable: 'Kamera nicht verfügbar. Aufnahme wird ohne Positionsbild fortgesetzt.',
      browserNotCompatible: 'Ihr Browser unterstützt keine Audioaufnahme. Bitte verwenden Sie einen aktuellen Browser.',
      stabilizing: 'Stabilisierung...',
      waitingForSignal: 'Warte auf Signal',
      recording: 'Aufnahme läuft',
      microphoneFailed: 'Mikrofonzugriff fehlgeschlagen',
      processingFailed: 'Aufnahme konnte nicht verarbeitet werden',
      noSignal: 'Bitte näher an die Maschine gehen und erneut versuchen.',
      positionImage: '📷 Positionsbild wird automatisch aufgenommen',
      instruction: 'Halten Sie das Mikrofon 10–30 cm vor die Maschine.',
    },

    quality: {
      signalStable: '✓ Signal stabil',
      slightUnrest: '⚠ Leichte Unruhe',
      signalUnstable: '✗ Warnung: Signal instabil!',
    },

    errors: {
      tooShort: 'Aufnahme zu kurz: {{duration}}s Gesamtdauer ist kürzer als die {{warmup}}s Warmup-Phase. Mindestdauer: {{minDuration}}s',
      trainingTooShort: 'Trainings-Daten zu kurz: {{duration}}s (nach Warmup-Phase). Minimum erforderlich: {{minDuration}}s. Bitte mindestens {{totalDuration}}s aufnehmen.',
      qualityTooLow: 'Aufnahme zu schlecht für Training. Bitte in ruhiger Umgebung mit deutlichem Maschinensignal erneut aufnehmen.\n\nProbleme:\n{{issues}}',
      signalTooWeak: 'Signal zu schwach oder diffus (möglicherweise nur Rauschen).\n\nSignal-Stärke (RMS): {{magnitude}} (Minimum: 0.03)\nQualität: {{quality}}%\n\nBitte sicherstellen:\n• Mikrofon ist nah genug an der Maschine (10-30cm)\n• Maschine läuft mit ausreichend Lautstärke\n• Kein reines Hintergrundrauschen wird aufgenommen\n\nProbleme:\n{{issues}}',
      qualityWarning: '⚠️ WARNUNG: Schlechte Aufnahmequalität\n\nDie Qualität dieser Aufnahme ist schlecht. Das Training könnte unzuverlässig sein.\n\nProbleme:\n{{issues}}\n\nMöchten Sie trotzdem speichern?',
      baselineTooLow: 'Referenzaufnahme zu undeutlich oder verrauscht.\n\nSelbsterkennungs-Score: {{score}}%\nMinimum erforderlich: {{minScore}}%\n\nMögliche Ursachen:\n• Signal zu schwach oder instabil\n• Zu viel Hintergrundgeräusch\n• Maschine läuft nicht konstant\n\nBitte Aufnahme unter besseren Bedingungen wiederholen:\n• Mikrofon näher an der Maschine (10-30cm)\n• Ruhige Umgebung\n• Maschine läuft stabil während gesamter Aufnahme',
      noAudioFile: 'Bitte zuerst eine Referenzaufnahme erstellen.',
      exportFailed: 'Export fehlgeschlagen',
      saveFailed: 'Speichern fehlgeschlagen',
      machineDataMissing: 'Maschinendaten fehlen',
    },

    success: {
      modelTrained: '✅ Referenzmodell erfolgreich trainiert!\n\nMaschine: {{name}}\n\nMöchten Sie die Referenz-Audiodatei herunterladen?\n(Empfohlen für Backup)',
      canStartNew: 'Sie können eine neue Referenzaufnahme starten.',
    },

    labels: {
      baseline: 'Referenz',
      prompt: 'Geben Sie einen Namen für diesen Maschinenzustand ein:\n\nBeispiele:\n• Normale Betriebszustände: "Leerlauf", "Volllast", "Teillast"\n• Fehler: "Unwucht simuliert", "Lagerschaden", "Lüfterfehler"',
      confirmType: 'Zustand: "{{label}}"\n\nIst dies ein NORMALER Betriebszustand?\n\n🟢 OK (Ja) → Normaler Zustand (z.B. "Leerlauf", "Volllast")\n🔴 Abbrechen (Nein) → Bekannter Fehler (z.B. "Unwucht", "Lagerschaden")\n\nHinweis: Diese Wahl bestimmt, ob eine Diagnose als "gesund" oder "fehlerhaft" angezeigt wird.',
      enterName: 'Bitte einen Namen eingeben',
      cancelled: 'Abgebrochen',
    },
  },

  // ============================================================================
  // PHASE 3: DIAGNOSE (Real-time)
  // ============================================================================
  diagnose: {
    alreadyRunning: 'Eine Diagnose läuft bereits.',
    noReferenceModel: 'Kein Referenzmodell gefunden. Bitte zuerst eine Referenzaufnahme erstellen.',
    browserNotCompatible: 'Ihr Browser unterstützt keine Real-Time-Diagnose. Bitte verwenden Sie Chrome, Edge oder Safari.',
    noValidSampleRate: 'Kein Referenzmodell mit gültiger Sample Rate gefunden.',
    cameraNotAvailable: 'Kamera nicht verfügbar. Diagnose wird ohne Positionshilfe fortgesetzt.',
    diagnosisRunning: 'Diagnose läuft',
    saveFailed: 'Diagnose konnte nicht gespeichert werden',
    liveAnalysis: 'Live-Analyse durchführen',

    sampleRateError: 'Audio-Setup Fehler: Ihr Mikrofon läuft bei {{actual}}Hz, aber kein Referenzmodell wurde bei dieser Sample Rate trainiert (Modelle: {{expected}}Hz). Bitte verwenden Sie das gleiche Audio-Setup wie beim Training oder erstellen Sie ein neues Referenzmodell mit der aktuellen Sample Rate.',

    display: {
      referenceModels: 'REFERENZMODELL(E):',
      statesTrainedCount: '{{count}} Zustand(e) trainiert',
      debugValues: '🔍 DEBUG VALUES:',
      signalHint: 'Telefon näher an die Maschine halten für optimales Signal',
      match: 'Übereinstimmung',
      ghostHint: '👻 Bewegen Sie das Handy, bis Live-Bild und Referenzbild übereinstimmen',
      noCameraAvailable: 'Kein Positionsbild verfügbar',
    },

    smartStart: {
      stabilizing: '🎙️ {{message}}\n(Mikrofon pegelt ein, OS-Filter werden stabilisiert...)',
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
      healthyMatch: 'Akustische Signatur entspricht Referenzzustand "{{state}}" ({{score}}%). Keine Auffälligkeiten.',
      faultyMatch: 'Auffälligkeit erkannt: Signatur entspricht trainiertem Muster "{{state}}" ({{score}}%). Inspektion empfohlen.',
    },

    // State-based card UI (horizontal tiles)
    scanCode: 'QR scannen',
    selectExisting: 'Maschine wählen',
    createNew: 'Neue Maschine',
    statesReady: '{{count}} Zustand trainiert',
    noReference: 'Noch keine Referenz',
    changeMachine: 'Maschine wechseln',
    noMachinesYet: 'Noch keine Maschinen angelegt.',
    noMachinesHint: 'Legen Sie zuerst eine neue Maschine an.',
  },

  // ============================================================================
  // PHASE 4: SETTINGS
  // ============================================================================
  settings: {
    databaseNotAvailable: 'Datenbank nicht verfügbar. Bitte erlauben Sie IndexedDB in Ihren Browser-Einstellungen oder deaktivieren Sie den strikten Privacy-Modus.',
    exportError: 'Fehler beim Exportieren der Datenbank',
    importError: 'Fehler beim Importieren',
    shareError: 'Fehler beim Versenden der Datenbank',

    import: {
      confirmMerge: 'Datenbank importieren aus: {{filename}}\n\nMöchten Sie die Daten ZUSAMMENFÜHREN?\n\nJA = Zusammenführen mit bestehenden Daten\nNEIN = Alle bestehenden Daten ERSETZEN',
      confirmReplace: '⚠️ ACHTUNG!\n\nAlle bestehenden Daten werden GELÖSCHT und durch die Import-Daten ersetzt!\n\nMöchten Sie fortfahren?',
      success: 'Maschinen: {{machines}}\nAufnahmen: {{recordings}}\nDiagnosen: {{diagnoses}}\n\nModus: {{mode}}',
      modeMerged: 'Zusammengeführt',
      modeReplaced: 'Ersetzt',
      setupError: 'Fehler beim Vorbereiten des Imports',
    },

    clear: {
      confirmFirst: '⚠️ ACHTUNG!\n\nAlle Daten werden UNWIDERRUFLICH gelöscht:\n- Alle Maschinen\n- Alle Referenzmodelle\n- Alle Aufnahmen\n- Alle Diagnosen\n\nMöchten Sie fortfahren?',
      confirmSecond: 'Sind Sie ABSOLUT SICHER?\n\nDiese Aktion kann NICHT rückgängig gemacht werden!',
      success: 'Alle Daten wurden gelöscht',
      error: 'Fehler beim Löschen der Daten',
    },

    export: {
      success: 'Datei: {{filename}}\n\nMaschinen: {{machines}}\nAufnahmen: {{recordings}}\nDiagnosen: {{diagnoses}}',
    },

    share: {
      title: 'Zanobot Datenbank-Backup',
      text: 'Datenbank-Backup: {{filename}}',
      success: 'Backup versendet: {{filename}}',
      fallback: 'Teilen nicht verfügbar. {{filename}} wurde stattdessen heruntergeladen.',
    },
  },

  // ============================================================================
  // MAIN APP / STARTUP
  // ============================================================================
  app: {
    browserNotSupported: 'Ihr Browser ist nicht kompatibel mit Zanobo.\n\nFehlende Features:\n{{features}}\n\nBitte verwenden Sie einen modernen Browser wie Chrome, Edge, Firefox oder Safari.',
    uiLoadFailed: 'Benutzeroberfläche konnte nicht geladen werden',
    fatalError: 'Schwerwiegender Fehler',
    browserNotSupportedTitle: 'Browser nicht unterstützt',
  },

  // ============================================================================
  // CORE ML / SCORING
  // ============================================================================
  scoring: {
    matchesReference: 'Akustische Signatur entspricht der Referenz. Keine Auffälligkeiten.',
    moderateDeviation: 'Moderate Abweichung vom Referenzmuster. Überprüfung empfohlen.',
    significantDeviation: 'Signifikante Abweichung vom Referenzmuster erkannt. Inspektion empfohlen.',
    noMatch: 'Signifikante Abweichung vom Referenzmuster ({{score}}%). Das Signal passt zu keinem trainierten Zustand. Inspektion empfohlen.',
    hints: {
      matchesReference: 'Akustische Signatur entspricht der Referenz.',
      minorDeviations: 'Geringfügige Abweichungen im akzeptablen Bereich.',
      moderateDeviation: 'Moderate Abweichung vom Referenzmuster erkannt.',
      recommendInspection: 'Inspektion empfohlen.',
      significantAnomaly: 'Signifikante Anomalie erkannt.',
      immediateInspection: 'Sofortige Inspektion empfohlen.',
    },
    multiclass: {
      noMatch: 'Kein Übereinstimmung mit trainierten Zuständen ({{score}}%). Signal unklar.',
      healthy: 'Baseline-Zustand "{{label}}" erkannt ({{score}}% Übereinstimmung). Maschine arbeitet normal.',
      faulty: 'Zustand "{{label}}" erkannt ({{score}}% Übereinstimmung). Abweichung vom Normalzustand.',
    },
  },

  // ============================================================================
  // HARDWARE CHECK
  // ============================================================================
  hardware: {
    suitable: 'Hardware geeignet für Maschinendiagnose',
    voiceOptimized: 'Sprach-optimierte Hardware filtert Maschinengeräusche.',
    useStudioMic: 'Verwenden Sie ein Studio-Mikrofon oder das eingebaute Geräte-Mikrofon',
    mayFilter: 'Maschinengeräusche könnten gefiltert oder unterdrückt werden',
    lowSampleRate: 'Niedrige Sample Rates können hochfrequente Maschinensignale nicht erfassen',
    microphoneDenied: 'Mikrofonzugriff verweigert oder nicht verfügbar',
    iphoneBackMic: 'iPhone Rückseiten-Mikrofon',
  },

  // ============================================================================
  // DETECTION MODE
  // ============================================================================
  detectionMode: {
    stationary: 'Für kontinuierlich laufende Maschinen wie Ventilatoren, Pumpen, Kompressoren',
    cyclic: 'Für Maschinen mit wiederkehrenden Abläufen wie Verpackungsmaschinen, Montagelinien',
    referenceComparison: 'Referenzlauf-Vergleich',
    featureFFT: 'Frequenzanalyse mit FFT',
    featureGaussian: 'Gaussian Model für statistische Erkennung',
    featureLocalProcessing: 'Schnelle lokale Verarbeitung',
    featureNoML: 'Keine ML-Bibliothek erforderlich',
    featureYAMNet: 'YAMNet Deep Learning Model',
    featureMelSpectrogram: 'Mel-Spektrogramm Visualisierung',
    featureWebGPU: 'WebGPU-beschleunigte Inferenz',
  },

  // ============================================================================
  // COMMON
  // ============================================================================
  common: {
    machine: 'Maschine',
    error: 'Fehler',
    warning: 'Warnung',
    info: 'Info',
    success: 'Erfolg',
    yes: 'Ja',
    no: 'Nein',
    or: 'oder',
    ok: 'OK',
    loading: 'Laden...',
    initializing: 'Initialisierung...',
    unknown: 'unbekannt',
  },

  // ============================================================================
  // ROUTER / UI DESCRIPTIONS
  // ============================================================================
  router: {
    statesTrained: '{{count}} Zustand{{plural}} trainiert (zuletzt: {{date}}) - Weitere hinzufügen',
    referenceRequired: '10-Sekunden Referenzaufnahme (Erforderlich für Diagnose)',
    liveAnalysis: 'Live-Analyse durchführen',
    lastCheck: 'Letzte Prüfung {{time}}',
  },

  // ============================================================================
  // VIEW LEVELS
  // ============================================================================
  viewLevels: {
    basic: 'Einfache Ampel-Anzeige für Bediener',
    advanced: 'Details für Vorarbeiter & Instandhalter',
    expert: 'Volle technische Ansicht für Ingenieure',
    basicLabel: 'Basis',
    basicDesc: 'Einfach',
    advancedLabel: 'Fortgeschritten',
    advancedDesc: 'Details',
    expertLabel: 'Experte',
    expertDesc: 'Technisch',
    viewModeTitle: 'Ansichtsmodus',
    viewModeDescription: 'Passen Sie die Komplexität der Benutzeroberfläche an Ihre Bedürfnisse an.',
  },

  // ============================================================================
  // NOTIFICATIONS
  // ============================================================================
  notifications: {
    confirmRequired: 'Bestätigung erforderlich',
  },

  // ============================================================================
  // ERROR BOUNDARY
  // ============================================================================
  errorBoundary: {
    storageFull: 'Bitte löschen Sie alte Diagnosen oder Referenzaufnahmen.',
    networkError: 'Bitte überprüfen Sie Ihre Internetverbindung.',
    technicalDetails: 'Technische Details',
    noStackTrace: 'Kein Stack Trace verfügbar',
  },

  // ============================================================================
  // QUALITY CHECK
  // ============================================================================
  qualityCheck: {
    noFeatures: 'Keine Features vorhanden',
    noAudioData: 'Keine Audiodaten extrahiert (Frame Count 0)',
    highVariance: 'Hohe Spektralvarianz - Signal instabil',
    veryHighVariance: 'Sehr hohe Varianz - Bitte in ruhigerer Umgebung aufnehmen',
    outliers: '{{count}} Ausreißer erkannt ({{ratio}}%) - Mögliche Störgeräusche',
    weakSignal: 'Sehr schwaches/diffuses Signal - Möglicherweise nur Rauschen. Bitte näher an die Maschine gehen.',
    weakTonal: 'Schwaches tonales Signal - Signal-Rausch-Verhältnis könnte zu niedrig sein.',
    trainingSignalWeak: 'Signal zu schwach oder inkonsistent für Training. Bitte sicherstellen: Mikrofon nah an Maschine, Maschine läuft, kein reines Hintergrundrauschen. (Durchschnittliche Cosinus-Ähnlichkeit: {{value}})',
    invalidSampleRate: 'Ungültige Sample Rate: {{rate}}Hz. Erwartet: 8000-192000Hz (typisch: 44100Hz oder 48000Hz)',
  },

  // ============================================================================
  // LEVEL 2 REFERENCE
  // ============================================================================
  level2Reference: {
    title: '🔄 Level 2: Referenzlauf (ML)',
    fullDescription: 'Nehmen Sie einen Referenzlauf Ihrer Maschine im Normalzustand auf. Diese Aufnahme wird verwendet, um zukünftige Abweichungen zu erkennen.',
    description: 'Diese Aufnahme wird verwendet, um zukünftige Abweichungen zu erkennen.',
    readyForRecording: 'Bereit für Aufnahme',
    machineLabel: 'Maschine:',
    seconds: 'Sekunden',
    cameraHint: '📷 Position für Referenzbild - halten Sie das Gerät ruhig',
    recordButton: '🎤 Referenz aufnehmen',
    tipsTitle: 'ℹ️ Hinweise für gute Aufnahmen:',
    tipNormalState: 'Stellen Sie sicher, dass die Maschine im Normalzustand läuft',
    tipMicPosition: 'Halten Sie das Mikrofon konstant in Position',
    tipNoNoise: 'Vermeiden Sie Störgeräusche während der Aufnahme',
    tipDuration: 'Die Aufnahme dauert 10 Sekunden',
    notLoaded: 'nicht geladen',
    initializingModel: 'Initialisiere ML-Modell...',
    recordingStarting: '🎤 Aufnahme startet...',
    countdownText: '⏱️ Aufnahme startet in {{seconds}}...',
    recordingRunning: '🔴 Aufnahme läuft...',
    processingRecording: '🔄 Verarbeite Aufnahme...',
    referenceCreated: '✅ Referenz erfolgreich erstellt!',
    referenceSaved: 'Level 2 Referenz wurde gespeichert',
    referenceCreatedBtn: '✅ Referenz erstellt',
    errorPrefix: '❌ Fehler:',
  },

  // ============================================================================
  // LEVEL 2 DIAGNOSE
  // ============================================================================
  level2Diagnose: {
    title: '🔍 Level 2: Maschine prüfen (ML)',
    description: 'Vergleichen Sie den aktuellen Maschinenzustand mit der Referenz.',
    machineLabel: 'Maschine:',
    initializing: 'Initialisiere...',
    ghostHint: '👻 Bewegen Sie das Handy, bis Live-Bild und Referenzbild übereinstimmen',
    liveRecording: '🌊 Live-Aufnahme',
    similarityLabel: 'Übereinstimmung mit Referenz',
    spectrogramTitle: '📊 Spektrogramm (Analyse)',
    checkMachine: '🔍 Maschine prüfen',
    recheckMachine: '🔍 Erneut prüfen',
    analysisResult: '📊 Analyseergebnis',
    similarityDetail: 'Ähnlichkeit:',
    statusLabel: 'Status:',
    analysisTime: 'Analysezeit:',
    notLoaded: 'nicht geladen',
    noReference: '⚠️ Keine Referenz vorhanden. Bitte zuerst Referenz erstellen.',
    noReferenceError: 'Keine Referenz vorhanden. Bitte zuerst Referenz erstellen.',
    recordingRunning: '🎤 Aufnahme läuft...',
    recordingCountdown: '🔴 Aufnahme läuft... ({{seconds}}s)',
    analyzingRecording: '🔄 Analysiere Aufnahme...',
    analysisComplete: '✅ Analyse abgeschlossen: {{percentage}}%',
    referenceLoaded: '✅ Referenz geladen. Bereit für Diagnose.',
    newReferenceLoaded: '✅ Neue Referenz geladen. Bereit für Diagnose.',
    loadingNewReference: '🔄 Lade neue Referenz...',
    machineNormal: 'Maschine läuft normal',
    calculatingSimilarity: 'Berechne Ähnlichkeit...',
    initTensorflow: 'Initialisiere TensorFlow.js...',
    loadingYamnet: 'Lade YAMNet Modell (6 MB)...',
    extractingFeatures: 'Extrahiere Audio-Features...',
    savingReference: 'Speichere Referenz...',
    referenceCreatedProgress: 'Referenz erstellt',
    generatingSpectrogram: 'Generiere Spektrogramm...',
    warningDeviation: 'Leichte Abweichung erkannt - Beobachten empfohlen',
    criticalDeviation: 'Signifikante Abweichung - Wartung dringend empfohlen!',
    diagnosisSaved: 'Diagnose gespeichert',
    diagnosisSaveFailed: 'Diagnose konnte nicht gespeichert werden',
    healthyLabel: 'UNAUFFÄLLIG',
    warningLabel: 'WARNUNG',
    criticalLabel: 'KRITISCH',
    errorPrefix: '❌ Fehler:',
  },

  // ============================================================================
  // HEALTH GAUGE
  // ============================================================================
  healthGauge: {
    normal: 'UNAUFFÄLLIG',
    deviation: 'ABWEICHUNG',
    abnormal: 'AUFFÄLLIG',
  },

  // ============================================================================
  // INSPECTION VIEW (Simplified PWA)
  // ============================================================================
  inspection: {
    // Header
    mainQuestion: 'Hört sich die Maschine unauffällig an?',
    subtitle: 'Prüfung läuft – bitte nahe an die Maschine gehen',
    subtitleInitializing: 'Vorbereitung – bitte warten',
    // Status words (simple, non-technical)
    statusNormal: 'Unauffällig',
    statusUncertain: 'Unsicher',
    statusDeviation: 'Abweichung',
    // Reference info
    referenceState: 'Referenzzustand',
    referenceDefault: 'Normalbetrieb',
    // Dynamic hints for poor signal quality
    hintMoveCloser: 'Bitte näher an die Maschine gehen',
    hintChangePosition: 'Position leicht verändern',
    hintHoldSteady: 'Gerät ruhig halten',
    hintWaiting: 'Warte auf Maschinensignal...',
    // Button
    stopButton: 'STOP',
  },

  // ============================================================================
  // MODE SELECTOR
  // ============================================================================
  modeSelector: {
    title: 'Analysemodus',
    description: 'Wählen Sie den passenden Modus für Ihre Maschine',
    featuresOf: 'Funktionen von {{level}}:',
    modeChanged: 'Modus geändert: {{name}}',
    stationaryName: 'Level 1: Stationäre Geräusche (GMIA)',
    stationaryFeature: 'Gaussian Model für statistische Erkennung',
    cyclicName: 'Level 2: Zyklische Geräusche (ML)',
  },

  // ============================================================================
  // AUDIO
  // ============================================================================
  audio: {
    ready: 'Bereit',
    stabilizing: 'Akustische Stabilisierung... {{seconds}}s',
    waitingForSignal: 'Warte auf Signal...',
    recordingRunning: 'Aufnahme läuft',
  },

  // ============================================================================
  // SETTINGS UI (index.html)
  // ============================================================================
  settingsUI: {
    title: 'Einstellungen',
    nfcWriterTitle: 'NFC-Tags',
    nfcWriterDescription: 'Schreiben Sie NFC-Tags für den App-Zugang oder eine ausgewählte Maschine.',
    appearance: 'Erscheinungsbild',
    audioSettings: 'Audioeinstellungen',
    audioHardware: 'Audio Hardware',
    detectingMic: 'Erkenne Mikrofon...',
    initHardwareCheck: 'Initialisiere Hardware-Check',
    changeMicrophone: 'Anderes Mikrofon wählen',
    confidenceThreshold: 'Vertrauensschwelle',
    recordingDuration: 'Aufnahmedauer',
    seconds5: '5 Sekunden',
    seconds10: '10 Sekunden',
    seconds15: '15 Sekunden',
    seconds: 'Sekunden',
    frequencyAxis: 'Frequenzachse',
    frequencyAxisDesc: 'Logarithmisch (mehr Details im Bereich 20–500 Hz)',
    frequencyLogDesc: 'Logarithmisch (mehr Details im Bereich 20–500 Hz)',
    amplitudeAxis: 'Y-Achse / Amplitude',
    amplitudeAxisDesc: 'Logarithmisch (dB) – betont leise Signale',
    amplitudeLogDesc: 'Logarithmisch (dB) – betont leise Signale',
    deviceInvariantToggle: 'Device-Invariant Mode',
    deviceInvariantHelp: 'Hilft beim Vergleich zwischen unterschiedlichen Handys/Mikrofonen (lineare Effekte). Kann bei aggressiver Noise-Suppression begrenzt helfen.',
    deviceInvariantAdvanced: 'Erweiterte Einstellungen',
    deviceInvariantMethod: 'Methode',
    deviceInvariantMethodDct: 'DCT-Lifter Whitening',
    deviceInvariantMethodSmooth: 'Smooth Subtract',
    deviceInvariantStrength: 'Stärke',
    deviceInvariantStrengthLow: 'Niedrig',
    deviceInvariantStrengthMedium: 'Mittel',
    deviceInvariantStrengthHigh: 'Hoch',
    deviceInvariantZNorm: 'Z-Normalize',
    deviceInvariantZNormDesc: 'Über Frequenz-Bins normalisieren (mittlere Lautstärke entfernen).',
    deviceInvariantZNormOn: 'Z-Normalize an',
    deviceInvariantZNormOff: 'Z-Normalize aus',
    deviceInvariantABHint: 'Für A/B-Test: Referenz aufnehmen → DB exportieren → anderes Gerät importieren → Live-Test; dann Mode umschalten und wiederholen.',
    deviceInvariantMismatchTitle: 'Feature-Mode passt nicht',
    deviceInvariantMismatchDescription: 'Datenbank nutzt {{dbMode}}. App ist auf {{appMode}} eingestellt.',
    deviceInvariantMismatchNotice: 'Datenbank nutzt {{mode}}. Die passenden Einstellungen finden Sie in den Profi-Audioeinstellungen.',
    deviceInvariantMismatchPrompt: 'Datenbank nutzt {{dbMode}}. App ist auf {{appMode}} eingestellt. Einstellungen aus Datenbank übernehmen?',
    deviceInvariantApplyFromDb: 'Einstellungen aus Datenbank übernehmen',
    deviceInvariantApplied: 'Einstellungen aus Datenbank übernommen.',
    deviceInvariantModeBaseline: 'Baseline',
    deviceInvariantModeDim: 'Device-Invariant',
    analysisMethod: 'Analysemethode',
    analysisMethodDesc: 'Wählen Sie die passende Analysemethode für Ihre Maschine.',
    level1Info: 'Level 1: Frequenz- und Amplitudeneinstellungen oben aktiv',
    level2Info: 'Level 2: 10-Sekunden Aufnahme, YAMNet ML-Analyse',
    dataManagement: 'Datenverwaltung',
    exportDatabase: 'Datenbank exportieren',
    shareDatabase: 'Datenbank versenden',
    importDatabase: 'Datenbank importieren',
    statistics: 'Statistik:',
    machines: 'Maschinen',
    recordings: 'Aufnahmen',
    diagnoses: 'Diagnosen',
    clearAllData: 'Alle Daten löschen',
    deleteAllData: 'Alle Daten löschen',
    quickAccessDesc: 'Schneller Zugriff auf kürzlich verwendete Maschinen',
    noMachines: 'Keine Maschinen vorhanden',
    or: 'oder',
    selectMicrophone: 'Mikrofon auswählen',
    microphoneAdvice: 'Wählen Sie das beste Mikrofon für die Maschinendiagnose. Vermeiden Sie Headsets und Bluetooth-Geräte, da diese für Sprache optimiert sind.',
    manualInput: 'Manuell eingeben',
    machineIdInput: 'Maschinen-ID eingeben',
    continue: 'Weiter',
    qrHint: 'QR-Code oder Barcode in den Rahmen halten',
    codeRecognized: 'Code erkannt!',
  },

  // ============================================================================
  // AUTO-DETECTION (Simplified "Zustand prüfen" Flow)
  // ============================================================================
  autoDetect: {
    // Primary CTA
    startButton: 'Jetzt prüfen',
    hint: 'Das System erkennt automatisch bekannte Maschinen',

    // Manual selection toggle
    showManualSelection: 'Maschine manuell auswählen',
    hideManualSelection: 'Manuelle Auswahl ausblenden',

    // Listening modal
    listening: 'Höre zu...',
    waitingForSignal: 'Bitte Mikrofon an die Maschine halten',
    initializing: 'Initialisiere...',
    analyzing: 'Analysiere Geräusch...',

    // Fall A: Machine recognized (≥80%)
    machineRecognized: 'Maschine erkannt',
    matchConfidence: 'Übereinstimmung',
    continueAnalysis: 'Weiter prüfen',
    differentMachine: 'Andere Maschine',

    // Fall B: Uncertain match (40-79%)
    uncertainMatch: 'Welche Maschine ist das?',
    selectMachine: 'Bitte wählen Sie die passende Maschine',

    // Fall C: No match (<40%)
    noMatch: 'Dieses Geräusch kenne ich noch nicht',
    noMatchHint: 'Möchten Sie eine Referenz aufnehmen?',
    recordReference: 'Referenz aufnehmen',
    newMachine: 'Neue Maschine anlegen',
  },

  // ============================================================================
  // NFC WRITER
  // ============================================================================
  nfc: {
    title: 'NFC-Tag beschreiben',
    description: 'Wählen Sie aus, welche Information auf den NFC-Tag geschrieben wird.',
    supportDetails: 'Sicherer Kontext: {{secureContext}} · NDEFReader verfügbar: {{ndefReader}}',
    openWriter: 'NFC-Tag beschreiben',
    writeButton: 'Jetzt schreiben',
    optionGeneric: 'App-Link (generisch)',
    optionGenericDetail: 'Öffnet die App ohne Maschinen-ID.',
    optionSpecific: 'Maschinen-Link',
    optionSpecificDetailDefault: 'Öffnet die App mit der aktuell ausgewählten Maschine.',
    optionSpecificDetail: 'Öffnet die App für "{{name}}" (ID: {{id}}).',
    optionSpecificUnavailable: 'Wählen Sie zuerst eine Maschine aus, um einen spezifischen Link zu schreiben.',
    hint: 'Halten Sie den NFC-Tag an die Rückseite Ihres Geräts.',
    unavailableHint: 'NFC-Schreiben ist nur in Chrome auf Android verfügbar.',
    statusWriting: 'Schreibe NFC-Tag...',
    statusSuccess: 'NFC-Tag erfolgreich beschrieben.',
    statusCancelled: 'Schreibvorgang abgebrochen.',
    statusError: 'NFC-Tag konnte nicht beschrieben werden.',
    unsupported: 'NFC-Schreiben wird auf diesem Gerät nicht unterstützt.',
    requiresSecureContext: 'NFC-Schreiben erfordert eine sichere (HTTPS) Verbindung.',
    unsupportedBrowser: 'NFC-Schreiben erfordert Chrome auf Android.',
    // Customer ID (Variante B)
    customerIdLabel: 'Kundenkennung (c)',
    customerIdDescription: 'Diese Kennung bestimmt, welche Referenzdaten beim NFC-Scan geladen werden. Die App lädt automatisch: https://gunterstruck.github.io/<Kundenkennung>/db-latest.json',
    customerIdPlaceholder: 'z.B. Kundenkennung_nr1',
    customerIdRequired: 'Bitte geben Sie eine Kundenkennung ein.',
    dbUrlPreview: 'Geladene DB-URL: {{url}}',
  },

  // ============================================================================
  // REVIEW MODAL
  // ============================================================================
  review: {
    title: 'Aufnahme prüfen',
    subtitle: 'Qualitätskontrolle',
    listenTitle: 'Aufnahme anhören',
    browserNoAudio: 'Ihr Browser unterstützt keine Audio-Wiedergabe.',
    recordingInfo: '15 Sekunden Aufnahme (5s Stabilisierung + 10s Training)',
    positionImageTitle: 'Gespeichertes Positionsbild',
    positionImageCheck: 'Prüfen Sie, ob das Bild die korrekte Position zeigt.',
    qualityTitle: 'Qualitätsbewertung',
    quality: 'Qualität',
    issuesTitle: 'Erkannte Probleme:',
    discardNew: 'Verwerfen / Neu',
    saveAsReference: 'Als Referenz speichern',
  },

  // ============================================================================
  // DIAGNOSIS RESULTS MODAL
  // ============================================================================
  diagnosisResults: {
    title: 'Diagnoseergebnisse',
    fingerprintLabel: 'Fingerprint',
    confidenceScoreLabel: 'Vertrauensscore',
    featureModeLabel: 'Feature-Mode',
    featureModeValue: '{{mode}} · {{method}} · {{strength}} · {{zNorm}}',
    varianceTitle: 'Varianz',
    frequencyAnomalyLabel: 'Frequenzabweichung',
    analysisHintDefault: 'Hinweis: Leicht erhöhtes Signal um 20 kHz',
    referenceQualityTitle: 'Referenzqualität',
    referenceQualityStatusGood: 'GUT',
    referenceQualityDescription: 'Referenzaufnahme erfüllt empfohlene Bedingungen',
    viewHistory: 'Verlauf anzeigen',
  },

  // ============================================================================
  // WORK POINT RANKING (Probability Distribution View)
  // ============================================================================
  workPointRanking: {
    title: 'Zustandsanalyse',
    states: 'Zustände',
    ariaLabel: 'Ranking der erkannten Maschinenzustände',
    statusHealthy: 'Normal',
    statusFaulty: 'Fehler',
    noData: 'Keine Analysedaten verfügbar',
    rank: 'Rang',
    probability: 'Wahrscheinlichkeit',
    topMatch: 'Beste Übereinstimmung',
    sectionTitle: 'Detaillierte Zustandsverteilung',
    sectionDescription: 'Wahrscheinlichkeitsverteilung aller trainierten Maschinenzustände',
  },

  // ============================================================================
  // THEME DESCRIPTIONS
  // ============================================================================
  themes: {
    neonTitle: 'Neon Industrial',
    neonDescription: 'Kontrastreiches Neon-Design für dunkle Umgebungen. Akzente führen den Blick zu wichtigen Aktionen.',
    neonDesc: 'Kontrastreiches Neon-Design für dunkle Umgebungen. Akzente führen den Blick zu wichtigen Aktionen.',
    daylightTitle: 'Daylight',
    daylightDescription: 'Helles, blendarmes Design für den Außeneinsatz. Klare Kontraste bleiben in der Sonne lesbar.',
    daylightDesc: 'Helles, blendarmes Design für den Außeneinsatz. Klare Kontraste bleiben in der Sonne lesbar.',
    brandTitle: 'Zanobo',
    brandDescription: 'Hell, freundlich, vertrauenswürdig. KI, der man vertraut.',
    brandDesc: 'Hell, freundlich, vertrauenswürdig. KI, der man vertraut.',
    focusTitle: 'Steve Jobs',
    focusDescription: 'Eine Aktion. Kein Rauschen. Das Wesentliche im Fokus – alles andere tritt zurück.',
    focusDesc: 'Eine Aktion. Kein Rauschen. Klarheit, die funktioniert.',
  },

  // ============================================================================
  // LEVEL 2 DEFAULT CONTENT
  // ============================================================================
  level2Default: {
    referenceTitle: 'ML-Referenzaufnahme',
    referenceDescription: 'Erstellen Sie einen akustischen Fingerprint Ihrer Maschine im Normalzustand. Die KI lernt das typische Geräuschmuster für spätere Vergleiche.',
    feature10sec: '10 Sekunden Aufnahme',
    featureYamnet: 'YAMNet ML-Analyse',
    featureCamera: 'Automatische Positionierung per Kamera',
    selectMachineFirst: 'Bitte wählen Sie zuerst eine Maschine aus',
    diagnoseTitle: 'KI-Zustandsanalyse',
    diagnoseDescription: 'Vergleichen Sie den aktuellen Maschinenzustand mit der Referenz. Die KI erkennt Abweichungen und bewertet den Gesundheitszustand.',
    featureRealtime: 'Echtzeit-Analyse',
    featureWaterfall: 'Live-Wasserfall-Spektrogramm',
    featureTrafficLight: 'Ampel-Statusanzeige',
    refSubDesc: '10-Sekunden Referenzaufnahme',
    diagSubDesc: 'Live-Analyse durchführen',
    analyzeBtn: 'Analysieren',
  },

  // ============================================================================
  // MACHINE SETUP (NFC Deep Link - Status/Error Messages)
  // Note: Manual URL entry UI was removed - referenceDbUrl is now derived
  // from customerId via HashRouter.buildDbUrlFromCustomerId()
  // ============================================================================
  machineSetup: {
    // Validation errors (used by 1-Identify.ts for URL validation)
    urlEmpty: 'Bitte geben Sie einen Referenz-DB-Link ein.',
    urlInvalid: 'Der Link scheint keine gültige URL zu sein.',
    urlNotHttps: 'Der Link muss mit https:// beginnen.',
    urlNotOfficialSource: 'Nur offizielle Datenquellen (gunterstruck.github.io) werden akzeptiert.',

    // Download status (used by HashRouter, 1-Identify.ts, ReferenceLoadingOverlay)
    downloadingReference: 'Referenzdaten werden geladen...',
    statusDownloading: 'Lade Referenzdaten herunter...',
    statusParsing: 'Verarbeite Daten...',
    statusValidating: 'Prüfe Datenformat...',
    statusSaving: 'Speichere lokal...',
    statusComplete: 'Fertig!',

    // Download errors (used by HashRouter, 1-Identify.ts)
    errorMachineNotFound: 'Maschine nicht eingerichtet. Bitte wenden Sie sich an den Servicetechniker.',
    errorNoReferenceUrl: 'Keine Referenzdaten hinterlegt. Bitte wenden Sie sich an den Servicetechniker.',
    errorDownloadFailed: 'Download fehlgeschlagen. Bitte überprüfen Sie Ihre Internetverbindung.',
    errorInvalidFormat: 'Die Referenzdaten haben ein ungültiges Format.',
    errorInvalidStructure: 'Die Datenstruktur ist fehlerhaft.',
    errorNoModels: 'Keine Referenzmodelle in den Daten gefunden.',
    errorInvalidModel: 'Ein oder mehrere Referenzmodelle sind fehlerhaft.',
    errorUnknown: 'Ein unbekannter Fehler ist aufgetreten.',

    // Success messages (used by ReferenceLoadingOverlay)
    referenceLoaded: 'Referenzdaten erfolgreich geladen!',

    // Loading overlay (used by ReferenceLoadingOverlay)
    loadingTitle: 'Referenz wird geladen',
    loadingSubtitle: 'Bitte warten...',
    testingBlocked: 'Testen ist erst nach dem Laden der Referenzdaten möglich.',
  },

  // ============================================================================
  // FOOTER
  // ============================================================================
  footer: {
    impressum: 'Impressum',
    privacy: 'Datenschutz',
    about: 'Über Zanobo',
    settings: 'Einstellungen',
  },

  // ============================================================================
  // NFC IMPORT (Deep Link Import via ?importUrl=)
  // ============================================================================
  nfcImport: {
    // Modal
    modalTitle: 'NFC-Backup erkannt',
    warningOverwrite: 'Achtung: Die lokale Datenbank wird überschrieben!',
    currentData: 'Aktuelle Daten',
    newData: 'Neue Daten',
    exportedAt: 'Exportiert am',
    confirmButton: 'Daten importieren',

    // Success
    success: 'Datenbank erfolgreich importiert!',
    successTitle: 'Import abgeschlossen',

    // Errors
    error: 'Import fehlgeschlagen',
    errorTitle: 'Import fehlgeschlagen',
    errorGitHubBlob: 'Fehler: Bitte nutzen Sie den "Raw"-Link von GitHub, nicht den Web-Link.',
    errorFetchFailed: 'Download fehlgeschlagen. Bitte prüfen Sie die URL.',
    errorNotJson: 'Fehler: Die URL liefert HTML statt JSON.\n\nBitte nutzen Sie den "Raw"-Link von GitHub:\n1. Öffnen Sie die Datei auf GitHub\n2. Klicken Sie auf "Raw"\n3. Kopieren Sie die URL aus der Adressleiste',
    errorInvalidJson: 'Fehler: Die Datei enthält kein gültiges JSON-Format.',
    errorInvalidStructure: 'Fehler: Die Datei hat nicht das erwartete Backup-Format.',
    errorNetwork: 'Netzwerkfehler beim Laden der Daten. Bitte prüfen Sie Ihre Internetverbindung.',
  },

  // ============================================================================
  // ONBOARDING TRACE (Debug Protocol)
  // ============================================================================
  trace: {
    // UI
    title: 'Debug-Protokoll',
    toggle: 'Protokoll ein-/ausklappen',
    copyToClipboard: 'Protokoll kopieren',
    copy: 'Kopieren',
    copied: 'Kopiert!',
    copyFailed: 'Fehler',
    noEntries: 'Noch keine Einträge',

    // Status
    statusRunning: 'Läuft...',
    statusComplete: 'Abgeschlossen',
    statusFailed: 'Fehlgeschlagen',

    // Step labels - these map to TraceStepId
    steps: {
      // Deep Link Processing
      deep_link_detected: 'Deep-Link erkannt',
      hash_parsed: 'Hash geparst',
      machine_id_extracted: 'Maschinen-ID extrahiert',
      customer_id_extracted: 'Kunden-ID extrahiert',
      db_url_derived: 'DB-URL abgeleitet',

      // Download Process
      download_started: 'Download gestartet',
      download_complete: 'Download abgeschlossen',
      download_failed: 'Download fehlgeschlagen',

      // JSON Processing
      json_parse_started: 'JSON-Parse gestartet',
      json_parse_complete: 'JSON-Parse erfolgreich',
      json_parse_failed: 'JSON-Parse fehlgeschlagen',

      // Validation
      schema_validation_started: 'Schema-Validierung gestartet',
      schema_validation_complete: 'Schema-Validierung erfolgreich',
      schema_validation_failed: 'Schema-Validierung fehlgeschlagen',

      // Database Operations
      db_reset_started: 'DB-Reset gestartet',
      db_import_started: 'DB-Import gestartet',
      db_import_complete: 'DB-Import abgeschlossen',
      db_import_failed: 'DB-Import fehlgeschlagen',

      // App State
      app_state_reload: 'App-Status neu geladen',

      // Machine Operations
      machine_lookup: 'Maschine wird gesucht',
      machine_found: 'Maschine gefunden',
      machine_not_found: 'Maschine nicht gefunden',
      machine_created: 'Maschine erstellt',
      machine_selected: 'Maschine ausgewählt',

      // Final Steps
      test_dialog_shown: 'Test-Dialog angezeigt',
      process_complete: 'Prozess abgeschlossen',
      process_failed: 'Prozess fehlgeschlagen',
    },
  },

  // ============================================================================
  // BADGES (UI Hints)
  // ============================================================================
  badges: {
    recommended: 'Empfohlen',
    nextStep: 'Nächster Schritt',
  },
};
