/**
 * ZANOBOT - Chinese (中文) Translations
 */

import type { TranslationDict } from '../index.js';

export const zh: TranslationDict = {
  // ============================================================================
  // BUTTONS
  // ============================================================================
  buttons: {
    stop: '停止',
    stopAndSave: '停止并保存',
    scan: '扫描',
    create: '创建',
    record: '录制',
    startDiagnosis: '开始诊断',
    close: '关闭',
    cancel: '取消',
    save: '保存',
    discard: '丢弃',
    trainAnother: '训练另一个状态',
    newMachine: '新建机器',
  },

  // ============================================================================
  // STATUS
  // ============================================================================
  status: {
    healthy: '正常',
    uncertain: '偏差',
    faulty: '异常',
    unknown: '未知',
    noData: '无数据',
    notChecked: '尚未检查',
    ready: '就绪',
    analyzing: '分析中...',
  },

  // ============================================================================
  // MODAL TITLES
  // ============================================================================
  modals: {
    referenceRecording: '参考录制',
    liveDiagnosis: '实时诊断 - 寻找最佳点',
    qrScanner: '二维码/条形码扫描器',
    databaseError: '数据库错误',
    browserIncompatible: '浏览器不兼容',
    accessDenied: '访问被拒绝',
    processingError: '处理错误',
    saveError: '保存错误',
    sampleRateMismatch: '采样率不兼容',
    unsuitable: '信号不适合',
    referenceUnsuitable: '参考录制不适合',
    recordingDiscarded: '录制已丢弃',
    cameraOptional: '摄像头可选',
    noSignalDetected: '未检测到信号',
    scanError: '扫描错误',
    databaseExported: '数据库已导出',
    databaseImported: '数据库已导入',
    databaseCleared: '数据库已清空',
  },

  // ============================================================================
  // PHASE 1: IDENTIFY (Machine Selection)
  // ============================================================================
  identify: {
    selectMachine: '选择机器',
    scanQrCode: '扫描二维码',
    scanQrDescription: '通过二维码识别机器',
    manualEntry: '手动创建',
    manualEntryDescription: '使用名称创建新机器',
    machineName: '机器名称',
    machineId: '机器ID（可选）',
    quickAccess: '快速访问',
    recentlyUsed: '最近使用',
    overview: '概览',
    machineOverview: '机器概览',
    history: '历史记录',
    noMeasurements: '暂无测量数据',
    statesTrained: '{{count}} 个状态已训练',

    errors: {
      scannerStart: '启动扫描器时出错',
      cameraAccessDenied: '摄像头访问被拒绝',
      cameraAccessHint: '请在浏览器设置中允许访问摄像头',
      noCameraFound: '未找到摄像头',
      noCameraHint: '请确保您的设备有摄像头',
      qrProcessing: '处理二维码时出错',
      invalidCode: '扫描到无效代码',
      codeProcessing: '处理代码时出错',
      manualEntryLoad: '无法加载手动输入',
      invalidMachineId: '无效的机器ID',
      machineLoad: '加载机器时出错',
      machineNotFound: '未找到机器。请重新选择。',
      nameRequired: '请输入机器名称',
      nameWhitespace: '机器名称不能只包含空格',
      nameTooLong: '机器名称太长（最多100个字符）',
      machineExists: '此ID的机器已存在',
      machineCreate: '创建机器时出错',
      idEmpty: '机器ID不能为空',
      idTooShort: '机器ID太短',
      idTooLong: '机器ID太长（最多100个字符）',
      idWhitespace: '机器ID不能只包含空格',
      microphoneLoad: '加载麦克风时出错',
      microphoneSwitch: '切换麦克风时出错',
    },

    success: {
      machineLoaded: '机器"{{name}}"已加载',
      machineCreated: '机器已创建：{{name}}',
      machineAutoCreated: '新机器"{{name}}"已自动创建。',
      microphoneOptimized: '麦克风已自动设置为"{{label}}"以获得最佳诊断效果',
      microphoneChanged: '麦克风已切换：{{label}}',
    },

    time: {
      justNow: '刚刚',
      minutesAgo: '{{minutes}}分钟前',
      hoursAgo: '{{hours}}小时前',
      dayAgo: '1天前',
      daysAgo: '{{days}}天前',
      weekAgo: '1周前',
      weeksAgo: '{{weeks}}周前',
    },
  },

  // ============================================================================
  // PHASE 2: REFERENCE (Training)
  // ============================================================================
  reference: {
    recordReference: '录制参考',
    noReferenceModel: '无可用的参考模型',
    trainedStates: '已训练状态',
    noModelsYet: '尚无参考模型',
    existingModels: '现有模型：',
    statesTrainedCount: '{{count}} 个状态已训练',

    recording: {
      alreadyRunning: '录制已在进行中。',
      cameraNotAvailable: '摄像头不可用。录制将在无位置图像的情况下继续。',
      browserNotCompatible: '您的浏览器不支持音频录制。请使用现代浏览器。',
      stabilizing: '稳定中...',
      waitingForSignal: '等待信号',
      recording: '录制中',
      microphoneFailed: '麦克风访问失败',
      processingFailed: '无法处理录制',
      noSignal: '请靠近机器并重试。',
      positionImage: '📷 位置图像将自动捕获',
      instruction: '将麦克风保持在机器前10-30厘米处。',
    },

    quality: {
      signalStable: '✓ 信号稳定',
      slightUnrest: '⚠ 轻微不稳定',
      signalUnstable: '✗ 警告：信号不稳定！',
    },

    errors: {
      tooShort: '录制太短：{{duration}}秒总时长短于{{warmup}}秒预热阶段。最短时长：{{minDuration}}秒',
      trainingTooShort: '训练数据太短：{{duration}}秒（预热阶段后）。最低要求：{{minDuration}}秒。请至少录制{{totalDuration}}秒。',
      qualityTooLow: '录制质量太差，无法训练。请在安静环境中使用清晰的机器信号重新录制。\n\n问题：\n{{issues}}',
      signalTooWeak: '信号太弱或分散（可能只是噪音）。\n\n信号强度（RMS）：{{magnitude}}（最小值：0.03）\n质量：{{quality}}%\n\n请确保：\n• 麦克风足够靠近机器（10-30厘米）\n• 机器以足够的音量运行\n• 没有只录制背景噪音\n\n问题：\n{{issues}}',
      qualityWarning: '⚠️ 警告：录制质量差\n\n此录制的质量较差。训练可能不可靠。\n\n问题：\n{{issues}}\n\n您仍要保存吗？',
      baselineTooLow: '参考录制太不清晰或有噪音。\n\n自我识别分数：{{score}}%\n最低要求：{{minScore}}%\n\n可能的原因：\n• 信号太弱或不稳定\n• 背景噪音太多\n• 机器运行不稳定\n\n请在更好的条件下重新录制：\n• 麦克风更靠近机器（10-30厘米）\n• 安静的环境\n• 机器在整个录制过程中稳定运行',
      noAudioFile: '请先创建参考录制。',
      exportFailed: '导出失败',
      saveFailed: '保存失败',
      machineDataMissing: '缺少机器数据',
    },

    success: {
      modelTrained: '✅ 参考模型训练成功！\n\n机器：{{name}}\n\n您想下载参考音频文件吗？\n（建议备份）',
      canStartNew: '您可以开始新的参考录制。',
    },

    labels: {
      prompt: '为此机器状态输入名称：\n\n示例：\n• 正常运行状态："空转"、"满载"、"部分负载"\n• 故障："模拟不平衡"、"轴承损坏"、"风扇故障"',
      confirmType: '状态："{{label}}"\n\n这是正常运行状态吗？\n\n🟢 确定（是）→ 正常状态（如"空转"、"满载"）\n🔴 取消（否）→ 已知故障（如"不平衡"、"轴承损坏"）\n\n注意：此选择决定诊断显示为"健康"还是"故障"。',
      enterName: '请输入名称',
      cancelled: '已取消',
    },
  },

  // ============================================================================
  // PHASE 3: DIAGNOSE (Real-time)
  // ============================================================================
  diagnose: {
    alreadyRunning: '诊断已在进行中。',
    noReferenceModel: '未找到参考模型。请先创建参考录制。',
    browserNotCompatible: '您的浏览器不支持实时诊断。请使用Chrome、Edge或Safari。',
    noValidSampleRate: '未找到具有有效采样率的参考模型。',
    cameraNotAvailable: '摄像头不可用。诊断将在无位置指南的情况下继续。',
    diagnosisRunning: '诊断运行中',
    saveFailed: '无法保存诊断',

    sampleRateError: '音频设置错误：您的麦克风运行在{{actual}}Hz，但没有参考模型是在此采样率下训练的（模型：{{expected}}Hz）。请使用与训练时相同的音频设置，或使用当前采样率创建新的参考模型。',

    display: {
      referenceModels: '参考模型：',
      statesTrainedCount: '{{count}} 个状态已训练',
      debugValues: '🔍 调试值：',
      signalHint: '将手机靠近机器以获得最佳信号',
      match: '匹配度',
      ghostHint: '👻 移动手机直到实时图像与参考图像对齐',
    },

    analysis: {
      healthyMatch: '声学特征与参考状态"{{state}}"匹配（{{score}}%）。无异常。',
      faultyMatch: '检测到异常：特征与训练模式"{{state}}"匹配（{{score}}%）。建议检查。',
    },
  },

  // ============================================================================
  // PHASE 4: SETTINGS
  // ============================================================================
  settings: {
    databaseNotAvailable: '数据库不可用。请在浏览器设置中允许IndexedDB或禁用严格隐私模式。',
    exportError: '导出数据库时出错',
    importError: '导入时出错',

    import: {
      confirmMerge: '从以下位置导入数据库：{{filename}}\n\n您想合并数据吗？\n\n是 = 与现有数据合并\n否 = 替换所有现有数据',
      confirmReplace: '⚠️ 警告！\n\n所有现有数据将被删除并替换为导入数据！\n\n您要继续吗？',
      success: '机器：{{machines}}\n录制：{{recordings}}\n诊断：{{diagnoses}}\n\n模式：{{mode}}',
      modeMerged: '已合并',
      modeReplaced: '已替换',
    },

    clear: {
      confirmFirst: '⚠️ 警告！\n\n所有数据将被永久删除：\n- 所有机器\n- 所有参考模型\n- 所有录制\n- 所有诊断\n\n您要继续吗？',
      confirmSecond: '您绝对确定吗？\n\n此操作无法撤消！',
      success: '所有数据已删除',
      error: '删除数据时出错',
    },

    export: {
      success: '文件：{{filename}}\n\n机器：{{machines}}\n录制：{{recordings}}\n诊断：{{diagnoses}}',
    },
  },

  // ============================================================================
  // MAIN APP / STARTUP
  // ============================================================================
  app: {
    browserNotSupported: '您的浏览器与Zanobo不兼容。\n\n缺少的功能：\n{{features}}\n\n请使用现代浏览器，如Chrome、Edge、Firefox或Safari。',
    uiLoadFailed: '无法加载用户界面',
    fatalError: '致命错误',
    browserNotSupportedTitle: '浏览器不支持',
  },

  // ============================================================================
  // CORE ML / SCORING
  // ============================================================================
  scoring: {
    matchesReference: '声学特征与参考匹配。无异常。',
    moderateDeviation: '与参考模式有中等偏差。建议检查。',
    significantDeviation: '检测到与参考模式有显著偏差。建议检查。',
    noMatch: '与参考模式有显著偏差（{{score}}%）。信号与任何训练状态都不匹配。建议检查。',
  },

  // ============================================================================
  // HARDWARE CHECK
  // ============================================================================
  hardware: {
    suitable: '硬件适合机器诊断',
    voiceOptimized: '语音优化的硬件会过滤机器声音。',
    useStudioMic: '使用录音室麦克风或设备内置麦克风',
    mayFilter: '机器声音可能被过滤或抑制',
    lowSampleRate: '低采样率无法捕获高频机器信号',
    microphoneDenied: '麦克风访问被拒绝或不可用',
    iphoneBackMic: 'iPhone后置麦克风',
  },

  // ============================================================================
  // DETECTION MODE
  // ============================================================================
  detectionMode: {
    stationary: '用于连续运行的机器，如风扇、泵、压缩机',
    cyclic: '用于具有循环周期的机器，如包装机、装配线',
    referenceComparison: '参考运行比较',
  },

  // ============================================================================
  // COMMON
  // ============================================================================
  common: {
    machine: '机器',
    error: '错误',
    warning: '警告',
    info: '信息',
    success: '成功',
    yes: '是',
    no: '否',
    ok: '确定',
    loading: '加载中...',
    initializing: '初始化中...',
    unknown: '未知',
  },
};
