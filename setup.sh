#!/bin/bash

# IDweb3 Setup Script
# This script helps set up the development environment

set -e

echo "🚀 IDweb3 Setup Script"
echo "======================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📄 Creating .env file from template..."
    cp .env.example .env
    echo "✅ .env file created. Please update it with your Hedera credentials."
    echo ""
    echo "📝 You need to:"
    echo "  1. Create a Hedera testnet account at https://portal.hedera.com"
    echo "  2. Get your Account ID and Private Key"
    echo "  3. Update HEDERA_OPERATOR_ID and HEDERA_OPERATOR_KEY in .env"
    echo "  4. Optionally, set up IPFS_API_KEY for Web3.Storage"
    echo ""
    read -p "Press Enter when you've updated the .env file..."
fi

# Validate .env file
echo "🔍 Validating .env configuration..."

if grep -q "HEDERA_OPERATOR_ID=0.0.xxxxx" .env; then
    echo "⚠️  Warning: HEDERA_OPERATOR_ID is still using the example value"
fi

if grep -q "HEDERA_OPERATOR_KEY=-----BEGIN PRIVATE KEY-----" .env; then
    echo "⚠️  Warning: HEDERA_OPERATOR_KEY is still using the example value"
fi

# Build and start services
echo "🐳 Building and starting Docker services..."

# Build custom images
docker-compose build

# Start the services
echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to start..."
sleep 30

# Check service health
echo "🔍 Checking service health..."

# Check MongoDB
if docker-compose exec -T mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
    echo "✅ MongoDB is running"
else
    echo "❌ MongoDB failed to start"
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping &> /dev/null; then
    echo "✅ Redis is running"
else
    echo "❌ Redis failed to start"
fi

# Check API
if curl -s http://localhost:3001/health &> /dev/null; then
    echo "✅ IDweb3 API is running"
else
    echo "❌ IDweb3 API failed to start"
fi

# Check Guardian (may take longer to start)
echo "⏳ Checking Guardian services (this may take a few minutes)..."
sleep 60

if curl -s http://localhost:3000 &> /dev/null; then
    echo "✅ Guardian UI is running"
else
    echo "❌ Guardian UI failed to start (this is normal on first run)"
fi

echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
echo "📊 Service URLs:"
echo "  • IDweb3 Frontend: http://localhost:3003"
echo "  • Guardian UI: http://localhost:3000"
echo "  • IDweb3 API: http://localhost:3001"
echo "  • API Health: http://localhost:3001/health"
echo ""
echo "📋 Next Steps:"
echo "  1. Open Guardian UI to configure identity policies"
echo "  2. Test the API endpoints with Postman or curl"
echo "  3. Create your first digital identity"
echo ""
echo "📚 Documentation:"
echo "  • README.md - Main documentation"
echo "  • configs/identity-policy.md - Guardian policy configuration"
echo "  • docs/ - Additional documentation"
echo ""
echo "🔧 Useful Commands:"
echo "  • docker-compose logs -f [service] - View logs"
echo "  • docker-compose down - Stop all services"
echo "  • docker-compose restart [service] - Restart a service"
echo ""

# Show running containers
echo "🐳 Running Containers:"
docker-compose ps