/**
 * ZANOBOT - French (Français) Translations
 */

import type { TranslationDict } from '../index.js';

export const fr: TranslationDict = {
  // ============================================================================
  // BUTTONS
  // ============================================================================
  buttons: {
    stop: 'Arrêter',
    stopAndSave: 'Arrêter et sauvegarder',
    scan: 'Scanner',
    create: 'Créer',
    record: 'Enregistrer',
    startDiagnosis: 'Vérifier l\'état',
    analyze: 'Analyser',
    close: 'Fermer',
    cancel: 'Annuler',
    save: 'Sauvegarder',
    discard: 'Rejeter',
    trainAnother: 'Entraîner un autre état',
    newMachine: 'Nouvelle machine',
    stopRecording: 'Arrêter l\'enregistrement',
    saveReference: 'Enregistrer la référence',
  },

  // ============================================================================
  // BANNER
  // ============================================================================
  banner: {
    headline: 'Le système sonne-t-il normal ?',
    subline: 'Vérifier l\'état en quelques secondes – directement sur l\'appareil, hors ligne',
  },

  // ============================================================================
  // STATUS
  // ============================================================================
  status: {
    healthy: 'Normal',
    uncertain: 'Déviation',
    faulty: 'Anormal',
    unknown: 'Inconnu',
    noData: 'Pas de données',
    notChecked: 'Pas encore vérifié',
    ready: 'Prêt',
    analyzing: 'ANALYSE EN COURS...',
  },

  // ============================================================================
  // MODAL TITLES
  // ============================================================================
  modals: {
    referenceRecording: 'Enregistrement de référence',
    liveDiagnosis: 'Diagnostic en direct - Trouver le point optimal',
    qrScanner: 'Scanner QR/Code-barres',
    databaseError: 'Erreur de base de données',
    browserIncompatible: 'Navigateur incompatible',
    accessDenied: 'Accès refusé',
    processingError: 'Erreur de traitement',
    saveError: 'Erreur de sauvegarde',
    sampleRateMismatch: 'Fréquence d\'échantillonnage incompatible',
    unsuitable: 'Signal inapproprié',
    referenceUnsuitable: 'Enregistrement de référence inapproprié',
    recordingDiscarded: 'Enregistrement rejeté',
    cameraOptional: 'Caméra optionnelle',
    noSignalDetected: 'Aucun signal détecté',
    scanError: 'Erreur de scan',
    databaseExported: 'Base de données exportée',
    databaseShared: 'Base de données partagée',
    databaseImported: 'Base de données importée',
    databaseCleared: 'Base de données effacée',
    nfcDiagnosisTitle: 'Vérifier l\'état ?',
    nfcDiagnosisPrompt: 'Machine détectée. Vérifier l\'état maintenant ?',
    closeDialog: 'Fermer le dialogue',
  },

  // ============================================================================
  // PHASE 1: IDENTIFY (Machine Selection)
  // ============================================================================
  identify: {
    selectMachine: 'Sélectionner une machine',
    scanQrCode: 'Scanner le code QR',
    scanQrDescription: 'Identifier la machine via code QR',
    manualEntry: 'Créer manuellement',
    manualEntryDescription: 'Créer une nouvelle machine avec un nom',
    machineName: 'Nom de la machine',
    machineId: 'ID de la machine (optionnel)',
    quickAccess: 'Accès rapide',
    quickAccessDescription: 'Accès rapide aux machines récemment utilisées',
    recentlyUsed: 'Récemment utilisé',
    overview: 'Aperçu',
    machineOverview: 'Aperçu des machines',
    history: 'Historique',
    noMeasurements: 'Aucune mesure disponible',
    noMachines: 'Aucune machine disponible',
    statesTrained: '{{count}} états entraînés',

    errors: {
      scannerStart: 'Erreur lors du démarrage du scanner',
      cameraAccessDenied: 'Accès à la caméra refusé',
      cameraAccessHint: 'Veuillez autoriser l\'accès à la caméra dans les paramètres de votre navigateur',
      noCameraFound: 'Aucune caméra trouvée',
      noCameraHint: 'Veuillez vous assurer que votre appareil dispose d\'une caméra',
      qrProcessing: 'Erreur lors du traitement du code QR',
      invalidCode: 'Code invalide scanné',
      codeProcessing: 'Erreur lors du traitement du code',
      manualEntryLoad: 'L\'entrée manuelle n\'a pas pu être chargée',
      invalidMachineId: 'ID de machine invalide',
      machineLoad: 'Erreur lors du chargement de la machine',
      machineNotFound: 'Machine non trouvée. Veuillez sélectionner à nouveau.',
      nameRequired: 'Veuillez entrer un nom de machine',
      nameWhitespace: 'Le nom de la machine ne peut pas être uniquement des espaces',
      nameTooLong: 'Le nom de la machine est trop long (maximum 100 caractères)',
      machineExists: 'Une machine avec cet ID existe déjà',
      machineCreate: 'Erreur lors de la création de la machine',
      idEmpty: 'L\'ID de la machine ne peut pas être vide',
      idTooShort: 'L\'ID de la machine est trop court',
      idTooLong: 'L\'ID de la machine est trop long (maximum 100 caractères)',
      idWhitespace: 'L\'ID de la machine ne peut pas être uniquement des espaces',
      microphoneLoad: 'Erreur lors du chargement des microphones',
      microphoneSwitch: 'Erreur lors du changement de microphone',
    },

    success: {
      machineLoaded: 'Machine "{{name}}" chargée',
      machineCreated: 'Machine créée : {{name}}',
      machineAutoCreated: 'Nouvelle machine "{{name}}" créée automatiquement.',
      microphoneOptimized: 'Microphone automatiquement réglé sur "{{label}}" pour un meilleur diagnostic',
      microphoneChanged: 'Microphone changé : {{label}}',
    },

    warnings: {
      preferredMicrophoneUnavailable:
        'Le microphone préféré n’est plus disponible. Le microphone par défaut sera utilisé.',
    },

    messages: {
      codeRecognized: 'Code reconnu : {{code}}',
      autoMachineName: 'Machine {{id}}',
      loadingMachine: 'Chargement de la machine...',
    },

    time: {
      justNow: 'à l\'instant',
      minutesAgo: 'il y a {{minutes}} min.',
      hoursAgo: 'il y a {{hours}} h.',
      dayAgo: 'il y a 1 jour',
      daysAgo: 'il y a {{days}} jours',
      weekAgo: 'il y a 1 semaine',
      weeksAgo: 'il y a {{weeks}} semaines',
    },
  },

  // ============================================================================
  // PHASE 2: REFERENCE (Training)
  // ============================================================================
  reference: {
    recordReference: 'Enregistrer la référence',
    tenSecondRecording: 'Enregistrement de référence de 10 secondes',
    noReferenceModel: 'Aucun modèle de référence disponible',
    trainedStates: 'États entraînés',
    noModelsYet: 'Aucun modèle de référence disponible',
    existingModels: 'MODÈLES EXISTANTS :',
    statesTrainedCount: '{{count}} état(s) déjà entraîné(s)',
    recordingStatusHighQuality: 'Haute qualité audio détectée',

    // State-based card UI (mirrors diagnose card)
    statesRecorded: '{{count}} état enregistré',
    noReferenceYet: 'Pas encore de référence',
    changeMachine: 'Changer de machine',
    noMachinesYet: 'Aucune machine créée.',
    noMachinesHint: 'Veuillez d\'abord créer une nouvelle machine.',

    recording: {
      alreadyRunning: 'Un enregistrement est déjà en cours.',
      cameraNotAvailable: 'Caméra non disponible. L\'enregistrement continuera sans image de position.',
      browserNotCompatible: 'Votre navigateur ne prend pas en charge l\'enregistrement audio. Veuillez utiliser un navigateur moderne.',
      stabilizing: 'Stabilisation...',
      waitingForSignal: 'En attente du signal',
      recording: 'Enregistrement en cours',
      microphoneFailed: 'Accès au microphone échoué',
      processingFailed: 'L\'enregistrement n\'a pas pu être traité',
      noSignal: 'Veuillez vous rapprocher de la machine et réessayer.',
      positionImage: '📷 L\'image de position sera capturée automatiquement',
      instruction: 'Tenez le microphone à 10-30 cm devant la machine.',
      // iOS Audio Blocked (watchdog detection)
      iosAudioBlocked: 'Microphone bloqué',
      iosAudioBlockedMessage: 'Le microphone ne fournit pas de données audio.\n\nCauses possibles :\n• Une autre application utilise le microphone\n• iOS bloque l\'accès au microphone\n• Le volume du système est coupé\n\nVeuillez fermer les autres applications et réessayer.',
      iosAudioBlockedRetry: 'Réessayer',
    },

    quality: {
      signalStable: '✓ Signal stable',
      slightUnrest: '⚠ Légère instabilité',
      signalUnstable: '✗ Attention : Signal instable !',
    },

    errors: {
      tooShort: 'Enregistrement trop court : {{duration}}s de durée totale est plus court que la phase de préchauffage de {{warmup}}s. Durée minimale : {{minDuration}}s',
      trainingTooShort: 'Données d\'entraînement trop courtes : {{duration}}s (après la phase de préchauffage). Minimum requis : {{minDuration}}s. Veuillez enregistrer au moins {{totalDuration}}s.',
      qualityTooLow: 'Qualité d\'enregistrement trop faible pour l\'entraînement. Veuillez enregistrer à nouveau dans un environnement calme avec un signal machine clair.\n\nProblèmes :\n{{issues}}',
      signalTooWeak: 'Signal trop faible ou diffus (peut-être juste du bruit).\n\nForce du signal (RMS) : {{magnitude}} (Minimum : 0.03)\nQualité : {{quality}}%\n\nVeuillez vous assurer :\n• Le microphone est assez proche de la machine (10-30cm)\n• La machine fonctionne à un volume suffisant\n• Vous n\'enregistrez pas uniquement du bruit de fond\n\nProblèmes :\n{{issues}}',
      qualityWarning: '⚠️ ATTENTION : Mauvaise qualité d\'enregistrement\n\nLa qualité de cet enregistrement est mauvaise. L\'entraînement peut être peu fiable.\n\nProblèmes :\n{{issues}}\n\nVoulez-vous quand même sauvegarder ?',
      baselineTooLow: 'Enregistrement de référence trop flou ou bruyant.\n\nScore d\'auto-reconnaissance : {{score}}%\nMinimum requis : {{minScore}}%\n\nCauses possibles :\n• Signal trop faible ou instable\n• Trop de bruit de fond\n• Machine ne fonctionnant pas de manière constante\n\nVeuillez répéter l\'enregistrement dans de meilleures conditions :\n• Microphone plus proche de la machine (10-30cm)\n• Environnement calme\n• Machine fonctionnant de manière stable pendant tout l\'enregistrement',
      noAudioFile: 'Veuillez d\'abord créer un enregistrement de référence.',
      exportFailed: 'Échec de l\'exportation',
      saveFailed: 'Échec de la sauvegarde',
      machineDataMissing: 'Données de la machine manquantes',
    },

    success: {
      modelTrained: '✅ Modèle de référence entraîné avec succès !\n\nMachine : {{name}}\n\nVoulez-vous télécharger le fichier audio de référence ?\n(Recommandé pour la sauvegarde)',
      canStartNew: 'Vous pouvez démarrer un nouvel enregistrement de référence.',
    },

    labels: {
      baseline: 'Référence',
      prompt: 'Entrez un nom pour cet état de machine :\n\nExemples :\n• États de fonctionnement normaux : "Ralenti", "Pleine charge", "Charge partielle"\n• Défauts : "Déséquilibre simulé", "Dommage de roulement", "Erreur de ventilateur"',
      confirmType: 'État : "{{label}}"\n\nEst-ce un état de fonctionnement NORMAL ?\n\n🟢 OK (Oui) → État normal (ex. "Ralenti", "Pleine charge")\n🔴 Annuler (Non) → Défaut connu (ex. "Déséquilibre", "Dommage de roulement")\n\nNote : Ce choix détermine si un diagnostic est affiché comme "sain" ou "défectueux".',
      enterName: 'Veuillez entrer un nom',
      cancelled: 'Annulé',
    },
  },

  // ============================================================================
  // PHASE 3: DIAGNOSE (Real-time)
  // ============================================================================
  diagnose: {
    alreadyRunning: 'Un diagnostic est déjà en cours.',
    noReferenceModel: 'Aucun modèle de référence trouvé. Veuillez d\'abord créer un enregistrement de référence.',
    browserNotCompatible: 'Votre navigateur ne prend pas en charge le diagnostic en temps réel. Veuillez utiliser Chrome, Edge ou Safari.',
    noValidSampleRate: 'Aucun modèle de référence avec une fréquence d\'échantillonnage valide trouvé.',
    cameraNotAvailable: 'Caméra non disponible. Le diagnostic continuera sans guide de position.',
    diagnosisRunning: 'Diagnostic en cours',
    saveFailed: 'Le diagnostic n\'a pas pu être sauvegardé',
    liveAnalysis: 'Effectuer une analyse en direct',

    sampleRateError: 'Erreur de configuration audio : Votre microphone fonctionne à {{actual}}Hz, mais aucun modèle de référence n\'a été entraîné à cette fréquence d\'échantillonnage (Modèles : {{expected}}Hz). Veuillez utiliser la même configuration audio que lors de l\'entraînement ou créer un nouveau modèle de référence avec la fréquence d\'échantillonnage actuelle.',

    display: {
      referenceModels: 'MODÈLE(S) DE RÉFÉRENCE :',
      statesTrainedCount: '{{count}} état(s) entraîné(s)',
      debugValues: '🔍 VALEURS DE DÉBOGAGE :',
      signalHint: 'Rapprochez le téléphone de la machine pour un signal optimal',
      match: 'Correspondance',
      ghostHint: '👻 Déplacez le téléphone jusqu\'à ce que l\'image en direct et l\'image de référence correspondent',
      noCameraAvailable: 'Aucune image de position disponible',
      machineQuestion: 'La machine semble-t-elle normale ?',
      reference: 'Référence',
      waitingForSignal: 'En attente du signal...',
    },

    smartStart: {
      stabilizing: '🎙️ {{message}}\n(Calibration du microphone, stabilisation des filtres système...)',
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
      healthyMatch: 'La signature acoustique correspond à l\'état de référence "{{state}}" ({{score}}%). Aucune anomalie.',
      faultyMatch: 'Anomalie détectée : La signature correspond au motif entraîné "{{state}}" ({{score}}%). Inspection recommandée.',
    },

    // State-based card UI (horizontal tiles)
    scanCode: 'Scanner QR',
    selectExisting: 'Sélectionner une machine',
    createNew: 'Nouvelle machine',
    statesReady: '{{count}} état entraîné',
    noReference: 'Pas encore de référence',
    changeMachine: 'Changer de machine',
    noMachinesYet: 'Aucune machine créée.',
    noMachinesHint: 'Veuillez d\'abord créer une nouvelle machine.',
  },

  // ============================================================================
  // PHASE 4: SETTINGS
  // ============================================================================
  settings: {
    databaseNotAvailable: 'Base de données non disponible. Veuillez autoriser IndexedDB dans les paramètres de votre navigateur ou désactiver le mode de confidentialité strict.',
    exportError: 'Erreur lors de l\'exportation de la base de données',
    importError: 'Erreur lors de l\'importation',
    shareError: 'Erreur lors du partage de la base de données',

    import: {
      confirmMerge: 'Importer la base de données depuis : {{filename}}\n\nVoulez-vous FUSIONNER les données ?\n\nOUI = Fusionner avec les données existantes\nNON = REMPLACER toutes les données existantes',
      confirmReplace: '⚠️ ATTENTION !\n\nToutes les données existantes seront SUPPRIMÉES et remplacées par les données importées !\n\nVoulez-vous continuer ?',
      success: 'Machines : {{machines}}\nEnregistrements : {{recordings}}\nDiagnostics : {{diagnoses}}\n\nMode : {{mode}}',
      modeMerged: 'Fusionné',
      modeReplaced: 'Remplacé',
      setupError: 'Erreur lors de la préparation de l\'importation',
    },

    clear: {
      confirmFirst: '⚠️ ATTENTION !\n\nToutes les données seront DÉFINITIVEMENT supprimées :\n- Toutes les machines\n- Tous les modèles de référence\n- Tous les enregistrements\n- Tous les diagnostics\n\nVoulez-vous continuer ?',
      confirmSecond: 'Êtes-vous ABSOLUMENT SÛR ?\n\nCette action NE PEUT PAS être annulée !',
      success: 'Toutes les données ont été supprimées',
      error: 'Erreur lors de la suppression des données',
    },

    export: {
      success: 'Fichier : {{filename}}\n\nMachines : {{machines}}\nEnregistrements : {{recordings}}\nDiagnostics : {{diagnoses}}',
    },

    share: {
      title: 'Sauvegarde de la base de données Zanobot',
      text: 'Sauvegarde de la base de données : {{filename}}',
      success: 'Sauvegarde partagée : {{filename}}',
      fallback: 'Partage indisponible. {{filename}} a été téléchargé à la place.',
      preparing: 'L\'exportation est en cours de préparation... veuillez patienter un instant et réessayer.',
    },
  },

  // ============================================================================
  // MAIN APP / STARTUP
  // ============================================================================
  app: {
    browserNotSupported: 'Votre navigateur n\'est pas compatible avec Zanobo.\n\nFonctionnalités manquantes :\n{{features}}\n\nVeuillez utiliser un navigateur moderne tel que Chrome, Edge, Firefox ou Safari.',
    uiLoadFailed: 'L\'interface utilisateur n\'a pas pu être chargée',
    fatalError: 'Erreur fatale',
    browserNotSupportedTitle: 'Navigateur non pris en charge',
  },

  // ============================================================================
  // CORE ML / SCORING
  // ============================================================================
  scoring: {
    matchesReference: 'La signature acoustique correspond à la référence. Aucune anomalie.',
    moderateDeviation: 'Déviation modérée par rapport au motif de référence. Révision recommandée.',
    significantDeviation: 'Déviation significative par rapport au motif de référence détectée. Inspection recommandée.',
    noMatch: 'Déviation significative par rapport au motif de référence ({{score}}%). Le signal ne correspond à aucun état entraîné. Inspection recommandée.',
    hints: {
      matchesReference: 'La signature acoustique correspond à la référence.',
      minorDeviations: 'Déviations mineures dans la plage acceptable.',
      moderateDeviation: 'Déviation modérée du motif de référence détectée.',
      recommendInspection: 'Inspection recommandée.',
      significantAnomaly: 'Anomalie significative détectée.',
      immediateInspection: 'Inspection immédiate recommandée.',
    },
    multiclass: {
      noMatch: 'Pas de correspondance avec les états entraînés ({{score}}%). Signal peu clair.',
      healthy: 'État de base "{{label}}" détecté ({{score}}% correspondance). Machine fonctionne normalement.',
      faulty: 'État "{{label}}" détecté ({{score}}% correspondance). Déviation de l\'état normal.',
    },
  },

  // ============================================================================
  // HARDWARE CHECK
  // ============================================================================
  hardware: {
    suitable: 'Matériel adapté au diagnostic de machine',
    voiceOptimized: 'Le matériel optimisé pour la voix filtre les sons de machine.',
    useStudioMic: 'Utilisez un microphone de studio ou le microphone intégré de l\'appareil',
    headsetsOptimized: 'Les casques sont optimisés pour les fréquences vocales',
    mayFilter: 'Les sons de machine peuvent être filtrés ou supprimés',
    lowSampleRate: 'Les fréquences d\'échantillonnage basses ne peuvent pas capturer les signaux machine haute fréquence',
    microphoneDenied: 'Accès au microphone refusé ou non disponible',
    iphoneBackMic: 'Microphone arrière iPhone',
    micReady: 'Microphone prêt',
  },


  // ============================================================================
  // ZERO-FRICTION RECORDING (Auto-Machine Creation)
  // ============================================================================
  zeroFriction: {
    autoMachineName: 'Machine {{number}}',
    referenceCreatedToast: 'Référence pour {{machineName}} créée',
    editMachineName: 'Modifier',
    editMachineNamePrompt: 'Entrez un nouveau nom pour la machine :',
    machineRenamed: 'Machine renommée en "{{newName}}"',
    noMachineSelected: 'Aucune machine sélectionnée – sera créée automatiquement',
  },

  // ============================================================================
  // AUTO-DETECTION (Simplified "Vérifier l'état" Flow)
  // ============================================================================
  autoDetect: {
    startButton: 'Vérifier maintenant',
    hint: 'Le système reconnaît automatiquement les machines connues',
    showManualSelection: 'Sélectionner manuellement',
    hideManualSelection: 'Masquer la sélection manuelle',
    listening: 'Écoute en cours...',
    waitingForSignal: 'Veuillez tenir le microphone près de la machine',
    initializing: 'Initialisation...',
    analyzing: 'Analyse du son...',
    machineRecognized: 'Machine reconnue',
    matchConfidence: 'Correspondance',
    continueAnalysis: 'Continuer l\'analyse',
    differentMachine: 'Autre machine',
    uncertainMatch: 'Quelle machine est-ce ?',
    selectMachine: 'Veuillez sélectionner la machine correspondante',
    noMatch: 'Je ne reconnais pas encore ce son',
    noMatchHint: 'Voulez-vous enregistrer une référence ?',
    recordReference: 'Enregistrer une référence',
    newMachine: 'Créer une nouvelle machine',
  },

  // ============================================================================
  // COMMON
  // ============================================================================
  common: {
    machine: 'Machine',
    error: 'Erreur',
    warning: 'Attention',
    info: 'Info',
    success: 'Succès',
    yes: 'Oui',
    no: 'Non',
    or: 'ou',
    ok: 'OK',
    loading: 'Chargement...',
    initializing: 'Initialisation...',
    unknown: 'inconnu',
  },

  router: {
    statesTrained: '{{count}} état{{plural}} entraîné(s) (dernier : {{date}}) - Ajouter plus',
    referenceRequired: 'Enregistrement de référence de 10 secondes (requis pour le diagnostic)',
    liveAnalysis: 'Effectuer une analyse en direct',
    lastCheck: 'Dernière vérification {{time}}',
  },
  viewLevels: {
    basic: 'Affichage simple en feux tricolores pour opérateurs',
    advanced: 'Détails pour superviseurs et maintenance',
    expert: 'Vue technique complète pour ingénieurs',
    basicLabel: 'Base', basicDesc: 'Simple',
    advancedLabel: 'Avancé', advancedDesc: 'Détails',
    expertLabel: 'Expert', expertDesc: 'Technique',
    viewModeTitle: 'Mode d\'affichage',
    viewModeDescription: 'Adaptez la complexité de l\'interface à vos besoins.',
  },
  notifications: {
    confirmRequired: 'Confirmation requise',
    closeNotification: 'Fermer la notification',
  },
  errorBoundary: {
    unexpectedError: 'Une erreur inattendue s\'est produite.',
    unexpectedErrorTitle: 'Erreur inattendue',
    permissionDenied: 'Accès refusé',
    permissionHint: 'Veuillez autoriser l\'accès au microphone/caméra dans les paramètres de votre navigateur.',
    hardwareNotFound: 'Matériel introuvable',
    hardwareHint: 'Veuillez vérifier que votre microphone/caméra est connecté(e).',
    audioSystemError: 'Erreur du système audio',
    audioSystemHint: 'Veuillez recharger la page. Si le problème persiste, utilisez un navigateur à jour.',
    storageFull: 'Veuillez supprimer d\'anciens diagnostics ou enregistrements de référence.',
    networkError: 'Veuillez vérifier votre connexion internet.',
    technicalDetails: 'Détails techniques',
    noStackTrace: 'Aucune trace de pile disponible',
  },
  qualityCheck: {
    noFeatures: 'Aucune feature disponible',
    noAudioData: 'Aucune donnée audio extraite (Frame Count 0)',
    highVariance: 'Variance spectrale élevée - Signal instable',
    veryHighVariance: 'Variance très élevée - Veuillez enregistrer dans un environnement plus calme',
    outliers: '{{count}} valeurs aberrantes détectées ({{ratio}}%) - Bruits parasites possibles',
    weakSignal: 'Signal très faible/diffus - Peut-être juste du bruit. Veuillez vous rapprocher de la machine.',
    weakTonal: 'Signal tonal faible - Le rapport signal/bruit pourrait être trop faible.',
    trainingSignalWeak: 'Signal trop faible ou incohérent pour l\'entraînement. Veuillez vous assurer : microphone proche de la machine, machine en marche, pas uniquement du bruit de fond. (Similarité cosinus moyenne : {{value}})',
    invalidSampleRate: 'Taux d\'échantillonnage invalide : {{rate}}Hz. Attendu : 8000-192000Hz (typique : 44100Hz ou 48000Hz)',
  },
  healthGauge: { normal: 'NORMAL', deviation: 'DEVIATION', abnormal: 'ANORMAL' },
  audio: { ready: 'Prêt', stabilizing: 'Stabilisation acoustique... {{seconds}}s', waitingForSignal: 'En attente du signal...', recordingRunning: 'Enregistrement en cours' },
  settingsUI: {
    title: 'Paramètres', nfcWriterTitle: 'Tags NFC', nfcWriterDescription: 'Écrivez des tags NFC pour l’accès à l’app ou une machine sélectionnée.', appearance: 'Apparence',
    audioSettings: 'Paramètres audio', audioHardware: 'Matériel audio',
    detectingMic: 'Détection du microphone...', detectingMicrophone: 'Détection du microphone...', initHardwareCheck: 'Initialisation du test matériel',
    changeMicrophone: 'Changer de microphone', confidenceThreshold: 'Seuil de confiance',
    faultyThreshold: 'Seuil d\'anomalie',
    recordingDuration: 'Durée d\'enregistrement',
    recordingDurationDesc: 'Temps d\'enregistrement net pour les données d\'entraînement. 5 secondes de stabilisation supplémentaires sont ajoutées pour une qualité audio optimale.',
    seconds5: '5 secondes', seconds10: '10 secondes', seconds15: '15 secondes', seconds: 'secondes',
    frequencyAxis: 'Axe des fréquences', frequencyAxisDesc: 'Logarithmique (plus de détails dans la plage 20-500 Hz)', frequencyLogDesc: 'Logarithmique (plus de détails dans la plage 20-500 Hz)',
    amplitudeAxis: 'Axe Y / Amplitude', amplitudeAxisDesc: 'Logarithmique (dB) – met en valeur les signaux faibles', amplitudeLogDesc: 'Logarithmique (dB) – met en valeur les signaux faibles',
    analysisMethod: 'Méthode d\'analyse', analysisMethodDesc: 'Sélectionnez la méthode d\'analyse appropriée pour votre machine.',
    gmaiMethodDesc: 'GMIA (Generalized Mutual Interdependence Analysis) extrait les composants communs et stables de plusieurs fenêtres temporelles tout en supprimant les effets spécifiques à l\'appareil. Idéal pour les sons de machines structurés et stables dans le temps.',
    level1Info: 'Niveau 1 : Les paramètres de fréquence et d\'amplitude ci-dessus sont actifs',
    dataManagement: 'Gestion des données', exportDatabase: 'Exporter la base de données', shareDatabase: 'Envoyer la base de données',
    importDatabase: 'Importer la base de données', statistics: 'Statistiques :',
    machines: 'Machines', recordings: 'Enregistrements', diagnoses: 'Diagnostics',
    clearAllData: 'Supprimer toutes les données', deleteAllData: 'Supprimer toutes les données',
    quickAccessDesc: 'Accès rapide aux machines récemment utilisées',
    noMachines: 'Aucune machine disponible', or: 'ou',
    selectMicrophone: 'Sélectionner un microphone',
    microphoneAdvice: 'Sélectionnez le meilleur microphone pour le diagnostic machine. Évitez les casques et appareils Bluetooth car ils sont optimisés pour la parole.',
    manualInput: 'Saisir manuellement', machineIdInput: 'Entrer l\'ID de la machine', continue: 'Continuer',
    qrHint: 'Placez le code QR ou le code-barres dans le cadre', codeRecognized: 'Code reconnu !',
    // Paramètres du banner
    bannerTitle: 'Image de bannière',
    bannerDescription: 'Personnalisez l\'image de bannière de la page d\'accueil. Chaque thème peut avoir sa propre bannière.',
    bannerUpload: 'Télécharger la bannière',
    bannerReset: 'Réinitialiser par défaut',
    bannerHint: 'Recommandé : 1024×400 ou 1024×500 pixels, format PNG. Le tiers gauche reste libre pour le texte.',
    bannerFormatError: 'Le format doit être 1024×400 ou 1024×500 PNG.',
    bannerUpdated: 'La bannière a été mise à jour.',
    bannerSaveError: 'La bannière n\'a pas pu être sauvegardée.',
    bannerResetSuccess: 'Bannière par défaut restaurée.',
    bannerResetError: 'Erreur lors de la réinitialisation de la bannière.',
    themeToggle: 'Changer de thème',
    closeSettings: 'Fermer les paramètres',
  },
  nfc: {
    title: 'Écrire un tag NFC',
    description: 'Choisissez les informations à écrire sur le tag NFC.',
    supportDetails: 'Contexte sécurisé : {{secureContext}} · NDEFReader disponible : {{ndefReader}}',
    openWriter: 'Écrire un tag NFC',
    writeButton: 'Écrire maintenant',
    optionGeneric: 'Lien de l’app (générique)',
    optionGenericDetail: 'Ouvre l’app sans ID de machine.',
    optionSpecific: 'Lien de machine',
    optionSpecificDetailDefault: 'Ouvre l’app pour la machine actuellement sélectionnée.',
    optionSpecificDetail: 'Ouvre l’app pour "{{name}}" (ID : {{id}}).',
    optionSpecificUnavailable: 'Sélectionnez d’abord une machine pour écrire un lien spécifique.',
    hint: 'Placez le tag NFC à l’arrière de votre appareil.',
    unavailableHint: 'L’écriture NFC est disponible uniquement sur Chrome Android.',
    statusWriting: 'Écriture du tag NFC...',
    statusSuccess: 'Tag NFC écrit avec succès.',
    statusCancelled: 'Écriture annulée.',
    statusError: 'Impossible d’écrire le tag NFC.',
    unsupported: 'L’écriture NFC n’est pas prise en charge sur cet appareil.',
    requiresSecureContext: 'L’écriture NFC nécessite une connexion sécurisée (HTTPS).',
    unsupportedBrowser: 'L\'écriture NFC nécessite Chrome sur Android.',
    // Customer ID (Variant B)
    customerIdLabel: 'Identifiant client (c)',
    customerIdDescription: 'Cet identifiant détermine quelles données de référence sont chargées lors du scan du tag NFC. L\'application charge automatiquement : https://gunterstruck.github.io/<IdentifiantClient>/db-latest.json',
    customerIdPlaceholder: 'ex. Identifiant_Client_1',
    customerIdRequired: 'Veuillez entrer un identifiant client.',
    dbUrlPreview: 'URL de la BD chargée : {{url}}',
    closeDialog: 'Fermer le dialogue NFC',
  },
  review: {
    title: 'Vérifier l\'enregistrement', subtitle: 'Contrôle qualité',
    listenTitle: 'Écouter l\'enregistrement',
    browserNoAudio: 'Votre navigateur ne prend pas en charge la lecture audio.',
    recordingInfo: '15 secondes d\'enregistrement (5s stabilisation + 10s entraînement)',
    positionImageTitle: 'Image de position sauvegardée',
    savedPositionImage: 'Image de position sauvegardée',
    positionImageCheck: 'Vérifiez si l\'image montre la position correcte.',
    qualityTitle: 'Évaluation de la qualité', quality: 'Qualité',
    issuesTitle: 'Problèmes détectés :', discardNew: 'Rejeter / Nouveau',
    saveAsReference: 'Sauvegarder comme référence',
  },
  diagnosisResults: {
    title: 'Résultats du diagnostic',
    fingerprintLabel: 'Empreinte',
    confidenceScoreLabel: 'Score de confiance',
    varianceTitle: 'Variance',
    frequencyAnomalyLabel: 'Anomalie de fréquence',
    analysisHintDefault: 'Astuce : signal légèrement accru autour de 20 kHz',
    referenceQualityTitle: 'Qualité de référence',
    referenceQualityStatusGood: 'BON',
    referenceQualityDescription: 'L\'enregistrement de référence respecte les conditions recommandées',
    viewHistory: 'Voir l\'historique',
    closeDialog: 'Fermer le diagnostic',
  },
  historyChart: {
    title: 'Historique de la machine',
    machineName: 'Machine',
    dataPoints: 'Points de données',
    timeRange: 'Plage temporelle',
    xAxisLabel: 'Temps',
    yAxisLabel: 'Score de santé (%)',
    noData: 'Aucun historique disponible pour le moment',
    noDataMessage: 'Aucun diagnostic n\'a encore été enregistré pour cette machine.',
    errorMessage: 'Erreur lors du chargement de l\'historique.',
    closeDialog: 'Fermer l\'historique',
  },
  themes: {
    focusTitle: 'Steve Jobs',
    focusDescription: 'Une action. Pas de bruit. L\'essentiel au centre – le reste s\'efface.',
    focusDesc: 'Une action. Pas de bruit. La clarté qui fonctionne.',
    daylightTitle: 'Daylight',
    daylightDescription: 'Thème clair anti‑éblouissement pour usage extérieur. Contraste net pour la lisibilité au soleil.',
    daylightDesc: 'Thème clair anti‑éblouissement pour usage extérieur. Contraste net pour la lisibilité au soleil.',
    brandTitle: 'Zanobo',
    brandDescription: 'Clair, convivial, fiable. Une IA de confiance.',
    brandDesc: 'Clair, convivial, fiable. Une IA de confiance.',
    neonTitle: 'Neon Industrial',
    neonDescription: 'Palette néon très contrastée pour environnements sombres. Les accents guident l\'attention vers les actions clés.',
    neonDesc: 'Palette néon très contrastée pour environnements sombres. Les accents guident l\'attention vers les actions clés.',
  },
  footer: {
    impressum: 'Mentions légales',
    privacy: 'Politique de confidentialité',
    about: 'À propos de Zanobo',
    settings: 'Paramètres',
    closeImpressum: 'Fermer les mentions légales',
    closePrivacy: 'Fermer la politique de confidentialité',
    closeAbout: 'Fermer à propos de Zanobo',
  },

  // NFC IMPORT (Deep Link Import via ?importUrl=)
  nfcImport: {
    modalTitle: 'Sauvegarde NFC détectée',
    warningOverwrite: 'Attention: La base de données locale sera écrasée!',
    currentData: 'Données actuelles',
    newData: 'Nouvelles données',
    exportedAt: 'Exporté le',
    confirmButton: 'Importer les données',
    success: 'Base de données importée avec succès!',
    successTitle: 'Importation terminée',
    error: 'Échec de l\'importation',
    errorTitle: 'Échec de l\'importation',
    errorGitHubBlob: 'Erreur: Veuillez utiliser le lien "Raw" de GitHub, pas le lien web.',
    errorFetchFailed: 'Échec du téléchargement. Veuillez vérifier l\'URL.',
    errorNotJson: 'Erreur: L\'URL renvoie du HTML au lieu de JSON.\n\nVeuillez utiliser le lien "Raw" de GitHub.',
    errorInvalidJson: 'Erreur: Le fichier ne contient pas de format JSON valide.',
    errorInvalidStructure: 'Erreur: Le fichier n\'a pas le format de sauvegarde attendu.',
    errorNetwork: 'Erreur réseau lors du chargement des données. Veuillez vérifier votre connexion.',
  },

  // BADGES (UI Hints)
  badges: {
    recommended: 'Recommandé',
    nextStep: 'Prochaine étape',
  },

  // WORK POINT RANKING
  workPointRanking: {
    title: 'Analyse des états',
    states: 'États',
    ariaLabel: 'Classement des états détectés de la machine',
    statusHealthy: 'Normal',
    statusFaulty: 'Défaut',
    noData: "Aucune donnée d'analyse disponible",
    rank: 'Rang',
    probability: 'Probabilité',
    topMatch: 'Meilleure correspondance',
    sectionTitle: 'Distribution détaillée des états',
    sectionDescription: 'Distribution de probabilité de tous les états de machine entraînés',
  },

  // ============================================================================
  // INSPECTION VIEW (Simplified PWA)
  // ============================================================================
  inspection: {
    // Header
    mainQuestion: 'La machine sonne-t-elle normal ?',
    subtitle: 'Inspection en cours – veuillez rester près de la machine',
    subtitleInitializing: 'Préparation – veuillez patienter',
    // Status words (simple, non-technical)
    statusNormal: 'Normal',
    statusUncertain: 'Incertain',
    statusDeviation: 'Déviation',
    // Reference info
    referenceState: 'État de référence',
    referenceDefault: 'Fonctionnement normal',
    // Dynamic hints for poor signal quality
    hintMoveCloser: 'Veuillez vous rapprocher de la machine',
    hintChangePosition: 'Changez légèrement de position',
    hintHoldSteady: 'Maintenez l\'appareil stable',
    hintWaiting: 'En attente du signal de la machine...',
    // Button
    stopButton: 'STOP',
  },

  // ============================================================================
  // MACHINE SETUP (NFC Deep Link - Status/Error Messages)
  // ============================================================================
  machineSetup: {
    // Validation errors
    urlEmpty: 'Veuillez entrer un lien vers la BD de référence.',
    urlInvalid: 'Le lien ne semble pas être une URL valide.',
    urlNotHttps: 'Le lien doit commencer par https://.',
    urlNotOfficialSource: 'Seules les sources de données officielles (gunterstruck.github.io) sont acceptées.',

    // Download status
    downloadingReference: 'Chargement des données de référence...',
    statusDownloading: 'Téléchargement des données de référence...',
    statusParsing: 'Traitement des données...',
    statusValidating: 'Validation du format...',
    statusSaving: 'Sauvegarde locale...',
    statusComplete: 'Terminé !',

    // Download errors
    errorMachineNotFound: 'Machine non configurée. Veuillez contacter le technicien de service.',
    errorNoReferenceUrl: 'Aucune donnée de référence configurée. Veuillez contacter le technicien de service.',
    errorDownloadFailed: 'Échec du téléchargement. Veuillez vérifier votre connexion internet.',
    errorInvalidFormat: 'Les données de référence ont un format invalide.',
    errorInvalidStructure: 'La structure des données est corrompue.',
    errorNoModels: 'Aucun modèle de référence trouvé dans les données.',
    errorInvalidModel: 'Un ou plusieurs modèles de référence sont corrompus.',
    errorUnknown: 'Une erreur inconnue est survenue.',

    // Success messages
    referenceLoaded: 'Données de référence chargées avec succès !',

    // Loading overlay
    loadingTitle: 'Chargement de la référence',
    loadingSubtitle: 'Veuillez patienter...',
    testingBlocked: 'Le test n\'est disponible qu\'après le chargement des données de référence.',
  },

  // ============================================================================
  // ONBOARDING TRACE (Debug Protocol)
  // ============================================================================
  trace: {
    // UI
    title: 'Protocole de débogage',
    toggle: 'Afficher/masquer le protocole',
    copyToClipboard: 'Copier le protocole',
    copy: 'Copier',
    copied: 'Copié !',
    copyFailed: 'Erreur',
    noEntries: 'Aucune entrée',

    // Status
    statusRunning: 'En cours...',
    statusComplete: 'Terminé',
    statusFailed: 'Échoué',

    // Step labels - these map to TraceStepId
    steps: {
      // Deep Link Processing
      deep_link_detected: 'Deep link détecté',
      hash_parsed: 'Hash analysé',
      machine_id_extracted: 'ID de machine extrait',
      customer_id_extracted: 'ID client extrait',
      db_url_derived: 'URL de BD dérivée',

      // Download Process
      download_started: 'Téléchargement démarré',
      download_complete: 'Téléchargement terminé',
      download_failed: 'Échec du téléchargement',

      // JSON Processing
      json_parse_started: 'Analyse JSON démarrée',
      json_parse_complete: 'Analyse JSON réussie',
      json_parse_failed: 'Échec de l\'analyse JSON',

      // Validation
      schema_validation_started: 'Validation du schéma démarrée',
      schema_validation_complete: 'Validation du schéma réussie',
      schema_validation_failed: 'Échec de la validation du schéma',

      // Database Operations
      db_reset_started: 'Réinitialisation de la BD démarrée',
      db_import_started: 'Importation de la BD démarrée',
      db_import_complete: 'Importation de la BD terminée',
      db_import_failed: 'Échec de l\'importation de la BD',

      // App State
      app_state_reload: 'État de l\'application rechargé',

      // Machine Operations
      machine_lookup: 'Recherche de la machine',
      machine_found: 'Machine trouvée',
      machine_not_found: 'Machine non trouvée',
      machine_created: 'Machine créée',
      machine_selected: 'Machine sélectionnée',

      // Final Steps
      test_dialog_shown: 'Dialogue de test affiché',
      process_complete: 'Processus terminé',
      process_failed: 'Échec du processus',
    },
  },

  // DATABASE MIGRATION
  migration: {
    title: 'Mise à jour de la base de données',
    dataCleared:
      'La base de données a été réinitialisée suite à une mise à jour. Toutes les machines, enregistrements et diagnostics ont été supprimés.',
  },

  // ============================================================================
  // ABOUT MODAL
  // ============================================================================
  about: {
    title: 'À propos de Zanobo',
    subtitle: 'Assistant pour la comparaison acoustique des états de machines',

    // Introduction
    intro: '<strong>Zanobo 2.0</strong> est une Progressive Web App (PWA) respectueuse de la vie privée, conçue pour l\'analyse comparative de l\'acoustique des machines. Elle permet aux utilisateurs d\'enregistrer et de comparer les sons de machines entièrement <strong>hors ligne</strong>, sans dépendre de services cloud, de capteurs externes ou de modèles d\'IA.',

    // Core Features
    coreFeaturesTitle: 'Fonctionnalités principales',
    coreFeatures: {
      offlineFirst: '<strong>Hors ligne d\'abord :</strong> Tous les enregistrements et traitements sont effectués localement dans le navigateur.',
      similarityScore: '<strong>Score de similarité (0–100%) :</strong> Zanobo calcule une similarité cosinus entre une référence et un nouvel enregistrement.',
      userThreshold: '<strong>Seuil défini par l\'utilisateur :</strong> Les utilisateurs peuvent définir ce qui compte comme "Normal" ou "Déviant".',
      visualFeedback: '<strong>Retour visuel du spectre :</strong> Spectre de fréquence en temps réel et visualisation du score.',
      noDataLeaks: '<strong>Aucune donnée ne quitte l\'appareil :</strong> Toutes les données sonores et les scores sont stockés exclusivement dans l\'IndexedDB local.',
    },

    // Legal Position
    legalTitle: 'Position juridique et examen de la propriété intellectuelle',
    legalIntro: 'Zanobo a été créé de manière indépendante en tant que projet open-source privé et non commercial sous <strong>licence MIT</strong>. Sa fonctionnalité est basée sur des procédures mathématiques décrites ouvertement (par ex. comparaison cosinus de type GMIA), et n\'intègre aucune logique système brevetée ni mécanismes d\'apprentissage.',
    legalReview: 'Avant la publication, un examen juridique et technique détaillé a été effectué pour s\'assurer que la solution n\'entre pas en conflit avec les brevets existants ou les méthodes internes.',

    // IP Table
    ipTableTitle: 'Propriété intellectuelle pertinente et différenciation technique',
    ipTable: {
      headers: {
        reference: 'Référence / Titre',
        source: 'Source et statut',
        protectedScope: 'Portée protégée',
        zanoboDiff: 'Différence Zanobo',
      },
      rows: {
        '0': {
          reference: '<strong>PAPDEOTT005125</strong><br><em>Procédure de diagnostic des machines</em>',
          source: 'Publication défensive, Siemens AG, 2016',
          protectedScope: 'Système de diagnostic basé sur le cloud utilisant des bases de données centrales et des capteurs mobiles',
          zanoboDiff: 'Zanobo est <strong>entièrement local</strong>, pas de cloud, pas de base de données distante, pas de diagnostic',
        },
        '1': {
          reference: '<strong>EP3701708B1</strong><br><em>Analyse à distance de l\'état de la machine</em>',
          source: 'Brevet européen, Siemens AG, 2022',
          protectedScope: 'Diagnostic à distance basé sur le ML avec des modèles entraînés et des capteurs',
          zanoboDiff: 'Zanobo <strong>n\'utilise pas de ML</strong>, pas de cloud, pas de logique intégrée',
        },
        '2': {
          reference: '<strong>US9263041B2</strong><br><em>Détection de canal dans le bruit utilisant GMIA</em>',
          source: 'Siemens Corp, 2016',
          protectedScope: 'Application de GMIA pour la reconnaissance vocale et les systèmes auditifs',
          zanoboDiff: 'Zanobo utilise des mathématiques de type GMIA pour le <strong>non-vocal</strong>, exclusivement comparaison locale',
        },
        '3': {
          reference: '<strong>US9443201B2</strong><br><em>Apprentissage des signatures de capteurs</em>',
          source: 'Siemens, 2016',
          protectedScope: 'Classification et entraînement de modèles de profils de signaux',
          zanoboDiff: 'Zanobo <strong>ne fait aucune classification</strong> et aucun entraînement de modèle',
        },
        '4': {
          reference: '<strong>US9602781B2</strong><br><em>Démêlage de signaux sismiques (GMIA)</em>',
          source: 'Schlumberger, 2017',
          protectedScope: 'Séparation basée sur GMIA de signaux sismiques',
          zanoboDiff: 'Zanobo n\'est pas lié au domaine et au type de signal',
        },
      },
    },

    // Transparency
    transparencyTitle: 'Transparence et intention',
    transparencyText1: 'Zanobo <strong>n\'est pas un outil de diagnostic</strong> et ne fait aucune évaluation technique automatisée. Il fournit exclusivement une aide visuelle et mathématique à la comparaison, sous le contrôle total de l\'utilisateur. Tout le traitement se fait hors ligne. Aucune donnée utilisateur n\'est transmise, stockée à distance ou évaluée en externe.',
    transparencyText2: 'Cette transparence reflète un engagement fort envers le développement open-source responsable et le respect des droits des tiers.',

    // Public Instance
    publicInstance: 'Instance publique :',
    publicInstanceUrl: 'https://zanobo.vercel.app',

    // Version Info
    version: 'Version :',
    versionNumber: '2.0.0 (2026)',
    developedBy: 'Développé par :',
    developerName: 'Günter Struck',
    license: 'Licence :',
    licenseType: 'MIT',
    stack: 'Stack technologique :',
    stackTech: 'TypeScript, Vite, Web Audio API',
  },
};
