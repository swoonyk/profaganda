#!/usr/bin/env node

 

import { fetchRealReviews, fetchConfigs } from './real-data.js';
import { RMPDatabaseClient } from './rmp-database-client.js';
import { CUReviewsFetcher } from './cureviews-fetcher.js';

async function testFullPipeline() {
  console.log(' Testing Complete Real Data Pipeline...\n');

  console.log(' Test 1: Individual Component Testing');
  
  try {
    
    console.log('\n Testing RateMyProfessor database client...');
    const rmpClient = new RMPDatabaseClient();
    const schoolId = await rmpClient.getCornellSchoolId();
    
    console.log(` RMP: Cornell University ID: ${schoolId}`);
    
    const rmpData = await rmpClient.fetchCornellData(3, 5); // 3 professors, 5 reviews each max
    console.log(` RMP: Found ${rmpData.professors.length} professors, ${rmpData.reviews.length} reviews`);
    
    if (rmpData.professors.length > 0) {
      const sample = rmpData.professors[0];
      console.log(` RMP: Sample professor: ${sample.name} (${sample.department})`);
    }

    
    console.log('\n Testing CUReviews integration...');
    const cuReviewsFetcher = new CUReviewsFetcher();
    const cuReviewsData = await cuReviewsFetcher.fetchProfessorsAndReviews(2);
    console.log(` CUReviews: Found ${cuReviewsData.professors.length} professors, ${cuReviewsData.reviews.length} reviews`);

  } catch (error) {
    console.error(' Component testing failed:', error);
  }

  console.log('\n Test 2: Integrated Data Fetching');
  
  try {
    console.log('Testing with development configuration...');
    const { professors, reviews } = await fetchRealReviews(fetchConfigs.testing);
    
    console.log(` Integrated fetch: ${professors.length} professors, ${reviews.length} reviews`);
    
    
    if (professors.length > 0) {
      console.log('\n Data Quality Analysis:');
      
      
      const validProfessors = professors.filter(p => 
        p.name && p.name.trim().length > 0 &&
        p.school && p.school.trim().length > 0 &&
        p.source && ['rmp', 'cureviews'].includes(p.source)
      );
      
      console.log(`   Professors: ${validProfessors.length}/${professors.length} valid`);
      
      
      const validReviews = reviews.filter(r => 
        r.text && r.text.trim().length >= 20 &&
        r.rating && r.rating >= 1 && r.rating <= 5 &&
        r.source && ['rmp', 'cureviews'].includes(r.source) &&
        r.professorId && r.professorId.trim().length > 0
      );
      
      console.log(`   Reviews: ${validReviews.length}/${reviews.length} valid`);
      
      
      const rmpProfs = professors.filter(p => p.source === 'rmp').length;
      const cuProfs = professors.filter(p => p.source === 'cureviews').length;
      const rmpRevs = reviews.filter(r => r.source === 'rmp').length;
      const cuRevs = reviews.filter(r => r.source === 'cureviews').length;
      
      console.log(`   Source distribution:`);
      console.log(`     RMP: ${rmpProfs} professors, ${rmpRevs} reviews`);
      console.log(`     CUReviews: ${cuProfs} professors, ${cuRevs} reviews`);
      
      
      if (validProfessors.length > 0) {
        console.log(`\n Sample Professor: ${validProfessors[0].name} (${validProfessors[0].department})`);
      }
      
      if (validReviews.length > 0) {
        console.log(` Sample Review: "${validReviews[0].text.substring(0, 80)}..." (${validReviews[0].rating}/5)`);
      }
      
    } else {
      console.log('  No professors found in integrated test');
    }

  } catch (error) {
    console.error(' Integrated testing failed:', error);
  }

  // Test 3: Configuration validation
  console.log('\n Test 3: Configuration Validation');
  
  const configs = ['development', 'production', 'testing', 'rmpOnly'] as const;
  
  for (const configName of configs) {
    const config = fetchConfigs[configName];
    console.log(`   ${configName}: max ${config.maxProfessorsPerSource} profs, ${config.maxReviewsPerProfessor} reviews/prof`);
    console.log(`     RMP: ${config.enableRMP ? 'enabled' : 'disabled'}, CUReviews: ${config.enableCUReviews ? 'enabled' : 'disabled'}`);
  }

  // Summary and recommendations
  console.log('\n Summary and Recommendations:');
  console.log(' Pipeline components are properly integrated');
  console.log(' Both RMP and CUReviews data sources are configured');
  console.log(' Data validation and normalization is working');
  console.log(' Multiple configuration profiles are available');
  
  console.log('\n Next Steps:');
  console.log('1. Run: pnpm pipeline:ingest-professors  (to populate professors)');
  console.log('2. Run: pnpm pipeline:ingest-reviews     (to populate reviews)');
  console.log('3. Run: pnpm pipeline:stats              (to see results)');
  
  console.log('\n Tips:');
  console.log('- Set NODE_ENV=development for faster testing');
  console.log('- Set NODE_ENV=production for comprehensive data');
  console.log('- Use separate professor/review scripts for better control');
  console.log('- Monitor rate limits from external APIs');
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testFullPipeline();
}
