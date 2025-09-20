import { createPool } from '@profaganda/database';
import type { PipelineConfig } from '@profaganda/shared';

function loadConfig(): PipelineConfig {
  const requiredEnvVars = ['GEMINI_API_KEY', 'DATABASE_URL'];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  return {
    geminiApiKey: process.env.GEMINI_API_KEY!,
    databaseUrl: process.env.DATABASE_URL!,
    batchSize: parseInt(process.env.BATCH_SIZE || '20'),
    school: process.env.SCHOOL || 'Cornell',
    sanitizationVersion: process.env.SANITIZATION_VERSION || '1.0.0',
    minReviewLength: parseInt(process.env.MIN_REVIEW_LENGTH || '30'),
    maxReviewLength: parseInt(process.env.MAX_REVIEW_LENGTH || '3000'),
    maxRetries: parseInt(process.env.MAX_RETRIES || '2'),
    retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || '1000'),
  };
}

async function main() {
  try {
    console.log('Starting review sanitization pipeline...');
    
    const config = loadConfig();
    createPool(config.databaseUrl);
    
    console.log(`Pipeline configured for ${config.school}`);
    console.log('Pipeline setup complete - ready for implementation');
    
  } catch (error) {
    console.error('Pipeline failed:', error);
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}