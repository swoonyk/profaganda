import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { GameMode2Response } from '../../../src/shared/index.js';
import { getDatabase } from '../../../src/lib/db.js';
import { cors, handleError } from '../../../src/lib/middleware.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { dbQueries } = await getDatabase();

    const professorData = await dbQueries.getRandomProfessorWithReviews();
    if (!professorData || professorData.reviews.length === 0) {
      return res.status(404).json({ 
        error: 'No professors with reviews available for game' 
      });
    }

    const { professor, reviews } = professorData;

    const showRealReview = Math.random() < 0.5;
    let selectedReview;
    let isRealReview;

    if (showRealReview) {
      const realReviews = reviews.filter((r: any) => !r.is_ai_generated);
      
      if (realReviews.length > 0) {
        selectedReview = realReviews[Math.floor(Math.random() * realReviews.length)];
        isRealReview = true;
      } else {
        selectedReview = reviews[Math.floor(Math.random() * reviews.length)];
        isRealReview = !selectedReview.is_ai_generated;
      }
    } else {
      const aiReviews = reviews.filter((r: any) => r.is_ai_generated);
      
      if (aiReviews.length > 0) {
        selectedReview = aiReviews[Math.floor(Math.random() * aiReviews.length)];
        isRealReview = false;
      } else {
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
    handleError(error, res, 'Error generating game mode 2 question');
  }
}
