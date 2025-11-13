import * as SQLite from 'expo-sqlite';
import { Collection, OmniItem } from '../types';
import { v4 as uuidv4 } from 'uuid';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const getDatabase = async () => {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync('omnilens.db');
      await db.execAsync('PRAGMA journal_mode = WAL;');
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS collections (
          id TEXT PRIMARY KEY NOT NULL,
          name TEXT NOT NULL,
          description TEXT,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );
      `);
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS items (
          id TEXT PRIMARY KEY NOT NULL,
          image_uri TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL,
          title TEXT,
          notes TEXT,
          ocr_text TEXT,
          category TEXT,
          tags TEXT,
          identified_objects TEXT,
          collection_id TEXT,
          status TEXT NOT NULL,
          FOREIGN KEY(collection_id) REFERENCES collections(id)
        );
      `);
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
    })();
  }
  return dbPromise;
};

const deserializeItem = (row: any): OmniItem => ({
  id: row.id,
  imageUri: row.image_uri,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  title: row.title ?? '',
  notes: row.notes ?? '',
  ocrText: row.ocr_text ?? '',
  category: row.category ?? 'Uncategorized',
  tags: row.tags ? JSON.parse(row.tags) : [],
  identifiedObjects: row.identified_objects ? JSON.parse(row.identified_objects) : [],
  collectionId: row.collection_id ?? null,
  status: row.status,
});

const deserializeCollection = (row: any): Collection => ({
  id: row.id,
  name: row.name,
  description: row.description ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

export const getItems = async (): Promise<OmniItem[]> => {
  const db = await getDatabase();
  const rows = await db.getAllAsync('SELECT * FROM items ORDER BY created_at DESC');
  return rows.map(deserializeItem);
};

export const searchItems = async (
  query: string,
  filters?: { tags?: string[]; category?: string; collectionId?: string | null },
): Promise<OmniItem[]> => {
  const db = await getDatabase();
  const clauses: string[] = [];
  const params: any[] = [];

  if (query) {
    clauses.push('(title LIKE ? OR notes LIKE ? OR ocr_text LIKE ?)');
    const like = `%${query}%`;
    params.push(like, like, like);
  }
  if (filters?.category) {
    clauses.push('category = ?');
    params.push(filters.category);
  }
  if (filters?.collectionId) {
    clauses.push('collection_id = ?');
    params.push(filters.collectionId);
  }
  if (filters?.tags && filters.tags.length > 0) {
    filters.tags.forEach((tag) => {
      clauses.push('tags LIKE ?');
      params.push(`%${tag}%`);
    });
  }

  const where = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const rows = await db.getAllAsync(`SELECT * FROM items ${where} ORDER BY created_at DESC`, params);
  return rows.map(deserializeItem);
};

export const createItem = async (
  item: Omit<OmniItem, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<OmniItem> => {
  const db = await getDatabase();
  const id = uuidv4();
  const timestamp = Date.now();
  await db.runAsync(
    `INSERT INTO items (id, image_uri, created_at, updated_at, title, notes, ocr_text, category, tags, identified_objects, collection_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    id,
    item.imageUri,
    timestamp,
    timestamp,
    item.title,
    item.notes,
    item.ocrText,
    item.category,
    JSON.stringify(item.tags ?? []),
    JSON.stringify(item.identifiedObjects ?? []),
    item.collectionId,
    item.status,
  );
  return { ...item, id, createdAt: timestamp, updatedAt: timestamp };
};

export const updateItem = async (id: string, updates: Partial<OmniItem>): Promise<OmniItem> => {
  const db = await getDatabase();
  const existing = await db.getFirstAsync('SELECT * FROM items WHERE id = ?', id);
  if (!existing) {
    throw new Error('Item not found');
  }
  const merged = {
    ...deserializeItem(existing),
    ...updates,
    updatedAt: updates.updatedAt ?? Date.now(),
  };
  await db.runAsync(
    `UPDATE items SET image_uri = ?, updated_at = ?, title = ?, notes = ?, ocr_text = ?, category = ?, tags = ?, identified_objects = ?, collection_id = ?, status = ? WHERE id = ?`,
    merged.imageUri,
    merged.updatedAt,
    merged.title,
    merged.notes,
    merged.ocrText,
    merged.category,
    JSON.stringify(merged.tags ?? []),
    JSON.stringify(merged.identifiedObjects ?? []),
    merged.collectionId,
    merged.status,
    id,
  );
  return merged;
};

export const deleteItem = async (id: string): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM items WHERE id = ?', id);
};

export const getCollections = async (): Promise<Collection[]> => {
  const db = await getDatabase();
  const rows = await db.getAllAsync('SELECT * FROM collections ORDER BY created_at ASC');
  return rows.map(deserializeCollection);
};

export const createCollection = async (
  collection: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Collection> => {
  const db = await getDatabase();
  const id = uuidv4();
  const timestamp = Date.now();
  await db.runAsync(
    `INSERT INTO collections (id, name, description, created_at, updated_at) VALUES (?, ?, ?, ?, ?)`,
    id,
    collection.name,
    collection.description ?? null,
    timestamp,
    timestamp,
  );
  return { ...collection, id, createdAt: timestamp, updatedAt: timestamp };
};

export const updateCollection = async (
  id: string,
  updates: Partial<Collection>,
): Promise<Collection> => {
  const db = await getDatabase();
  const existing = await db.getFirstAsync('SELECT * FROM collections WHERE id = ?', id);
  if (!existing) {
    throw new Error('Collection not found');
  }
  const merged = {
    ...deserializeCollection(existing),
    ...updates,
    updatedAt: updates.updatedAt ?? Date.now(),
  };
  await db.runAsync(
    `UPDATE collections SET name = ?, description = ?, updated_at = ? WHERE id = ?`,
    merged.name,
    merged.description ?? null,
    merged.updatedAt,
    id,
  );
  return merged;
};

export const deleteCollection = async (id: string): Promise<void> => {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM collections WHERE id = ?', id);
};
