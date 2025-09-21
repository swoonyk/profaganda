#!/usr/bin/env node


import { fetchReviewsWithConfig } from './real-data.js';

async function testRealDataFetching() {
  console.log(' Testing production data pipeline...\n');

  try {
    console.log(' Testing with development configuration...');
    const { professors, reviews } = await fetchReviewsWithConfig('testing');

    console.log('\n Test Results:');
    console.log(`   Professors found: ${professors.length}`);
    console.log(`   Reviews found: ${reviews.length}`);

    if (professors.length > 0) {
      console.log('\n Sample professors:');
      professors.slice(0, 3).forEach((prof, index) => {
        console.log(`   ${index + 1}. ${prof.name} (${prof.department}) - Source: ${prof.source}`);
      });
    }

    if (reviews.length > 0) {
      console.log('\n Sample reviews:');
      reviews.slice(0, 2).forEach((review, index) => {
        const professor = professors.find(p => p.id === review.professorId);
        console.log(`   ${index + 1}. Rating: ${review.rating}/5 for ${professor?.name || 'Unknown'}`);
        console.log(`      Text: "${review.text.substring(0, 100)}..."`);
        console.log(`      Source: ${review.source}\n`);
      });
    }

    const rmpProfs = professors.filter(p => p.source === 'rmp').length;
    const cuProfs = professors.filter(p => p.source === 'cureviews').length;
    const rmpReviews = reviews.filter(r => r.source === 'rmp').length;
    const cuReviews = reviews.filter(r => r.source === 'cureviews').length;

    console.log(' Data by source:');
    console.log(`   RateMyProfessor: ${rmpProfs} professors, ${rmpReviews} reviews`);
    console.log(`   CUReviews: ${cuProfs} professors, ${cuReviews} reviews`);

    if (professors.length === 0) {
      console.log('\n No professors found. This could be due to:');
      console.log('   1. Network connectivity issues');
      console.log('   2. Rate limiting from the data sources');
      console.log('   3. Changes in the website structures');
      console.log('   4. The unofficial API might be temporarily unavailable');
      console.log('\n The system will fall back to limited sample data in such cases.');
    } else {
      console.log('\n Production data pipeline is working! The system fetches real professors and reviews.');
    }

  } catch (error) {
    console.error('\n Error during testing:', error);
      console.log('\n This is expected if you don\'t have network access or if the external APIs are unavailable.');
      console.log('   Check your network connection and API availability.');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testRealDataFetching();
}
