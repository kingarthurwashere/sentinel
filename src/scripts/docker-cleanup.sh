#!/bin/bash

# AgriSat Docker Cleanup Script
# This script cleans up Docker resources for the satellite monitoring application

set -e

echo "🧹 AgriSat Docker Cleanup"
echo "========================="

# Stop and remove containers
echo "🛑 Stopping containers..."
docker-compose down

# Remove images
echo "🗑️  Removing images..."
docker rmi agrisat-satellite-monitoring-app:latest 2>/dev/null || true
docker rmi agrisat-satellite-monitoring_app:latest 2>/dev/null || true

# Remove volumes (optional - uncomment if you want to remove data)
# echo "💾 Removing volumes..."
# docker-compose down -v

# Remove unused Docker resources
echo "🧽 Cleaning up unused Docker resources..."
docker system prune -f

# Remove build cache
echo "🗂️  Removing build cache..."
docker builder prune -f

echo "✅ Cleanup complete!"
