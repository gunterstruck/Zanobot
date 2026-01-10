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
const DB_VERSION = 2; // Incremented for keyPath fix: timestamp → id

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
      if (db.objectStoreNames.contains('diagnoses') && oldVersion < 2) {
        console.log('🔄 Migrating diagnoses store: fixing keyPath from timestamp to id');
        db.deleteObjectStore('diagnoses');
        const diagnosisStore = db.createObjectStore('diagnoses', { keyPath: 'id' });
        diagnosisStore.createIndex('by-machine', 'machineId');
        diagnosisStore.createIndex('by-timestamp', 'timestamp');
        diagnosisStore.createIndex('by-status', 'status');
      }
    },
  });

  console.log('✅ Database initialized');

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
  console.log(`💾 Machine saved: ${machine.id}`);
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

  console.log(`🗑️ Machine deleted: ${id}`);
}

/**
 * Update machine's reference model
 *
 * @param machineId - Machine ID
 * @param model - GMIA model
 */
export async function updateMachineModel(machineId: string, model: GMIAModel): Promise<void> {
  const db = await initDB();
  const machine = await db.get('machines', machineId);

  if (!machine) {
    throw new Error(`Machine not found: ${machineId}`);
  }

  machine.referenceModel = model;
  await db.put('machines', machine);

  console.log(`🧠 Model updated for machine: ${machineId}`);
}

// ============================================================================
// RECORDING OPERATIONS
// ============================================================================

/**
 * Save a recording
 *
 * @param recording - Recording object
 */
export async function saveRecording(recording: Recording): Promise<void> {
  const db = await initDB();
  await db.put('recordings', recording);
  console.log(`🎙️ Recording saved: ${recording.id}`);
}

/**
 * Get recording by ID
 *
 * @param id - Recording ID
 * @returns Recording or undefined
 */
export async function getRecording(id: string): Promise<Recording | undefined> {
  const db = await initDB();
  return await db.get('recordings', id);
}

/**
 * Get all recordings for a machine
 *
 * @param machineId - Machine ID
 * @returns Array of recordings
 */
export async function getRecordingsForMachine(machineId: string): Promise<Recording[]> {
  const db = await initDB();
  return await db.getAllFromIndex('recordings', 'by-machine', machineId);
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

  console.log(`📊 Diagnosis saved for machine: ${diagnosis.machineId}`);
}

/**
 * Get all diagnoses for a machine
 *
 * @param machineId - Machine ID
 * @param limit - Maximum number of results (optional)
 * @returns Array of diagnoses (sorted by timestamp, newest first)
 */
export async function getDiagnosesForMachine(
  machineId: string,
  limit?: number
): Promise<DiagnosisResult[]> {
  const db = await initDB();
  const diagnoses = await db.getAllFromIndex('diagnoses', 'by-machine', machineId);

  // Sort by timestamp descending (newest first)
  diagnoses.sort((a, b) => b.timestamp - a.timestamp);

  return limit ? diagnoses.slice(0, limit) : diagnoses;
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

  console.log('🗑️ All data cleared');
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
 * Export all data (for backup)
 *
 * @returns All database data
 */
export async function exportData(): Promise<{
  machines: Machine[];
  recordings: Recording[];
  diagnoses: DiagnosisResult[];
}> {
  const db = await initDB();

  const machines = await db.getAll('machines');
  const recordings = await db.getAll('recordings');
  const diagnoses = await db.getAll('diagnoses');

  console.log('📦 Data exported successfully');

  return { machines, recordings, diagnoses };
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
    recordings?: Recording[];
    diagnoses?: DiagnosisResult[];
  },
  merge: boolean = false
): Promise<void> {
  const db = await initDB();

  // If not merging, clear existing data first
  if (!merge) {
    await clearAllData();
    console.log('🗑️ Existing data cleared for import');
  }

  // Import machines
  if (data.machines) {
    for (const machine of data.machines) {
      await db.put('machines', machine);
    }
    console.log(`📥 Imported ${data.machines.length} machines`);
  }

  // Import recordings
  if (data.recordings) {
    for (const recording of data.recordings) {
      await db.put('recordings', recording);
    }
    console.log(`📥 Imported ${data.recordings.length} recordings`);
  }

  // Import diagnoses
  if (data.diagnoses) {
    for (const diagnosis of data.diagnoses) {
      await db.put('diagnoses', diagnosis);
    }
    console.log(`📥 Imported ${data.diagnoses.length} diagnoses`);
  }

  console.log('✅ Data import complete');
}
