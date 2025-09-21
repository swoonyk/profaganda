import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { GameMode1Response } from '../../../src/shared/index.js';
import { getDatabase } from '../../../src/lib/db.js';
import { cors, handleError } from '../../../src/lib/middleware.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { dbQueries } = await getDatabase();

    const reviewData = await dbQueries.getRandomReviewWithProfessor();
    if (!reviewData) {
      return res.status(404).json({ 
        error: 'No reviews available for game' 
      });
    }

    const { review, professor: correctProfessor } = reviewData;

    let wrongProfessors = await dbQueries.getProfessorsExcluding(
      [correctProfessor._id!], 
      correctProfessor.department, 
      3
    );

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
    handleError(error, res, 'Error generating game mode 1 question');
  }
}
