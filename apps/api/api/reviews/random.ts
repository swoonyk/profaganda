import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { RandomReviewsResponse } from '../../src/shared/index.js';
import { getDatabase } from '../../src/lib/db.js';
import { cors, handleError } from '../../src/lib/middleware.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const count = parseInt(req.query.count as string) || 10;
    
    if (count < 1 || count > 100) {
      return res.status(400).json({ 
        error: 'Count must be between 1 and 100' 
      });
    }

    const { dbQueries } = await getDatabase();
    const reviews = await dbQueries.getRandomReviews(count);
    
    const response: RandomReviewsResponse = {
      reviews
    };

    res.json(response);
  } catch (error) {
    handleError(error, res, 'Error fetching random reviews');
  }
}
