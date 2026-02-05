/**
 * ZANOBOT Level 2 - Main Detector Controller
 *
 * Orchestrates YAMNet feature extraction, similarity calculation,
 * and spectrogram generation for cyclic machine analysis.
 *
 * Workflow 1: Create reference from healthy machine recording
 * Workflow 2: Compare current recording against reference
 */

import { get, set, del, keys } from 'idb-keyval';
import { YAMNetExtractor } from './yamnet-extractor.js';
import { SimilarityCalculator } from './similarity-calculator.js';
import { MelSpectrogramGenerator } from '../../audio/mel-spectrogram.js';
import { logger } from '@utils/logger.js';
import type {
  Level2Reference,
  Level2ReferenceStored,
  Level2AnalysisResult,
  Level2DetectorState,
  Level2DetectorEvents,
} from './types.js';
import { serializeReference, deserializeReference, DEFAULT_LEVEL2_SETTINGS } from './types.js';

/**
 * IndexedDB key prefix for Level 2 references
 */
const REFERENCE_KEY_PREFIX = 'level2-ref-';

/**
 * Level 2 Detector - Main Controller
 *
 * Manages the full pipeline for cyclic machine analysis:
 * - YAMNet model loading (singleton)
 * - Reference creation and storage
 * - Real-time analysis with similarity scoring
 * - Spectrogram generation for visualization
 */
export class Level2Detector {
  private yamnet: YAMNetExtractor | null = null;
  private similarity: SimilarityCalculator;
  private specGen: MelSpectrogramGenerator;
  private referenceEmbedding: Float32Array | null = null;
  private currentMachineId: string | null = null;
  private state: Level2DetectorState = 'uninitialized';
  private events: Level2DetectorEvents = {};
  private settings = DEFAULT_LEVEL2_SETTINGS;

  constructor(events?: Level2DetectorEvents) {
    this.similarity = new SimilarityCalculator();
    this.specGen = new MelSpectrogramGenerator();
    if (events) {
      this.events = events;
    }
  }

  /**
   * Initialize the detector
   * Loads YAMNet model (singleton - only loaded once)
   */
  async initialize(): Promise<void> {
    if (this.state === 'ready') return;

    this.setState('initializing');
    this.emitProgress(0, 'Initialisiere TensorFlow.js...');

    try {
      // Load YAMNet (singleton pattern - only loads once)
      this.emitProgress(20, 'Lade YAMNet Modell (6 MB)...');
      this.yamnet = await YAMNetExtractor.getInstance();

      this.emitProgress(100, 'Bereit');
      this.setState('ready');

      logger.info('✅ Level 2 Detector initialized');
    } catch (error) {
      this.setState('error');
      this.emitError(error as Error);
      throw error;
    }
  }

  /**
   * WORKFLOW 1: Create Reference from Audio
   *
   * Steps:
   * 1. Extract YAMNet embeddings from audio
   * 2. Save to IndexedDB for persistence
   * 3. Cache in memory for fast access
   *
   * @param audioBuffer - Audio recording of healthy machine
   * @param machineId - Unique machine identifier
   * @param label - Human-readable label (e.g., "Baseline", "Normal Operation")
   */
  async createReference(
    audioBuffer: AudioBuffer,
    machineId: string,
    label = 'Baseline'
  ): Promise<Level2Reference> {
    if (!this.yamnet) {
      throw new Error('Detector not initialized. Call initialize() first.');
    }

    logger.info(`📝 Creating reference for machine: ${machineId}`);
    this.setState('analyzing');
    this.emitProgress(10, 'Extrahiere Audio-Features...');

    try {
      // Extract YAMNet embeddings
      const embedding = await this.yamnet.extractEmbeddings(audioBuffer);

      this.emitProgress(70, 'Speichere Referenz...');

      // Create reference object
      const reference: Level2Reference = {
        machineId,
        label,
        embedding,
        createdAt: Date.now(),
        duration: audioBuffer.duration,
        sampleRate: audioBuffer.sampleRate,
        metadata: {
          backendUsed: this.yamnet.getBackendInfo().backend,
        },
      };

      // Save to IndexedDB
      await this.saveReferenceToStorage(reference);

      // Cache in memory
      this.referenceEmbedding = embedding;
      this.currentMachineId = machineId;

      this.emitProgress(100, 'Referenz erstellt');
      this.setState('ready');

      // Emit event
      this.events.onReferenceCreated?.(reference);

      logger.info('✅ Reference saved successfully');
      return reference;
    } catch (error) {
      this.setState('error');
      this.emitError(error as Error);
      throw error;
    }
  }

  /**
   * WORKFLOW 2: Analyze Audio Against Reference
   *
   * Steps:
   * 1. Extract YAMNet embeddings from current audio
   * 2. Calculate cosine similarity with reference
   * 3. Generate spectrogram for visualization
   * 4. Return analysis result with health status
   *
   * @param audioBuffer - Current audio recording to analyze
   * @returns Analysis result with similarity, status, and spectrogram
   */
  async analyzeAudio(audioBuffer: AudioBuffer): Promise<Level2AnalysisResult> {
    if (!this.yamnet) {
      throw new Error('Detector not initialized. Call initialize() first.');
    }

    if (!this.referenceEmbedding) {
      throw new Error('No reference available. Create reference first.');
    }

    logger.info('🔍 Analyzing audio...');
    this.setState('analyzing');
    this.emitProgress(10, 'Extrahiere Audio-Features...');

    const startTime = performance.now();

    try {
      // Extract current embeddings
      const currentEmbedding = await this.yamnet.extractEmbeddings(audioBuffer);

      this.emitProgress(50, 'Berechne Ähnlichkeit...');

      // Calculate cosine similarity
      const similarity = this.similarity.calculateCosineSimilarity(
        this.referenceEmbedding,
        currentEmbedding
      );

      // Get health status
      const status = this.similarity.getHealthStatusWithThresholds(
        similarity,
        this.settings.healthyThreshold,
        this.settings.warningThreshold
      );

      this.emitProgress(70, 'Generiere Spektrogramm...');

      // Generate spectrogram for visualization
      const spectrogram = await this.specGen.generate(audioBuffer);

      const analysisTime = performance.now() - startTime;

      const result: Level2AnalysisResult = {
        similarity,
        percentage: this.similarity.similarityToPercentage(similarity),
        status,
        spectrogram,
        analysisTime,
        timestamp: Date.now(),
      };

      this.emitProgress(100, `Analyse abgeschlossen: ${result.percentage}%`);
      this.setState('ready');

      // Emit event
      this.events.onAnalysisComplete?.(result);

      logger.info(`✅ Analysis complete: ${result.percentage}% (${status.status})`);
      return result;
    } catch (error) {
      this.setState('error');
      this.emitError(error as Error);
      throw error;
    }
  }

  /**
   * Load reference from storage for a specific machine
   *
   * @param machineId - Machine ID to load reference for
   * @returns True if reference was loaded, false if not found
   */
  async loadReferenceFromStorage(machineId: string): Promise<boolean> {
    try {
      const key = `${REFERENCE_KEY_PREFIX}${machineId}`;
      const stored = await get<Level2ReferenceStored>(key);

      if (stored) {
        const reference = deserializeReference(stored);
        this.referenceEmbedding = reference.embedding;
        this.currentMachineId = machineId;
        logger.info(
          `✅ Loaded reference for ${machineId} (from ${new Date(reference.createdAt).toLocaleString()})`
        );
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Failed to load reference:', error);
      return false;
    }
  }

  /**
   * Save reference to IndexedDB
   */
  private async saveReferenceToStorage(reference: Level2Reference): Promise<void> {
    const key = `${REFERENCE_KEY_PREFIX}${reference.machineId}`;
    const serialized = serializeReference(reference);
    await set(key, serialized);
  }

  /**
   * Delete reference from storage
   */
  async deleteReference(machineId: string): Promise<void> {
    const key = `${REFERENCE_KEY_PREFIX}${machineId}`;
    await del(key);

    if (this.currentMachineId === machineId) {
      this.referenceEmbedding = null;
      this.currentMachineId = null;
    }

    logger.info(`🗑️ Deleted reference for ${machineId}`);
  }

  /**
   * Get all stored reference machine IDs
   */
  async getStoredMachineIds(): Promise<string[]> {
    const allKeys = await keys();
    return allKeys
      .filter((key) => typeof key === 'string' && key.startsWith(REFERENCE_KEY_PREFIX))
      .map((key) => (key as string).replace(REFERENCE_KEY_PREFIX, ''));
  }

  /**
   * Get reference details for a machine
   */
  async getReferenceDetails(machineId: string): Promise<Level2Reference | null> {
    const key = `${REFERENCE_KEY_PREFIX}${machineId}`;
    const stored = await get<Level2ReferenceStored>(key);
    return stored ? deserializeReference(stored) : null;
  }

  /**
   * Check if reference exists for a machine
   */
  async hasReference(machineId: string): Promise<boolean> {
    const key = `${REFERENCE_KEY_PREFIX}${machineId}`;
    const stored = await get(key);
    return stored !== undefined;
  }

  /**
   * Get current state
   */
  getState(): Level2DetectorState {
    return this.state;
  }

  /**
   * Check if detector is ready
   */
  isReady(): boolean {
    return this.state === 'ready' && this.yamnet !== null;
  }

  /**
   * Check if reference is loaded
   */
  hasLoadedReference(): boolean {
    return this.referenceEmbedding !== null;
  }

  /**
   * Get current machine ID
   */
  getCurrentMachineId(): string | null {
    return this.currentMachineId;
  }

  /**
   * Update settings
   */
  updateSettings(settings: Partial<typeof DEFAULT_LEVEL2_SETTINGS>): void {
    this.settings = { ...this.settings, ...settings };
  }

  /**
   * Get current settings
   */
  getSettings(): typeof DEFAULT_LEVEL2_SETTINGS {
    return { ...this.settings };
  }

  /**
   * Get TensorFlow backend info
   */
  getBackendInfo(): { backend: string; isGPU: boolean } | null {
    return this.yamnet?.getBackendInfo() ?? null;
  }

  /**
   * Get memory usage info (for debugging)
   */
  getMemoryInfo(): { numTensors: number; numBytes: number } | null {
    return this.yamnet?.getMemoryInfo() ?? null;
  }

  /**
   * Set event handlers
   */
  setEventHandlers(events: Level2DetectorEvents): void {
    this.events = { ...this.events, ...events };
  }

  /**
   * Cleanup resources
   */
  dispose(): void {
    this.referenceEmbedding = null;
    this.currentMachineId = null;
    this.state = 'uninitialized';
    // Note: YAMNet singleton is not disposed to allow reuse
    logger.info('🧹 Level 2 Detector disposed (YAMNet singleton preserved)');
  }

  /**
   * Full cleanup including YAMNet model
   */
  disposeAll(): void {
    this.dispose();
    this.yamnet?.dispose();
    this.yamnet = null;
    logger.info('🧹 Level 2 Detector fully disposed (including YAMNet)');
  }

  // Private helper methods

  private setState(state: Level2DetectorState): void {
    this.state = state;
    this.events.onStateChange?.(state);
  }

  private emitProgress(progress: number, message: string): void {
    this.events.onProgress?.(progress, message);
  }

  private emitError(error: Error): void {
    this.events.onError?.(error);
  }
}
