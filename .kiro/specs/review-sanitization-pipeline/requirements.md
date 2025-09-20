# Requirements Document

## Introduction

The review sanitization pipeline is a comprehensive data processing system that fetches professor reviews from multiple sources (RateMyProfessor and Cureviews), sanitizes them to remove all personally identifying information using AI, and provides a clean REST API for the Cornell professor guessing game. The pipeline ensures complete anonymization while preserving review sentiment and usefulness for the game experience.

## Requirements

### Requirement 1

**User Story:** As a game developer, I want to fetch professor reviews from multiple sources, so that I have a comprehensive dataset for the guessing game.

#### Acceptance Criteria

1. WHEN the pipeline runs THEN the system SHALL fetch reviews from RateMyProfessor for Cornell professors
2. WHEN the pipeline runs THEN the system SHALL fetch reviews from Cureviews for Cornell professors
3. WHEN fetching reviews THEN the system SHALL collect review text, professor source ID, rating, and minimal metadata
4. WHEN API keys are provided THEN the system SHALL use authenticated access to review sources
5. WHEN API keys are not provided THEN the system SHALL use unauthenticated scraping methods where available

### Requirement 2

**User Story:** As a privacy-conscious developer, I want all personally identifying information removed from reviews, so that no real professor or student information is exposed.

#### Acceptance Criteria

1. WHEN processing reviews THEN the system SHALL replace all professor names with deterministic placeholders ("###")
2. WHEN sanitizing text THEN the system SHALL remove all names, initials, emails, phone numbers, office locations, and course codes
3. WHEN sanitization is complete THEN the system SHALL ensure no original PII remains in any output field

### Requirement 3

**User Story:** As a system administrator, I want AI-powered sanitization with quality controls, so that the sanitization process is thorough and reliable.

#### Acceptance Criteria

1. WHEN sanitizing reviews THEN the system SHALL use Google Gemini API for intelligent PII removal
2. WHEN calling Gemini THEN the system SHALL process reviews in configurable batches (default 20)
3. WHEN Gemini fails THEN the system SHALL retry up to 2 times with exponential backoff
4. WHEN sanitization completes THEN the system SHALL return confidence scores and safety flags
5. WHEN confidence is below threshold THEN the system SHALL re-process or flag the review

### Requirement 4

**User Story:** As a data engineer, I want normalized and deduplicated review data, so that the dataset is clean and consistent.

#### Acceptance Criteria

1. WHEN processing raw reviews THEN the system SHALL strip HTML tags and normalize whitespace
2. WHEN processing reviews THEN the system SHALL remove embedded URLs, emails, and phone numbers
3. WHEN reviews are too short (< 30 chars) or too long (> 3000 chars) THEN the system SHALL discard them
4. WHEN duplicate reviews are found THEN the system SHALL deduplicate using SHA256 hash comparison
5. WHEN grouping reviews THEN the system SHALL organize them by professor for consistent placeholder mapping

### Requirement 5

**User Story:** As a database administrator, I want structured storage for sanitized reviews, so that the game can efficiently access clean data.

#### Acceptance Criteria

1. WHEN storing data THEN the system SHALL create professors table with deterministic internal codes
2. WHEN storing reviews THEN the system SHALL create reviews table with sanitized content and metadata
3. WHEN inserting data THEN the system SHALL link reviews to professors via foreign key relationships
4. WHEN storing reviews THEN the system SHALL include sanitization version, timestamp, and safety flags
5. WHEN the same professor appears THEN the system SHALL reuse existing professor records

### Requirement 6

**User Story:** As a game developer, I want a read-only REST API to access sanitized reviews, so that the game can fetch random reviews without exposing sensitive data.

#### Acceptance Criteria

1. WHEN requesting reviews THEN the API SHALL provide GET /api/reviews endpoint with mode and count parameters
2. WHEN mode is "guess" or "realorfake" THEN the API SHALL return appropriate review sets
3. WHEN requesting professors THEN the API SHALL provide GET /api/professors endpoint with school filtering
4. WHEN returning data THEN the API SHALL only include sanitized content and placeholder codes
5. WHEN API is called THEN the system SHALL never expose original PII or source URLs

### Requirement 7

**User Story:** As a system operator, I want comprehensive logging and reporting, so that I can monitor pipeline performance and data quality.

#### Acceptance Criteria

1. WHEN pipeline completes THEN the system SHALL generate a report with fetch/sanitize/insert counts
2. WHEN errors occur THEN the system SHALL log failures with sufficient detail for debugging
3. WHEN reviews are flagged THEN the system SHALL create a separate log of flagged items with IDs
4. WHEN pipeline runs THEN the system SHALL track processing time and success rates
5. WHEN sanitization fails THEN the system SHALL continue processing other reviews without stopping

### Requirement 8

**User Story:** As a quality assurance engineer, I want automated acceptance tests, so that I can verify the pipeline works correctly.

#### Acceptance Criteria

1. WHEN running tests THEN at least 90% of processed reviews SHALL have safety_flag = 'ok'
2. WHEN checking sanitized text THEN no capitalized full names or email/phone/URL patterns SHALL remain
3. WHEN testing API THEN GET /api/reviews SHALL return proper JSON with professor codes and sanitized text
4. WHEN testing deterministic mapping THEN running the same input twice SHALL produce identical PROF_### assignments
5. WHEN validating output THEN random samples SHALL pass regex checks for remaining PII