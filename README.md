# Profaganda - Professor Review Game

A full-stack application for the Cornell professor game, featuring AI-powered review sanitization and a modern React frontend.

## Project Structure

This is a monorepo managed with pnpm workspaces:

```
├── apps/
│   ├── web/          # Next.js frontend application
│   ├── api/          # Express.js REST API server
│   └── pipeline/     # Review sanitization pipeline
├── packages/
│   ├── shared/       # Shared TypeScript types and utilities
│   └── database/     # Database schema and connection utilities
```

## 🚀 Quick Start (Automated Setup)

**The easiest way to get started:**

```bash
# Run the setup script (handles everything below)
./scripts/setup.sh
```

This script will:
- Install all dependencies with pnpm
- Copy environment files for all apps
- Guide you through the next steps

## 📋 Manual Setup (Alternative)

If you prefer to set up manually:

### Prerequisites
- **Node.js 18+** 
- **pnpm** (install with `npm install -g pnpm`)
- **PostgreSQL** database running locally or remotely
- **Gemini API Key** from [Google AI Studio](https://aistudio.google.com/apikey)

### Steps

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment variables**:
   ```bash
   # Copy the example environment file
   cp env.example .env
   ```

3. **Configure your `.env` file**:
   - Set `DATABASE_URL` to your PostgreSQL connection string
   - Set `GEMINI_API_KEY` to your Gemini API key
   - Adjust other settings as needed

4. **Set up your database and run the pipeline**:
   ```bash
   # Create database (adjust connection details as needed)
   createdb profaganda_dev
   
   # Run database setup (migrations + initial data ingestion)
   pnpm db:setup
   ```

5. **Start development servers**:
   ```bash
   # Start API server
   pnpm api:dev      # API Server → http://localhost:3001
   
   # In another terminal, start web app
   pnpm web:dev      # Frontend → http://localhost:3000
   ```

## 🌐 Local Development URLs

Once running, access your applications at:

- **Frontend**: http://localhost:3000
- **API Server**: http://localhost:4000
- **API Health Check**: http://localhost:4000/health

## Applications

### Web App (`apps/web`)
- **Framework**: Next.js 15 with React 19
- **Styling**: Tailwind CSS
- **Port**: 3000
- **Features**: Professor game interface, review browsing

### API Server (`apps/api`)
- **Framework**: Express.js with TypeScript
- **Database**: PostgreSQL with pg driver
- **Port**: 4000
- **Features**: REST API for professors and reviews

### Pipeline (`apps/pipeline`)
- **Purpose**: AI-powered review sanitization
- **AI**: Google Gemini for PII removal
- **Sources**: Rate My Professor, CUReviews
- **Features**: Batch processing, safety validation

## Packages

### Shared (`packages/shared`)
Common TypeScript types and utilities used across all applications.

### Database (`packages/database`)
PostgreSQL schema, migrations, and connection management.

## 💻 Development Commands

### Setup & Installation
```bash
./scripts/setup.sh      # Automated setup (recommended)
pnpm install            # Install dependencies manually
```

### Development Servers
```bash
pnpm dev                # Start all apps simultaneously
pnpm web:dev           # Start web app only (port 3000)
pnpm api:dev           # Start API server only (port 3001)
```

### Pipeline Operations
```bash
pnpm pipeline:ingest   # Run review ingestion and sanitization
pnpm pipeline:stats    # Show database statistics
```

### Database Operations
```bash
pnpm db:migrate        # Run database migrations
pnpm db:setup          # Set up database and ingest initial data
```

### Building & Testing
```bash
pnpm build             # Build all packages
pnpm type-check        # Type check all packages
pnpm lint              # Lint all packages
```

### Utilities
```bash
pnpm clean             # Clean all build artifacts
```

## 🔧 Environment Configuration

Copy `env.example` to `.env` and configure the following:

### Required Variables

**Database (for API & Pipeline)**:
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/profaganda_dev
```

**AI Service (for Pipeline)**:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### Optional Variables

**Pipeline Configuration**:
```bash
BATCH_SIZE=5                    # Number of reviews to process at once
SCHOOL=Cornell                  # School name for filtering
MIN_REVIEW_LENGTH=30           # Minimum review length
MAX_REVIEW_LENGTH=3000         # Maximum review length
```

**API Configuration**:
```bash
PORT=3001                      # API server port
```

### Getting API Keys

- **Gemini AI**: Get your API key from [Google AI Studio](https://aistudio.google.com/apikey)

### API Endpoints

Once the API server is running, you can access:

- `GET /health` - Health check
- `GET /reviews/random?count=N` - Get N random sanitized reviews  
- `GET /reviews/by-professor/:id` - Get reviews for a specific professor
- `GET /professors` - Get all professors with review counts
- `GET /stats` - Get database statistics

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Express.js, PostgreSQL
- **AI**: Google Gemini
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Database**: PostgreSQL