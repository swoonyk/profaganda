# Testing & Deployment Guide

## 🧪 Testing the Pipeline Implementation

### Prerequisites Checklist
- [ ] PostgreSQL database running
- [ ] Gemini API key from [Google AI Studio](https://aistudio.google.com/apikey)
- [ ] Node.js 18+ installed
- [ ] pnpm installed (`npm install -g pnpm`)

### Environment Setup
1. **Configure environment**:
   ```bash
   cp env.example .env
   ```

2. **Edit `.env` with your credentials**:
   ```bash
   DATABASE_URL=postgresql://username:password@localhost:5432/profaganda_dev
   GEMINI_API_KEY=your_actual_api_key_here
   BATCH_SIZE=5
   PORT=3001
   ```

### Quick Test (Once Dependencies Install)

**Step 1: Database Setup**
```bash
# Install dependencies
pnpm install

# Set up database and run migrations
pnpm db:migrate

# Run initial data ingestion
pnpm pipeline:ingest
```

**Step 2: Test API Server**
```bash
# Start API server
pnpm api:dev

# Test endpoints (in another terminal):
curl http://localhost:3001/health
curl http://localhost:3001/stats
curl "http://localhost:3001/reviews/random?count=3"
```

**Step 3: Verify Sanitization**
```bash
# Check database stats
pnpm pipeline:stats

# Expected output:
# 📊 Database Statistics:
#    Professors: 4
#    Reviews: 10
```

## 🔍 Implementation Verification

### Core Components Status: ✅ COMPLETE

#### 1. **Database Layer** (`packages/database/`)
- ✅ PostgreSQL schema with professors/reviews tables
- ✅ TypeScript query helpers
- ✅ Migration system
- ✅ Connection pooling

#### 2. **Shared Utilities** (`packages/shared/`)
- ✅ TypeScript interfaces for all data types
- ✅ Gemini API client with sanitization prompt
- ✅ Error handling and response validation

#### 3. **Pipeline System** (`apps/pipeline/`)
- ✅ Mock data ingestion (10 realistic professor reviews)
- ✅ Text normalization (HTML stripping, entity decoding)
- ✅ Batch processing with Gemini API
- ✅ Progress tracking and error handling
- ✅ CLI commands: `pnpm pipeline:ingest` and `pnpm pipeline:stats`

#### 4. **REST API** (`apps/api/`)
- ✅ `GET /reviews/random?count=N` - Random sanitized reviews
- ✅ `GET /reviews/by-professor/:id` - Reviews for specific professor
- ✅ `GET /professors` - All professors with review counts  
- ✅ `GET /stats` - Database statistics
- ✅ `GET /health` - Health check

## 🎯 Expected Sanitization Results

### Sample Input/Output:
**Input Review:**
```
"Dr. Johnson is amazing! Her CS 2110 class was challenging but really well structured. Email her at sarah.johnson@cornell.edu for questions."
```

**Expected Sanitized Output:**
```json
{
  "sanitized_text": "[REDACTED] is amazing! [REDACTED] class was challenging but really well structured. Email [REDACTED] for questions.",
  "was_redacted": true
}
```

### Mock Data Includes:
- ✅ Professor names and initials
- ✅ Course codes (CS 2110, MATH 1920, etc.)
- ✅ Email addresses  
- ✅ Office locations
- ✅ Clean reviews (no PII)
- ✅ Various rating levels (1-5 stars)

## 🚀 Hackathon Demo Script

### 1. **Show the Problem** (30 seconds)
```bash
# Show raw mock data with PII
cat apps/pipeline/src/ingestion/mock-data.ts | grep -A 3 "Dr. Johnson"
```

### 2. **Demonstrate Sanitization** (60 seconds)
```bash
# Run pipeline with live Gemini API
pnpm pipeline:ingest

# Show sanitized results
curl "http://localhost:3001/reviews/random?count=3" | jq
```

### 3. **Show API for Game** (30 seconds)
```bash
# Get professors for game setup
curl http://localhost:3001/professors | jq

# Get random reviews for gameplay
curl "http://localhost:3001/reviews/random?count=5" | jq
```

## 🛠️ Troubleshooting

### Common Issues:

**1. Dependencies won't install:**
- Try: `rm -rf node_modules pnpm-lock.yaml && pnpm install`
- Alternative: Use `npm install` in each package individually

**2. Database connection fails:**
- Verify PostgreSQL is running: `pg_isready`
- Check DATABASE_URL format: `postgresql://user:pass@host:port/db`

**3. Gemini API errors:**
- Verify API key is correct and active
- Check rate limits (default: 100ms delay between requests)

**4. TypeScript errors:**
- Ensure all workspace dependencies are installed
- Try: `pnpm build` to check for type issues

## 📊 Success Metrics

**Pipeline Working Correctly When:**
- ✅ All 10 mock reviews are processed without errors
- ✅ PII is properly redacted (names, emails, course codes)
- ✅ Non-PII reviews remain unchanged
- ✅ API returns sanitized reviews only
- ✅ Database contains 4 professors and 10 reviews

**API Working Correctly When:**
- ✅ `/health` returns 200 OK
- ✅ `/stats` shows professor and review counts
- ✅ `/reviews/random` returns sanitized reviews
- ✅ No raw review text is ever exposed

## 🎮 Game Integration

The API is designed for your multiplayer guessing game:

1. **Professor Selection**: Use `/professors` to get available professors
2. **Review Fetching**: Use `/reviews/by-professor/:id` for specific rounds
3. **Random Mode**: Use `/reviews/random?count=N` for mixed gameplay
4. **Safety**: All responses contain only sanitized text - safe for players

The sanitization ensures players can never see identifiable information while maintaining the authentic tone and content of student reviews.
