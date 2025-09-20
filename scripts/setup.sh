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

if [ ! -f "apps/web/.env.local" ]; then
    cp apps/web/.env.example apps/web/.env.local
    echo "✅ Created apps/web/.env.local"
fi

if [ ! -f "apps/api/.env" ]; then
    cp apps/api/.env.example apps/api/.env
    echo "✅ Created apps/api/.env"
fi

if [ ! -f "apps/pipeline/.env" ]; then
    cp apps/pipeline/.env.example apps/pipeline/.env
    echo "✅ Created apps/pipeline/.env"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "Next steps:"
echo "1. Configure your environment variables in the .env files"
echo "2. Set up your PostgreSQL database"
echo "3. Add your API keys (Gemini, RateMyProfessor, etc.)"
echo "4. Run 'pnpm dev' to start all services"
echo ""
echo "Available commands:"
echo "  pnpm dev        - Start all services"
echo "  pnpm web:dev    - Start web app (port 3000)"
echo "  pnpm api:dev    - Start API server (port 4000)"
echo "  pnpm pipeline:dev - Start pipeline service"