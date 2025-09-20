import { config } from 'dotenv';
import { connectToMongoDB, runMigrations, closeConnection } from '@profaganda/database';
import type { PipelineConfig } from '@profaganda/shared';
import { RMPFetcher } from './rmp-fetcher.js';
import { CUReviewsFetcher } from './cureviews-fetcher.js';
import { SanitizationProcessor } from '../sanitization/processor.js';
import { normalizeReview, isReviewUsable } from './review-utils.js';

// Load environment variables from .env file
config({ path: '../../../.env' });

function loadConfig(): PipelineConfig {
  const requiredEnvVars = ['GEMINI_API_KEY', 'MONGODB_URI'];
  
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }

  return {
    geminiApiKey: process.env.GEMINI_API_KEY!,
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
 * Fetch and ingest reviews for existing professors in the database
 */
async function ingestReviewsOnly() {
  const startTime = Date.now();
  
  try {
    console.log('📝 Starting reviews-only ingestion...');
    
    const config = loadConfig();
    const db = await connectToMongoDB(config.mongodbUri);
    
    console.log('📊 Setting up database...');
    await runMigrations(db);
    
    const processor = new SanitizationProcessor(config.geminiApiKey, db);
    
    const initialStats = await processor.getProcessingStats();
    console.log(`📈 Initial stats: ${initialStats.professors} professors, ${initialStats.reviews} reviews`);
    
    if (initialStats.professors === 0) {
      console.log('❌ No professors found in database. Please run professor ingestion first:');
      console.log('   pnpm pipeline:ingest-professors');
      return;
    }
    
    // Get existing professors from database
    console.log('\n👨‍🏫 Getting existing professors from database...');
    const professorsCollection = db.collection('professors');
    const existingProfessors = await professorsCollection.find({}).toArray();
    
    console.log(`📊 Found ${existingProfessors.length} professors in database`);
    
    const allReviews: any[] = [];
    
    // Fetch reviews for RMP professors
    const rmpProfessors = existingProfessors.filter(p => p.source === 'rmp');
    if (rmpProfessors.length > 0) {
      console.log(`\n🔍 Fetching reviews for ${rmpProfessors.length} RateMyProfessor professors...`);
      const rmpFetcher = new RMPFetcher();
      const maxReviewsPerProfessor = process.env.NODE_ENV === 'production' ? 20 : 10;
      
      for (const professor of rmpProfessors) {
        try {
          const professorData = {
            id: professor.internal_code,
            name: professor.name,
            school: professor.school,
            department: professor.department,
            source: professor.source as 'rmp',
            metadata: { rmpId: professor.internal_code.split('_')[1] } // Extract RMP ID from internal code
          };
          
          const reviews = await rmpFetcher.fetchReviewsForProfessor(professorData, maxReviewsPerProfessor);
          
          // Update reviews to reference the correct professor ID
          const updatedReviews = reviews.map(review => ({
            ...review,
            professorId: professor._id.toString()
          }));
          
          allReviews.push(...updatedReviews);
          console.log(`  ✅ Found ${reviews.length} reviews for ${professor.name}`);
          
          // Add delay to be respectful
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(`❌ Error fetching reviews for ${professor.name}:`, error);
          continue;
        }
      }
    }
    
    // Fetch reviews for CUReviews professors
    const cuReviewsProfessors = existingProfessors.filter(p => p.source === 'cureviews');
    if (cuReviewsProfessors.length > 0) {
      console.log(`\n🔍 Fetching reviews for ${cuReviewsProfessors.length} CUReviews professors...`);
      const cuReviewsFetcher = new CUReviewsFetcher();
      const maxCoursesPerSubject = process.env.NODE_ENV === 'production' ? 10 : 3;
      
      // Fetch all CUReviews data and match to existing professors
      const cuReviewsData = await cuReviewsFetcher.fetchProfessorsAndReviews(maxCoursesPerSubject);
      
      for (const professor of cuReviewsProfessors) {
        // Find matching reviews for this professor
        const matchingReviews = cuReviewsData.reviews.filter(review => {
          const reviewProfessorKey = review.professorId.replace('cureviews_', '');
          const professorKey = `${professor.name}_${professor.department}`;
          return reviewProfessorKey.includes(professor.name) || professorKey.includes(reviewProfessorKey);
        });
        
        // Update reviews to reference the correct professor ID
        const updatedReviews = matchingReviews.map(review => ({
          ...review,
          professorId: professor._id.toString()
        }));
        
        allReviews.push(...updatedReviews);
        console.log(`  ✅ Found ${matchingReviews.length} reviews for ${professor.name}`);
      }
    }
    
    // Filter and normalize reviews
    const usableReviews = allReviews
      .filter(review => isReviewUsable(review.text))
      .map(review => ({
        ...review,
        text: normalizeReview(review.text)
      }));
    
    const validReviews = usableReviews.filter(review => 
      review.text.length >= config.minReviewLength && 
      review.text.length <= config.maxReviewLength
    );
    
    if (validReviews.length !== usableReviews.length) {
      console.log(`\n📏 Filtered to ${validReviews.length} valid reviews (${usableReviews.length - validReviews.length} excluded by length)`);
    }
    
    if (validReviews.length === 0) {
      console.log('⚠️  No valid reviews to process');
      return;
    }
    
    // Process reviews through sanitization
    console.log(`\n🤖 Starting sanitization with Gemini API (batch size: ${config.batchSize})...`);
    console.log(`📝 Processing ${validReviews.length} reviews...`);
    
    await processor.processBatch(validReviews, [], config.batchSize); // Empty professors array since they already exist
    
    const finalStats = await processor.getProcessingStats();
    console.log(`\n📊 Final stats: ${finalStats.professors} professors, ${finalStats.reviews} reviews`);
    
    const processingTime = (Date.now() - startTime) / 1000;
    console.log(`\n✅ Reviews ingestion completed successfully in ${processingTime.toFixed(2)}s`);
    console.log(`📈 Added ${finalStats.reviews - initialStats.reviews} new reviews`);
    
    // Log summary by source
    const rmpReviews = validReviews.filter(r => r.source === 'rmp').length;
    const cuReviewsReviews = validReviews.filter(r => r.source === 'cureviews').length;
    console.log(`📊 Reviews by source: RMP: ${rmpReviews}, CUReviews: ${cuReviewsReviews}`);
    
  } catch (error) {
    console.error('❌ Reviews ingestion failed:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

// Run the ingestion if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  ingestReviewsOnly();
}
