import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDatabase } from '../src/lib/db.js';
import { cors, handleError } from '../src/lib/middleware.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { dbQueries } = await getDatabase();

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
    handleError(error, res, 'Error fetching stats');
  }
}
