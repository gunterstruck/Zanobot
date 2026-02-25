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
    closeDialog: 'Dialog schließen',
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
    quickAccessDescription: 'Schneller Zugriff auf kürzlich verwendete Maschinen',
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
    tenSecondRecording: '{{duration}}-Sekunden Referenzaufnahme',
    noReferenceModel: 'Kein Referenzmodell vorhanden',
    trainedStates: 'Trainierte Zustände',
    noModelsYet: 'Noch keine Referenzmodelle vorhanden',
    existingModels: 'VORHANDENE MODELLE:',
    statesTrainedCount: '{{count}} Zustand(e) bereits trainiert',
    recordingStatusHighQuality: 'Hohe Audioqualität erkannt',

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
      // iOS Audio Blocked (watchdog detection)
      iosAudioBlocked: 'Mikrofon blockiert',
      iosAudioBlockedMessage: 'Das Mikrofon liefert keine Audiodaten.\n\nMögliche Ursachen:\n• Eine andere App verwendet das Mikrofon\n• iOS blockiert den Mikrofonzugriff\n• Systemlautstärke ist stummgeschaltet\n\nBitte schließen Sie andere Apps und versuchen Sie es erneut.',
      iosAudioBlockedRetry: 'Erneut versuchen',
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
      machineQuestion: 'Hört sich die Maschine unauffällig an?',
      reference: 'Referenz',
      waitingForSignal: 'Warte auf Signal...',
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
  // PIPELINE STATUS DASHBOARD (Expert Mode)
  // ============================================================================
  pipelineStatus: {
    title: 'Pipeline-Status',
    room: 'Raum',
    rejected: 'verworfen',
    active: 'aktiv',
    waiting: 'bereit',
    chirpPending: 'Chirp wird ausgeführt...',
    chirpFailed: 'Chirp fehlgeschlagen',
    t60VeryDry: 'sehr trocken',
    t60Dry: 'trocken',
    t60Medium: 'mittel hallig',
    t60Reverberant: 'hallig',
    t60VeryReverberant: 'sehr hallig',
  },

  // ============================================================================
  // ENVIRONMENT COMPARISON (Reference T60 vs. Diagnosis T60)
  // ============================================================================
  envCompare: {
    environment: 'Umgebung',
    reference: 'Ref.',
    ok: '\u00c4hnliche Umgebung wie Referenz',
    moreReverberant: 'Umgebung deutlich halliger als Referenz',
    lesserReverberant: 'Umgebung deutlich trockener als Referenz',
    muchMoreReverberant: 'Pr\u00fcfumgebung stark abweichend \u2014 Score kann verf\u00e4lscht sein',
    muchLessReverberant: 'Pr\u00fcfumgebung stark abweichend \u2014 Score kann verf\u00e4lscht sein',
    recommendCloser: 'Empfehlung: N\u00e4her an Maschine messen oder Raumkompensation aktivieren',
    recommendCompensation: 'Empfehlung: Session Bias Match oder T60-Entzerrung aktivieren',
    recommendNote: 'Hinweis: Score-Abweichungen k\u00f6nnen umgebungsbedingt sein',
  },

  // ============================================================================
  // OPERATING POINT MONITOR (Expert Mode)
  // ============================================================================
  opMonitor: {
    title: 'Betriebszustand / Signalqualit\u00e4t',
    initializingBaseline: 'Referenz-Betriebspunkt wird erfasst \u2013 bitte Ger\u00e4t konstant halten\u2026',
    operatingPointChanged: 'Betriebspunkt ge\u00e4ndert \u2013 Referenzvergleich eingeschr\u00e4nkt.',
    scoreInvalid: '\u26A0 Betriebspunkt abweichend \u2013 Score nicht vergleichbar',
    similarityP10: {
      shortLabel: 'Stabilit\u00e4t',
      description: 'Bewertet die \u201eschlechtesten\u201c Momente der Aufnahme (10. Perzentil).',
      warning: '\u2139\uFE0F Signal unruhig: Der Durchschnitt ist gut, aber es gibt kurze Einbr\u00fcche. Gibt es schwankende Ger\u00e4usche oder Aussetzer?',
      explain: 'Bewertet die \u201eschlechtesten\u201c Momente der Aufnahme. Ein niedriger Wert zeigt, dass das Ger\u00e4usch unruhig ist, auch wenn der Durchschnitt gut aussieht.',
    },
    energyDelta: {
      shortLabel: 'Energie \u0394',
      description: 'Lautst\u00e4rke-Differenz zur Referenz in Dezibel.',
      warning: '\u26A0\uFE0F Achtung: Signal ist deutlich lauter/leiser als die Referenz. L\u00e4uft die Maschine unter anderer Last oder wurde der Mikrofonabstand ge\u00e4ndert? Der Score ist daher evtl. nicht vergleichbar.',
      explain: 'Zeigt die Lautst\u00e4rke-Differenz zur Referenz. Starke Abweichungen deuten auf ver\u00e4nderte Last, anderen Abstand oder eine lautere Umgebung hin.',
    },
    frequencyDelta: {
      shortLabel: 'Frequenz \u0394',
      description: 'Mittlere Verschiebung der wichtigsten Spektral-Peaks im Vergleich zur Referenz. Kann auf Drehzahl\u00e4nderung oder ge\u00e4nderten Betriebspunkt hinweisen.',
      warning: '\u26A0\uFE0F Abweichender Betriebspunkt: Die Hauptfrequenzen haben sich verschoben. Die Maschine l\u00e4uft vermutlich mit einer anderen Drehzahl als bei der Referenz.',
      explain: 'Vergleicht die wichtigsten Spektral-Peaks (z.\u00A0B. Motordrehzahl und Oberwellen) mit der Referenz. Eine Verschiebung bedeutet meist, dass die Maschine schneller oder langsamer l\u00e4uft.',
    },
    stability: {
      shortLabel: 'Signal-Stabilit\u00e4t',
      description: 'Anteil stabiler Signalabschnitte w\u00e4hrend der Messung.',
      warning: '\u26A0\uFE0F Signal instabil: Schwankende Ger\u00e4usche oder Unterbrechungen erkannt. Messung unter stabilen Bedingungen wiederholen.',
      explain: 'Misst, wie gleichm\u00e4\u00dfig das Ger\u00e4usch \u00fcber die Zeit ist. Niedrige Werte deuten auf schwankende Betriebsbedingungen oder St\u00f6rger\u00e4usche hin.',
    },
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
      partialWarning: 'Maschinen: {{machinesImported}} importiert, {{machinesSkipped}} übersprungen\nAufnahmen: {{recordingsImported}} importiert, {{recordingsSkipped}} übersprungen\nDiagnosen: {{diagnosesImported}} importiert, {{diagnosesSkipped}} übersprungen\n\n{{totalSkipped}} Datensatz/Datensätze konnten nicht importiert werden.\nModus: {{mode}}',
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
      preparing: 'Export wird vorbereitet... bitte kurz warten und erneut versuchen.',
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
    headsetsOptimized: 'Headsets sind für Sprachfrequenzen optimiert',
    mayFilter: 'Maschinengeräusche könnten gefiltert oder unterdrückt werden',
    lowSampleRate: 'Niedrige Sample Rates können hochfrequente Maschinensignale nicht erfassen',
    microphoneDenied: 'Mikrofonzugriff verweigert oder nicht verfügbar',
    iphoneBackMic: 'iPhone Rückseiten-Mikrofon',
    micReady: 'Mikrofon bereit',
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
    referenceRequired: '{{duration}}-Sekunden Referenzaufnahme (Erforderlich für Diagnose)',
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
    closeNotification: 'Benachrichtigung schließen',
  },

  // ============================================================================
  // ERROR BOUNDARY
  // ============================================================================
  errorBoundary: {
    unexpectedError: 'Ein unerwarteter Fehler ist aufgetreten.',
    unexpectedErrorTitle: 'Unerwarteter Fehler',
    permissionDenied: 'Zugriff verweigert',
    permissionHint: 'Bitte erlauben Sie den Zugriff auf Mikrofon/Kamera in Ihren Browser-Einstellungen.',
    hardwareNotFound: 'Hardware nicht gefunden',
    hardwareHint: 'Bitte stellen Sie sicher, dass Ihr Mikrofon/Kamera angeschlossen ist.',
    audioSystemError: 'Audio-System-Fehler',
    audioSystemHint: 'Bitte laden Sie die Seite neu. Falls das Problem weiterhin besteht, verwenden Sie einen aktuellen Browser.',
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
    detectingMicrophone: 'Erkenne Mikrofon...',
    initHardwareCheck: 'Initialisiere Hardware-Check',
    changeMicrophone: 'Anderes Mikrofon wählen',
    confidenceThreshold: 'Vertrauensschwelle',
    faultyThreshold: 'Auffälligkeitsschwelle',
    recordingDuration: 'Aufnahmedauer',
    recordingDurationDesc:
      'Reine Aufnahmezeit für Trainingsdaten. Zusätzlich werden 5 Sekunden Stabilisierungszeit für optimale Audioqualität vorgeschaltet.',
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
    disableAudioTriggerLabel: 'Audio-Trigger deaktivieren',
    disableAudioTriggerDesc: 'Startet die Messung sofort, auch bei sehr leisen Signalen, ohne auf einen Mindestpegel zu warten. Für extrem leise Maschinen oder Umgebungen.',
    analysisMethod: 'Analysemethode',
    analysisMethodDesc: 'Wählen Sie die passende Analysemethode für Ihre Maschine.',
    gmaiMethodDesc: 'GMIA (Generalized Mutual Interdependence Analysis) extrahiert den gemeinsamen, stabilen Anteil mehrerer Zeitfenster und unterdrückt gerätespezifische Effekte. Ideal für strukturierte, zeitlich stabile Maschinengeräusche.',
    level1Info: 'Level 1: Frequenz- und Amplitudeneinstellungen oben aktiv',
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
    // Banner-Einstellungen
    bannerTitle: 'Banner-Bild',
    bannerDescription: 'Passen Sie das Banner-Bild der Startseite an. Jedes Theme kann ein eigenes Banner haben.',
    bannerUpload: 'Banner hochladen',
    bannerReset: 'Auf Standard zurücksetzen',
    bannerHint: 'Empfohlen: 1024×400 oder 1024×500 Pixel, PNG-Format. Das linke Drittel bleibt für Text frei.',
    bannerFormatError: 'Format muss 1024×400 oder 1024×500 PNG sein.',
    bannerUpdated: 'Banner wurde aktualisiert.',
    bannerSaveError: 'Banner konnte nicht gespeichert werden.',
    bannerResetSuccess: 'Standardbanner wiederhergestellt.',
    bannerResetError: 'Fehler beim Zurücksetzen des Banners.',
    themeToggle: 'Theme wechseln',
    closeSettings: 'Einstellungen schließen',
    // Room Compensation (Expert only)
    roomCompTitle: 'Raumkompensation',
    roomCompDescription: 'Kompensiert akustische Raumeinflüsse (Nachhall) für stabilere Ergebnisse in verschiedenen Umgebungen.',
    roomCompEnabled: 'Raumkompensation aktivieren',
    biasMatchEnabled: 'Session Bias Match',
    biasMatchHint: 'Kompensiert spektrale Unterschiede zwischen Aufnahme-Sessions (verschiedene Räume, Mikro-Positionen). Empfohlen für Raumwechsel.',
    cmnEnabled: 'CMN (experimentell)',
    cmnWarning: '⚠️ Kann bei stationären Maschinen den Score verschlechtern. Nutze bevorzugt "Session Bias Match" oder T60/Dereverb.',
    t60Enabled: 'Raumvermessung per Chirp',
    t60Hint: 'Spielt automatisch einen kurzen Ton ab, um die Nachhallzeit zu messen',
    betaLabel: 'Kompensationsstärke (β)',
    roomCompActiveHint: '🔧 Raumkompensation aktiv',
    // Cherry-Picking (Expert only)
    cherryPickTitle: 'Cherry-Picking',
    cherryPickDescription: 'Filtert transiente Störgeräusche (Hupen, Hämmern, Türen) automatisch aus der Aufnahme.',
    cherryPickEnabled: 'Cherry-Picking aktiviert',
    sigmaLabel: 'Empfindlichkeit (σ)',
    sigmaHint: 'Niedrig = strenger (mehr Frames verworfen), Hoch = toleranter',
    cherryPickActiveHint: 'Cherry-Picking aktiv: Transiente Störgeräusche werden automatisch erkannt und verworfen.',
  },

  // ============================================================================
  // ROOM MEASUREMENT (Standalone T60 in Settings)
  // ============================================================================
  roomMeasure: {
    title: 'Raummessung',
    description: 'Misst die Nachhallzeit (T60) deiner aktuellen Umgebung per Chirp-Signal. Halte das Smartphone frei in den Raum (nicht abdecken).',
    measureBtn: 'Raum messen',
    measureAgain: 'Erneut messen',
    measuring: 'Messung läuft...',
    chirpProgress: 'Chirp {{current}}/{{total}}...',
    individual: 'Einzelmessungen',
    stddev: 'Standardabweichung',
    stable: 'stabil',
    unstable: 'instabil',
    veryDry: 'sehr trocken',
    dry: 'trocken',
    medium: 'mittel hallig',
    reverberant: 'hallig',
    veryReverberant: 'sehr hallig',
    classVeryDry: 'Sehr trockener Raum – ideal für Messungen',
    classDry: 'Trockener Raum – gute Bedingungen',
    classMedium: 'Mittel hallig – akzeptable Bedingungen',
    classReverberant: 'Hallig – Ergebnisse können beeinflusst werden',
    classVeryReverberant: 'Sehr hallig – näher an die Maschine gehen',
    errorNoResult: 'Messung fehlgeschlagen. Mögliche Ursachen:\n• Umgebung zu laut (Maschine abstellen)\n• Smartphone-Lautsprecher zu leise\n• Lautstärke am Gerät erhöhen',
    errorMicPermission: 'Kein Mikrofon-Zugriff. Bitte erlaube den Zugriff in den Browser-Einstellungen.',
    errorNoMic: 'Kein Mikrofon gefunden.',
    errorGeneric: 'Messung fehlgeschlagen. Bitte versuche es erneut.',
  },

  // ============================================================================
  // ZERO-FRICTION RECORDING (Auto-Machine Creation)
  // ============================================================================
  zeroFriction: {
    // Auto-generated machine names
    autoMachineName: 'Maschine {{number}}',
    // Success toast after silent save
    referenceCreatedToast: 'Referenz für {{machineName}} erstellt',
    // Edit button in toast/success screen
    editMachineName: 'Bearbeiten',
    // Prompt for editing machine name after creation
    editMachineNamePrompt: 'Neuen Namen für die Maschine eingeben:',
    // Success after renaming
    machineRenamed: 'Maschine umbenannt zu "{{newName}}"',
    // No machine selected hint (for when starting recording without machine)
    noMachineSelected: 'Keine Maschine ausgewählt – wird automatisch erstellt',
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
    closeDialog: 'NFC-Dialog schließen',
    // Customer ID (Variante B)
    customerIdLabel: 'Kundenkennung (c)',
    customerIdDescription: 'Diese Kennung bestimmt, welche Referenzdaten beim NFC-Scan geladen werden. Die App lädt automatisch: https://gunterstruck.github.io/<Kundenkennung>/db-latest.json',
    customerIdPlaceholder: 'z.B. Kundenkennung_nr1',
    customerIdRequired: 'Bitte geben Sie eine Kundenkennung ein.',
    dbUrlPreview: 'Geladene DB-URL: {{url}}',
  },

  // ============================================================================
  // QR CODE GENERATOR
  // ============================================================================
  qrCode: {
    title: 'QR-Code erstellen',
    description: 'Erstellen Sie einen QR-Code zum Ausdrucken oder Speichern. Einfach an der Maschine anbringen — fertig.',
    openGenerator: 'QR-Code erstellen',
    optionGeneric: 'App-Link (generisch)',
    optionGenericDetail: 'Öffnet die App ohne Maschinen-ID.',
    optionSpecific: 'Maschinen-Link',
    optionSpecificDetailDefault: 'Öffnet die App mit der aktuell ausgewählten Maschine.',
    optionSpecificDetail: 'Öffnet die App für "{{name}}" (ID: {{id}}).',
    optionSpecificUnavailable: 'Wählen Sie zuerst eine Maschine aus, um einen spezifischen QR-Code zu erstellen.',
    customerIdLabel: 'Kundenkennung (c)',
    customerIdDescription: 'Diese Kennung bestimmt, welche Referenzdaten beim Scan geladen werden.',
    customerIdPlaceholder: 'z.B. Kundenkennung_nr1',
    customerIdRequired: 'Bitte geben Sie eine Kundenkennung ein.',
    dbUrlPreview: 'Geladene DB-URL: {{url}}',
    urlPreview: 'Link-Vorschau',
    downloadPng: 'Als Bild speichern',
    print: 'Drucken',
    closeDialog: 'QR-Code Dialog schließen',
    generatedFor: 'QR-Code für',
    machineLabel: 'Maschine',
    machineIdLabel: 'ID',
    dateLabel: 'Erstellt am',
    printTitle: 'Maschinen-QR-Code',
    printInstructions: 'QR-Code ausschneiden und an der Maschine anbringen.',
    genericLabel: 'App-Zugang',
  },

  // ============================================================================
  // REVIEW MODAL
  // ============================================================================
  review: {
    title: 'Aufnahme prüfen',
    subtitle: 'Qualitätskontrolle',
    listenTitle: 'Aufnahme anhören',
    browserNoAudio: 'Ihr Browser unterstützt keine Audio-Wiedergabe.',
    recordingInfo: '{{total}} Sekunden Aufnahme (5s Stabilisierung + {{duration}}s Training)',
    positionImageTitle: 'Gespeichertes Positionsbild',
    savedPositionImage: 'Gespeichertes Positionsbild',
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
    varianceTitle: 'Varianz',
    frequencyAnomalyLabel: 'Frequenzabweichung',
    analysisHintDefault: 'Hinweis: Leicht erhöhtes Signal um 20 kHz',
    referenceQualityTitle: 'Referenzqualität',
    referenceQualityStatusGood: 'GUT',
    referenceQualityDescription: 'Referenzaufnahme erfüllt empfohlene Bedingungen',
    viewHistory: 'Verlauf anzeigen',
    closeDialog: 'Diagnose schließen',
  },

  // ============================================================================
  // HISTORY CHART MODAL
  // ============================================================================
  historyChart: {
    title: 'Maschinen-Verlauf',
    machineName: 'Maschine',
    dataPoints: 'Datenpunkte',
    timeRange: 'Zeitraum',
    xAxisLabel: 'Zeit',
    yAxisLabel: 'Health Score (%)',
    noData: 'Noch keine Historie vorhanden',
    noDataMessage: 'Für diese Maschine sind noch keine Diagnosen gespeichert.',
    errorMessage: 'Fehler beim Laden des Verlaufs.',
    closeDialog: 'Verlauf schließen',
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
    focusTitle: 'Steve Jobs',
    focusDescription: 'Eine Aktion. Kein Rauschen. Das Wesentliche im Fokus – alles andere tritt zurück.',
    focusDesc: 'Eine Aktion. Kein Rauschen. Klarheit, die funktioniert.',
    daylightTitle: 'Daylight',
    daylightDescription: 'Helles, blendarmes Design für den Außeneinsatz. Klare Kontraste bleiben in der Sonne lesbar.',
    daylightDesc: 'Helles, blendarmes Design für den Außeneinsatz. Klare Kontraste bleiben in der Sonne lesbar.',
    brandTitle: 'Zanobo',
    brandDescription: 'Hell, freundlich, vertrauenswürdig. KI, der man vertraut.',
    brandDesc: 'Hell, freundlich, vertrauenswürdig. KI, der man vertraut.',
    neonTitle: 'Neon Industrial',
    neonDescription: 'Kontrastreiches Neon-Design für dunkle Umgebungen. Akzente führen den Blick zu wichtigen Aktionen.',
    neonDesc: 'Kontrastreiches Neon-Design für dunkle Umgebungen. Akzente führen den Blick zu wichtigen Aktionen.',
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
    closeImpressum: 'Impressum schließen',
    closePrivacy: 'Datenschutzerklärung schließen',
    closeAbout: 'Über Zanobo schließen',
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
  // URL IMPORT (Deep Link Import via #/import?url=)
  // ============================================================================
  urlImport: {
    // Status messages (loading overlay)
    statusFetching: 'Datenbank wird geladen...',
    statusValidating: 'Daten werden geprüft...',
    statusImporting: 'Daten werden importiert...',

    // Success
    success: 'Datenbank erfolgreich importiert!',
    successTitle: 'Import abgeschlossen',

    // Errors
    errorTitle: 'Import fehlgeschlagen',
    errorGeneric: 'Import fehlgeschlagen.',
    errorInvalidUrl: 'Ungültige URL.',
    errorFetchFailed: 'Download fehlgeschlagen (HTTP {{status}}).',
    errorFileTooLarge: 'Datei zu groß. Maximale Größe: 50 MB.',
    errorNotJson: 'Die URL liefert HTML statt JSON. Bitte prüfen Sie den Link.',
    errorInvalidJson: 'Die Datei enthält kein gültiges JSON-Format.',
    errorInvalidStructure: 'Die Datei hat nicht das erwartete Datenbank-Format.',
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
      import_url_detected: 'Import-URL erkannt',

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

  // ============================================================================
  // DATABASE MIGRATION
  // ============================================================================
  migration: {
    title: 'Datenbank-Update',
    dataCleared:
      'Die Datenbank wurde aufgrund eines Updates zurückgesetzt. Alle Maschinen, Aufnahmen und Diagnosen wurden gelöscht.',
  },

  // ============================================================================
  // ABOUT MODAL
  // ============================================================================
  about: {
    title: 'Über Zanobo',
    subtitle: 'Assistent für akustischen Vergleich von Maschinenzuständen',

    // Introduction
    intro: '<strong>Zanobo 2.0</strong> ist eine datenschutzfreundliche Progressive Web App (PWA) für die vergleichende Analyse von Maschinenakustik. Die Anwendung ermöglicht es, Maschinengeräusche vollständig <strong>offline</strong> aufzuzeichnen und miteinander zu vergleichen – ohne Cloud-Dienste, ohne externe Sensoren und ohne trainierte KI-Modelle.<br><br>Zanobo versteht sich bewusst <strong>nicht als Diagnosewerkzeug</strong>, sondern als <strong>Vergleichs- und Orientierungsinstrument</strong>, das menschliche Einschätzung unterstützt.',

    // Core Features
    coreFeaturesTitle: 'Kernfunktionen',
    coreFeatures: {
      offlineFirst: '<strong>Offline-First:</strong> Alle Aufnahmen und Berechnungen erfolgen lokal im Browser.',
      similarityScore: '<strong>Ähnlichkeits-Score (0–100%):</strong> Zanobo berechnet eine mathematische Ähnlichkeit (Kosinus-Ähnlichkeit) zwischen Referenz- und Vergleichsaufnahme.',
      userThreshold: '<strong>Nutzerdefinierte Schwelle:</strong> Nutzer legen selbst fest, ab welchem Score ein Zustand als „unauffällig" oder „abweichend" gilt.',
      visualFeedback: '<strong>Visuelles Spektrum-Feedback:</strong> Echtzeit-Darstellung von Frequenzspektrum und Vergleichsergebnis.',
      noDataLeaks: '<strong>Lokale Datenspeicherung:</strong> Alle Audioaufnahmen und Scores werden ausschließlich in der lokalen IndexedDB des Geräts gespeichert.',
    },

    // Legal Position
    legalTitle: 'Rechtliche Position und IP-Überprüfung',
    legalIntro: 'Zanobo wurde unabhängig als <strong>privates, nicht-kommerzielles Open-Source-Projekt</strong> unter der <strong>MIT-Lizenz</strong> entwickelt. Die Funktionalität basiert auf <strong>offen beschriebenen mathematischen Verfahren</strong> (z.B. Frequenzanalyse und GMIA-ähnliche Kosinus-Vergleiche) und integriert <strong>keine patentierte Systemlogik</strong>, <strong>keine Klassifikationsmechanismen</strong> und <strong>keine Lernmodelle</strong>.',
    legalReview: 'Vor der Veröffentlichung wurde eine <strong>technische und inhaltliche Prüfung</strong> durchgeführt, um sicherzustellen, dass Zanobo nicht mit bestehenden Patenten oder bekannten industriellen Diagnoseansätzen kollidiert.',

    // IP Table
    ipTableTitle: 'Relevante IP und technische Abgrenzung',
    ipTable: {
      headers: {
        reference: 'Referenz / Titel',
        source: 'Quelle & Status',
        protectedScope: 'Geschützter Bereich',
        zanoboDiff: 'Abgrenzung von Zanobo',
      },
      rows: {
        '0': {
          reference: '<strong>PAPDEOTT005125</strong><br><em>Verfahren zur Diagnose von Maschinen</em>',
          source: 'Defensive Veröffentlichung, Siemens AG, 2016',
          protectedScope: 'Cloudbasiertes Diagnosesystem mit zentralen Datenbanken und mobilen Sensoren',
          zanoboDiff: 'Zanobo arbeitet vollständig lokal, ohne Cloud, ohne zentrale Datenbank, ohne Diagnose',
        },
        '1': {
          reference: '<strong>EP3701708B1</strong><br><em>Remote machine condition analysis</em>',
          source: 'Europäisches Patent, Siemens AG, 2022',
          protectedScope: 'ML-basierte Remote-Diagnose mit trainierten Modellen und Sensorik',
          zanoboDiff: 'Zanobo verwendet kein Machine Learning, keine Cloud, keine eingebettete Diagnose-Logik',
        },
        '2': {
          reference: '<strong>US9263041B2</strong><br><em>Channel detection in noise using GMIA</em>',
          source: 'Siemens Corp., 2016',
          protectedScope: 'Anwendung von GMIA für Sprach- und Hörsysteme',
          zanoboDiff: 'Zanobo nutzt GMIA-ähnliche Mathematik ausschließlich für Nicht-Sprache und lokale Vergleiche',
        },
        '3': {
          reference: '<strong>US9443201B2</strong><br><em>Learning of sensor signatures</em>',
          source: 'Siemens, 2016',
          protectedScope: 'Klassifikation und Modelltraining von Sensorsignaturen',
          zanoboDiff: 'Zanobo führt keine Klassifikation und kein Modelltraining durch',
        },
        '4': {
          reference: '<strong>US9602781B2</strong><br><em>Seismic signal deblending (GMIA)</em>',
          source: 'Schlumberger, 2017',
          protectedScope: 'Trennung seismischer Signale mittels GMIA',
          zanoboDiff: 'Unterschiedliche Domäne und Signalart, nicht verwandt',
        },
        '5': {
          reference: '<strong>ABB – Integration of Mobile Measurement</strong>',
          source: 'Öffentliche Industrie-Präsentation, ABB, 2015',
          protectedScope: 'Mobile Sensorik zur ad-hoc Diagnose mit Cloud- und Service-Integration',
          zanoboDiff: 'Zanobo vermeidet Diagnose, Service-Workflows und Cloud-Anbindung und fokussiert sich auf lokalen Vergleich',
        },
      },
    },

    // Use Cases
    useCasesTitle: 'Anwendungsfälle',
    useCasesIntro: 'Zanobo ermöglicht zwei grundlegende Vergleichsszenarien, die sich in ihrer zeitlichen und räumlichen Struktur unterscheiden:',

    // Serial Comparison
    serialComparisonTitle: 'a) Serieller Vergleich (Zeitlicher Vergleich / Trend)',
    serialComparisonPrinciple: '<strong>Prinzip:</strong> Vergleich einer aktuellen Aufnahme mit einer zuvor erstellten Referenz <strong>derselben Maschine</strong>.',
    serialComparisonGoal: '<strong>Ziel:</strong> Veränderungen des akustischen Musters über die Zeit sichtbar machen.',
    serialComparisonApplication: '<strong>Anwendung:</strong><ul><li>Eine Referenzaufnahme wird zu einem Zeitpunkt erstellt, an dem die Maschine als „unauffällig" bewertet wird</li><li>Spätere Aufnahmen werden mit dieser Referenz verglichen</li><li>Abweichungen vom ursprünglichen Muster werden quantifiziert (Ähnlichkeits-Score)</li></ul>',
    serialComparisonHint: '<strong>Hinweis:</strong> Zanobo zeigt lediglich <strong>ob und wie stark</strong> sich das aktuelle Geräusch von der Referenz unterscheidet. Die Interpretation, ob eine Abweichung relevant ist, erfolgt durch den Nutzer. Das System trifft keine Diagnose und gibt keine Prognose ab.',

    // Parallel Comparison
    parallelComparisonTitle: 'b) Paralleler Vergleich (Vergleich baugleicher Maschinen / Flotten-Check)',
    parallelComparisonPrinciple: '<strong>Prinzip:</strong> Vergleich mehrerer baugleicher Maschinen unter ähnlichen Betriebsbedingungen.',
    parallelComparisonGoal: '<strong>Ziel:</strong> Identifikation akustischer Ausreißer innerhalb einer Gruppe baugleicher Anlagen.',
    parallelComparisonApplication: '<strong>Anwendung:</strong><ul><li>Aufnahmen von mehreren baugleichen Maschinen (z. B. in einer Produktionshalle) werden erstellt</li><li>Zanobo berechnet die akustische Ähnlichkeit zwischen den Maschinen</li><li>Maschinen, deren Geräuschsignatur deutlich von der Gruppe abweicht, werden sichtbar</li></ul>',
    parallelComparisonSpecial: '<strong>Besonderheit:</strong> Funktioniert <strong>auch ohne historische Referenz</strong>. Die Vergleichsbasis bildet die Gruppe selbst.',
    parallelComparisonHint: '<strong>Hinweis:</strong> Zanobo entscheidet nicht, welche Maschine defekt ist oder welche den „Sollzustand" darstellt. Es zeigt ausschließlich <strong>relative Abweichungen</strong> innerhalb der Gruppe. Die Bewertung, ob eine abweichende Maschine weiter untersucht werden sollte, liegt beim Nutzer.',

    // NFC Section
    nfcTitle: 'NFC-basierter Sofortzugang und kontextbasierter Vergleich',
    nfcIntro: 'Zanobo unterstützt den <strong>Einsatz von NFC-Tags</strong> an Maschinen, um den Zugang zur App zu vereinfachen und optional einen maschinenspezifischen Kontext bereitzustellen.',

    nfcFunctionalityTitle: 'Funktionsweise',
    nfcTagDescription: '<strong>NFC-Tag an der Maschine:</strong> Ein am Gehäuse oder an der Zugangsstelle platzierter NFC-Tag kann folgende Informationen enthalten:<ul><li>URL zur Zanobo-PWA (direkter App-Start im Browser)</li><li>Maschinen-ID zur automatischen Identifikation</li><li>Optional: Verweis auf kundenspezifische Referenzdaten (URL zu einer JSON-Datei)</li></ul>',
    nfcInstantAccess: '<strong>Sofortzugang ohne Installation:</strong><ul><li>Der Nutzer hält das Smartphone an den NFC-Tag</li><li>Die Zanobo-PWA öffnet sich direkt im Browser (kein App Store, keine Registrierung erforderlich)</li><li>Optional: Die hinterlegte Maschinen-ID wird automatisch geladen</li></ul>',

    nfcReferenceDataTitle: 'Optionale kontextbasierte Referenzdaten',
    nfcReferenceDataDescription: 'Der NFC-Tag kann zusätzlich eine <strong>URL zu einer Referenzdatenbank</strong> enthalten. Diese Datenbank wird vom Maschinenbetreiber oder Servicepartner bereitgestellt und kann beinhalten:<ul><li><strong>Referenzaufnahmen</strong> für verschiedene Betriebszustände der Maschine</li><li><strong>Maschinenspezifische Metadaten</strong> (z. B. Typ, Baujahr, Standort)</li><li><strong>Vergleichsparameter</strong> für Flotten-Checks baugleicher Maschinen</li></ul>',

    nfcAdvantageTitle: 'Vorteil für neue oder externe Nutzer',
    nfcAdvantageDescription: 'Ein Servicetechniker oder Bediener, der die Maschine zum ersten Mal prüft, kann:<ul><li><strong>Sofort eine akustische Prüfung durchführen</strong>, ohne selbst eine Referenz aufnehmen zu müssen</li><li><strong>Direkt gegen vorhandene Referenzdaten vergleichen</strong>, die vom Betreiber bereitgestellt wurden</li><li><strong>Ohne Vorwissen</strong> eine erste Einschätzung treffen, ob das aktuelle Geräusch von der hinterlegten Referenz abweicht</li></ul>',

    nfcDataPrivacyTitle: 'Datenhaltung und Datenschutz',
    nfcDataPrivacyImportant: '<strong>Wichtig:</strong> Die Referenzdaten liegen <strong>nicht in einer Cloud von Zanobo</strong>. Sie werden bereitgestellt:<ul><li>Im <strong>lokalen Netzwerk</strong> des Betreibers (z. B. Intranet-Server)</li><li>In einer <strong>kundeneigenen Umgebung</strong> (z. B. GitHub Pages, eigener Webserver)</li><li>Als <strong>statische JSON-Datei</strong>, die über eine HTTPS-URL abrufbar ist</li></ul>',
    nfcDataPrivacyStorage: 'Die Referenzdatenbank wird beim ersten NFC-Scan heruntergeladen und anschließend <strong>lokal im Gerät</strong> gespeichert (IndexedDB). Alle weiteren Vergleiche erfolgen offline.',

    nfcFocusTitle: 'Fokus und Abgrenzung',
    nfcFocusDescription: 'Der NFC-basierte Zugang dient ausschließlich der <strong>Zugänglichkeit und Vergleichbarkeit</strong>. Er ermöglicht:<ul><li>Schnellen Einstieg ohne manuelle Konfiguration</li><li>Nutzung vorhandener Referenzdaten ohne eigene Aufnahme</li><li>Konsistente Vergleichsbasis bei mehreren Nutzern oder Standorten</li></ul>',
    nfcNoFeatures: '<strong>Zanobo führt auch bei Nutzung von NFC-basierten Referenzdaten:</strong><ul><li><strong>Keine Diagnose</strong> durch (keine Aussage über Schadensursache oder Zustand)</li><li><strong>Keine Automatisierung</strong> von Entscheidungen (kein „Gut/Schlecht"-Urteil)</li><li><strong>Keine Cloud-basierte Auswertung</strong> (alle Berechnungen erfolgen lokal)</li></ul>',
    nfcInterpretation: 'Die Interpretation der Vergleichsergebnisse liegt stets beim Nutzer.',

    // Transparency
    transparencyTitle: 'Transparenz und Intention',
    transparencyText1: 'Zanobo ist <strong>kein Diagnosewerkzeug</strong> und trifft <strong>keine automatisierten technischen Bewertungen</strong>. Es stellt ausschließlich eine <strong>visuelle und mathematische Vergleichshilfe</strong> bereit.',
    transparencyText2: 'Alle Verarbeitungen erfolgen <strong>offline</strong>. Es werden <strong>keine Nutzerdaten übertragen, gespeichert oder ausgewertet</strong>.',
    transparencyText3: 'Diese Transparenz ist Ausdruck eines bewussten Umgangs mit Verantwortung, Datenschutz und Rechten Dritter.',
    transparencyList: {
      noClassification: 'keine Zustandsklassifikation',
      noCauseAnalysis: 'keine Fehlerursachenanalyse',
      noRepairRecommendations: 'keine Reparaturempfehlungen',
    },

    // Public Instance
    publicInstance: 'Öffentliche Instanz:',
    publicInstanceUrl: 'https://zanobo.vercel.app',

    // Version Info
    version: 'Version:',
    versionNumber: '2.0.0 (2026)',
    developedBy: 'Entwickelt von:',
    developerName: 'Günter Struck',
    license: 'Lizenz:',
    licenseType: 'MIT',
    stack: 'Technologie-Stack:',
    stackTech: 'TypeScript, Vite, Web Audio API',

    // Guiding Principle
    guidingPrincipleTitle: 'Leitgedanke',
    guidingPrincipleQuestion: 'Hört sich die Maschine normal an?',
    guidingPrincipleStatement: 'Smartphones hören Maschinenklänge.',
  },

  // ============================================================================
  // DRIFT DETECTOR (Change Analysis)
  // ============================================================================
  drift: {
    // Settings
    settingsTitle: 'Änderungsanalyse',
    settingsDescription: 'Analysiert ob Score-Änderungen durch die Umgebung (Raum) oder die Maschine verursacht werden. Zeigt während der Diagnose eine separate Bewertung an.',
    enabled: 'Änderungsanalyse aktiviert',
    howItWorks: 'Das System trennt spektrale Änderungen in zwei Komponenten: Glatte, breitbandige Drift (= Raum/Umgebung) und lokale, schmalbandige Änderungen (= Maschine). So siehst du, ob ein Score-Abfall vom Raum oder von der Maschine kommt.',
    smoothWindow: 'Glättungsfenster',
    smoothHint: 'Größer = mehr Trennung zwischen Raum und Maschine. Kleiner = empfindlicher für Raumeigenheiten.',
    globalThreshold: 'Raum-Empfindlichkeit',
    globalThresholdHint: 'Niedrig = warnt früher bei Umgebungswechsel. Hoch = toleranter.',
    localThreshold: 'Maschinen-Empfindlichkeit',
    localThresholdHint: 'Niedrig = erkennt kleine Maschinenänderungen. Hoch = toleranter.',

    // Diagnose Panel
    title: 'Änderungsanalyse',
    environment: 'Umgebung',
    machine: 'Maschine',

    // Global Status
    globalOk: 'Umgebung konsistent',
    globalWarning: 'Umgebung leicht verändert',
    globalCritical: 'Umgebung stark verändert',

    // Local Status
    localOk: 'Keine strukturelle Änderung',
    localWarning: 'Leichte Änderung erkannt',
    localCritical: 'Deutliche Änderung erkannt',

    // Interpretations
    allOk: 'Umgebung und Maschine konsistent zur Referenz',
    roomChange: 'Umgebungsänderung erkannt – Maschine unverändert',
    machineChange: 'Maschinenänderung erkannt – Maschine prüfen',
    both: 'Umgebung und Maschine verändert – Ergebnis mit Vorsicht interpretieren',
    uncertain: 'Unklare Situation – näher an Maschine messen oder neue Referenz erstellen',

    // Recommendations
    recommendRoom: 'Score-Abfall wahrscheinlich durch Umgebung oder Mikrofonposition verursacht. Näher an Maschine messen, gleiche Position wie bei Referenz wählen, oder Referenz in dieser Umgebung neu erstellen.',
    recommendMachine: 'Strukturelle Änderung an der Maschine erkannt. Wartung prüfen.',
    recommendBoth: 'Sowohl Umgebung als auch Maschine verändert. Für zuverlässiges Ergebnis: Referenz in aktueller Umgebung neu erstellen.',
    recommendUncertain: 'Für klareres Ergebnis: Näher an Maschine messen, gleiche Position wie bei Referenz wählen, oder Referenz in aktueller Umgebung erstellen.',

    // Contextual hints
    roomChangeButScoreOk: 'Umgebungsänderung erkannt, aber Score stabil – das ist ein gutes Zeichen.',
    roomChangeMayCauseScoreDrop: 'Score-Abfall könnte durch Umgebung oder Mikrofonposition verursacht sein, nicht durch die Maschine. Gleiche Position wie bei Referenz wählen oder Referenz hier neu erstellen.',
    machineChangeDetected: 'Strukturelle Änderung an der Maschine erkannt. Bitte prüfen.',

    // Reference phase
    referenceHint: 'Änderungsanalyse aktiv: Diese Aufnahme definiert auch die Referenz-Umgebung und Mikrofonposition. Spätere Diagnosen zeigen ob sich die Umgebung oder die Maschine verändert hat.',
    referenceStored: 'Umgebungsprofil gespeichert. Bei zukünftigen Diagnosen wird automatisch analysiert ob Änderungen von der Umgebung oder der Maschine kommen.',
  },
};
