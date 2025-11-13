import * as FileSystem from 'expo-file-system/legacy';
import { LlmAnalysisResult } from '../types';

const API_URL = process.env.EXPO_PUBLIC_LLM_ENDPOINT ?? 'https://example.com/analyze';

export const analyzeImageWithLlm = async (imageUri: string): Promise<LlmAnalysisResult> => {
  try {
    const base64 = await FileSystem.readAsStringAsync(imageUri, { encoding: FileSystem.EncodingType.Base64 });
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_data: base64 }),
    });

    if (!response.ok) {
      throw new Error('LLM request failed');
    }

    const data = (await response.json()) as LlmAnalysisResult;
    return {
      ocr_text: data.ocr_text ?? '',
      suggested_title: data.suggested_title ?? 'Captured item',
      suggested_category: data.suggested_category ?? 'Uncategorized',
      suggested_tags: data.suggested_tags ?? [],
      identified_objects: data.identified_objects ?? [],
    };
  } catch (error) {
    console.error('LLM analysis error', error);
    return {
      ocr_text: '',
      suggested_title: 'Captured item',
      suggested_category: 'Uncategorized',
      suggested_tags: [],
      identified_objects: [],
    };
  }
};
