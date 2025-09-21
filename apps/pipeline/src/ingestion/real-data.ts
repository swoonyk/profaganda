import type { RawReview, RawProfessor } from '@profaganda/shared';
import { RMPDatabaseClient } from './rmp-database-client.js';
import { CUReviewsFetcher } from './cureviews-fetcher.js';
import { normalizeReview, isReviewUsable } from './review-utils.js';

interface FetchConfig {
  schoolName?: string;
  maxProfessorsPerSource?: number;
  maxReviewsPerProfessor?: number;
  enableRMP?: boolean;
  enableCUReviews?: boolean;
}

export async function fetchRealReviews(config: FetchConfig = {}): Promise<{ reviews: RawReview[], professors: RawProfessor[] }> {
  const {
    schoolName = 'Cornell University',
    maxProfessorsPerSource = 25,
    maxReviewsPerProfessor = 15,
    enableRMP = true,
    enableCUReviews = true
  } = config;

  console.log('Starting real data fetch from external sources...');
  console.log(` Config: School=${schoolName}, MaxProfs=${maxProfessorsPerSource}, MaxReviews=${maxReviewsPerProfessor}`);
  
  const allProfessors: RawProfessor[] = [];
  const allReviews: RawReview[] = [];
  
  if (enableRMP) {
    try {
      console.log('Fetching data from RateMyProfessor (comprehensive database client)...');
      const rmpClient = new RMPDatabaseClient();
      const rmpData = await rmpClient.fetchCornellData(maxProfessorsPerSource, maxReviewsPerProfessor);
      
      allProfessors.push(...rmpData.professors);
      allReviews.push(...rmpData.reviews);
      
      console.log(` RMP data: ${rmpData.professors.length} professors, ${rmpData.reviews.length} reviews`);
    } catch (error) {
      console.error(' Error fetching RMP data:', error);
      console.log(' Continuing without RMP data...');
    }
  }

  if (enableCUReviews) {
    try {
      console.log('Fetching data from CUReviews...');
      const cuReviewsFetcher = new CUReviewsFetcher();
      const cuReviewsData = await cuReviewsFetcher.fetchProfessorsAndReviews(maxProfessorsPerSource);
      
      allProfessors.push(...cuReviewsData.professors);
      allReviews.push(...cuReviewsData.reviews);
      
      console.log(` CUReviews data: ${cuReviewsData.professors.length} professors, ${cuReviewsData.reviews.length} reviews`);
    } catch (error) {
      console.error(' Error fetching CUReviews data:', error);
      console.log(' Continuing without CUReviews data...');
    }
  }

  const uniqueProfessors = removeDuplicateProfessors(allProfessors);
  console.log(` Removed ${allProfessors.length - uniqueProfessors.length} duplicate professors`);

  const usableReviews = allReviews
    .filter(review => isReviewUsable(review.text))
    .map(review => ({
      ...review,
      text: normalizeReview(review.text)
    }));

  console.log(` Filtered to ${usableReviews.length} usable reviews out of ${allReviews.length} total`);

  const rmpProfessors = uniqueProfessors.filter(p => p.source === 'rmp').length;
  const cuReviewsProfessors = uniqueProfessors.filter(p => p.source === 'cureviews').length;
  const rmpReviews = usableReviews.filter(r => r.source === 'rmp').length;
  const cuReviewsReviews = usableReviews.filter(r => r.source === 'cureviews').length;

  console.log(' Final data summary:');
  console.log(`   Total Professors: ${uniqueProfessors.length} (RMP: ${rmpProfessors}, CUReviews: ${cuReviewsProfessors})`);
  console.log(`   Total Reviews: ${usableReviews.length} (RMP: ${rmpReviews}, CUReviews: ${cuReviewsReviews})`);

  return {
    reviews: usableReviews,
    professors: uniqueProfessors
  };
}

function removeDuplicateProfessors(professors: RawProfessor[]): RawProfessor[] {
  const seen = new Set<string>();
  const unique: RawProfessor[] = [];

  for (const professor of professors) {
    const key = `${professor.name.toLowerCase().trim()}_${professor.school.toLowerCase().trim()}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(professor);
    }
  }

  return unique;
}


export const fetchConfigs = {
  development: {
    schoolName: 'Cornell University',
    maxProfessorsPerSource: 10,
    maxReviewsPerProfessor: 5,
    enableRMP: true,
    enableCUReviews: true
  },

  production: {
    schoolName: 'Cornell University',
    maxProfessorsPerSource: 50,
    maxReviewsPerProfessor: 20,
    enableRMP: true,
    enableCUReviews: true
  },

  testing: {
    schoolName: 'Cornell University',
    maxProfessorsPerSource: 3,
    maxReviewsPerProfessor: 2,
    enableRMP: true,
    enableCUReviews: false 
  },

  rmpOnly: {
    schoolName: 'Cornell University',
    maxProfessorsPerSource: 30,
    maxReviewsPerProfessor: 15,
    enableRMP: true,
    enableCUReviews: false
  }
};

export async function fetchReviewsWithConfig(env: keyof typeof fetchConfigs = 'development'): Promise<{ reviews: RawReview[], professors: RawProfessor[] }> {
  const config = fetchConfigs[env];
  console.log(` Using ${env} configuration`);
  return fetchRealReviews(config);
}
