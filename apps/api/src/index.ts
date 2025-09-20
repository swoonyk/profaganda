import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createPool, createDatabaseQueries } from '@profaganda/database';
import type { RandomReviewsResponse, ProfessorReviewsResponse } from '@profaganda/shared';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet());
app.use(cors());
app.use(express.json());

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = createPool(databaseUrl);
const dbQueries = create
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
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(professorId)) {
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
    const result = await pool.query(`
      SELECT DISTINCT p.id, p.internal_code, p.source, p.created_at, COUNT(r.id) as review_count
      FROM professors p
      INNER JOIN reviews r ON p.id = r.professor_id
      GROUP BY p.id, p.internal_code, p.source, p.created_at
      ORDER BY review_count DESC
    `);
    
    const professors = result.rows.map(row => ({
      id: row.id,
      internal_code: row.internal_code,
      source: row.source,
      created_at: row.created_at,
      review_count: parseInt(row.review_count)
    }));

    res.json({ professors });
  } catch (error) {
    console.error('Error fetching professors:', error);
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
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await pool.end();
  process.exit(0);
});
