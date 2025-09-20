export interface Professor {
  id: string;
  name: string;
  school: string;
  department?: string;
  sourceId: string;
  source: 'rmp' | 'cureviews';
  createdAt: Date;
  updatedAt: Date;
}

export interface Review {
  id: string;
  professorId: string;
  originalText: string;
  sanitizedText: string;
  source: 'rmp' | 'cureviews';
  sourceReviewId: string;
  safetyFlag: 'ok' | 'warning' | 'blocked';
  confidence: number;
  sanitizationVersion: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ReviewFetchResult {
  reviews: RawReview[];
  professors: RawProfessor[];
}

export interface RawReview {
  id: string;
  professorId: string;
  text: string;
  source: 'rmp' | 'cureviews';
  metadata?: Record<string, any>;
}

export interface RawProfessor {
  id: string;
  name: string;
  school: string;
  department?: string;
  source: 'rmp' | 'cureviews';
  metadata?: Record<string, any>;
}

export interface SanitizationResult {
  sanitizedText: string;
  safetyFlag: 'ok' | 'warning' | 'blocked';
  confidence: number;
  reasoning?: string;
}

export interface PipelineConfig {
  geminiApiKey: string;
  databaseUrl: string;
  batchSize: number;
  school: string;
  sanitizationVersion: string;
  minReviewLength: number;
  maxReviewLength: number;
  maxRetries: number;
  retryDelayMs: number;
}