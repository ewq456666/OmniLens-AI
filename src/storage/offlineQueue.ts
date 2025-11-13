import * as SQLite from 'expo-sqlite';
import { QueuedScan } from '../types';
import { v4 as uuidv4 } from 'uuid';

type QueuedScanRow = {
  id: string;
  image_uri: string;
  created_at: number;
  status: 'pending' | 'processing';
  item_id?: string | null;
};

const getDatabase = async () => {
  const db = await SQLite.openDatabaseAsync('omnilens.db');
  await db.execAsync('PRAGMA journal_mode = WAL;');
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS queued_scans (
      id TEXT PRIMARY KEY NOT NULL,
      image_uri TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      status TEXT NOT NULL,
      item_id TEXT
    );
  `);
  try {
    await db.execAsync('ALTER TABLE queued_scans ADD COLUMN item_id TEXT');
  } catch (error) {
    // ignore if column already exists
  }
  return db;
};

export const enqueueScan = async (imageUri: string, itemId: string | null): Promise<QueuedScan> => {
  const db = await getDatabase();
  const id = uuidv4();
  const createdAt = Date.now();
  await db.runAsync(
    `INSERT INTO queued_scans (id, image_uri, created_at, status, item_id) VALUES (?, ?, ?, ?, ?)`,
    id,
    imageUri,
    createdAt,
    'pending',
    itemId,
  );
  return { id, imageUri, createdAt, status: 'pending', itemId };
};

export const getQueuedScans = async (): Promise<QueuedScan[]> => {
  const db = await getDatabase();
  const rows = await db.getAllAsync<QueuedScanRow>('SELECT * FROM queued_scans ORDER BY created_at ASC');
  return rows.map((row) => ({
    id: row.id,
    imageUri: row.image_uri,
    createdAt: row.created_at,
    itemId: row.item_id ?? null,
    status: row.status,
  }));
};

export const markScanProcessing = async (id: string): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync('UPDATE queued_scans SET status = ? WHERE id = ?', 'processing', id);
};

export const removeQueuedScan = async (id: string): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM queued_scans WHERE id = ?', id);
};
