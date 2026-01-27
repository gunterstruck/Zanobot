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
    startDiagnosis: 'Diagnose starten',
    close: 'Schließen',
    cancel: 'Abbrechen',
    save: 'Speichern',
    discard: 'Verwerfen',
    trainAnother: 'Weiteren Zustand trainieren',
    newMachine: 'Neue Maschine',
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
    databaseImported: 'Datenbank importiert',
    databaseCleared: 'Datenbank geleert',
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
    noReferenceModel: 'Kein Referenzmodell vorhanden',
    trainedStates: 'Trainierte Zustände',
    noModelsYet: 'Noch keine Referenzmodelle vorhanden',
    existingModels: 'VORHANDENE MODELLE:',
    statesTrainedCount: '{{count}} Zustand(e) bereits trainiert',

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

    sampleRateError: 'Audio-Setup Fehler: Ihr Mikrofon läuft bei {{actual}}Hz, aber kein Referenzmodell wurde bei dieser Sample Rate trainiert (Modelle: {{expected}}Hz). Bitte verwenden Sie das gleiche Audio-Setup wie beim Training oder erstellen Sie ein neues Referenzmodell mit der aktuellen Sample Rate.',

    display: {
      referenceModels: 'REFERENZMODELL(E):',
      statesTrainedCount: '{{count}} Zustand(e) trainiert',
      debugValues: '🔍 DEBUG VALUES:',
      signalHint: 'Telefon näher an die Maschine halten für optimales Signal',
      match: 'Übereinstimmung',
      ghostHint: '👻 Bewegen Sie das Handy, bis Live-Bild und Referenzbild übereinstimmen',
    },

    analysis: {
      healthyMatch: 'Akustische Signatur entspricht Referenzzustand "{{state}}" ({{score}}%). Keine Auffälligkeiten.',
      faultyMatch: 'Auffälligkeit erkannt: Signatur entspricht trainiertem Muster "{{state}}" ({{score}}%). Inspektion empfohlen.',
    },
  },

  // ============================================================================
  // PHASE 4: SETTINGS
  // ============================================================================
  settings: {
    databaseNotAvailable: 'Datenbank nicht verfügbar. Bitte erlauben Sie IndexedDB in Ihren Browser-Einstellungen oder deaktivieren Sie den strikten Privacy-Modus.',
    exportError: 'Fehler beim Exportieren der Datenbank',
    importError: 'Fehler beim Importieren',

    import: {
      confirmMerge: 'Datenbank importieren aus: {{filename}}\n\nMöchten Sie die Daten ZUSAMMENFÜHREN?\n\nJA = Zusammenführen mit bestehenden Daten\nNEIN = Alle bestehenden Daten ERSETZEN',
      confirmReplace: '⚠️ ACHTUNG!\n\nAlle bestehenden Daten werden GELÖSCHT und durch die Import-Daten ersetzt!\n\nMöchten Sie fortfahren?',
      success: 'Maschinen: {{machines}}\nAufnahmen: {{recordings}}\nDiagnosen: {{diagnoses}}\n\nModus: {{mode}}',
      modeMerged: 'Zusammengeführt',
      modeReplaced: 'Ersetzt',
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
    ok: 'OK',
    loading: 'Laden...',
    initializing: 'Initialisierung...',
    unknown: 'unbekannt',
  },
};
