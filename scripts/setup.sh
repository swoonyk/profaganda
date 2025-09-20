#!/bin/bash

echo "🚀 Setting up Profaganda development environment..."

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install it first:"
    echo "   npm install -g pnpm"
    exit 1
fi

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Copy environment files
echo "⚙️  Setting up environment files..."

if [ ! -f ".env" ]; then
    cp env.example .env
    echo "✅ Created .env file from env.example"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure your .env file with:"
echo "   - DATABASE_URL (PostgreSQL connection string)"
echo "   - GEMINI_API_KEY (from https://aistudio.google.com/apikey)"
echo "2. Set up your PostgreSQL database"
echo "3. Run 'pnpm db:setup' to set up database and ingest initial data"
echo "4. Run 'pnpm api:dev' to start the API server"
echo "5. Run 'pnpm web:dev' to start the web app"
echo ""
echo "Available commands:"
echo "  pnpm db:setup       - Set up database and ingest data"
echo "  pnpm api:dev        - Start API server (port 3001)"
echo "  pnpm web:dev        - Start web app (port 3000)"
echo "  pnpm pipeline:ingest - Run review ingestion pipeline"
echo "  pnpm pipeline:stats  - Show database statistics"