import type { VercelRequest, VercelResponse } from '@vercel/node';
import { cors } from '../src/lib/middleware.js';

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (!cors(req, res)) return;

  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString() 
  });
}
