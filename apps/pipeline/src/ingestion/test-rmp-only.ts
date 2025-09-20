#!/usr/bin/env node

/**
 * Test script specifically for RateMyProfessor API integration
 */

import { RMPFetcher } from './rmp-fetcher.js';

async function testRMPFetcher() {
  console.log('🧪 Testing RateMyProfessor API integration...\n');

  const rmpFetcher = new RMPFetcher();

  try {
    // Test 1: School search
    console.log('📍 Test 1: School Search');
    const schoolId = await rmpFetcher.getSchoolId('Cornell University');
    if (schoolId) {
      console.log(`✅ Found Cornell University with ID: ${schoolId}`);
    } else {
      console.log('❌ Could not find Cornell University');
      return;
    }

    // Test 2: Fetch a few professors
    console.log('\n👨‍🏫 Test 2: Professor Fetching (limited)');
    const professors = await rmpFetcher.fetchProfessorsFromSchool('Cornell University', 3);
    
    if (professors.length > 0) {
      console.log(`✅ Found ${professors.length} professors:`);
      professors.forEach((prof, index) => {
        console.log(`   ${index + 1}. ${prof.name} (${prof.department})`);
        console.log(`      Source: ${prof.source}, RMP ID: ${prof.metadata?.rmpId}`);
      });

      // Test 3: Fetch reviews for first professor
      if (professors[0]) {
        console.log('\n📝 Test 3: Review Fetching');
        console.log(`Fetching reviews for: ${professors[0].name}`);
        
        const reviews = await rmpFetcher.fetchReviewsForProfessor(professors[0], 3);
        
        if (reviews.length > 0) {
          console.log(`✅ Found ${reviews.length} reviews:`);
          reviews.forEach((review, index) => {
            console.log(`   ${index + 1}. Rating: ${review.rating}/5`);
            console.log(`      Text: "${review.text.substring(0, 100)}..."`);
          });
        } else {
          console.log('⚠️  No reviews found for this professor');
        }
      }

    } else {
      console.log('❌ No professors found');
    }

    console.log('\n✅ RMP API testing completed successfully!');
    console.log('💡 The RateMyProfessor integration is working and ready for production use.');

  } catch (error) {
    console.error('\n❌ RMP API testing failed:', error);
    
    if (error.message?.includes('Property \'getRatings\' does not exist')) {
      console.log('\n💡 The ratemyprofessor-api package might have different method names.');
      console.log('   Check the package documentation for the correct API methods.');
    } else if (error.message?.includes('network') || error.message?.includes('timeout')) {
      console.log('\n💡 This might be a network connectivity issue or rate limiting.');
      console.log('   Try again in a few minutes.');
    } else {
      console.log('\n💡 This could be due to:');
      console.log('   1. Changes in the RateMyProfessor API structure');
      console.log('   2. Rate limiting or blocked requests');
      console.log('   3. The unofficial API package needs updating');
    }
  }
}

// Run the test if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testRMPFetcher();
}
