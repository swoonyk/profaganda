import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createPool } from '@profaganda/database';

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000']
}));
app.use(express.json());

// Initialize database
if (process.env.DATABASE_URL) {
  createPool(process.env.DATABASE_URL);
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.get('/api/professors', (req, res) => {
  res.json({ message: 'Professors endpoint - coming soon' });
});

app.get('/api/reviews', (req, res) => {
  res.json({ message: 'Reviews endpoint - coming soon' });
});

app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});