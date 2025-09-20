import type { RawReview, RawProfessor } from '@profaganda/shared';
import { RMPFetcher } from './rmp-fetcher.js';
import { CUReviewsFetcher } from './cureviews-fetcher.js';
import { normalizeReview, isReviewUsable } from './review-utils.js';

interface FetchConfig {
  schoolName?: string;
  maxProfessorsPerSource?: number;
  maxReviewsPerProfessor?: number;
  enableRMP?: boolean;
  enableCUReviews?: boolean;
}

/**
 * Fetch real professor and review data from RateMyProfessor and CUReviews
 */
export async function fetchRealReviews(config: FetchConfig = {}): Promise<{ reviews: RawReview[], professors: RawProfessor[] }> {
  const {
    schoolName = 'Cornell University',
    maxProfessorsPerSource = 25,
    maxReviewsPerProfessor = 15,
    enableRMP = true,
    enableCUReviews = true
  } = config;

  console.log('🌐 Starting real data fetch from external sources...');
  console.log(`📊 Config: School=${schoolName}, MaxProfs=${maxProfessorsPerSource}, MaxReviews=${maxReviewsPerProfessor}`);
  
  const allProfessors: RawProfessor[] = [];
  const allReviews: RawReview[] = [];
  
  // Fetch from RateMyProfessor
  if (enableRMP) {
    try {
      console.log('🔍 Fetching data from RateMyProfessor...');
      const rmpFetcher = new RMPFetcher();
      const rmpData = await rmpFetcher.fetchAllData(schoolName, maxProfessorsPerSource, maxReviewsPerProfessor);
      
      allProfessors.push(...rmpData.professors);
      allReviews.push(...rmpData.reviews);
      
      console.log(`✅ RMP data: ${rmpData.professors.length} professors, ${rmpData.reviews.length} reviews`);
    } catch (error) {
      console.error('❌ Error fetching RMP data:', error);
      console.log('⚠️  Continuing without RMP data...');
    }
  }

  // Fetch from CUReviews
  if (enableCUReviews) {
    try {
      console.log('🔍 Fetching data from CUReviews...');
      const cuReviewsFetcher = new CUReviewsFetcher();
      const cuReviewsData = await cuReviewsFetcher.fetchProfessorsAndReviews(maxProfessorsPerSource);
      
      allProfessors.push(...cuReviewsData.professors);
      allReviews.push(...cuReviewsData.reviews);
      
      console.log(`✅ CUReviews data: ${cuReviewsData.professors.length} professors, ${cuReviewsData.reviews.length} reviews`);
    } catch (error) {
      console.error('❌ Error fetching CUReviews data:', error);
      console.log('⚠️  Continuing without CUReviews data...');
    }
  }

  // Remove duplicate professors (by name and school)
  const uniqueProfessors = removeDuplicateProfessors(allProfessors);
  console.log(`🔄 Removed ${allProfessors.length - uniqueProfessors.length} duplicate professors`);

  // Filter and normalize reviews
  const usableReviews = allReviews
    .filter(review => isReviewUsable(review.text))
    .map(review => ({
      ...review,
      text: normalizeReview(review.text)
    }));

  console.log(`📝 Filtered to ${usableReviews.length} usable reviews out of ${allReviews.length} total`);

  // Log summary statistics
  const rmpProfessors = uniqueProfessors.filter(p => p.source === 'rmp').length;
  const cuReviewsProfessors = uniqueProfessors.filter(p => p.source === 'cureviews').length;
  const rmpReviews = usableReviews.filter(r => r.source === 'rmp').length;
  const cuReviewsReviews = usableReviews.filter(r => r.source === 'cureviews').length;

  console.log('📊 Final data summary:');
  console.log(`   Total Professors: ${uniqueProfessors.length} (RMP: ${rmpProfessors}, CUReviews: ${cuReviewsProfessors})`);
  console.log(`   Total Reviews: ${usableReviews.length} (RMP: ${rmpReviews}, CUReviews: ${cuReviewsReviews})`);

  return {
    reviews: usableReviews,
    professors: uniqueProfessors
  };
}

/**
 * Remove duplicate professors based on name and school
 */
function removeDuplicateProfessors(professors: RawProfessor[]): RawProfessor[] {
  const seen = new Set<string>();
  const unique: RawProfessor[] = [];

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

/**
 * Configuration for different environments
 */
export const fetchConfigs = {
  // Development - fast fetch with limited data
  development: {
    schoolName: 'Cornell University',
    maxProfessorsPerSource: 10,
    maxReviewsPerProfessor: 5,
    enableRMP: true,
    enableCUReviews: true
  },

  // Production - comprehensive fetch
  production: {
    schoolName: 'Cornell University',
    maxProfessorsPerSource: 50,
    maxReviewsPerProfessor: 20,
    enableRMP: true,
    enableCUReviews: true
  },

  // Testing - minimal fetch
  testing: {
    schoolName: 'Cornell University',
    maxProfessorsPerSource: 3,
    maxReviewsPerProfessor: 2,
    enableRMP: true,
    enableCUReviews: false // Disable CUReviews for faster testing
  },

  // RMP only
  rmpOnly: {
    schoolName: 'Cornell University',
    maxProfessorsPerSource: 30,
    maxReviewsPerProfessor: 15,
    enableRMP: true,
    enableCUReviews: false
  }
};

/**
 * Wrapper function that uses environment-based configuration
 */
export async function fetchReviewsWithConfig(env: keyof typeof fetchConfigs = 'development'): Promise<{ reviews: RawReview[], professors: RawProfessor[] }> {
  const config = fetchConfigs[env];
  console.log(`🔧 Using ${env} configuration`);
  return fetchRealReviews(config);
}
