import { config } from 'dotenv';
import { connectToMongoDB, runMigrations, closeConnection } from '@profaganda/database';
import type { PipelineConfig } from '@profaganda/shared';
import { RMPDatabaseClient } from './rmp-database-client.js';
import { CUReviewsFetcher } from './cureviews-fetcher.js';
import { SanitizationProcessor } from '../sanitization/processor.js';

// Load environment variables from .env file
config({ path: '../../.env' });

function loadConfig(): PipelineConfig {
  const requiredEnvVars = ['MONGODB_URI'];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  return {
    geminiApiKey: process.env.GEMINI_API_KEY || 'not-needed-for-professors-only',
    mongodbUri: process.env.MONGODB_URI!,
    batchSize: parseInt(process.env.BATCH_SIZE || '5'),
    school: process.env.SCHOOL || 'Cornell University',
    minReviewLength: parseInt(process.env.MIN_REVIEW_LENGTH || '30'),
    maxReviewLength: parseInt(process.env.MAX_REVIEW_LENGTH || '3000'),
    maxRetries: parseInt(process.env.MAX_RETRIES || '2'),
    retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || '1000'),
  };
}

/**
 * Fetch and ingest only professors (no reviews) from both RMP and CUReviews
 */
async function ingestProfessorsOnly() {
  const startTime = Date.now();
  
  try {
    console.log('👨‍🏫 Starting professor-only ingestion...');
    
    const config = loadConfig();
    const db = await connectToMongoDB(config.mongodbUri);
    
    console.log('📊 Setting up database...');
    await runMigrations(db);
    
    const processor = new SanitizationProcessor(config.geminiApiKey, db);
    
    const initialStats = await processor.getProcessingStats();
    console.log(`📈 Initial stats: ${initialStats.professors} professors, ${initialStats.reviews} reviews`);
    
    // Fetch professors from RateMyProfessor
    console.log('\n🔍 Fetching professors from RateMyProfessor (comprehensive database)...');
    const rmpClient = new RMPDatabaseClient();
    const maxProfessors = process.env.NODE_ENV === 'production' ? 100 : 25;
    const rmpData = await rmpClient.fetchCornellData(maxProfessors, 0); // 0 reviews since this is professors-only
    const rmpProfessors = rmpData.professors;
    
    // Fetch professors from CUReviews (without their reviews for now)
    console.log('\n🔍 Fetching professors from CUReviews...');
    const cuReviewsFetcher = new CUReviewsFetcher();
    const maxCoursesPerSubject = process.env.NODE_ENV === 'production' ? 10 : 3;
    const cuReviewsData = await cuReviewsFetcher.fetchProfessorsAndReviews(maxCoursesPerSubject);
    
    // Combine all professors
    const allProfessors = [...rmpProfessors, ...cuReviewsData.professors];
    
    // Remove duplicates
    const uniqueProfessors = removeDuplicateProfessors(allProfessors);
    console.log(`\n🔄 Removed ${allProfessors.length - uniqueProfessors.length} duplicate professors`);
    
    if (uniqueProfessors.length === 0) {
      console.log('⚠️  No professors found to ingest');
      return;
    }
    
    // Create professors in database
    console.log(`\n💾 Creating ${uniqueProfessors.length} professors in database...`);
    await processor.createProfessors(uniqueProfessors);
    
    const finalStats = await processor.getProcessingStats();
    console.log(`\n📊 Final stats: ${finalStats.professors} professors, ${finalStats.reviews} reviews`);
    
    const processingTime = (Date.now() - startTime) / 1000;
    console.log(`\n✅ Professor ingestion completed successfully in ${processingTime.toFixed(2)}s`);
    console.log(`📈 Added ${finalStats.professors - initialStats.professors} new professors`);
    
    // Log summary by source
    const rmpCount = uniqueProfessors.filter(p => p.source === 'rmp').length;
    const cuReviewsCount = uniqueProfessors.filter(p => p.source === 'cureviews').length;
    console.log(`📊 Professors by source: RMP: ${rmpCount}, CUReviews: ${cuReviewsCount}`);
    
  } catch (error) {
    console.error('❌ Professor ingestion failed:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

/**
 * Remove duplicate professors based on name and school
 */
function removeDuplicateProfessors(professors: any[]): any[] {
  const seen = new Set<string>();
  const unique: any[] = [];

  for (const professor of professors) {
    // Create a key based on normalized name and school
    const key = `${professor.name.toLowerCase().trim()}_${professor.school.toLowerCase().trim()}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(professor);
    }
  }

  return unique;
}

// Run the ingestion if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestProfessorsOnly();
}
