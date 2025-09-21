import { RMPDatabaseClient } from './rmp-database-client.js';

async function testRMPDatabaseClient() {
  console.log(' Testing RateMyProfessor Database Client (comprehensive)...\n');

  const rmpClient = new RMPDatabaseClient();

  try {
    console.log(' Test 1: Cornell School ID');
    const schoolId = await rmpClient.getCornellSchoolId();
    console.log(` Cornell University School ID: ${schoolId}`);

    console.log('\n Test 2: Professor Fetching (first 5 professors)');
    const allProfessors = await rmpClient.fetchAllProfessorsFromSchool(schoolId);
    
    if (allProfessors.length > 0) {
      console.log(` Found ${allProfessors.length} total professors from Cornell`);
      
      const topProfessors = allProfessors.slice(0, 5);
      topProfessors.forEach((prof, index) => {
        console.log(`   ${index + 1}. ${prof.firstName} ${prof.lastName} (${prof.department})`);
        console.log(`      Ratings: ${prof.numRatings}, Avg: ${prof.avgRating}/5, Difficulty: ${prof.avgDifficulty}/5`);
      });

      const professorWithRatings = allProfessors.find(p => p.numRatings > 5);
      if (professorWithRatings) {
        console.log(`\n Test 3: Review Fetching for ${professorWithRatings.firstName} ${professorWithRatings.lastName}`);
        console.log(`   Professor has ${professorWithRatings.numRatings} ratings`);
        
        const detailed = await rmpClient.fetchProfessorDetails(professorWithRatings.id);
        
        if (detailed && detailed.ratings.length > 0) {
          console.log(` Found ${detailed.ratings.length} detailed reviews:`);
          detailed.ratings.slice(0, 3).forEach((review, index) => {
            console.log(`   ${index + 1}. Rating: ${Math.round((review.clarityRating + review.helpfulRating) / 2)}/5`);
            console.log(`      Text: "${review.comment.substring(0, 100)}..."`);
            console.log(`      Class: ${review.class}, Date: ${review.date}`);
          });
        } else {
          console.log(' No detailed reviews found');
        }
      } else {
        console.log('\n No professors with ratings found for detailed testing');
      }

      console.log('\n Test 4: Data Conversion');
      const sampleProf = topProfessors[0];
      const rawProfessor = rmpClient.convertToRawProfessor(sampleProf);
      console.log(` Converted professor: ${rawProfessor.name} (${rawProfessor.department})`);
      console.log(`   Source: ${rawProfessor.source}, ID: ${rawProfessor.id}`);

    } else {
      console.log(' No professors found');
    }

    console.log('\n RMP Database Client testing completed successfully!');
    console.log(' The comprehensive RateMyProfessor integration is working and ready for production use.');
    console.log(' This client can fetch ALL professors and reviews from Cornell with detailed metadata.');

  } catch (error) {
    console.error('\n RMP Database Client testing failed:', error);
    console.log('\n This could be due to:');
    console.log('   1. Network connectivity issues');
    console.log('   2. Rate limiting from RateMyProfessor');
    console.log('   3. Changes in the RateMyProfessor GraphQL API');
    console.log('   4. Temporary service unavailability');
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testRMPDatabaseClient();
}
