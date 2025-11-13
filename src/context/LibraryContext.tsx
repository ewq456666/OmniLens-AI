import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { Collection, LlmAnalysisResult, OmniItem, QueuedScan } from '../types';
import {
  createCollection,
  createItem,
  deleteCollection,
  deleteItem,
  getCollections,
  getItems,
  searchItems,
  updateCollection,
  updateItem,
} from '../storage/database';
import { analyzeImageWithLlm } from '../services/llm';
import { enqueueScan, getQueuedScans, markScanProcessing, removeQueuedScan } from '../storage/offlineQueue';
import { moveImageToLibrary } from '../utils/fileSystem';

interface LibraryContextValue {
  items: OmniItem[];
  collections: Collection[];
  queuedScans: QueuedScan[];
  defaultCollectionId: string | null;
  refresh: () => Promise<void>;
  addCollection: (collection: Omit<Collection, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  editCollection: (id: string, updates: Partial<Collection>) => Promise<void>;
  removeCollection: (id: string) => Promise<void>;
  addScan: (options: { imageUri: string; collectionId?: string | null }) => Promise<OmniItem | null>;
  editItem: (id: string, updates: Partial<OmniItem>) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  runSearch: (query: string, filters?: { tags?: string[]; category?: string; collectionId?: string | null }) => Promise<OmniItem[]>;
}

const LibraryContext = createContext<LibraryContextValue | undefined>(undefined);

export const useLibrary = (): LibraryContextValue => {
  const ctx = useContext(LibraryContext);
  if (!ctx) {
    throw new Error('useLibrary must be used within LibraryProvider');
  }
  return ctx;
};

const DEFAULT_COLLECTION_NAME = 'My Library';

const ensureDefaultCollection = async (): Promise<string> => {
  const collections = await getCollections();
  const existing = collections.find((collection) => collection.name === DEFAULT_COLLECTION_NAME);
  if (existing) {
    return existing.id;
  }
  const created = await createCollection({
    name: DEFAULT_COLLECTION_NAME,
    description: 'Default space for every capture.',
  });
  return created.id;
};

export const LibraryProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [items, setItems] = useState<OmniItem[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [queuedScans, setQueuedScans] = useState<QueuedScan[]>([]);
  const [isBootstrapped, setBootstrapped] = useState(false);
  const [defaultCollectionId, setDefaultCollectionId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const [freshItems, freshCollections, freshQueue] = await Promise.all([
      getItems(),
      getCollections(),
      getQueuedScans(),
    ]);
    setItems(freshItems);
    setCollections(freshCollections);
    setQueuedScans(freshQueue);
    const defaultCollection = freshCollections.find((collection) => collection.name === DEFAULT_COLLECTION_NAME);
    if (defaultCollection) {
      setDefaultCollectionId(defaultCollection.id);
    }
  }, []);

  useEffect(() => {
    (async () => {
      const defaultId = await ensureDefaultCollection();
      setDefaultCollectionId(defaultId);
      await refresh();
      setBootstrapped(true);
    })();
  }, [refresh]);

  useEffect(() => {
    if (!isBootstrapped) {
      return;
    }
    if (queuedScans.length === 0) {
      return;
    }
    queuedScans.forEach(async (scan) => {
      try {
        await markScanProcessing(scan.id);
        setQueuedScans((prev) => prev.map((q) => (q.id === scan.id ? { ...q, status: 'processing' } : q)));
        const processedUri = scan.imageUri;
        const llmResult = await analyzeImageWithLlm(processedUri);
        let updated: OmniItem;
        if (scan.itemId) {
          updated = await updateItem(scan.itemId, {
            title: llmResult.suggested_title ?? 'Captured item',
            ocrText: llmResult.ocr_text ?? '',
            category: llmResult.suggested_category ?? 'Uncategorized',
            tags: llmResult.suggested_tags ?? [],
            identifiedObjects: llmResult.identified_objects ?? [],
            status: 'ready',
            updatedAt: Date.now(),
          });
          setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        } else {
          updated = await createItem({
            title: llmResult.suggested_title ?? 'Captured item',
            notes: '',
            ocrText: llmResult.ocr_text ?? '',
            category: llmResult.suggested_category ?? 'Uncategorized',
            tags: llmResult.suggested_tags ?? [],
            identifiedObjects: llmResult.identified_objects ?? [],
            imageUri: processedUri,
            collectionId: null,
            status: 'ready',
          });
          setItems((prev) => [updated, ...prev]);
        }
        await removeQueuedScan(scan.id);
        setQueuedScans((prev) => prev.filter((q) => q.id !== scan.id));
      } catch (error) {
        console.error('Failed to process queued scan', error);
        Alert.alert('Processing error', 'A queued scan could not be processed. It will remain in your queue.');
      }
    });
  }, [queuedScans, isBootstrapped]);

  const addCollection: LibraryContextValue['addCollection'] = async (collection) => {
    const created = await createCollection(collection);
    setCollections((prev) => [...prev, created]);
  };

  const editCollection: LibraryContextValue['editCollection'] = async (id, updates) => {
    const updated = await updateCollection(id, updates);
    setCollections((prev) => prev.map((col) => (col.id === id ? updated : col)));
  };

  const removeCollection: LibraryContextValue['removeCollection'] = async (id) => {
    if (id === defaultCollectionId) {
      Alert.alert('Protected collection', 'The default collection cannot be deleted.');
      return;
    }
    await deleteCollection(id);
    setCollections((prev) => prev.filter((col) => col.id !== id));
    setItems((prev) => prev.map((item) => (item.collectionId === id ? { ...item, collectionId: null } : item)));
  };

  const addScan: LibraryContextValue['addScan'] = async ({ imageUri, collectionId }) => {
    try {
      const processedUri = await moveImageToLibrary(imageUri);
      const targetCollectionId =
        typeof collectionId === 'undefined' ? defaultCollectionId : collectionId ?? null;
      const placeholder = await createItem({
        title: 'Processing capture…',
        notes: '',
        ocrText: '',
        category: 'Uncategorized',
        tags: [],
        identifiedObjects: [],
        imageUri: processedUri,
        collectionId: targetCollectionId ?? null,
        status: 'processing',
      });
      setItems((prev) => [placeholder, ...prev]);
      try {
        const llmResult: LlmAnalysisResult = await analyzeImageWithLlm(processedUri);
        const updated = await updateItem(placeholder.id, {
          title: llmResult.suggested_title ?? placeholder.title,
          ocrText: llmResult.ocr_text ?? '',
          category: llmResult.suggested_category ?? 'Uncategorized',
          tags: llmResult.suggested_tags ?? [],
          identifiedObjects: llmResult.identified_objects ?? [],
          status: 'ready',
          updatedAt: Date.now(),
        });
        setItems((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        return updated;
      } catch (networkError) {
        console.warn('LLM analysis failed, queuing item for later processing', networkError);
        const queued = await enqueueScan(processedUri, placeholder.id);
        setQueuedScans((prev) => [...prev, queued]);
        const queuedItem = await updateItem(placeholder.id, {
          status: 'queued',
          updatedAt: Date.now(),
        });
        setItems((prev) => prev.map((item) => (item.id === queuedItem.id ? queuedItem : item)));
        return queuedItem;
      }
    } catch (error) {
      console.error('Failed to add scan', error);
      Alert.alert('Capture failed', 'We could not save this capture. Please try again.');
      return null;
    }
  };

  const editItem: LibraryContextValue['editItem'] = async (id, updates) => {
    const updated = await updateItem(id, updates);
    setItems((prev) => prev.map((item) => (item.id === id ? updated : item)));
  };

  const removeItem: LibraryContextValue['removeItem'] = async (id) => {
    await deleteItem(id);
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const runSearch: LibraryContextValue['runSearch'] = async (query, filters) => {
    const results = await searchItems(query, filters);
    return results;
  };

  const value = useMemo(
    () => ({
      items,
      collections,
      queuedScans,
      defaultCollectionId,
      refresh,
      addCollection,
      editCollection,
      removeCollection,
      addScan,
      editItem,
      removeItem,
      runSearch,
    }),
    [items, collections, queuedScans, defaultCollectionId, refresh],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
};
