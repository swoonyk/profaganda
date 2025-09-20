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

### Steps

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Set up environment variables**:
   ```bash
   # Copy environment files for each app
   cp apps/web/.env.example apps/web/.env.local
   cp apps/api/.env.example apps/api/.env
   cp apps/pipeline/.env.example apps/pipeline/.env
   ```

3. **Configure your environment files**:
   - `apps/api/.env` - Add your `DATABASE_URL`
   - `apps/pipeline/.env` - Add `DATABASE_URL`, `GEMINI_API_KEY`, and data source API keys
   - `apps/web/.env.local` - Configure `NEXT_PUBLIC_API_URL` (defaults to http://localhost:4000)

4. **Set up your database**:
   ```bash
   # Create database (adjust connection details as needed)
   createdb review_sanitization
   
   # Run migrations (coming soon)
   # pnpm --filter database migrate
   ```

5. **Start development servers**:
   ```bash
   # Start all services at once
   pnpm dev

   # Or start individual services
   pnpm web:dev      # Frontend → http://localhost:3000
   pnpm api:dev      # API Server → http://localhost:4000  
   pnpm pipeline:dev # Pipeline service
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
pnpm api:dev           # Start API server only (port 4000)
pnpm pipeline:dev      # Start pipeline service only
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

### Database Operations
```bash
# Coming soon - database migrations
pnpm --filter database migrate
```

## 🔧 Environment Configuration

Each application has its own `.env.example` file. Here's what you need to configure:

### Required Variables

**Database (for API & Pipeline)**:
```bash
DATABASE_URL=postgresql://username:password@localhost:5432/review_sanitization
```

**AI Service (for Pipeline)**:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
```

### Optional Variables

**Data Sources (for Pipeline)**:
```bash
RMP_API_KEY=your_ratemyprof_api_key        # Rate My Professor
CUREVIEWS_API_KEY=your_cureviews_api_key   # CUReviews
```

**Frontend Configuration**:
```bash
NEXT_PUBLIC_API_URL=http://localhost:4000  # API server URL
```

### Getting API Keys

- **Gemini AI**: Get your API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
- **Rate My Professor**: Contact RMP for API access or use web scraping
- **CUReviews**: Check if they offer an API or use web scraping

## Tech Stack

- **Frontend**: Next.js, React, Tailwind CSS
- **Backend**: Express.js, PostgreSQL
- **AI**: Google Gemini
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Database**: PostgreSQL