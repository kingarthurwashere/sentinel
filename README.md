# 🛰️ AgriSat Pro - Satellite Vegetation Monitoring

Advanced satellite vegetation monitoring and analysis platform using Sentinel-2 data, built with Next.js and Docker.

## 🌟 Features

- **Vegetation Indices Calculation**: NDVI, EVI, NDWI, SAVI
- **True Color Satellite Imagery**: High-resolution Sentinel-2 images
- **Field Management**: Create, manage, and monitor agricultural fields
- **Health Scoring**: Automated vegetation health assessment
- **Historical Analysis**: Track vegetation changes over time
- **Docker Deployment**: Complete containerized solution

## 🚀 Quick Start with Docker

### Prerequisites

- Docker and Docker Compose installed
- Sentinel Hub API credentials

### 1. Clone and Setup

\`\`\`bash
git clone <repository-url>
cd agrisat-satellite-monitoring
chmod +x scripts/docker-setup.sh
\`\`\`

### 2. Configure Environment

\`\`\`bash
cp .env.example .env
# Edit .env and add your Sentinel Hub client secret
\`\`\`

### 3. Start Application

\`\`\`bash
# Using the setup script
./scripts/docker-setup.sh

# Or manually
make setup
make up
\`\`\`

### 4. Access Application

- **Application**: http://localhost:3000
- **Database**: localhost:5432
- **Redis**: localhost:6379

## 🔧 Configuration

### Environment Variables

\`\`\`env
# Sentinel Hub API (Required)
SENTINEL_HUB_CLIENT_ID=3e7b8ab4-0c05-4ac2-96bd-0ca40bef9be1
SENTINEL_HUB_CLIENT_SECRET=your_client_secret_here
SENTINEL_HUB_INSTANCE_ID=your_instance_id_here

# Database
DATABASE_URL=postgresql://agrisat_user:password@postgres:5432/agrisat_db

# Optional
REDIS_URL=redis://redis:6379
\`\`\`

## 📋 Docker Commands

\`\`\`bash
# Start services
make up

# Stop services
make down

# View logs
make logs

# Access app shell
make shell

# Access database
make db-shell

# Check health
make health

# Clean up
make clean
\`\`\`

## 🗄️ Database

The application uses PostgreSQL with the following tables:
- `fields` - Agricultural field information
- `vegetation_analysis` - Satellite analysis results
- `analysis_history` - Processing history and status

## 🛰️ Sentinel Hub Integration

The application integrates with Sentinel Hub API to:
1. Calculate vegetation indices (NDVI, EVI, NDWI, SAVI)
2. Retrieve true color satellite images
3. Generate NDVI visualizations

## 🔍 API Endpoints

- `GET /api/health` - Health check
- `GET /api/fields` - List fields
- `POST /api/fields` - Create field
- `DELETE /api/fields/[id]` - Delete field
- `POST /api/analyze` - Analyze field
- `GET /api/analyses/[fieldId]` - Get field analyses

## 🏗️ Architecture

\`\`\`
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Nginx Proxy   │    │   Next.js App   │    │   PostgreSQL    │
│   (Port 80)     │────│   (Port 3000)   │────│   (Port 5432)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                       ┌─────────────────┐
                       │     Redis       │
                       │   (Port 6379)   │
                       └─────────────────┘
\`\`\`

## 🔒 Security

- Rate limiting via Nginx
- Security headers
- Environment variable protection
- Database connection pooling
- Input validation and sanitization

## 📊 Monitoring

- Health check endpoints
- Service status monitoring
- Database connection health
- Application performance metrics

## 🚀 Production Deployment

\`\`\`bash
# Production mode
make prod

# With SSL (configure nginx/ssl first)
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
\`\`\`

## 🛠️ Development

\`\`\`bash
# Development mode with hot reload
make dev

# Or manually
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up
\`\`\`

## 📦 Backup & Restore

\`\`\`bash
# Backup database
make backup

# Restore database
make restore
\`\`\`

## 🐛 Troubleshooting

### Common Issues

1. **Port conflicts**: Change ports in docker-compose.yml
2. **Permission issues**: Check file permissions
3. **Database connection**: Verify DATABASE_URL
4. **Sentinel Hub API**: Check credentials and quotas

### Logs

\`\`\`bash
# View all logs
make logs

# View specific service logs
docker-compose logs -f app
docker-compose logs -f postgres
\`\`\`

## 📄 License

This project is licensed under the MIT License.
