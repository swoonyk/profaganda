export interface Professor {
  _id?: string;
  internal_code: string;
  name: string;
  school: string;
  department?: string;
  source: 'rmp' | 'cureviews';
  average_satisfaction?: number;
  total_reviews?: number;
  created_at: Date;
}

export interface Review {
  _id?: string;
  professor_id: string;
  sanitized_text: string;
  source: 'rmp' | 'cureviews' | 'ai_generated';
  rating?: number;
  sanitized_at: Date;
  is_ai_generated?: boolean;
}

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

export interface ProfessorCharacteristics {
  name: string;
  department: string;
  teaching_style?: string;
  difficulty_level?: string;
  personality_traits?: string[];
  course_examples?: string[];
}

export interface GenerateReviewRequest {
  professor: ProfessorCharacteristics;
  review_type: 'positive' | 'negative' | 'mixed';
  target_rating: number;
}

export interface GenerateReviewResponse {
  review_text: string;
  rating: number;
  sentiment: 'positive' | 'negative' | 'mixed';
}

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

export interface RandomReviewsResponse {
  reviews: Review[];
}

export interface ProfessorReviewsResponse {
  reviews: Review[];
  professor: Professor;
}

export interface GameMode1Response {
  review: Review;
  professorOptions: Professor[];
  correctProfessorId: string;
}

export interface GameMode2Response {
  professor: Professor;
  review: Review;
  isRealReview: boolean;
}