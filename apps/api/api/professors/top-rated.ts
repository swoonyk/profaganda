import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDatabase } from '../../src/lib/db.js';
import { cors, handleError } from '../../src/lib/middleware.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { dbQueries } = await getDatabase();

    const limit = parseInt(req.query.limit as string) || 10;
    const minReviews = parseInt(req.query.min_reviews as string) || 1;

    if (limit > 100) {
      return res.status(400).json({ 
        error: 'Limit cannot exceed 100' 
      });
    }

    const professors = await dbQueries.getProfessorsSortedBySatisfaction(limit, minReviews);
    
    res.json({ 
      professors,
      query_params: {
        limit,
        min_reviews: minReviews
      }
    });
  } catch (error) {
    handleError(error, res, 'Error fetching top-rated professors');
  }
}
