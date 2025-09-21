import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getDatabase } from '../../src/lib/db.js';
import { cors, handleError } from '../../src/lib/middleware.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!cors(req, res)) return;

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { dbQueries, dbConnection } = await getDatabase();

    // Get all professors with their information
    const result = await dbConnection.collection('professors').find({}).toArray();
    
    const professors = result.map((row: any) => ({
      _id: row._id.toString(),
      internal_code: row.internal_code,
      name: row.name,
      school: row.school,
      department: row.department,
      source: row.source,
      average_satisfaction: row.average_satisfaction,
      total_reviews: row.total_reviews || 0,
      created_at: row.created_at
    }));

    res.json({ professors });
  } catch (error) {
    handleError(error, res, 'Error fetching professors');
  }
}
