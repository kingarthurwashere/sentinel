# AgriSat Satellite Monitoring - Docker Management
# Usage: make [command]

.PHONY: help build up down logs clean restart shell db-shell health

# Default target
help:
	@echo "🛰️  AgriSat Satellite Monitoring - Docker Commands"
	@echo "=================================================="
	@echo ""
	@echo "Available commands:"
	@echo "  make build     - Build Docker images"
	@echo "  make up        - Start all services"
	@echo "  make down      - Stop all services"
	@echo "  make restart   - Restart all services"
	@echo "  make logs      - View logs"
	@echo "  make shell     - Access app container shell"
	@echo "  make db-shell  - Access database shell"
	@echo "  make health    - Check service health"
	@echo "  make clean     - Clean up Docker resources"
	@echo "  make setup     - Initial setup"
	@echo ""

# Build Docker images
build:
	@echo "🔨 Building Docker images..."
	docker-compose build --no-cache

# Start services
up:
	@echo "🚀 Starting services..."
	docker-compose up -d
	@echo "✅ Services started!"
	@echo "🌐 Application: http://localhost:3000"

# Stop services
down:
	@echo "🛑 Stopping services..."
	docker-compose down
	@echo "✅ Services stopped!"

# Restart services
restart: down up

# View logs
logs:
	@echo "📋 Viewing logs..."
	docker-compose logs -f

# Access app container shell
shell:
	@echo "🐚 Accessing app container shell..."
	docker-compose exec app sh

# Access database shell
db-shell:
	@echo "🗄️  Accessing database shell..."
	docker-compose exec postgres psql -U agrisat_user -d agrisat_db

# Check service health
health:
	@echo "🔍 Checking service health..."
	@echo ""
	@echo "Services status:"
	docker-compose ps
	@echo ""
	@echo "Application health:"
	curl -s http://localhost:3000/api/health | jq . || echo "❌ Health check failed"

# Clean up Docker resources
clean:
	@echo "🧹 Cleaning up Docker resources..."
	docker-compose down -v
	docker system prune -f
	docker builder prune -f
	@echo "✅ Cleanup complete!"

# Initial setup
setup:
	@echo "🛰️  Setting up AgriSat Satellite Monitoring..."
	@chmod +x scripts/docker-setup.sh
	@./scripts/docker-setup.sh

# Development mode
dev:
	@echo "🔧 Starting in development mode..."
	docker-compose -f docker-compose.yml -f docker-compose.dev.yml up

# Production deployment
prod:
	@echo "🚀 Starting in production mode..."
	docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Backup database
backup:
	@echo "💾 Creating database backup..."
	docker-compose exec postgres pg_dump -U agrisat_user agrisat_db > backup_$(shell date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup created!"

# Restore database
restore:
	@echo "📥 Restoring database..."
	@read -p "Enter backup file path: " backup_file; \
	docker-compose exec -T postgres psql -U agrisat_user -d agrisat_db < $$backup_file
	@echo "✅ Database restored!"
