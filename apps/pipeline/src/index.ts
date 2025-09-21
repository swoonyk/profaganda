import { config } from 'dotenv';
import { connectToMongoDB, runMigrations, closeConnection } from '@profaganda/database';
import type { PipelineConfig } from '@profaganda/shared';
import { fetchRealReviews, fetchConfigs } from './ingestion/real-data.js';
import { SanitizationProcessor } from './sanitization/processor.js';
import { generateAIReviews } from './generation/ai-reviews.js';

config({ path: '../../.env' });

function loadConfig(): PipelineConfig {
  const requiredEnvVars = ['GEMINI_API_KEY', 'MONGODB_URI'];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  return {
    geminiApiKey: process.env.GEMINI_API_KEY!,
    mongodbUri: ((): string => {
      let uri = process.env.MONGODB_URI!;
      uri = uri.trim();
      if ((uri.startsWith('"') && uri.endsWith('"')) || (uri.startsWith("'") && uri.endsWith("'"))) {
        uri = uri.slice(1, -1);
      }
      return uri;
    })(),
    batchSize: parseInt(process.env.BATCH_SIZE || '5'),
    school: process.env.SCHOOL || 'Cornell University',
    minReviewLength: parseInt(process.env.MIN_REVIEW_LENGTH || '30'),
    maxReviewLength: parseInt(process.env.MAX_REVIEW_LENGTH || '3000'),
    maxRetries: parseInt(process.env.MAX_RETRIES || '2'),
    retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || '1000'),
  };
}

async function main() {
  const startTime = Date.now();
  
  try {
    console.log(' Starting review ingestion and sanitization pipeline...');
    
    const config = loadConfig();
    const db = await connectToMongoDB(config.mongodbUri);
    
    console.log(' Setting up database...');
    await runMigrations(db);
    
    const processor = new SanitizationProcessor(config.geminiApiKey, db);
    
    const initialStats = await processor.getProcessingStats();
    console.log(` Initial stats: ${initialStats.professors} professors, ${initialStats.reviews} reviews`);
    
    console.log(' Fetching reviews from real sources...');
    const fetchConfig = process.env.NODE_ENV === 'production' ? 'production' : 'development';
    const { reviews, professors } = await fetchRealReviews(fetchConfigs[fetchConfig]);
    console.log(` Fetched ${reviews.length} reviews from ${professors.length} professors`);
    
    const validReviews = reviews.filter(review => 
      review.text.length >= config.minReviewLength && 
      review.text.length <= config.maxReviewLength
    );
    
    if (validReviews.length !== reviews.length) {
      console.log(` Filtered to ${validReviews.length} valid reviews (${reviews.length - validReviews.length} excluded by length)`);
    }
    
    if (validReviews.length === 0) {
      console.log(' No valid reviews to process');
      return;
    }
    
    console.log(` Starting sanitization with Gemini API (batch size: ${config.batchSize})...`);
    await processor.processBatch(validReviews, professors, config.batchSize);
    
    const finalStats = await processor.getProcessingStats();
    console.log(` Final stats: ${finalStats.professors} professors, ${finalStats.reviews} reviews`);
    
    const processingTime = (Date.now() - startTime) / 1000;
    console.log(` Pipeline completed successfully in ${processingTime.toFixed(2)}s`);
    console.log(` Processed ${finalStats.reviews - initialStats.reviews} new reviews`);
    
  } catch (error) {
    console.error(' Pipeline failed:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

const command = process.argv[2];

if (command === 'ingest') {
  main();
} else if (command === 'stats') {
  statsCommand();
} else if (command === 'generate-ai') {
  generateAICommand();
} else if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('Available commands:');
  console.log('  pnpm pipeline:ingest     - Run ingestion and sanitization');
  console.log('  pnpm pipeline:stats      - Show database statistics');
  console.log('  pnpm pipeline:generate   - Generate AI reviews for professors');
}

async function statsCommand() {
  try {
    const config = loadConfig();
    const db = await connectToMongoDB(config.mongodbUri);
    const processor = new SanitizationProcessor(config.geminiApiKey, db);
    
    const stats = await processor.getProcessingStats();
    console.log(' Database Statistics:');
    console.log(`   Professors: ${stats.professors}`);
    console.log(`   Reviews: ${stats.reviews}`);
    
  } catch (error) {
    console.error('Failed to get stats:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

async function generateAICommand() {
  try {
    console.log('Starting AI review generation...');
    const config = loadConfig();
    await generateAIReviews(config);
    
  } catch (error) {
    console.error('Failed to generate AI reviews:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}