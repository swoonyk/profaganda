#!/usr/bin/env node

/**
 * Script to recalculate satisfaction ratings for all professors
 * This script connects to the database and recalculates average satisfaction
 * for all professors based on their current reviews with ratings.
 */

import { connectToMongoDB, closeConnection } from '../connection.js';
import { createDatabaseQueries } from '../queries.js';

async function main() {
  console.log('🔧 Professor Satisfaction Recalculation Tool');
  console.log('============================================');

  let mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    console.error('❌ MONGODB_URI environment variable is required');
    process.exit(1);
  }

  // Clean up URI format
  mongodbUri = mongodbUri.trim();
  if ((mongodbUri.startsWith('"') && mongodbUri.endsWith('"')) || 
      (mongodbUri.startsWith("'") && mongodbUri.endsWith("'"))) {
    mongodbUri = mongodbUri.slice(1, -1);
  }

  try {
    console.log('🔌 Connecting to database...');
    const db = await connectToMongoDB(mongodbUri);
    const queries = createDatabaseQueries(db);

    console.log('📊 Getting current database statistics...');
    const [professorCount, reviewCount] = await Promise.all([
      queries.getProfessorCount(),
      queries.getReviewCount()
    ]);

    console.log(`   📚 Total professors: ${professorCount}`);
    console.log(`   📝 Total reviews: ${reviewCount}`);

    // Count reviews with ratings
    const reviewsWithRatings = await db.collection('reviews').countDocuments({
      rating: { $exists: true, $ne: null }
    });

    console.log(`   ⭐ Reviews with ratings: ${reviewsWithRatings}`);

    if (reviewsWithRatings === 0) {
      console.log('⚠️  No reviews with ratings found. Satisfaction calculation will clear existing data.');
    }

    console.log('\n🔄 Starting satisfaction recalculation...');
    await queries.recalculateAllProfessorSatisfactions();

    console.log('\n📈 Post-recalculation statistics:');
    
    // Get professors with satisfaction data
    const professorsWithSatisfaction = await db.collection('professors').countDocuments({
      average_satisfaction: { $exists: true }
    });

    console.log(`   👨‍🏫 Professors with satisfaction ratings: ${professorsWithSatisfaction}`);

    // Show top 5 professors by satisfaction
    console.log('\n🏆 Top 5 professors by satisfaction:');
    const topProfessors = await queries.getProfessorsSortedBySatisfaction(5, 1);
    
    if (topProfessors.length === 0) {
      console.log('   (No professors have satisfaction ratings yet)');
    } else {
      topProfessors.forEach((prof, index) => {
        const rating = prof.average_satisfaction?.toFixed(2) || 'N/A';
        const reviews = prof.total_reviews || 0;
        console.log(`   ${index + 1}. ${prof.name} - ${rating}/5.0 (${reviews} reviews)`);
      });
    }

    // Show distribution of satisfaction ratings
    const satisfactionDistribution = await db.collection('professors').aggregate([
      { $match: { average_satisfaction: { $exists: true } } },
      {
        $bucket: {
          groupBy: '$average_satisfaction',
          boundaries: [1.0, 2.0, 3.0, 4.0, 5.0, 6.0],
          default: 'other',
          output: { count: { $sum: 1 } }
        }
      }
    ]).toArray();

    if (satisfactionDistribution.length > 0) {
      console.log('\n📊 Satisfaction rating distribution:');
      satisfactionDistribution.forEach((bucket: any) => {
        const range = bucket._id === 'other' ? 'Other' : `${bucket._id}-${bucket._id + 1}`;
        console.log(`   ${range}: ${bucket.count} professors`);
      });
    }

    console.log('\n✅ Satisfaction recalculation completed successfully!');

  } catch (error) {
    console.error('❌ Error during satisfaction recalculation:', error);
    process.exit(1);
  } finally {
    await closeConnection();
  }
}

// Handle script interruption gracefully
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Script interrupted by user');
  await closeConnection();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n\n🛑 Script terminated');
  await closeConnection();
  process.exit(0);
});

main().catch(async (error) => {
  console.error('💥 Unhandled error:', error);
  await closeConnection();
  process.exit(1);
});
