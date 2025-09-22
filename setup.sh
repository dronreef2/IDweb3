#!/bin/bash

# IDweb3 Setup Script
echo "🚀 Setting up IDweb3 Digital Identity System..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if MongoDB is running
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB is not installed. Please install MongoDB first."
    echo "   Visit: https://docs.mongodb.com/manual/installation/"
fi

# Check if Redis is running
if ! command -v redis-server &> /dev/null; then
    echo "⚠️  Redis is not installed. Please install Redis first."
    echo "   Visit: https://redis.io/download"
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Create environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "⚙️  Creating environment file..."
    cp .env.example .env
    echo "✅ Please edit .env file with your configuration"
fi

# Create logs directory
mkdir -p logs

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build completed successfully!"
    echo ""
    echo "🎉 Setup complete! Next steps:"
    echo "1. Configure your .env file with:"
    echo "   - Hedera account credentials"
    echo "   - Database connection strings"
    echo "   - Web3.Storage token (optional)"
    echo "2. Start MongoDB and Redis services"
    echo "3. Run: npm start"
    echo ""
    echo "📖 See README.md for detailed instructions"
else
    echo "❌ Build failed. Please check the error messages above."
    exit 1
fi