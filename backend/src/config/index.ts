// Configuration management with environment variable handling
import { readFileSync } from 'fs';
import { join } from 'path';
import { PipelineConfig } from '../types/index.js';

// Load environment variables from .env file if it exists
function loadEnvFile(): void {
  try {
    const envPath = join(process.cwd(), '.env');
    const envContent = readFileSync(envPath, 'utf8');
    
    envContent.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          const value = valueParts.join('=');
          process.env[key.trim()] = value.trim();
        }
      }
    });
  } catch (error) {
    // .env file doesn't exist or can't be read, continue with system env vars
  }
}

// Initialize environment variables
loadEnvFile();

// Validate required environment variables
function validateRequiredEnvVars(): void {
  const required = ['GEMINI_API_KEY', 'DATABASE_URL'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
}

// Create pipeline configuration from environment variables
export function createPipelineConfig(): PipelineConfig {
  validateRequiredEnvVars();
  
  return {
    // Data sources (optional)
    rmp_api_key: process.env.RMP_API_KEY,
    cureviews_api_key: process.env.CUREVIEWS_API_KEY,
    
    // AI sanitization (required)
    gemini_api_key: process.env.GEMINI_API_KEY!,
    gemini_model: process.env.GEMINI_MODEL || 'gemini-pro',
    batch_size: parseInt(process.env.BATCH_SIZE || '20', 10),
    
    // Database (required)
    database_url: process.env.DATABASE_URL!,
    
    // Processing options
    school: process.env.SCHOOL || 'Cornell',
    sanitization_version: process.env.SANITIZATION_VERSION || '1.0.0',
    min_review_length: parseInt(process.env.MIN_REVIEW_LENGTH || '30', 10),
    max_review_length: parseInt(process.env.MAX_REVIEW_LENGTH || '3000', 10),
    
    // Retry settings
    max_retries: parseInt(process.env.MAX_RETRIES || '2', 10),
    retry_delay_ms: parseInt(process.env.RETRY_DELAY_MS || '1000', 10)
  };
}

// Export default configuration instance
export const pipelineConfig = createPipelineConfig();