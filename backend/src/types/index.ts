// Core data models and interfaces for the review sanitization pipeline

// Raw review data from external sources
export interface RawReview {
  source: 'ratemyprof' | 'cureviews';
  source_id: string;
  prof_source_id: string;
  text: string;
  rating?: number;
  source_meta?: Record<string, any>;
}

// Normalized review after text cleaning
export interface NormalizedReview extends RawReview {
  normalized_text: string;
  char_length: number;
}

// Reviews grouped by professor
export interface GroupedReviews {
  [prof_source_id: string]: NormalizedReview[];
}

// Review with professor placeholder mapping
export interface AnnotatedReview extends NormalizedReview {
  professor_code: string;
  professor_id: string;
}

// Sanitized review from AI processing
export interface SanitizedReview {
  id: string;
  sanitized_text: string;
  redacted_types: string[];
  sanitization_replacements: Record<string, string>;
  confidence: number;
  safety_flag: 'ok' | 'pii_found' | 'manual_reject';
}

// Professor mapping information
export interface ProfessorMapping {
  [prof_source_id: string]: {
    internal_code: string;
    professor_id: string;
  };
}

// Database record for professors
export interface ProfessorRecord {
  id: string;
  source_prof_id: string;
  school: string;
  dept?: string;
  internal_prof_code: string;
  created_at: Date;
}

// Database record for reviews
export interface ReviewRecord {
  id: string;
  professor_id: string;
  sanitized_text: string;
  rating?: number;
  length: number;
  source: string;
  source_meta?: Record<string, any>;
  sanitization_version: string;
  sanitized_at: Date;
  safety_flag: string;
}

// Safety check result
export interface SafetyResult {
  passed: boolean;
  issues: string[];
  updated_flag: string;
}

// Pipeline configuration
export interface PipelineConfig {
  // Data sources
  rmp_api_key?: string;
  cureviews_api_key?: string;
  
  // AI sanitization
  gemini_api_key: string;
  gemini_model: string;
  batch_size: number;
  
  // Database
  database_url: string;
  
  // Processing options
  school: string;
  sanitization_version: string;
  min_review_length: number;
  max_review_length: number;
  
  // Retry settings
  max_retries: number;
  retry_delay_ms: number;
}

// Fetch options for data sources
export interface FetchOptions {
  limit?: number;
  offset?: number;
  authenticated?: boolean;
}

// Log entry structure
export interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error';
  component: string;
  message: string;
  metadata?: Record<string, any>;
}

// API response types
export interface ReviewsApiResponse {
  reviews: Array<{
    id: string;
    professor_code: string;
    sanitized_text: string;
    rating?: number;
    source: string;
  }>;
}

export interface ProfessorsApiResponse {
  professors: Array<{
    internal_prof_code: string;
    school: string;
  }>;
}

export interface HealthApiResponse {
  status: 'ok' | 'error';
  timestamp: string;
}