// Main entry point for the review sanitization pipeline
import { pipelineConfig } from './config/index.js';

console.log('Review Sanitization Pipeline');
console.log('Configuration loaded successfully');
console.log(`School: ${pipelineConfig.school}`);
console.log(`Batch size: ${pipelineConfig.batch_size}`);
console.log(`Sanitization version: ${pipelineConfig.sanitization_version}`);

// TODO: Initialize pipeline orchestrator and API server
// This will be implemented in subsequent tasks