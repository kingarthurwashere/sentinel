#!/bin/bash

# AgriSat Docker Setup Script
# This script sets up the complete Docker environment for the satellite monitoring application

set -e

echo "🛰️  AgriSat Satellite Monitoring - Docker Setup"
echo "================================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p nginx/ssl
mkdir -p data/postgres
mkdir -p data/redis
mkdir -p logs

# Copy environment file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from template..."
    cp .env.example .env
    echo "⚠️  Please edit .env file and add your Sentinel Hub client secret!"
fi

# Build and start services
echo "🔨 Building Docker images..."
docker-compose build --no-cache

echo "🚀 Starting services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service health
echo "🔍 Checking service health..."
docker-compose ps

# Test database connection
echo "🗄️  Testing database connection..."
docker-compose exec postgres pg_isready -U agrisat_user -d agrisat_db

# Test application health
echo "🌐 Testing application health..."
curl -f http://localhost:3000/api/health || echo "⚠️  Application health check failed"

echo ""
echo "✅ Setup complete!"
echo ""
echo "🌐 Application: http://localhost:3000"
echo "🗄️  Database: localhost:5432"
echo "🔴 Redis: localhost:6379"
echo ""
echo "📋 Useful commands:"
echo "  docker-compose logs -f          # View logs"
echo "  docker-compose down             # Stop services"
echo "  docker-compose up -d            # Start services"
echo "  docker-compose exec app sh      # Access app container"
echo "  docker-compose exec postgres psql -U agrisat_user -d agrisat_db  # Access database"
echo ""
echo "⚠️  Don't forget to add your Sentinel Hub client secret to .env file!"
