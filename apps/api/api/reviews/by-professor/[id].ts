import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { ProfessorReviewsResponse } from '../../../src/shared/index.js';
import { getDatabase } from '../../../src/lib/db.js';
import { cors, handleError } from '../../../src/lib/middleware.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const professorId = req.query.id as string;
    
    const objectIdRegex = /^[0-9a-fA-F]{24}$/;
    if (!objectIdRegex.test(professorId)) {
      return res.status(400).json({ 
        error: 'Invalid professor ID format' 
      });
    }

    const { dbQueries } = await getDatabase();
    
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
    handleError(error, res, 'Error fetching professor reviews');
  }
}
