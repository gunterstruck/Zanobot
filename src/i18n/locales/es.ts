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
    startDiagnosis: 'Iniciar diagnóstico',
    close: 'Cerrar',
    cancel: 'Cancelar',
    save: 'Guardar',
    discard: 'Descartar',
    trainAnother: 'Entrenar otro estado',
    newMachine: 'Nueva máquina',
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
    databaseImported: 'Base de datos importada',
    databaseCleared: 'Base de datos borrada',
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
    machineName: 'Nombre de la máquina',
    machineId: 'ID de la máquina (opcional)',
    quickAccess: 'Acceso rápido',
    recentlyUsed: 'Usado recientemente',
    overview: 'Vista general',
    machineOverview: 'Vista general de máquinas',
    history: 'Historial',
    noMeasurements: 'Sin mediciones todavía',
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
    noReferenceModel: 'No hay modelo de referencia disponible',
    trainedStates: 'Estados entrenados',
    noModelsYet: 'Aún no hay modelos de referencia disponibles',
    existingModels: 'MODELOS EXISTENTES:',
    statesTrainedCount: '{{count}} estado(s) ya entrenado(s)',

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

    sampleRateError: 'Error de configuración de audio: Su micrófono funciona a {{actual}}Hz, pero ningún modelo de referencia fue entrenado a esta frecuencia de muestreo (Modelos: {{expected}}Hz). Por favor use la misma configuración de audio que durante el entrenamiento o cree un nuevo modelo de referencia con la frecuencia de muestreo actual.',

    display: {
      referenceModels: 'MODELO(S) DE REFERENCIA:',
      statesTrainedCount: '{{count}} estado(s) entrenado(s)',
      debugValues: '🔍 VALORES DE DEPURACIÓN:',
      signalHint: 'Acerque el teléfono a la máquina para una señal óptima',
      match: 'Coincidencia',
      ghostHint: '👻 Mueva el teléfono hasta que la imagen en vivo y la imagen de referencia coincidan',
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

    import: {
      confirmMerge: 'Importar base de datos desde: {{filename}}\n\n¿Desea FUSIONAR los datos?\n\nSÍ = Fusionar con datos existentes\nNO = REEMPLAZAR todos los datos existentes',
      confirmReplace: '⚠️ ¡ADVERTENCIA!\n\n¡Todos los datos existentes serán ELIMINADOS y reemplazados con los datos importados!\n\n¿Desea continuar?',
      success: 'Máquinas: {{machines}}\nGrabaciones: {{recordings}}\nDiagnósticos: {{diagnoses}}\n\nModo: {{mode}}',
      modeMerged: 'Fusionado',
      modeReplaced: 'Reemplazado',
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
    ok: 'OK',
    loading: 'Cargando...',
    initializing: 'Inicializando...',
    unknown: 'desconocido',
  },
};
