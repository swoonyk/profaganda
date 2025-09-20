```bash

. Separate Ingestion Scripts

pnpm pipeline:ingest-professors - Fetch and store professors only
pnpm pipeline:ingest-reviews - Fetch and store reviews for existing professors
pnpm pipeline:ingest - Full pipeline (professors + reviews + sanitization)

3. Comprehensive Testing

pnpm pipeline:test-rmp - Test RateMyProfessor API specifically
pnpm pipeline:test-real-data - Test both data sources
pnpm pipeline:test-full - Complete pipeline validation
pnpm pipeline:stats - View database statistics

# 1. Test system first
pnpm pipeline:test-full

# 2. Ingest professors (5-10 minutes)
pnpm pipeline:ingest-professors

# 3. Check what was added
pnpm pipeline:stats

# 4. Ingest reviews (10-20 minutes)  
pnpm pipeline:ingest-reviews

# 5. Final check
pnpm pipeline:stats
