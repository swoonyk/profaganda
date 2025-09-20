```bash

# Check current status
pnpm pipeline:stats

# Load professors and real reviews (sanitizes with Gemini)
pnpm pipeline:ingest

# Generate AI-generated fake reviews 
pnpm pipeline:generate


### **Test API Endpoints**

```bash
# Start the API server
pnpm api:dev

# In a new terminal, test the endpoints:

# Get all professors with names
curl http://localhost:3001/professors

# Get database statistics  
curl http://localhost:3001/stats

# Get random reviews (mix of real and AI)
curl http://localhost:3001/reviews/random?count=5

# Get reviews for a specific professor
curl http://localhost:3001/reviews/by-professor/[PROFESSOR_ID]
```