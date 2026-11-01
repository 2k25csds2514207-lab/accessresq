import { BarrierCategory } from './community';

export interface AIClassificationResult {
  detectedCategory: BarrierCategory;
  confidence: number;
  extractedKeywords: string[];
  suggestedSeverity: 'low' | 'moderate' | 'high' | 'impassable';
  isFromApi: boolean;
}

export interface AISummaryResult {
  conciseTitle: string;
  shortSummary: string;
  bulletPoints: string[];
  isFromApi: boolean;
}

export interface AIRouteExplanation {
  summary: string;
  accessibilityHighlights: string[];
  tradeoffs: string;
  isFromApi: boolean;
}

export interface AIHelperRecommendation {
  summary: string;
  reasons: string[];
  equipmentFit: string;
  isFromApi: boolean;
}

