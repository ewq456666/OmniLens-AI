export type ItemStatus = 'processing' | 'ready' | 'failed' | 'queued';

export interface OmniItem {
  id: string;
  imageUri: string;
  createdAt: number;
  updatedAt: number;
  title: string;
  notes: string;
  ocrText: string;
  category: string;
  tags: string[];
  identifiedObjects: string[];
  collectionId: string | null;
  status: ItemStatus;
}

export interface Collection {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
}

export interface QueuedScan {
  id: string;
  imageUri: string;
  createdAt: number;
  itemId: string | null;
  status: 'pending' | 'processing';
}

export interface LlmAnalysisResult {
  ocr_text: string;
  suggested_title: string;
  suggested_category: string;
  suggested_tags: string[];
  identified_objects: string[];
}
