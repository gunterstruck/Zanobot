/**
 * ZANOBOT - DATABASE LAYER
 *
 * IndexedDB wrapper for offline-first data persistence.
 * Stores machines, recordings, and diagnosis results locally.
 *
 * Uses the idb library for simpler IndexedDB operations.
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';
import type { Machine, Recording, DiagnosisResult, GMIAModel } from './types.js';
import { logger } from '@utils/logger.js';

/**
 * Database schema definition
 */
interface ZanobotDB extends DBSchema {
  machines: {
    key: string;
    value: Machine;
    indexes: {
      'by-name': string;
      'by-created': number;
    };
  };
  recordings: {
    key: string;
    value: Recording;
    indexes: {
      'by-machine': string;
      'by-timestamp': number;
    };
  };
  diagnoses: {
    key: string;
    value: DiagnosisResult;
    indexes: {
      'by-machine': string;
      'by-timestamp': number;
      'by-status': DiagnosisResult['status'];
    };
  };
}

const DB_NAME = 'zanobot-db';
const DB_VERSION = 3; // Incremented for multiclass diagnosis: referenceModel → referenceModels[]

let dbInstance: IDBPDatabase<ZanobotDB> | null = null;

/**
 * Initialize and open the database
 *
 * @returns Database instance
 */
export async function initDB(): Promise<IDBPDatabase<ZanobotDB>> {
  if (dbInstance) {
    return dbInstance;
  }

  dbInstance = await openDB<ZanobotDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      // Create machines store
      if (!db.objectStoreNames.contains('machines')) {
        const machineStore = db.createObjectStore('machines', { keyPath: 'id' });
        machineStore.createIndex('by-name', 'name');
        machineStore.createIndex('by-created', 'createdAt');
      }

      // Create recordings store
      if (!db.objectStoreNames.contains('recordings')) {
        const recordingStore = db.createObjectStore('recordings', { keyPath: 'id' });
        recordingStore.createIndex('by-machine', 'machineId');
        recordingStore.createIndex('by-timestamp', 'timestamp');
      }

      // Create or migrate diagnoses store
      if (!db.objectStoreNames.contains('diagnoses')) {
        // Fresh install: create with correct keyPath
        const diagnosisStore = db.createObjectStore('diagnoses', { keyPath: 'id' });
        diagnosisStore.createIndex('by-machine', 'machineId');
        diagnosisStore.createIndex('by-timestamp', 'timestamp');
        diagnosisStore.createIndex('by-status', 'status');
      }

      // Migration from v1 to v2: Fix keyPath if upgrading from old version
      // SIMPLIFIED MIGRATION: Due to race condition issues with asynchronous cursor operations
      // in the synchronous upgrade callback, we simply recreate the store.
      // This results in data loss for v1 users, but prevents database corruption.
      if (db.objectStoreNames.contains('diagnoses') && oldVersion < 2) {
        logger.warn('🔄 Migrating diagnoses store from v1 to v2');
        logger.warn(
          '   ⚠️ Old diagnosis data will be lost due to schema change (keyPath: timestamp → id)'
        );

        try {
          // Delete old store with incorrect keyPath
          db.deleteObjectStore('diagnoses');

          // Create new store with correct keyPath
          const diagnosisStore = db.createObjectStore('diagnoses', { keyPath: 'id' });
          diagnosisStore.createIndex('by-machine', 'machineId');
          diagnosisStore.createIndex('by-timestamp', 'timestamp');
          diagnosisStore.createIndex('by-status', 'status');

          logger.info('   ✅ Diagnoses store recreated with correct schema');
        } catch (error) {
          logger.error('   ❌ Migration error:', error);
          // Ensure store exists even on error
          if (!db.objectStoreNames.contains('diagnoses')) {
            const diagnosisStore = db.createObjectStore('diagnoses', { keyPath: 'id' });
            diagnosisStore.createIndex('by-machine', 'machineId');
            diagnosisStore.createIndex('by-timestamp', 'timestamp');
            diagnosisStore.createIndex('by-status', 'status');
          }
        }
      }

      // Migration from v2 to v3: Multiclass diagnosis - HARD RESET
      // Breaking change: referenceModel → referenceModels[] + label field
      // We cannot migrate old single-model data to multiclass, so we clear everything
      if (oldVersion < 3) {
        logger.warn('🔄 Migrating database from v2 to v3 (Multiclass Diagnosis)');
        logger.warn('   ⚠️ BREAKING CHANGE: referenceModel → referenceModels[]');
        logger.warn('   ⚠️ All existing data will be cleared (machines, recordings, diagnoses)');

        try {
          // Clear all stores to start fresh
          const machineStore = transaction.objectStore('machines');
          const recordingStore = transaction.objectStore('recordings');
          const diagnosisStore = transaction.objectStore('diagnoses');

          machineStore.clear();
          recordingStore.clear();
          diagnosisStore.clear();

          logger.info('   ✅ Database reset complete - ready for multiclass diagnosis');
        } catch (error) {
          logger.error('   ❌ Migration error:', error);
        }
      }
    },
  });

  logger.info('✅ Database initialized');

  return dbInstance;
}

// ============================================================================
// MACHINE OPERATIONS
// ============================================================================

/**
 * Save or update a machine
 *
 * @param machine - Machine object
 */
export async function saveMachine(machine: Machine): Promise<void> {
  const db = await initDB();
  await db.put('machines', machine);
  logger.info(`💾 Machine saved: ${machine.id}`);
}

/**
 * Get machine by ID
 *
 * @param id - Machine ID
 * @returns Machine or undefined
 */
export async function getMachine(id: string): Promise<Machine | undefined> {
  const db = await initDB();
  return await db.get('machines', id);
}

/**
 * Get all machines
 *
 * @returns Array of all machines
 */
export async function getAllMachines(): Promise<Machine[]> {
  const db = await initDB();
  return await db.getAll('machines');
}

/**
 * Delete machine and all associated data
 *
 * @param id - Machine ID
 */
export async function deleteMachine(id: string): Promise<void> {
  const db = await initDB();

  // Delete machine
  await db.delete('machines', id);

  // Delete associated recordings
  const recordings = await db.getAllFromIndex('recordings', 'by-machine', id);
  for (const recording of recordings) {
    await db.delete('recordings', recording.id);
  }

  // Delete associated diagnoses
  const diagnoses = await db.getAllFromIndex('diagnoses', 'by-machine', id);
  for (const diagnosis of diagnoses) {
    await db.delete('diagnoses', diagnosis.id); // id is the key
  }

  logger.info(`🗑️ Machine deleted: ${id}`);
}

/**
 * Add a reference model to a machine's model collection
 *
 * @param machineId - Machine ID
 * @param model - GMIA model to add
 */
export async function updateMachineModel(machineId: string, model: GMIAModel): Promise<void> {
  const db = await initDB();
  const machine = await db.get('machines', machineId);

  if (!machine) {
    throw new Error(`Machine not found: ${machineId}`);
  }

  // CRITICAL FIX: Initialize referenceModels array if it doesn't exist
  // This handles legacy data from old versions or imported data
  if (!machine.referenceModels) {
    logger.warn(`⚠️ Machine ${machineId} has no referenceModels array - initializing empty array`);
    machine.referenceModels = [];
  }

  // Add model to the collection
  machine.referenceModels.push(model);
  await db.put('machines', machine);

  logger.info(`🧠 Model '${model.label}' added to machine: ${machineId}`);
}

// ============================================================================
// RECORDING OPERATIONS
// ============================================================================

/**
 * Save a recording
 *
 * CRITICAL FIX: Serialize AudioBuffer before storing in IndexedDB
 * AudioBuffer is not structure-cloneable and will cause DataCloneError if stored directly.
 * We serialize it to a plain object that IndexedDB can handle.
 *
 * @param recording - Recording object
 */
export async function saveRecording(recording: Recording): Promise<void> {
  const db = await initDB();

  // Serialize AudioBuffer for IndexedDB storage
  const serializedRecording = {
    ...recording,
    audioBuffer: serializeAudioBuffer(recording.audioBuffer),
  };

  await db.put('recordings', serializedRecording as any);
  logger.info(`🎙️ Recording saved: ${recording.id}`);
}

/**
 * Get recording by ID
 *
 * CRITICAL FIX: Deserialize AudioBuffer after loading from IndexedDB
 * The stored recording has a serialized AudioBuffer that needs to be converted back.
 *
 * @param id - Recording ID
 * @returns Recording or undefined
 */
export async function getRecording(id: string): Promise<Recording | undefined> {
  const db = await initDB();
  const storedRecording = await db.get('recordings', id);

  if (!storedRecording) {
    return undefined;
  }

  // Deserialize AudioBuffer if it's in serialized format
  if (isSerializedAudioBuffer(storedRecording.audioBuffer)) {
    return {
      ...storedRecording,
      audioBuffer: deserializeAudioBuffer(storedRecording.audioBuffer),
    } as Recording;
  }

  // Already deserialized (shouldn't happen, but handle gracefully)
  return storedRecording as Recording;
}

/**
 * Get all recordings for a machine
 *
 * CRITICAL FIX: Deserialize AudioBuffers after loading from IndexedDB
 * The stored recordings have serialized AudioBuffers that need to be converted back.
 *
 * @param machineId - Machine ID
 * @returns Array of recordings
 */
export async function getRecordingsForMachine(machineId: string): Promise<Recording[]> {
  const db = await initDB();
  const storedRecordings = await db.getAllFromIndex('recordings', 'by-machine', machineId);

  // Deserialize all AudioBuffers
  return storedRecordings.map((recording) => {
    if (isSerializedAudioBuffer(recording.audioBuffer)) {
      return {
        ...recording,
        audioBuffer: deserializeAudioBuffer(recording.audioBuffer),
      } as Recording;
    }
    return recording as Recording;
  });
}

// ============================================================================
// DIAGNOSIS OPERATIONS
// ============================================================================

/**
 * Save a diagnosis result
 *
 * @param diagnosis - Diagnosis result
 */
export async function saveDiagnosis(diagnosis: DiagnosisResult): Promise<void> {
  const db = await initDB();
  await db.put('diagnoses', diagnosis);

  // Update machine's last diagnosis timestamp
  const machine = await db.get('machines', diagnosis.machineId);
  if (machine) {
    machine.lastDiagnosisAt = diagnosis.timestamp;
    await db.put('machines', machine);
  }

  logger.info(`📊 Diagnosis saved for machine: ${diagnosis.machineId}`);
}

/**
 * Get all diagnoses for a machine
 *
 * OPTIMIZED: Uses cursor-based approach when limit is specified to avoid loading
 * all records into memory. This prevents performance issues with large datasets.
 *
 * @param machineId - Machine ID
 * @param limit - Maximum number of results (optional, recommended for large datasets)
 * @returns Array of diagnoses (sorted by timestamp, newest first)
 */
export async function getDiagnosesForMachine(
  machineId: string,
  limit?: number
): Promise<DiagnosisResult[]> {
  const db = await initDB();

  // OPTIMIZATION: When limit is specified, use cursor-based pagination
  if (limit !== undefined && limit > 0) {
    const diagnoses: DiagnosisResult[] = [];

    // Open cursor on by-timestamp index (automatically sorted)
    let cursor = await db
      .transaction('diagnoses')
      .store.index('by-timestamp')
      .openCursor(null, 'prev');

    while (cursor && diagnoses.length < limit) {
      const diagnosis = cursor.value as DiagnosisResult;

      // Filter by machineId (since we're using timestamp index)
      if (diagnosis.machineId === machineId) {
        diagnoses.push(diagnosis);
      }

      cursor = await cursor.continue();
    }

    return diagnoses;
  }

  // Fallback: Load all diagnoses (only when no limit specified)
  const diagnoses = await db.getAllFromIndex('diagnoses', 'by-machine', machineId);

  // Sort by timestamp descending (newest first)
  diagnoses.sort((a, b) => b.timestamp - a.timestamp);

  return diagnoses;
}

/**
 * Get latest diagnosis for a machine
 *
 * @param machineId - Machine ID
 * @returns Latest diagnosis or undefined
 */
export async function getLatestDiagnosis(machineId: string): Promise<DiagnosisResult | undefined> {
  const diagnoses = await getDiagnosesForMachine(machineId, 1);
  return diagnoses[0];
}

/**
 * Get diagnoses by status
 *
 * @param status - Health status
 * @returns Array of diagnoses
 */
export async function getDiagnosesByStatus(
  status: DiagnosisResult['status']
): Promise<DiagnosisResult[]> {
  const db = await initDB();
  return await db.getAllFromIndex('diagnoses', 'by-status', status);
}

// ============================================================================
// UTILITY OPERATIONS
// ============================================================================

/**
 * Clear all data from database (for testing/reset)
 */
export async function clearAllData(): Promise<void> {
  const db = await initDB();

  await db.clear('machines');
  await db.clear('recordings');
  await db.clear('diagnoses');

  logger.info('🗑️ All data cleared');
}

/**
 * Get database statistics
 *
 * @returns Database statistics
 */
export async function getDBStats(): Promise<{
  machines: number;
  recordings: number;
  diagnoses: number;
}> {
  const db = await initDB();

  const machines = await db.count('machines');
  const recordings = await db.count('recordings');
  const diagnoses = await db.count('diagnoses');

  return { machines, recordings, diagnoses };
}

/**
 * Serialized AudioBuffer for JSON export
 */
interface SerializedAudioBuffer {
  _serialized: true;
  numberOfChannels: number;
  sampleRate: number;
  length: number;
  duration: number;
  channelData: number[][]; // Array of Arrays (Float32Array → number[])
}

/**
 * Serialized Recording for JSON export
 */
interface SerializedRecording extends Omit<Recording, 'audioBuffer'> {
  audioBuffer: SerializedAudioBuffer;
}

/**
 * Serialized Machine for JSON export
 */
interface SerializedMachine extends Omit<Machine, 'referenceModels'> {
  referenceModels: Array<Omit<GMIAModel, 'weightVector'> & { weightVector: number[] }>;
}

/**
 * Serialize AudioBuffer to JSON-compatible format
 *
 * @param audioBuffer - Web Audio API AudioBuffer
 * @returns Serialized format with Float32Array data
 */
function serializeAudioBuffer(audioBuffer: AudioBuffer): SerializedAudioBuffer {
  const channelData: number[][] = [];

  // Extract all channel data
  for (let i = 0; i < audioBuffer.numberOfChannels; i++) {
    const data = audioBuffer.getChannelData(i);
    channelData.push(Array.from(data)); // Float32Array → number[]
  }

  return {
    _serialized: true,
    numberOfChannels: audioBuffer.numberOfChannels,
    sampleRate: audioBuffer.sampleRate,
    length: audioBuffer.length,
    duration: audioBuffer.duration,
    channelData,
  };
}

/**
 * Export all data (for backup)
 *
 * @returns All database data with serialized AudioBuffers
 */
export async function exportData(): Promise<{
  machines: SerializedMachine[];
  recordings: SerializedRecording[];
  diagnoses: DiagnosisResult[];
}> {
  const db = await initDB();

  const machines = await db.getAll('machines');
  const serializedMachines: SerializedMachine[] = machines.map((machine) => ({
    ...machine,
    referenceModels: (machine.referenceModels || []).map((model) => ({
      ...model,
      weightVector: Array.from(model.weightVector),
    })),
  }));
  const recordings = await db.getAll('recordings');
  const diagnoses = await db.getAll('diagnoses');

  // CRITICAL FIX: Check if AudioBuffers are already serialized
  // Recordings in IndexedDB are already serialized by saveRecording()
  // Attempting to serialize again causes crash (no getChannelData method on plain objects)
  const serializedRecordings = recordings.map((recording) => {
    if (isSerializedAudioBuffer(recording.audioBuffer)) {
      // Already serialized - use directly
      // CRITICAL FIX: Use explicit unknown cast to indicate intentional type conversion
      // This is safe because we've verified the audioBuffer is already serialized
      return recording as unknown as SerializedRecording;
    }

    // Not serialized yet - serialize now (shouldn't happen with current saveRecording, but handle gracefully)
    return {
      ...recording,
      audioBuffer: serializeAudioBuffer(recording.audioBuffer),
    };
  });

  logger.info('📦 Data exported successfully');

  return { machines: serializedMachines, recordings: serializedRecordings, diagnoses };
}

/**
 * Deserialize AudioBuffer from JSON format
 *
 * CRITICAL FIX: Close AudioContext after use to prevent resource leaks
 * Each AudioContext consumes browser resources. Creating many without closing
 * can lead to "Too many AudioContexts" errors and instability.
 *
 * @param serialized - Serialized AudioBuffer data
 * @returns Web Audio API AudioBuffer
 */
function deserializeAudioBuffer(serialized: SerializedAudioBuffer): AudioBuffer {
  // Create OfflineAudioContext instead of AudioContext for better resource management
  // OfflineAudioContext is designed for processing and is automatically cleaned up
  const audioContext = new OfflineAudioContext(
    serialized.numberOfChannels,
    serialized.length,
    serialized.sampleRate
  );

  // Create empty AudioBuffer
  const audioBuffer = audioContext.createBuffer(
    serialized.numberOfChannels,
    serialized.length,
    serialized.sampleRate
  );

  // Fill channel data
  for (let i = 0; i < serialized.numberOfChannels; i++) {
    const channelData = audioBuffer.getChannelData(i);
    const sourceData = serialized.channelData[i];

    for (let j = 0; j < sourceData.length; j++) {
      channelData[j] = sourceData[j];
    }
  }

  // OfflineAudioContext doesn't need explicit closing
  // It's designed for synchronous buffer creation and is auto-managed
  // No need for try/finally or async close() calls

  return audioBuffer;
}

/**
 * Check if an object is a serialized AudioBuffer
 *
 * @param obj - Object to check
 * @returns True if object is serialized AudioBuffer
 */
function isSerializedAudioBuffer(obj: any): obj is SerializedAudioBuffer {
  return (
    obj &&
    typeof obj === 'object' &&
    obj._serialized === true &&
    typeof obj.numberOfChannels === 'number' &&
    typeof obj.sampleRate === 'number' &&
    typeof obj.length === 'number' &&
    Array.isArray(obj.channelData)
  );
}

/**
 * Import data (restore from backup)
 *
 * @param data - Data to import
 * @param merge - If true, merge with existing data; if false, replace all data
 */
export async function importData(
  data: {
    machines?: Machine[];
    recordings?: (Recording | SerializedRecording)[];
    diagnoses?: DiagnosisResult[];
  },
  merge: boolean = false
): Promise<void> {
  const db = await initDB();

  // If not merging, clear existing data first
  if (!merge) {
    await clearAllData();
    logger.info('🗑️ Existing data cleared for import');
  }

  // Import machines
  if (data.machines) {
    for (const machine of data.machines) {
      const normalizedMachine: Machine = {
        ...machine,
        referenceModels: (machine.referenceModels || []).map((model) => ({
          ...model,
          weightVector:
            model.weightVector instanceof Float64Array
              ? model.weightVector
              : new Float64Array(model.weightVector as number[]),
        })),
      };
      await db.put('machines', normalizedMachine);
    }
    logger.info(`📥 Imported ${data.machines.length} machines`);
  }

  // Import recordings with AudioBuffer rehydration
  if (data.recordings) {
    for (const recording of data.recordings) {
      // CRITICAL FIX: IndexedDB requires serialized AudioBuffers, not real AudioBuffer objects
      // AudioBuffer is not structure-cloneable and causes DataCloneError
      let serializedRecording: any;

      if (isSerializedAudioBuffer(recording.audioBuffer)) {
        // Already serialized - use directly (format matches IndexedDB storage)
        serializedRecording = recording;
      } else {
        // Real AudioBuffer - serialize it before storing in IndexedDB
        serializedRecording = {
          ...recording,
          audioBuffer: serializeAudioBuffer(recording.audioBuffer as AudioBuffer),
        };
      }

      await db.put('recordings', serializedRecording);
    }
    logger.info(`📥 Imported ${data.recordings.length} recordings`);
  }

  // Import diagnoses
  if (data.diagnoses) {
    for (const diagnosis of data.diagnoses) {
      await db.put('diagnoses', diagnosis);
    }
    logger.info(`📥 Imported ${data.diagnoses.length} diagnoses`);
  }

  logger.info('✅ Data import complete');
}
