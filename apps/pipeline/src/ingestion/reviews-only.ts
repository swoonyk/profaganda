import { config } from 'dotenv';
import { connectToMongoDB, runMigrations, closeConnection } from '@profaganda/database';
import type { PipelineConfig } from '@profaganda/shared';
import { RMPDatabaseClient } from './rmp-database-client.js';
import { CUReviewsFetcher } from './cureviews-fetcher.js';
import { SanitizationProcessor } from '../sanitization/processor.js';
import { normalizeReview, isReviewUsable } from './review-utils.js';


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
    mongodbUri: process.env.MONGODB_URI!,
    batchSize: parseInt(process.env.BATCH_SIZE || '5'),
    school: process.env.SCHOOL || 'Cornell University',
    minReviewLength: parseInt(process.env.MIN_REVIEW_LENGTH || '30'),
    maxReviewLength: parseInt(process.env.MAX_REVIEW_LENGTH || '3000'),
    maxRetries: parseInt(process.env.MAX_RETRIES || '2'),
    retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || '1000'),
  };
}


async function ingestReviewsOnly() {
  const startTime = Date.now();
  
  try {
    console.log('Starting reviews-only ingestion...');
    
    const config = loadConfig();
    const db = await connectToMongoDB(config.mongodbUri);
    
    console.log('Setting up database...');
    await runMigrations(db);
    
    const processor = new SanitizationProcessor(config.geminiApiKey, db);
    
    const initialStats = await processor.getProcessingStats();
    console.log(` Initial stats: ${initialStats.professors} professors, ${initialStats.reviews} reviews`);
    
    if (initialStats.professors === 0) {
      console.log(' No professors found in database. Please run professor ingestion first:');
      console.log('   pnpm pipeline:ingest-professors');
      return;
    }
    

    console.log('\n Getting existing professors from database...');
    const professorsCollection = db.collection('professors');
    const existingProfessors = await professorsCollection.find({}).toArray();
    
    console.log(` Found ${existingProfessors.length} professors in database`);
    
    const allReviews: any[] = [];
    

    const rmpProfessors = existingProfessors.filter(p => p.source === 'rmp');
    if (rmpProfessors.length > 0) {
      console.log(`\n Fetching reviews for ${rmpProfessors.length} RateMyProfessor professors...`);
      const rmpClient = new RMPDatabaseClient();
      const maxReviewsPerProfessor = process.env.NODE_ENV === 'production' ? 50 : 20;
      
      for (const professor of rmpProfessors) {
        try {

          const rmpId = professor.internal_code.replace('rmp_', '');
          
          console.log(`   Fetching reviews for ${professor.name} (RMP ID: ${rmpId})`);
          const detailed = await rmpClient.fetchProfessorDetails(rmpId);
          
          if (detailed && detailed.ratings.length > 0) {
            const reviews = rmpClient.convertToRawReviews(professor._id.toString(), detailed.ratings.slice(0, maxReviewsPerProfessor));
            

            const updatedReviews = reviews.map(review => ({
              ...review,
              professorId: professor._id.toString()
            }));
            
            allReviews.push(...updatedReviews);
            console.log(`   Found ${reviews.length} reviews for ${professor.name}`);
          } else {
            console.log(`   No reviews found for ${professor.name}`);
          }
          
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (error) {
          console.error(` Error fetching reviews for ${professor.name}:`, error);
          continue;
        }
      }
    }
    
    const cuReviewsProfessors = existingProfessors.filter(p => p.source === 'cureviews');
    if (cuReviewsProfessors.length > 0) {
      console.log(`\n Fetching reviews for ${cuReviewsProfessors.length} CUReviews professors...`);
      const cuReviewsFetcher = new CUReviewsFetcher();
      const maxCoursesPerSubject = process.env.NODE_ENV === 'production' ? 10 : 3;
      
      const cuReviewsData = await cuReviewsFetcher.fetchProfessorsAndReviews(maxCoursesPerSubject);
      
      for (const professor of cuReviewsProfessors) {
        const matchingReviews = cuReviewsData.reviews.filter(review => {
          const reviewProfessorKey = review.professorId.replace('cureviews_', '');
          const professorKey = `${professor.name}_${professor.department}`;
          return reviewProfessorKey.includes(professor.name) || professorKey.includes(reviewProfessorKey);
        });
        
        const updatedReviews = matchingReviews.map(review => ({
          ...review,
          professorId: professor._id.toString()
        }));
        
        allReviews.push(...updatedReviews);
        console.log(`   Found ${matchingReviews.length} reviews for ${professor.name}`);
      }
    }
    
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
      console.log(`\n Filtered to ${validReviews.length} valid reviews (${usableReviews.length - validReviews.length} excluded by length)`);
    }
    
    if (validReviews.length === 0) {
      console.log(' No valid reviews to process');
      return;
    }
    
    console.log(`\n Starting sanitization with Gemini API (batch size: ${config.batchSize})...`);
    console.log(` Processing ${validReviews.length} reviews...`);
    
    await processor.processBatch(validReviews, [], config.batchSize); 
    
    const finalStats = await processor.getProcessingStats();
    console.log(`\n Final stats: ${finalStats.professors} professors, ${finalStats.reviews} reviews`);
    
    const processingTime = (Date.now() - startTime) / 1000;
    console.log(`\n Reviews ingestion completed successfully in ${processingTime.toFixed(2)}s`);
    console.log(` Added ${finalStats.reviews - initialStats.reviews} new reviews`);
    
    const rmpReviews = validReviews.filter(r => r.source === 'rmp').length;
    const cuReviewsReviews = validReviews.filter(r => r.source === 'cureviews').length;
    console.log(` Reviews by source: RMP: ${rmpReviews}, CUReviews: ${cuReviewsReviews}`);
    
  } catch (error) {
    console.error(' Reviews ingestion failed:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  ingestReviewsOnly();
}
