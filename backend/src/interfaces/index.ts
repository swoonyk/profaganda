// Component interfaces for the review sanitization pipeline

import {
  RawReview,
  NormalizedReview,
  GroupedReviews,
  AnnotatedReview,
  SanitizedReview,
  ProfessorMapping,
  SafetyResult,
  FetchOptions
} from '../types';

// Data fetcher interface for external sources
export interface ReviewFetcher {
  fetchReviews(school: string, options?: FetchOptions): Promise<RawReview[]>;
}

// Text normalizer interface
export interface TextNormalizer {
  normalize(review: RawReview): NormalizedReview | null;
}

// Deduplication engine interface
export interface Deduplicator {
  deduplicate(reviews: NormalizedReview[]): GroupedReviews;
}

// Professor mapper interface
export interface ProfessorMapper {
  mapProfessors(groupedReviews: GroupedReviews): Promise<ProfessorMapping>;
}

// AI sanitizer interface
export interface GeminiSanitizer {
  sanitizeBatch(reviews: AnnotatedReview[]): Promise<SanitizedReview[]>;
}

// Safety checker interface
export interface SafetyChecker {
  checkSafety(review: SanitizedReview): SafetyResult;
}

// Database operations interface
export interface DatabaseOperations {
  insertProfessors(professors: ProfessorMapping): Promise<void>;
  insertReviews(reviews: SanitizedReview[], professorMapping: ProfessorMapping): Promise<void>;
  getRandomReviews(mode: string, count: number): Promise<any[]>;
  getProfessors(school: string, limit: number): Promise<any[]>;
}

// Pipeline orchestrator interface
export interface PipelineOrchestrator {
  run(school: string): Promise<void>;
}