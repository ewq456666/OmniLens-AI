import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { Collection, LlmAnalysisResult, OmniItem, QueuedScan } from '../types';
import { mockCollections, mockItems, mockQueuedScans } from '../data/mockData';
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
const DESIGN_MODE_ENABLED = (process.env.EXPO_PUBLIC_USE_MOCK_DATA ?? 'true') === 'true';

const getDefaultCollectionId = (collectionList: Collection[]): string | null => {
  const defaultCollection = collectionList.find((collection) => collection.name === DEFAULT_COLLECTION_NAME);
  return defaultCollection?.id ?? collectionList[0]?.id ?? null;
};

type SuggestionPreset = {
  title: string;
  summary: string;
  ocr: string;
  category: string;
  tags: string[];
  objects: string[];
};

const SUGGESTION_PRESETS: SuggestionPreset[] = [
  {
    title: 'Storyboard sprint notes',
    summary: 'Call out timing tweaks for onboarding hero moment.',
    ocr: 'Frame 02: fade to copy, emphasize device silhouette.',
    category: 'Research',
    tags: ['ux', 'storyboard'],
    objects: ['whiteboard', 'marker'],
  },
  {
    title: 'Field kit packing list',
    summary: 'Checklist for botanical scouting trip to Marin.',
    ocr: 'Macro lens, silica packets, color reference card.',
    category: 'Checklist',
    tags: ['outdoor', 'prep'],
    objects: ['camera', 'bag'],
  },
  {
    title: 'Retail journey sketch',
    summary: 'Flow showing scent discovery wall with QR cues.',
    ocr: 'Step 3: prompt for profile + save to cloud locker.',
    category: 'Concept Art',
    tags: ['journey', 'ar'],
    objects: ['sketch', 'sticky note'],
  },
];

const wait = (ms = 120) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

const MockLibraryProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [items, setItems] = useState<OmniItem[]>(mockItems);
  const [collections, setCollections] = useState<Collection[]>(mockCollections);
  const [queuedScans, setQueuedScans] = useState<QueuedScan[]>(mockQueuedScans);

  const defaultCollectionId = useMemo(() => getDefaultCollectionId(collections), [collections]);

  const refresh = useCallback(async () => {
    await wait();
    setItems((prev) => [...prev].sort((a, b) => b.createdAt - a.createdAt));
  }, []);

  const addCollection = useCallback<LibraryContextValue['addCollection']>(async (collection) => {
    const timestamp = Date.now();
    const created: Collection = {
      ...collection,
      id: `mock-col-${timestamp}`,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    setCollections((prev) => [...prev, created]);
    await wait(80);
  }, []);

  const editCollection = useCallback<LibraryContextValue['editCollection']>(async (id, updates) => {
    setCollections((prev) =>
      prev.map((col) => (col.id === id ? { ...col, ...updates, updatedAt: Date.now() } : col)),
    );
    await wait(60);
  }, []);

  const removeCollection = useCallback<LibraryContextValue['removeCollection']>(
    async (id) => {
      if (id === defaultCollectionId) {
        Alert.alert('Protected collection', 'The default collection cannot be deleted during design mode.');
        return;
      }
      setCollections((prev) => prev.filter((col) => col.id !== id));
      setItems((prev) => prev.map((item) => (item.collectionId === id ? { ...item, collectionId: null } : item)));
      await wait(60);
    },
    [defaultCollectionId],
  );

  const addScan = useCallback<LibraryContextValue['addScan']>(
    async ({ imageUri, collectionId }) => {
      const timestamp = Date.now();
      const targetCollection =
        typeof collectionId === 'undefined' ? defaultCollectionId : collectionId ?? null;
      const placeholder: OmniItem = {
        id: `mock-item-${timestamp}`,
        imageUri,
        createdAt: timestamp,
        updatedAt: timestamp,
        title: 'Processing capture',
        notes: '',
        ocrText: '',
        category: 'Unsorted',
        tags: [],
        identifiedObjects: [],
        collectionId: targetCollection,
        status: 'processing',
      };

      const queuedRecord: QueuedScan = {
        id: `mock-scan-${timestamp}`,
        imageUri,
        createdAt: timestamp,
        status: 'pending',
        itemId: placeholder.id,
      };

      setItems((prev) => [placeholder, ...prev]);
      setQueuedScans((prev) => [...prev, queuedRecord]);

      setTimeout(() => {
        const preset = SUGGESTION_PRESETS[Math.floor(Math.random() * SUGGESTION_PRESETS.length)];
        setItems((prev) =>
          prev.map((item) =>
            item.id === placeholder.id
              ? {
                  ...item,
                  title: preset.title,
                  notes: preset.summary,
                  ocrText: preset.ocr,
                  category: preset.category,
                  tags: preset.tags,
                  identifiedObjects: preset.objects,
                  status: 'ready',
                  updatedAt: Date.now(),
                }
              : item,
          ),
        );
        setQueuedScans((prev) => prev.filter((scan) => scan.id !== queuedRecord.id));
      }, 1200);

      await wait(40);
      return placeholder;
    },
    [defaultCollectionId],
  );

  const editItem = useCallback<LibraryContextValue['editItem']>(async (id, updates) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id
          ? {
              ...item,
              ...updates,
              updatedAt: Date.now(),
            }
          : item,
      ),
    );
    await wait(40);
  }, []);

  const removeItem = useCallback<LibraryContextValue['removeItem']>(async (id) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    await wait(30);
  }, []);

  const runSearch = useCallback<LibraryContextValue['runSearch']>(
    async (query, filters) => {
      await wait(60);
      const trimmed = query.trim().toLowerCase();
      return items.filter((item) => {
        if (trimmed) {
          const haystack = `${item.title} ${item.notes} ${item.ocrText}`.toLowerCase();
          if (!haystack.includes(trimmed)) {
            return false;
          }
        }
        if (filters?.category && item.category !== filters.category) {
          return false;
        }
        if (filters?.collectionId && item.collectionId !== filters.collectionId) {
          return false;
        }
        if (filters?.tags && filters.tags.length > 0) {
          const lowerTags = filters.tags.map((tag) => tag.toLowerCase());
          const searchableTags = [item.category, ...item.tags].map((tag) => tag.toLowerCase());
          const hasAllTags = lowerTags.every((tag) => searchableTags.some((value) => value.includes(tag)));
          if (!hasAllTags) {
            return false;
          }
        }
        return true;
      });
    },
    [items],
  );

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
    [
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
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
};

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
  if (DESIGN_MODE_ENABLED) {
    return <MockLibraryProvider>{children}</MockLibraryProvider>;
  }

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
