# Profaganda API - Vercel Serverless Functions

This API has been migrated from a single Express.js server to individual Vercel serverless functions for better scalability and performance.

## Structure

```
api/
├── api/                           # Vercel serverless functions
│   ├── health.ts                 # GET /health
│   ├── stats.ts                  # GET /stats
│   ├── reviews/
│   │   ├── random.ts            # GET /reviews/random
│   │   └── by-professor/[id].ts # GET /reviews/by-professor/:id
│   ├── professors/
│   │   ├── index.ts             # GET /professors
│   │   └── top-rated.ts         # GET /professors/top-rated
│   └── game/
│       ├── mode1/
│       │   └── question.ts      # GET /game/mode1/question
│       └── mode2/
│           └── question.ts      # GET /game/mode2/question
├── src/
│   ├── lib/
│   │   ├── db.ts               # Shared database connection utilities
│   │   └── middleware.ts       # Shared middleware (CORS, error handling)
│   └── index.ts                # DEPRECATED: Original Express server
├── vercel.json                 # Vercel configuration and routing
└── package.json               # Updated for Vercel deployment
```

## API Endpoints

All endpoints maintain the same functionality as the original Express server:

- `GET /health` - Health check endpoint
- `GET /reviews/random?count=N` - Get N random reviews (1-100)
- `GET /reviews/by-professor/:id` - Get reviews for a specific professor
- `GET /professors` - Get all professors with satisfaction data
- `GET /professors/top-rated?limit=N&min_reviews=N` - Get top-rated professors
- `GET /game/mode1/question` - Game mode 1: Review + 4 professor options
- `GET /game/mode2/question` - Game mode 2: Professor + real/fake review
- `GET /stats` - Get database statistics

## Environment Variables

Make sure to set these environment variables in your Vercel project:

- `MONGODB_URI` - MongoDB connection string

## Deployment

1. Install Vercel CLI: `npm i -g vercel`
2. Run `pnpm run deploy` or `vercel --prod`
3. Set environment variables in Vercel dashboard or CLI

## Development

Run `pnpm run dev` to start the Vercel development server locally.

## Migration Notes

- Removed Express.js, CORS, and Helmet dependencies (replaced with Vercel runtime)
- Database connections are now handled per-function with connection reuse
- All endpoints maintain identical request/response interfaces
- Error handling standardized across all functions
- Added proper TypeScript types for Vercel Request/Response
