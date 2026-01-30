# watsonx.data Demo Application - Deployment Guide

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Local Development Setup](#local-development-setup)
3. [Configuration](#configuration)
4. [Running the Application](#running-the-application)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)
7. [Production Deployment](#production-deployment)

## Prerequisites

### Required Software

1. **watsonx.data Developer Edition**
   - Download from IBM website
   - Running on `https://localhost:6443`
   - Default credentials: `ibmlhadmin` / `password`

2. **Node.js and npm**
   - Version: 18.x or higher
   - Download: https://nodejs.org/

3. **Git**
   - For version control and deployment
   - Download: https://git-scm.com/

4. **Python 3.8+** (Optional)
   - For sample data generation
   - Download: https://python.org/

### System Requirements

- **OS**: macOS, Linux, or Windows
- **RAM**: 4GB minimum, 8GB recommended
- **Disk Space**: 2GB for application and dependencies
- **Network**: Access to watsonx.data instance

## Local Development Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd wxData-Bob
```

### 2. Install Dependencies

#### Backend
```bash
cd backend
npm install
cd ..
```

#### Frontend
```bash
cd frontend
npm install
cd ..
```

### 3. Configure Environment

Create backend environment file:

```bash
cat > backend/.env << EOF
# watsonx.data Configuration
WATSONX_BASE_URL=https://localhost:6443
WATSONX_USERNAME=ibmlhadmin
WATSONX_PASSWORD=password
WATSONX_INSTANCE_ID=0000-0000-0000-0000
WATSONX_ENGINE_ID=spark158
WATSONX_BUCKET_NAME=iceberg-bucket

# Server Configuration
PORT=5000
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:3000

# Environment
NODE_ENV=development
LOG_LEVEL=info
EOF
```

### 4. Verify watsonx.data Connection

Test connection to watsonx.data:

```bash
curl -k https://localhost:6443/lakehouse/api/v3/auth/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "username": "ibmlhadmin",
    "password": "password",
    "instance_id": "0000-0000-0000-0000",
    "instance_name": ""
  }'
```

Expected response should include a bearer token.

## Configuration

### Backend Configuration

Edit `backend/src/config/watsonx.config.js`:

```javascript
module.exports = {
  watsonxData: {
    baseUrl: process.env.WATSONX_BASE_URL || 'https://localhost:6443',
    username: process.env.WATSONX_USERNAME || 'ibmlhadmin',
    password: process.env.WATSONX_PASSWORD || 'password',
    instanceId: process.env.WATSONX_INSTANCE_ID || '0000-0000-0000-0000',
    // ... other settings
  }
};
```

### Frontend Configuration

The frontend uses proxy configuration in `package.json`:

```json
{
  "proxy": "http://localhost:5000"
}
```

For production, update API calls to use full backend URL.

## Running the Application

### Quick Start (Recommended)

Use the automated start script:

```bash
./scripts/start.sh
```

This will:
1. Check prerequisites
2. Install dependencies (if needed)
3. Start backend server on port 5000
4. Start frontend server on port 3000
5. Open browser automatically

### Manual Start

#### Start Backend
```bash
cd backend
npm start
```

Backend will be available at: http://localhost:5000

#### Start Frontend (in new terminal)
```bash
cd frontend
npm start
```

Frontend will be available at: http://localhost:3000

### Stop Application

Use the automated stop script:

```bash
./scripts/stop.sh
```

Or manually:
```bash
# Find and kill processes
lsof -ti:5000 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

## Testing

### 1. Generate Sample Data

```bash
./scripts/generate-sample-data.py
```

This creates sample JSON, CSV, and Parquet files in `sample-data/` directory.

### 2. Upload to MinIO

If using MinIO with watsonx.data:

```bash
# Install MinIO client
brew install minio/stable/mc  # macOS
# or download from https://min.io/docs/minio/linux/reference/minio-mc.html

# Configure MinIO
mc alias set myminio http://localhost:9000 minioadmin minioadmin

# Create bucket
mc mb myminio/test-bucket

# Upload sample data
mc cp sample-data/*.json myminio/test-bucket/data/
```

### 3. Test Ingestion

1. Open http://localhost:3000
2. Navigate to "Ingestion" page
3. Fill in the form:
   - Catalog: `iceberg_data`
   - Schema: `test_schema`
   - Table: `test_table`
   - File Path: `s3://test-bucket/data/transactions.json`
   - File Type: `json`
4. Click "Create Job"
5. Monitor progress in "Jobs" page

### 4. API Testing

Test backend API directly:

```bash
# Health check
curl http://localhost:5000/health

# Get auth status
curl http://localhost:5000/api/auth/status

# List jobs
curl http://localhost:5000/api/ingestion/jobs

# Get default config
curl http://localhost:5000/api/ingestion/config/default
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

**Error**: `Port 5000 is already in use`

**Solution**:
```bash
# Find process using port
lsof -ti:5000

# Kill process
kill -9 <PID>

# Or use stop script
./scripts/stop.sh
```

#### 2. Cannot Connect to watsonx.data

**Error**: `Authentication failed: connect ECONNREFUSED`

**Solutions**:
- Verify watsonx.data is running: `docker ps`
- Check URL in configuration
- Verify credentials
- Check SSL certificate settings

#### 3. Module Not Found

**Error**: `Cannot find module 'express'`

**Solution**:
```bash
cd backend
rm -rf node_modules package-lock.json
npm install
```

#### 4. CORS Errors

**Error**: `Access-Control-Allow-Origin`

**Solution**:
- Verify `CORS_ORIGIN` in backend `.env`
- Check frontend is running on correct port
- Clear browser cache

#### 5. Token Expired

**Error**: `Token expired`

**Solution**:
- Token auto-refreshes every 55 minutes
- Manually refresh: `curl -X POST http://localhost:5000/api/auth/refresh`
- Restart backend if issues persist

### Debug Mode

Enable debug logging:

```bash
# Backend
cd backend
LOG_LEVEL=debug npm start

# Check logs
tail -f logs/combined.log
```

### Check Logs

```bash
# Backend logs
tail -f backend.log
tail -f backend/logs/combined.log
tail -f backend/logs/error.log

# Frontend logs
tail -f frontend.log
```

## Production Deployment

### 1. Build Frontend

```bash
cd frontend
npm run build
```

This creates optimized production build in `frontend/build/`.

### 2. Configure Production Environment

```bash
# Backend .env
NODE_ENV=production
WATSONX_BASE_URL=https://your-watsonx-instance:6443
CORS_ORIGIN=https://your-domain.com
LOG_LEVEL=warn
```

### 3. Serve Frontend

Option A: Using Express (Backend serves frontend)

```javascript
// Add to backend/server.js
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});
```

Option B: Using Nginx

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /path/to/frontend/build;
        try_files $uri /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. Process Management

Use PM2 for production:

```bash
# Install PM2
npm install -g pm2

# Start backend
cd backend
pm2 start server.js --name wxdata-backend

# Save configuration
pm2 save

# Setup startup script
pm2 startup
```

### 5. SSL/TLS Configuration

For production, use proper SSL certificates:

```bash
# Using Let's Encrypt
sudo certbot --nginx -d your-domain.com
```

### 6. Monitoring

Setup monitoring:

```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs wxdata-backend

# Check status
pm2 status
```

## Docker Deployment (Optional)

### Build Docker Images

```bash
# Backend
docker build -t wxdata-backend ./backend

# Frontend
docker build -t wxdata-frontend ./frontend
```

### Run with Docker Compose

```bash
docker-compose up -d
```

### Docker Compose Configuration

```yaml
version: '3.8'

services:
  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - WATSONX_BASE_URL=https://host.docker.internal:6443
      - NODE_ENV=production
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    depends_on:
      - backend
    restart: unless-stopped
```

## GitHub Deployment

Deploy to GitHub:

```bash
./scripts/deploy-github.sh
```

Or manually:

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin <your-repo-url>
git push -u origin main
```

## Security Checklist

- [ ] Change default watsonx.data credentials
- [ ] Use environment variables for sensitive data
- [ ] Enable HTTPS in production
- [ ] Configure proper CORS origins
- [ ] Set up rate limiting
- [ ] Enable security headers (Helmet)
- [ ] Regular dependency updates
- [ ] Implement authentication for production
- [ ] Set up monitoring and alerting
- [ ] Regular backups

## Performance Optimization

1. **Frontend**
   - Enable code splitting
   - Optimize images
   - Use CDN for static assets
   - Enable gzip compression

2. **Backend**
   - Enable response caching
   - Use connection pooling
   - Optimize database queries
   - Implement request queuing

3. **watsonx.data**
   - Optimize Spark configurations
   - Use appropriate file formats (Parquet)
   - Partition large datasets
   - Monitor resource usage

## Support

For issues and questions:
- Check [Troubleshooting](#troubleshooting) section
- Review logs in `backend/logs/`
- Consult [API Documentation](API.md)
- Consult [Architecture Documentation](ARCHITECTURE.md)
- IBM watsonx.data Documentation: https://www.ibm.com/docs/en/watsonxdata