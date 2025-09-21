import { config } from 'dotenv';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { connectToMongoDB, createDatabaseQueries, closeConnection } from '@profaganda/database';
import type { RandomReviewsResponse, ProfessorReviewsResponse, GameMode1Response, GameMode2Response } from '@profaganda/shared';

// Load environment variables from .env file
config({ path: '../../.env' });

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

const mongodbUri = process.env.MONGODB_URI;
if (!mongodbUri) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

let dbQueries: any;

// Initialize database connection
(async () => {
  try {
    const db = await connectToMongoDB(mongodbUri);
    dbQueries = createDatabaseQueries(db);
    console.log('✅ Database connected and ready');
  } catch (error) {
    console.error('❌ Failed to connect to database:', error);
    process.exit(1);
  }
})();
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/reviews/random', async (req, res) => {
  try {
    const count = parseInt(req.query.count as string) || 10;
    
    if (count < 1 || count > 100) {
      return res.status(400).json({ 
        error: 'Count must be between 1 and 100' 
      });
    }

    const reviews = await dbQueries.getRandomReviews(count);
    
    const response: RandomReviewsResponse = {
      reviews
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching random reviews:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

app.get('/reviews/by-professor/:id', async (req, res) => {
  try {
    const professorId = req.params.id;
    
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(professorId)) {
      return res.status(400).json({ 
        error: 'Invalid professor ID format' 
      });
    }

    const professor = await dbQueries.findProfessorById(professorId);
    if (!professor) {
      return res.status(404).json({ 
        error: 'Professor not found' 
      });
    }

    const reviews = await dbQueries.getReviewsByProfessorId(professorId);
    
    const response: ProfessorReviewsResponse = {
      professor,
      reviews
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching professor reviews:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});
app.get('/professors', async (req, res) => {
  try {
    if (!dbQueries) {
      return res.status(503).json({ error: 'Database not ready' });
    }

    // Get all professors with their information
    const db = dbQueries.database || (await connectToMongoDB(mongodbUri));
    const result = await db.collection('professors').find({}).toArray();
    
    const professors = result.map((row: any) => ({
      _id: row._id.toString(),
      internal_code: row.internal_code,
      name: row.name,
      school: row.school,
      department: row.department,
      source: row.source,
      created_at: row.created_at
    }));

    res.json({ professors });
  } catch (error) {
    console.error('Error fetching professors:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Game Mode 1: Review + 4 Professor Options (1 correct, 3 wrong)
app.get('/game/mode1/question', async (req, res) => {
  try {
    if (!dbQueries) {
      return res.status(503).json({ error: 'Database not ready' });
    }

    // Get a random review with its professor
    const reviewData = await dbQueries.getRandomReviewWithProfessor();
    if (!reviewData) {
      return res.status(404).json({ 
        error: 'No reviews available for game' 
      });
    }

    const { review, professor: correctProfessor } = reviewData;

    // Get 3 wrong professor options from the same department (if possible)
    let wrongProfessors = await dbQueries.getProfessorsExcluding(
      [correctProfessor._id!], 
      correctProfessor.department, 
      3
    );

    // If not enough professors in the same department, get from other departments
    if (wrongProfessors.length < 3) {
      const additionalProfessors = await dbQueries.getProfessorsExcluding(
        [correctProfessor._id!, ...wrongProfessors.map((p: any) => p._id!)], 
        undefined, 
        3 - wrongProfessors.length
      );
      wrongProfessors = [...wrongProfessors, ...additionalProfessors];
    }

    if (wrongProfessors.length < 3) {
      return res.status(404).json({ 
        error: 'Not enough professors available for game' 
      });
    }

    // Shuffle the professor options (1 correct + 3 wrong)
    const professorOptions = [correctProfessor, ...wrongProfessors.slice(0, 3)];
    for (let i = professorOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [professorOptions[i], professorOptions[j]] = [professorOptions[j], professorOptions[i]];
    }

    const response: GameMode1Response = {
      review,
      professorOptions,
      correctProfessorId: correctProfessor._id!
    };

    res.json(response);
  } catch (error) {
    console.error('Error generating game mode 1 question:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

// Game Mode 2: Professor + Real or Fake Review
app.get('/game/mode2/question', async (req, res) => {
  try {
    if (!dbQueries) {
      return res.status(503).json({ error: 'Database not ready' });
    }

    // Get a random professor with reviews
    const professorData = await dbQueries.getRandomProfessorWithReviews();
    if (!professorData || professorData.reviews.length === 0) {
      return res.status(404).json({ 
        error: 'No professors with reviews available for game' 
      });
    }

    const { professor, reviews } = professorData;

    // Decide randomly whether to show a real review or AI-generated review
    const showRealReview = Math.random() < 0.5;
    let selectedReview;
    let isRealReview;

    if (showRealReview) {
      // Filter for real reviews (not AI-generated)
      const realReviews = reviews.filter((r: any) => !r.is_ai_generated);
      
      if (realReviews.length > 0) {
        selectedReview = realReviews[Math.floor(Math.random() * realReviews.length)];
        isRealReview = true;
      } else {
        // Fallback to any review if no real reviews available
        selectedReview = reviews[Math.floor(Math.random() * reviews.length)];
        isRealReview = !selectedReview.is_ai_generated;
      }
    } else {
      // Try to get an AI-generated review
      const aiReviews = reviews.filter((r: any) => r.is_ai_generated);
      
      if (aiReviews.length > 0) {
        selectedReview = aiReviews[Math.floor(Math.random() * aiReviews.length)];
        isRealReview = false;
      } else {
        // Fallback to any review if no AI reviews available
        selectedReview = reviews[Math.floor(Math.random() * reviews.length)];
        isRealReview = !selectedReview.is_ai_generated;
      }
    }

    const response: GameMode2Response = {
      professor,
      review: selectedReview,
      isRealReview
    };

    res.json(response);
  } catch (error) {
    console.error('Error generating game mode 2 question:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});

app.get('/stats', async (req, res) => {
  try {
    const [professorCount, reviewCount] = await Promise.all([
      dbQueries.getProfessorCount(),
      dbQueries.getReviewCount()
    ]);

    res.json({
      professors: professorCount,
      reviews: reviewCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
});


app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found' 
  });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 API server running on port ${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   GET /health - Health check`);
  console.log(`   GET /reviews/random?count=N - Get N random reviews`);
  console.log(`   GET /reviews/by-professor/:id - Get reviews for professor`);
  console.log(`   GET /professors - Get all professors with review counts`);
  console.log(`   GET /stats - Get database statistics`);
  console.log(`   🎮 Game endpoints:`);
  console.log(`   GET /game/mode1/question - Game mode 1: Review + 4 professor options`);
  console.log(`   GET /game/mode2/question - Game mode 2: Professor + real/fake review`);
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await closeConnection();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await closeConnection();
  process.exit(0);
});
