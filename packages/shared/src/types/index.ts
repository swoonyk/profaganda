// Database entities (MongoDB documents)
export interface Professor {
  _id?: string;
  internal_code: string;
  source: 'rmp' | 'cureviews';
  created_at: Date;
}

export interface Review {
  _id?: string;
  professor_id: string;
  sanitized_text: string;
  source: 'rmp' | 'cureviews';
  rating?: number;
  sanitized_at: Date;
}

// Raw data structures for ingestion
export interface RawReview {
  id: string;
  professorId: string;
  text: string;
  rating?: number;
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

// Gemini API structures
export interface GeminiSanitizationRequest {
  text: string;
}

export interface GeminiSanitizationResponse {
  sanitized_text: string;
  was_redacted: boolean;
}

export interface SanitizationResult {
  sanitized_text: string;
  was_redacted: boolean;
  error?: string;
}

// Pipeline configuration
export interface PipelineConfig {
  geminiApiKey: string;
  mongodbUri: string;
  batchSize: number;
  school: string;
  minReviewLength: number;
  maxReviewLength: number;
  maxRetries: number;
  retryDelayMs: number;
}

// API response types
export interface RandomReviewsResponse {
  reviews: Review[];
}

export interface ProfessorReviewsResponse {
  reviews: Review[];
  professor: Professor;
}