# Implementation Plan

- [ ] 1. Set up project structure and core interfaces
  - Create directory structure for pipeline components (fetchers, processors, sanitizers, api)
  - Define TypeScript interfaces for all data models and component contracts
  - Set up package.json with required dependencies (express, pg, @google/generative-ai, cheerio, crypto)
  - Configure TypeScript compilation and environment variable handling
  - _Requirements: 1.1, 1.4, 1.5_

- [ ] 2. Implement database schema and connection utilities
  - Create SQL schema file with professors and reviews tables including indexes
  - Implement database connection pool with PostgreSQL using pg library
  - Create database initialization script that creates tables if they don't exist
  - Write database utility functions for connection management and error handling
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

- [ ] 3. Create configuration management system
  - Implement configuration loader that reads environment variables with defaults
  - Create configuration validation to ensure required API keys and database URL are present
  - Set up configuration interface with all pipeline settings (batch size, retry limits, etc.)
  - Write configuration tests to verify environment variable parsing
  - _Requirements: 1.4, 1.5, 3.2, 7.4_

- [ ] 4. Implement RateMyProfessor data fetcher
  - Research and integrate RateMyProfessor API client or scraping library
  - Create RateMyProfessor fetcher class implementing ReviewFetcher interface
  - Implement Cornell-specific professor and review fetching with rate limiting
  - Add error handling and retry logic for network failures
  - Write unit tests for fetcher with mocked API responses
  - _Requirements: 1.1, 1.3, 1.4, 7.3_

- [ ] 5. Implement Cureviews data fetcher
  - Research Cureviews API or scraping options for Cornell data
  - Create Cureviews fetcher class implementing ReviewFetcher interface
  - Implement review fetching with authentication if API key is provided
  - Add fallback scraping method if API is unavailable
  - Write unit tests for Cureviews fetcher with mocked responses
  - _Requirements: 1.2, 1.3, 1.4, 7.3_

- [ ] 6. Create text normalization and cleaning module
  - Implement text normalizer that strips HTML tags using cheerio
  - Add whitespace normalization and control character removal
  - Create regex patterns to detect and replace obvious PII (emails, phones, URLs)
  - Implement length filtering to discard reviews outside 30-3000 character range
  - Write comprehensive unit tests for all normalization edge cases
  - _Requirements: 4.1, 4.2, 4.3, 2.4_

- [ ] 7. Implement deduplication and grouping engine
  - Create SHA256 hash generation for review text + source combination
  - Implement Set-based deduplication algorithm for O(n) performance
  - Create grouping logic to organize reviews by professor source ID
  - Add deterministic ordering to ensure consistent processing across runs
  - Write unit tests for deduplication with known duplicate scenarios
  - _Requirements: 4.4, 4.5, 2.2_

- [ ] 8. Create deterministic professor mapping system
  - Implement professor ID sorting and ranking algorithm for consistent PROF_### assignment
  - Create database upsert logic for professor records with conflict resolution
  - Build professor mapping cache to avoid repeated database queries
  - Add mapping persistence and retrieval from professors table
  - Write unit tests to verify deterministic mapping across multiple runs
  - _Requirements: 2.1, 2.2, 5.5, 8.4_

- [ ] 9. Implement Gemini AI sanitization module
  - Integrate Google Generative AI SDK with API key authentication
  - Create batch processing logic to send configurable number of reviews per request
  - Implement the exact sanitization prompt as specified in requirements
  - Add structured JSON response parsing with error handling for malformed responses
  - Create exponential backoff retry logic (1s, 2s delays) for API failures
  - Write unit tests with mocked Gemini responses and error scenarios
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 2.3, 2.4, 2.5_

- [ ] 10. Create safety checking and validation module
  - Implement regex patterns for detecting remaining PII (names, emails, phones, URLs)
  - Create keyword detection for allegation terms and inappropriate content
  - Build safety flag assignment logic based on detection results
  - Add confidence threshold checking and re-processing triggers
  - Write unit tests for all safety check patterns and edge cases
  - _Requirements: 3.5, 8.1, 8.2, 2.4, 2.5_

- [ ] 11. Implement database insertion and persistence layer
  - Create database insertion functions for professors and reviews tables
  - Implement transaction handling to ensure data consistency
  - Add conflict resolution for duplicate professor codes and review IDs
  - Create metadata storage for sanitization version and timestamps
  - Write database integration tests with test PostgreSQL instance
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 7.2_

- [ ] 12. Build pipeline orchestration and workflow engine
  - Create main pipeline orchestrator that coordinates all processing steps
  - Implement sequential task execution with proper error handling between stages
  - Add progress tracking and logging throughout the pipeline execution
  - Create pipeline state management to handle partial failures and restarts
  - Write integration tests for complete pipeline execution with small dataset
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [ ] 13. Implement REST API server for sanitized data access
  - Create Express.js server with CORS and JSON middleware
  - Implement GET /api/reviews endpoint with mode and count query parameters
  - Implement GET /api/professors endpoint with school filtering and pagination
  - Add health check endpoint for monitoring and deployment verification
  - Create database query optimization for API performance
  - Write API integration tests for all endpoints with test data
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [ ] 14. Create comprehensive error handling and logging system
  - Implement structured logging with different levels (info, warn, error)
  - Create error recovery mechanisms for each pipeline component
  - Add retry logic with exponential backoff for external API calls
  - Implement graceful degradation when components fail
  - Create error reporting and failed item tracking for debugging
  - Write error handling tests for various failure scenarios
  - _Requirements: 7.1, 7.2, 7.3, 3.3_

- [ ] 15. Build reporting and monitoring capabilities
  - Create pipeline execution report generator with processing statistics
  - Implement sanitization quality metrics tracking (success rates, safety flags)
  - Add performance monitoring for processing times and throughput
  - Create artifact generation for failed items and debugging information
  - Write monitoring tests to verify metric collection accuracy
  - _Requirements: 7.1, 7.2, 7.4_

- [ ] 16. Implement acceptance tests and quality validation
  - Create end-to-end test suite that processes sample review data
  - Implement automated PII detection tests using regex patterns
  - Create API response validation tests for proper JSON structure
  - Add deterministic mapping verification tests
  - Implement data quality threshold validation (90% safety_flag = 'ok')
  - Write performance benchmark tests for processing speed requirements
  - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5_

- [ ] 17. Create deployment configuration and documentation
  - Write environment variable documentation and .env.example file
  - Create Docker configuration for containerized deployment
  - Implement database migration scripts for production deployment
  - Add API documentation with example requests and responses
  - Create deployment guide with step-by-step setup instructions
  - _Requirements: 1.4, 1.5, 6.4_

- [ ] 18. Integrate pipeline as Kiro workflow job
  - Create Kiro job configuration file with proper task definitions
  - Implement job parameter handling for school selection and batch configuration
  - Add job artifact generation for reports and logs
  - Create job scheduling and execution monitoring
  - Write Kiro integration tests to verify job execution
  - _Requirements: 7.1, 7.4_