/**
 * ZANOBOT - Spanish (Español) Translations
 */

import type { TranslationDict } from '../index.js';

export const es: TranslationDict = {
  // ============================================================================
  // BUTTONS
  // ============================================================================
  buttons: {
    stop: 'Detener',
    stopAndSave: 'Detener y guardar',
    scan: 'Escanear',
    create: 'Crear',
    record: 'Grabar',
    startDiagnosis: 'Verificar estado',
    analyze: 'Analizar',
    close: 'Cerrar',
    cancel: 'Cancelar',
    save: 'Guardar',
    discard: 'Descartar',
    trainAnother: 'Entrenar otro estado',
    newMachine: 'Nueva máquina',
    stopRecording: 'Detener grabación',
    saveReference: 'Guardar referencia',
  },

  // ============================================================================
  // BANNER
  // ============================================================================
  banner: {
    headline: '¿El sistema suena normal?',
    subline: 'Verificar estado en segundos – directamente en el dispositivo, sin conexión',
  },

  // ============================================================================
  // STATUS
  // ============================================================================
  status: {
    healthy: 'Normal',
    uncertain: 'Desviación',
    faulty: 'Anormal',
    unknown: 'Desconocido',
    noData: 'Sin datos',
    notChecked: 'Aún no verificado',
    ready: 'Listo',
    analyzing: 'ANALIZANDO...',
  },

  // ============================================================================
  // MODAL TITLES
  // ============================================================================
  modals: {
    referenceRecording: 'Grabación de referencia',
    liveDiagnosis: 'Diagnóstico en vivo - Encontrar punto óptimo',
    qrScanner: 'Escáner QR/Código de barras',
    databaseError: 'Error de base de datos',
    browserIncompatible: 'Navegador no compatible',
    accessDenied: 'Acceso denegado',
    processingError: 'Error de procesamiento',
    saveError: 'Error al guardar',
    sampleRateMismatch: 'Frecuencia de muestreo incompatible',
    unsuitable: 'Señal inadecuada',
    referenceUnsuitable: 'Grabación de referencia inadecuada',
    recordingDiscarded: 'Grabación descartada',
    cameraOptional: 'Cámara opcional',
    noSignalDetected: 'No se detectó señal',
    scanError: 'Error de escaneo',
    databaseExported: 'Base de datos exportada',
    databaseShared: 'Base de datos compartida',
    databaseImported: 'Base de datos importada',
    databaseCleared: 'Base de datos borrada',
    nfcDiagnosisTitle: '¿Verificar estado?',
    nfcDiagnosisPrompt: 'Máquina detectada. ¿Verificar estado ahora?',
  },

  // ============================================================================
  // PHASE 1: IDENTIFY (Machine Selection)
  // ============================================================================
  identify: {
    selectMachine: 'Seleccionar máquina',
    scanQrCode: 'Escanear código QR',
    scanQrDescription: 'Identificar máquina via código QR',
    manualEntry: 'Crear manualmente',
    manualEntryDescription: 'Crear nueva máquina con nombre',
    machineName: 'Nombre',
    machineId: 'ID (opcional)',
    quickAccess: 'Acceso rápido',
    recentlyUsed: 'Usado recientemente',
    overview: 'Vista general',
    machineOverview: 'Vista general de máquinas',
    history: 'Historial',
    noMeasurements: 'Sin mediciones todavía',
    noMachines: 'No hay máquinas disponibles',
    statesTrained: '{{count}} estados entrenados',

    errors: {
      scannerStart: 'Error al iniciar el escáner',
      cameraAccessDenied: 'Acceso a la cámara denegado',
      cameraAccessHint: 'Por favor permita el acceso a la cámara en la configuración de su navegador',
      noCameraFound: 'No se encontró cámara',
      noCameraHint: 'Por favor asegúrese de que su dispositivo tiene una cámara',
      qrProcessing: 'Error al procesar el código QR',
      invalidCode: 'Código inválido escaneado',
      codeProcessing: 'Error al procesar el código',
      manualEntryLoad: 'No se pudo cargar la entrada manual',
      invalidMachineId: 'ID de máquina inválido',
      machineLoad: 'Error al cargar la máquina',
      machineNotFound: 'Máquina no encontrada. Por favor seleccione de nuevo.',
      nameRequired: 'Por favor ingrese un nombre de máquina',
      nameWhitespace: 'El nombre de la máquina no puede ser solo espacios',
      nameTooLong: 'El nombre de la máquina es demasiado largo (máximo 100 caracteres)',
      machineExists: 'Ya existe una máquina con este ID',
      machineCreate: 'Error al crear la máquina',
      idEmpty: 'El ID de la máquina no puede estar vacío',
      idTooShort: 'El ID de la máquina es demasiado corto',
      idTooLong: 'El ID de la máquina es demasiado largo (máximo 100 caracteres)',
      idWhitespace: 'El ID de la máquina no puede ser solo espacios',
      microphoneLoad: 'Error al cargar los micrófonos',
      microphoneSwitch: 'Error al cambiar el micrófono',
    },

    success: {
      machineLoaded: 'Máquina "{{name}}" cargada',
      machineCreated: 'Máquina creada: {{name}}',
      machineAutoCreated: 'Nueva máquina "{{name}}" creada automáticamente.',
      microphoneOptimized: 'Micrófono configurado automáticamente a "{{label}}" para mejor diagnóstico',
      microphoneChanged: 'Micrófono cambiado: {{label}}',
    },

    warnings: {
      preferredMicrophoneUnavailable:
        'El micrófono preferido ya no está disponible. Se usará el micrófono predeterminado.',
    },

    messages: {
      codeRecognized: 'Código reconocido: {{code}}',
      autoMachineName: 'Máquina {{id}}',
      loadingMachine: 'Cargando máquina...',
    },

    time: {
      justNow: 'ahora mismo',
      minutesAgo: 'hace {{minutes}} min.',
      hoursAgo: 'hace {{hours}} h.',
      dayAgo: 'hace 1 día',
      daysAgo: 'hace {{days}} días',
      weekAgo: 'hace 1 semana',
      weeksAgo: 'hace {{weeks}} semanas',
    },
  },

  // ============================================================================
  // PHASE 2: REFERENCE (Training)
  // ============================================================================
  reference: {
    recordReference: 'Grabar referencia',
    tenSecondRecording: 'Grabación de referencia de 10 segundos',
    noReferenceModel: 'No hay modelo de referencia disponible',
    trainedStates: 'Estados entrenados',
    noModelsYet: 'Aún no hay modelos de referencia disponibles',
    existingModels: 'MODELOS EXISTENTES:',
    statesTrainedCount: '{{count}} estado(s) ya entrenado(s)',
    recordingStatusHighQuality: 'Alta calidad de audio detectada',
    fingerprintQualityLabel: 'Calidad de huella:',
    fingerprintQualityConfident: 'SEGURO',

    // State-based card UI (mirrors diagnose card)
    statesRecorded: '{{count}} estado grabado',
    noReferenceYet: 'Sin referencia aún',
    changeMachine: 'Cambiar máquina',
    noMachinesYet: 'No hay máquinas creadas aún.',
    noMachinesHint: 'Por favor cree una nueva máquina primero.',

    recording: {
      alreadyRunning: 'Ya hay una grabación en progreso.',
      cameraNotAvailable: 'Cámara no disponible. La grabación continuará sin imagen de posición.',
      browserNotCompatible: 'Su navegador no soporta grabación de audio. Por favor use un navegador moderno.',
      stabilizing: 'Estabilizando...',
      waitingForSignal: 'Esperando señal',
      recording: 'Grabación en progreso',
      microphoneFailed: 'Acceso al micrófono fallido',
      processingFailed: 'No se pudo procesar la grabación',
      noSignal: 'Por favor acérquese más a la máquina e intente de nuevo.',
      positionImage: '📷 La imagen de posición se capturará automáticamente',
      instruction: 'Sostenga el micrófono a 10-30 cm frente a la máquina.',
    },

    quality: {
      signalStable: '✓ Señal estable',
      slightUnrest: '⚠ Ligera inestabilidad',
      signalUnstable: '✗ Advertencia: ¡Señal inestable!',
    },

    errors: {
      tooShort: 'Grabación demasiado corta: {{duration}}s de duración total es menor que la fase de calentamiento de {{warmup}}s. Duración mínima: {{minDuration}}s',
      trainingTooShort: 'Datos de entrenamiento demasiado cortos: {{duration}}s (después de la fase de calentamiento). Mínimo requerido: {{minDuration}}s. Por favor grabe al menos {{totalDuration}}s.',
      qualityTooLow: 'Calidad de grabación muy baja para entrenamiento. Por favor grabe de nuevo en un ambiente tranquilo con una señal clara de la máquina.\n\nProblemas:\n{{issues}}',
      signalTooWeak: 'Señal muy débil o difusa (posiblemente solo ruido).\n\nFuerza de la señal (RMS): {{magnitude}} (Mínimo: 0.03)\nCalidad: {{quality}}%\n\nPor favor asegúrese:\n• El micrófono está lo suficientemente cerca de la máquina (10-30cm)\n• La máquina funciona con suficiente volumen\n• No está grabando solo ruido de fondo\n\nProblemas:\n{{issues}}',
      qualityWarning: '⚠️ ADVERTENCIA: Mala calidad de grabación\n\nLa calidad de esta grabación es mala. El entrenamiento podría no ser confiable.\n\nProblemas:\n{{issues}}\n\n¿Desea guardar de todos modos?',
      baselineTooLow: 'Grabación de referencia demasiado confusa o ruidosa.\n\nPuntuación de auto-reconocimiento: {{score}}%\nMínimo requerido: {{minScore}}%\n\nPosibles causas:\n• Señal demasiado débil o inestable\n• Demasiado ruido de fondo\n• Máquina no funcionando de manera constante\n\nPor favor repita la grabación en mejores condiciones:\n• Micrófono más cerca de la máquina (10-30cm)\n• Ambiente tranquilo\n• Máquina funcionando de manera estable durante toda la grabación',
      noAudioFile: 'Por favor cree primero una grabación de referencia.',
      exportFailed: 'Exportación fallida',
      saveFailed: 'Error al guardar',
      machineDataMissing: 'Faltan datos de la máquina',
    },

    success: {
      modelTrained: '✅ ¡Modelo de referencia entrenado exitosamente!\n\nMáquina: {{name}}\n\n¿Desea descargar el archivo de audio de referencia?\n(Recomendado para respaldo)',
      canStartNew: 'Puede iniciar una nueva grabación de referencia.',
    },

    labels: {
      baseline: 'Referencia',
      prompt: 'Ingrese un nombre para este estado de la máquina:\n\nEjemplos:\n• Estados de operación normales: "Ralentí", "Carga completa", "Carga parcial"\n• Fallas: "Desequilibrio simulado", "Daño en rodamiento", "Error de ventilador"',
      confirmType: 'Estado: "{{label}}"\n\n¿Es este un estado de operación NORMAL?\n\n🟢 OK (Sí) → Estado normal (ej. "Ralentí", "Carga completa")\n🔴 Cancelar (No) → Falla conocida (ej. "Desequilibrio", "Daño en rodamiento")\n\nNota: Esta elección determina si un diagnóstico se muestra como "saludable" o "defectuoso".',
      enterName: 'Por favor ingrese un nombre',
      cancelled: 'Cancelado',
    },
  },

  // ============================================================================
  // PHASE 3: DIAGNOSE (Real-time)
  // ============================================================================
  diagnose: {
    alreadyRunning: 'Ya hay un diagnóstico en progreso.',
    noReferenceModel: 'No se encontró modelo de referencia. Por favor cree primero una grabación de referencia.',
    browserNotCompatible: 'Su navegador no soporta diagnóstico en tiempo real. Por favor use Chrome, Edge o Safari.',
    noValidSampleRate: 'No se encontró modelo de referencia con frecuencia de muestreo válida.',
    cameraNotAvailable: 'Cámara no disponible. El diagnóstico continuará sin guía de posición.',
    diagnosisRunning: 'Diagnóstico en ejecución',
    saveFailed: 'No se pudo guardar el diagnóstico',
    liveAnalysis: 'Realizar análisis en vivo',

    sampleRateError: 'Error de configuración de audio: Su micrófono funciona a {{actual}}Hz, pero ningún modelo de referencia fue entrenado a esta frecuencia de muestreo (Modelos: {{expected}}Hz). Por favor use la misma configuración de audio que durante el entrenamiento o cree un nuevo modelo de referencia con la frecuencia de muestreo actual.',

    display: {
      referenceModels: 'MODELO(S) DE REFERENCIA:',
      statesTrainedCount: '{{count}} estado(s) entrenado(s)',
      debugValues: '🔍 VALORES DE DEPURACIÓN:',
      signalHint: 'Acerque el teléfono a la máquina para una señal óptima',
      match: 'Coincidencia',
      ghostHint: '👻 Mueva el teléfono hasta que la imagen en vivo y la imagen de referencia coincidan',
    },

    smartStart: {
      stabilizing: '🎙️ {{message}}\n(Ajustando micrófono, estabilizando filtros del sistema...)',
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
      healthyMatch: 'La firma acústica coincide con el estado de referencia "{{state}}" ({{score}}%). Sin anomalías.',
      faultyMatch: 'Anomalía detectada: La firma coincide con el patrón entrenado "{{state}}" ({{score}}%). Se recomienda inspección.',
    },
  },

  // ============================================================================
  // PHASE 4: SETTINGS
  // ============================================================================
  settings: {
    databaseNotAvailable: 'Base de datos no disponible. Por favor permita IndexedDB en la configuración de su navegador o desactive el modo de privacidad estricto.',
    exportError: 'Error al exportar la base de datos',
    importError: 'Error al importar',
    shareError: 'Error al compartir la base de datos',

    import: {
      confirmMerge: 'Importar base de datos desde: {{filename}}\n\n¿Desea FUSIONAR los datos?\n\nSÍ = Fusionar con datos existentes\nNO = REEMPLAZAR todos los datos existentes',
      confirmReplace: '⚠️ ¡ADVERTENCIA!\n\n¡Todos los datos existentes serán ELIMINADOS y reemplazados con los datos importados!\n\n¿Desea continuar?',
      success: 'Máquinas: {{machines}}\nGrabaciones: {{recordings}}\nDiagnósticos: {{diagnoses}}\n\nModo: {{mode}}',
      modeMerged: 'Fusionado',
      modeReplaced: 'Reemplazado',
      setupError: 'Error al preparar la importación',
    },

    clear: {
      confirmFirst: '⚠️ ¡ADVERTENCIA!\n\nTodos los datos serán PERMANENTEMENTE eliminados:\n- Todas las máquinas\n- Todos los modelos de referencia\n- Todas las grabaciones\n- Todos los diagnósticos\n\n¿Desea continuar?',
      confirmSecond: '¿Está ABSOLUTAMENTE SEGURO?\n\n¡Esta acción NO PUEDE deshacerse!',
      success: 'Todos los datos han sido eliminados',
      error: 'Error al eliminar los datos',
    },

    export: {
      success: 'Archivo: {{filename}}\n\nMáquinas: {{machines}}\nGrabaciones: {{recordings}}\nDiagnósticos: {{diagnoses}}',
    },

    share: {
      title: 'Copia de seguridad de la base de datos de Zanobot',
      text: 'Copia de seguridad de la base de datos: {{filename}}',
      success: 'Copia compartida: {{filename}}',
      fallback: 'No se puede compartir. Se descargó {{filename}} en su lugar.',
    },
  },

  // ============================================================================
  // MAIN APP / STARTUP
  // ============================================================================
  app: {
    browserNotSupported: 'Su navegador no es compatible con Zanobo.\n\nCaracterísticas faltantes:\n{{features}}\n\nPor favor use un navegador moderno como Chrome, Edge, Firefox o Safari.',
    uiLoadFailed: 'No se pudo cargar la interfaz de usuario',
    fatalError: 'Error fatal',
    browserNotSupportedTitle: 'Navegador no soportado',
  },

  // ============================================================================
  // CORE ML / SCORING
  // ============================================================================
  scoring: {
    matchesReference: 'La firma acústica coincide con la referencia. Sin anomalías.',
    moderateDeviation: 'Desviación moderada del patrón de referencia. Se recomienda revisión.',
    significantDeviation: 'Se detectó desviación significativa del patrón de referencia. Se recomienda inspección.',
    noMatch: 'Desviación significativa del patrón de referencia ({{score}}%). La señal no coincide con ningún estado entrenado. Se recomienda inspección.',
    hints: {
      matchesReference: 'La firma acústica coincide con la referencia.',
      minorDeviations: 'Desviaciones menores dentro del rango aceptable.',
      moderateDeviation: 'Se detectó desviación moderada del patrón de referencia.',
      recommendInspection: 'Se recomienda inspección.',
      significantAnomaly: 'Se detectó anomalía significativa.',
      immediateInspection: 'Se recomienda inspección inmediata.',
    },
    multiclass: {
      noMatch: 'Sin coincidencia con estados entrenados ({{score}}%). Señal no clara.',
      healthy: 'Estado base "{{label}}" detectado ({{score}}% coincidencia). Máquina operando normalmente.',
      faulty: 'Estado "{{label}}" detectado ({{score}}% coincidencia). Desviación del estado normal.',
    },
  },

  // ============================================================================
  // HARDWARE CHECK
  // ============================================================================
  hardware: {
    suitable: 'Hardware adecuado para diagnóstico de máquinas',
    voiceOptimized: 'El hardware optimizado para voz filtra los sonidos de la máquina.',
    useStudioMic: 'Use un micrófono de estudio o el micrófono integrado del dispositivo',
    mayFilter: 'Los sonidos de la máquina podrían ser filtrados o suprimidos',
    lowSampleRate: 'Las frecuencias de muestreo bajas no pueden capturar señales de máquina de alta frecuencia',
    microphoneDenied: 'Acceso al micrófono denegado o no disponible',
    iphoneBackMic: 'Micrófono trasero de iPhone',
  },

  // ============================================================================
  // DETECTION MODE
  // ============================================================================
  detectionMode: {
    stationary: 'Para máquinas de funcionamiento continuo como ventiladores, bombas, compresores',
    cyclic: 'Para máquinas con ciclos recurrentes como máquinas de empaque, líneas de ensamblaje',
    referenceComparison: 'Comparación de ciclo de referencia',
    featureFFT: 'Análisis de frecuencia con FFT',
    featureGaussian: 'Modelo gaussiano para detección estadística',
    featureLocalProcessing: 'Procesamiento local rápido',
    featureNoML: 'No requiere biblioteca ML',
    featureYAMNet: 'YAMNet Deep Learning Model',
    featureMelSpectrogram: 'Visualización de espectrograma Mel',
    featureWebGPU: 'Inferencia acelerada por WebGPU',
  },

  // ============================================================================
  // AUTO-DETECTION (Simplified "Verificar estado" Flow)
  // ============================================================================
  autoDetect: {
    startButton: 'Verificar ahora',
    hint: 'El sistema reconoce automáticamente las máquinas conocidas',
    showManualSelection: 'Seleccionar manualmente',
    hideManualSelection: 'Ocultar selección manual',
    listening: 'Escuchando...',
    waitingForSignal: 'Por favor, acerque el micrófono a la máquina',
    initializing: 'Inicializando...',
    analyzing: 'Analizando sonido...',
    machineRecognized: 'Máquina reconocida',
    matchConfidence: 'Coincidencia',
    continueAnalysis: 'Continuar análisis',
    differentMachine: 'Otra máquina',
    uncertainMatch: '¿Qué máquina es esta?',
    selectMachine: 'Por favor, seleccione la máquina correspondiente',
    noMatch: 'No reconozco este sonido todavía',
    noMatchHint: '¿Desea grabar una referencia?',
    recordReference: 'Grabar referencia',
    newMachine: 'Crear nueva máquina',
  },

  // ============================================================================
  // COMMON
  // ============================================================================
  common: {
    machine: 'Máquina',
    error: 'Error',
    warning: 'Advertencia',
    info: 'Info',
    success: 'Éxito',
    yes: 'Sí',
    no: 'No',
    or: 'o',
    ok: 'OK',
    loading: 'Cargando...',
    initializing: 'Inicializando...',
    unknown: 'desconocido',
  },

  router: {
    statesTrained: '{{count}} estado{{plural}} entrenado(s) (último: {{date}}) - Agregar más',
    referenceRequired: 'Grabación de referencia de 10 segundos (requerido para diagnóstico)',
    liveAnalysis: 'Realizar análisis en vivo',
    lastCheck: 'Última verificación {{time}}',
  },
  viewLevels: {
    basic: 'Pantalla simple de semáforo para operadores',
    advanced: 'Detalles para supervisores y mantenimiento',
    expert: 'Vista técnica completa para ingenieros',
    basicLabel: 'Básico', basicDesc: 'Simple',
    advancedLabel: 'Avanzado', advancedDesc: 'Detalles',
    expertLabel: 'Experto', expertDesc: 'Técnico',
    viewModeTitle: 'Modo de vista',
    viewModeDescription: 'Ajuste la complejidad de la interfaz a sus necesidades.',
  },
  notifications: { confirmRequired: 'Confirmación requerida' },
  errorBoundary: {
    storageFull: 'Por favor elimine diagnósticos o grabaciones de referencia antiguos.',
    networkError: 'Por favor verifique su conexión a internet.',
    technicalDetails: 'Detalles técnicos',
    noStackTrace: 'Sin traza de pila disponible',
  },
  qualityCheck: {
    noFeatures: 'No hay features disponibles',
    noAudioData: 'No se extrajeron datos de audio (Frame Count 0)',
    highVariance: 'Alta varianza espectral - Señal inestable',
    veryHighVariance: 'Varianza muy alta - Por favor grabe en un entorno más tranquilo',
    outliers: '{{count}} valores atípicos detectados ({{ratio}}%) - Posible ruido de interferencia',
    weakSignal: 'Señal muy débil/difusa - Posiblemente solo ruido. Acérquese más a la máquina.',
    weakTonal: 'Señal tonal débil - La relación señal/ruido podría ser muy baja.',
    trainingSignalWeak: 'Señal demasiado débil o inconsistente para entrenamiento. Asegúrese: micrófono cerca de la máquina, máquina funcionando, no solo ruido de fondo. (Similitud coseno promedio: {{value}})',
    invalidSampleRate: 'Tasa de muestreo inválida: {{rate}}Hz. Esperada: 8000-192000Hz (típica: 44100Hz o 48000Hz)',
  },
  level2Reference: {
    title: '🔄 Nivel 2: Ejecución de referencia (ML)',
    fullDescription: 'Grabe una ejecución de referencia de su máquina en estado normal. Esta grabación se usará para detectar desviaciones futuras.',
    description: 'Esta grabación se usará para detectar desviaciones futuras.',
    readyForRecording: 'Listo para grabar',
    machineLabel: 'Máquina:',
    seconds: 'Segundos',
    cameraHint: '📷 Posición para imagen de referencia - mantenga el dispositivo estable',
    recordButton: '🎤 Grabar referencia',
    tipsTitle: 'ℹ️ Consejos para buenas grabaciones:',
    tipNormalState: 'Asegúrese de que la máquina esté funcionando en estado normal',
    tipMicPosition: 'Mantenga el micrófono en una posición constante',
    tipNoNoise: 'Evite ruidos de interferencia durante la grabación',
    tipDuration: 'La grabación dura 10 segundos',
    notLoaded: 'no cargado',
    initializingModel: 'Inicializando modelo ML...',
    recordingStarting: '🎤 Iniciando grabación...',
    countdownText: '⏱️ La grabación comienza en {{seconds}}...',
    recordingRunning: '🔴 Grabación en curso...',
    processingRecording: '🔄 Procesando grabación...',
    referenceCreated: '✅ ¡Referencia creada exitosamente!',
    referenceSaved: 'Referencia de nivel 2 guardada',
    referenceCreatedBtn: '✅ Referencia creada',
    errorPrefix: '❌ Error:',
  },
  level2Diagnose: {
    title: '🔍 Nivel 2: Verificar Máquina (ML)',
    description: 'Compare el estado actual de la máquina con la referencia.',
    machineLabel: 'Máquina:',
    initializing: 'Inicializando...',
    ghostHint: '👻 Mueva el teléfono hasta que la imagen en vivo coincida con la imagen de referencia',
    liveRecording: '🌊 Grabación en vivo',
    similarityLabel: 'Coincidencia con referencia',
    spectrogramTitle: '📊 Espectrograma (Análisis)',
    checkMachine: '🔍 Verificar Máquina',
    recheckMachine: '🔍 Verificar de nuevo',
    analysisResult: '📊 Resultado del análisis',
    similarityDetail: 'Similitud:',
    statusLabel: 'Estado:',
    analysisTime: 'Tiempo de análisis:',
    notLoaded: 'no cargado',
    noReference: '⚠️ No hay referencia disponible. Por favor cree una referencia primero.',
    noReferenceError: 'No hay referencia disponible. Por favor cree una referencia primero.',
    recordingRunning: '🎤 Grabación en curso...',
    recordingCountdown: '🔴 Grabando... ({{seconds}}s)',
    analyzingRecording: '🔄 Analizando grabación...',
    analysisComplete: '✅ Análisis completado: {{percentage}}%',
    referenceLoaded: '✅ Referencia cargada. Listo para diagnóstico.',
    newReferenceLoaded: '✅ Nueva referencia cargada. Listo para diagnóstico.',
    loadingNewReference: '🔄 Cargando nueva referencia...',
    machineNormal: 'Máquina funcionando normalmente',
    calculatingSimilarity: 'Calculando similitud...',
    initTensorflow: 'Inicializando TensorFlow.js...',
    loadingYamnet: 'Cargando modelo YAMNet (6 MB)...',
    extractingFeatures: 'Extrayendo features de audio...',
    savingReference: 'Guardando referencia...',
    referenceCreatedProgress: 'Referencia creada',
    generatingSpectrogram: 'Generando espectrograma...',
    warningDeviation: 'Desviación leve detectada - se recomienda monitoreo',
    criticalDeviation: 'Desviación significativa - ¡mantenimiento urgentemente recomendado!',
    diagnosisSaved: 'Diagnóstico guardado',
    diagnosisSaveFailed: 'No se pudo guardar el diagnóstico',
    healthyLabel: 'NORMAL',
    warningLabel: 'ADVERTENCIA',
    criticalLabel: 'CRÍTICO',
    errorPrefix: '❌ Error:',
  },
  healthGauge: { normal: 'NORMAL', deviation: 'DESVIACION', abnormal: 'ANORMAL' },
  modeSelector: {
    title: 'Modo de análisis',
    description: 'Seleccione el modo apropiado para su máquina',
    featuresOf: 'Funciones de {{level}}:',
    modeChanged: 'Modo cambiado: {{name}}',
    stationaryName: 'Nivel 1: Sonidos Estacionarios (GMIA)',
    stationaryFeature: 'Modelo gaussiano para detección estadística',
    cyclicName: 'Nivel 2: Sonidos Cíclicos (ML)',
  },
  audio: { ready: 'Listo', stabilizing: 'Estabilización acústica... {{seconds}}s', waitingForSignal: 'Esperando señal...', recordingRunning: 'Grabación en curso' },
  settingsUI: {
    title: 'Configuración', nfcWriterTitle: 'Etiquetas NFC', nfcWriterDescription: 'Escribe etiquetas NFC para acceder a la app o a una máquina seleccionada.', appearance: 'Apariencia',
    audioSettings: 'Configuración de audio', audioHardware: 'Hardware de audio',
    detectingMic: 'Detectando micrófono...', initHardwareCheck: 'Inicializando verificación de hardware',
    changeMicrophone: 'Cambiar micrófono', confidenceThreshold: 'Umbral de confianza',
    recordingDuration: 'Duración de grabación', seconds5: '5 segundos', seconds10: '10 segundos', seconds15: '15 segundos', seconds: 'segundos',
    frequencyAxis: 'Eje de frecuencia', frequencyAxisDesc: 'Logarítmico (más detalle en rango 20-500 Hz)', frequencyLogDesc: 'Logarítmico (más detalle en rango 20-500 Hz)',
    amplitudeAxis: 'Eje Y / Amplitud', amplitudeAxisDesc: 'Logarítmico (dB) – enfatiza señales débiles', amplitudeLogDesc: 'Logarítmico (dB) – enfatiza señales débiles',
    deviceInvariantToggle: 'Modo invariante al dispositivo',
    deviceInvariantHelp: 'Ayuda a comparar distintos teléfonos/micrófonos (efectos lineales). Puede ayudar poco con supresión de ruido agresiva.',
    deviceInvariantAdvanced: 'Ajustes avanzados',
    deviceInvariantMethod: 'Método',
    deviceInvariantMethodDct: 'DCT-Lifter Whitening',
    deviceInvariantMethodSmooth: 'Smooth Subtract',
    deviceInvariantStrength: 'Intensidad',
    deviceInvariantStrengthLow: 'Baja',
    deviceInvariantStrengthMedium: 'Media',
    deviceInvariantStrengthHigh: 'Alta',
    deviceInvariantZNorm: 'Z-Normalizar',
    deviceInvariantZNormDesc: 'Normalizar en los bins de frecuencia (eliminar media).',
    deviceInvariantZNormOn: 'Z-Normalizar activado',
    deviceInvariantZNormOff: 'Z-Normalizar desactivado',
    deviceInvariantABHint: 'Para prueba A/B: grabar referencia → exportar BD → importar en otro dispositivo → prueba en vivo; luego cambiar modo y repetir.',
    deviceInvariantMismatchTitle: 'Incompatibilidad de modo de características',
    deviceInvariantMismatchDescription: 'La base de datos usa {{dbMode}}. La app está en {{appMode}}.',
    deviceInvariantMismatchNotice: 'La base de datos usa {{mode}}. Puede aplicar estos ajustes en la configuración de audio avanzada.',
    deviceInvariantMismatchPrompt: 'La base de datos usa {{dbMode}}. La app está en {{appMode}}. ¿Aplicar ajustes de la base de datos?',
    deviceInvariantApplyFromDb: 'Aplicar ajustes de la base de datos',
    deviceInvariantApplied: 'Ajustes aplicados desde la base de datos.',
    deviceInvariantModeBaseline: 'Baseline',
    deviceInvariantModeDim: 'Invariante al dispositivo',
    analysisMethod: 'Método de análisis', analysisMethodDesc: 'Seleccione el método de análisis apropiado para su máquina.',
    level1Info: 'Nivel 1: Configuración de frecuencia y amplitud activa arriba',
    level2Info: 'Nivel 2: Grabación de 10 segundos, análisis ML YAMNet',
    dataManagement: 'Gestión de datos', exportDatabase: 'Exportar base de datos', shareDatabase: 'Enviar base de datos',
    importDatabase: 'Importar base de datos', statistics: 'Estadísticas:',
    machines: 'Máquinas', recordings: 'Grabaciones', diagnoses: 'Diagnósticos',
    clearAllData: 'Eliminar todos los datos', deleteAllData: 'Eliminar todos los datos',
    quickAccessDesc: 'Acceso rápido a máquinas usadas recientemente',
    noMachines: 'No hay máquinas disponibles', or: 'o',
    selectMicrophone: 'Seleccionar micrófono',
    microphoneAdvice: 'Seleccione el mejor micrófono para diagnóstico de máquinas. Evite auriculares y dispositivos Bluetooth ya que están optimizados para voz.',
    manualInput: 'Introducir manualmente', machineIdInput: 'Introducir ID de máquina', continue: 'Continuar',
    qrHint: 'Coloque el código QR o código de barras en el marco', codeRecognized: '¡Código reconocido!',
    // Configuración del banner
    bannerTitle: 'Imagen del banner',
    bannerDescription: 'Personalice la imagen del banner de la página de inicio. Cada tema puede tener su propio banner.',
    bannerUpload: 'Subir banner',
    bannerReset: 'Restablecer a predeterminado',
    bannerHint: 'Recomendado: 1024×400 o 1024×500 píxeles, formato PNG. El tercio izquierdo queda libre para texto.',
  },
  nfc: {
    title: 'Escribir etiqueta NFC',
    description: 'Elija qué información se escribirá en la etiqueta NFC.',
    supportDetails: 'Contexto seguro: {{secureContext}} · NDEFReader disponible: {{ndefReader}}',
    openWriter: 'Escribir etiqueta NFC',
    writeButton: 'Escribir ahora',
    optionGeneric: 'Enlace de la app (genérico)',
    optionGenericDetail: 'Abre la app sin un ID de máquina.',
    optionSpecific: 'Enlace de máquina',
    optionSpecificDetailDefault: 'Abre la app para la máquina seleccionada actualmente.',
    optionSpecificDetail: 'Abre la app para "{{name}}" (ID: {{id}}).',
    optionSpecificUnavailable: 'Seleccione primero una máquina para escribir un enlace específico.',
    hint: 'Acerque la etiqueta NFC a la parte trasera de su dispositivo.',
    unavailableHint: 'La escritura NFC solo está disponible en Chrome para Android.',
    statusWriting: 'Escribiendo etiqueta NFC...',
    statusSuccess: 'Etiqueta NFC escrita correctamente.',
    statusCancelled: 'Escritura cancelada.',
    statusError: 'No se pudo escribir la etiqueta NFC.',
    unsupported: 'La escritura NFC no es compatible con este dispositivo.',
    requiresSecureContext: 'La escritura NFC requiere una conexión segura (HTTPS).',
    unsupportedBrowser: 'La escritura NFC requiere Chrome en Android.',
  },
  review: {
    title: 'Revisar grabación', subtitle: 'Control de calidad',
    listenTitle: 'Escuchar grabación',
    browserNoAudio: 'Su navegador no admite reproducción de audio.',
    recordingInfo: '15 segundos de grabación (5s estabilización + 10s entrenamiento)',
    positionImageTitle: 'Imagen de posición guardada',
    positionImageCheck: 'Verifique si la imagen muestra la posición correcta.',
    qualityTitle: 'Evaluación de calidad', quality: 'Calidad',
    issuesTitle: 'Problemas detectados:', discardNew: 'Descartar / Nuevo',
    saveAsReference: 'Guardar como referencia',
  },
  diagnosisResults: {
    title: 'Resultados del diagnóstico',
    fingerprintLabel: 'Huella',
    confidenceScoreLabel: 'Puntuación de confianza',
    featureModeLabel: 'Modo de características',
    featureModeValue: '{{mode}} · {{method}} · {{strength}} · {{zNorm}}',
    varianceTitle: 'Varianza',
    frequencyAnomalyLabel: 'Anomalía de frecuencia',
    analysisHintDefault: 'Consejo: señal ligeramente elevada alrededor de 20 kHz',
    referenceQualityTitle: 'Calidad de referencia',
    referenceQualityStatusGood: 'BUENA',
    referenceQualityDescription: 'La grabación de referencia cumple las condiciones recomendadas',
    viewHistory: 'Ver historial',
  },
  themes: {
    focusTitle: 'Steve Jobs',
    focusDescription: 'Una acción. Sin ruido. Enfoque en lo esencial – todo lo demás desaparece.',
    focusDesc: 'Una acción. Sin ruido. Claridad que funciona.',
    daylightTitle: 'Daylight',
    daylightDescription: 'Tema claro y anti‑deslumbramiento para exteriores. Contraste nítido para leer a la luz del sol.',
    daylightDesc: 'Tema claro y anti‑deslumbramiento para exteriores. Contraste nítido para leer a la luz del sol.',
    brandTitle: 'Zanobo',
    brandDescription: 'Claro, amigable, confiable. IA en la que puedes confiar.',
    brandDesc: 'Claro, amigable, confiable. IA en la que puedes confiar.',
    neonTitle: 'Neon Industrial',
    neonDescription: 'Paleta neón de alto contraste para entornos con poca luz. Los acentos guían a las acciones clave.',
    neonDesc: 'Paleta neón de alto contraste para entornos con poca luz. Los acentos guían a las acciones clave.',
  },
  level2Default: {
    referenceTitle: 'Grabación de referencia ML',
    referenceDescription: 'Cree una huella acústica de su máquina en estado normal. La IA aprende el patrón de sonido típico para comparaciones futuras.',
    feature10sec: 'Grabación de 10 segundos', featureYamnet: 'Análisis ML YAMNet',
    featureCamera: 'Posicionamiento automático por cámara',
    selectMachineFirst: 'Por favor seleccione primero una máquina',
    diagnoseTitle: 'Análisis de estado IA',
    diagnoseDescription: 'Compare el estado actual de la máquina con la referencia. La IA detecta desviaciones y evalúa el estado de salud.',
    featureRealtime: 'Análisis en tiempo real', featureWaterfall: 'Espectrograma cascada en vivo',
    featureTrafficLight: 'Indicador de semáforo',
    refSubDesc: 'Grabación de referencia de 10 segundos', diagSubDesc: 'Realizar análisis en vivo', analyzeBtn: 'Analizar',
  },
  footer: { impressum: 'Aviso legal', privacy: 'Política de privacidad', about: 'Acerca de Zanobo', settings: 'Configuración' },

  // NFC IMPORT (Deep Link Import via ?importUrl=)
  nfcImport: {
    modalTitle: 'Copia de seguridad NFC detectada',
    warningOverwrite: '¡Atención: La base de datos local será sobrescrita!',
    currentData: 'Datos actuales',
    newData: 'Nuevos datos',
    exportedAt: 'Exportado el',
    confirmButton: 'Importar datos',
    success: '¡Base de datos importada con éxito!',
    successTitle: 'Importación completada',
    error: 'Error de importación',
    errorTitle: 'Error de importación',
    errorGitHubBlob: 'Error: Por favor use el enlace "Raw" de GitHub, no el enlace web.',
    errorFetchFailed: 'Descarga fallida. Por favor verifique la URL.',
    errorNotJson: 'Error: La URL devuelve HTML en lugar de JSON.\n\nPor favor use el enlace "Raw" de GitHub.',
    errorInvalidJson: 'Error: El archivo no contiene un formato JSON válido.',
    errorInvalidStructure: 'Error: El archivo no tiene el formato de copia de seguridad esperado.',
    errorNetwork: 'Error de red al cargar los datos. Por favor verifique su conexión.',
  },

  // BADGES (UI Hints)
  badges: {
    recommended: 'Recomendado',
    nextStep: 'Siguiente paso',
  },
};
