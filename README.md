# watsonx.data Developer Edition Demo Application

A comprehensive demonstration application showcasing IBM watsonx.data Developer Edition capabilities including data ingestion, catalog management, and query execution.

## Overview

This application demonstrates the key features of watsonx.data Developer Edition:
- **Authentication & Authorization**: Bearer token-based API authentication
- **Catalog Management**: Full CRUD operations for catalogs with schema visualization and table metadata viewer
- **File Upload**: Upload data files directly from browser to MinIO/S3
- **Data Ingestion**: Automated data ingestion from various sources (S3, MinIO, uploaded files)
- **Query Interface**: Interactive SQL editor with syntax highlighting, query history, and result visualization
- **Query Execution**: Execute Presto/Spark queries against data lakehouse with SQL injection protection
- **Monitoring**: Real-time system monitoring with metrics and performance analytics
- **Web UI**: Interactive dashboard for managing watsonx.data operations
- **Containerization**: Docker and Kubernetes deployment support with security best practices

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Web UI (React)                               │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────┐ │
│  │Dashboard │  │Ingestion │  │  Query   │  │   Jobs   │  │Monitor│ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  └──────┘ │
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ REST API
                         │
┌────────────────────────▼────────────────────────────────────────────┐
│              Backend API Server (Node.js/Express)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────┐│
│  │ Auth Service │  │ Ingestion    │  │ Query        │  │Monitoring││
│  │              │  │ Service      │  │ Service      │  │ Service  ││
│  └──────────────┘  └──────────────┘  └──────────────┘  └─────────┘│
└────────────────────────┬────────────────────────────────────────────┘
                         │
                         │ HTTPS/REST
                         │
┌────────────────────────▼────────────────────────────────────────────┐
│           watsonx.data Developer Edition                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐              │
│  │ Presto       │  │ Spark        │  │ MinIO        │              │
│  │ Engine       │  │ Engine       │  │ Storage      │              │
│  └──────────────┘  └──────────────┘  └──────────────┘              │
│  ┌──────────────┐  ┌──────────────┐                                │
│  │ Iceberg      │  │ Hive         │                                │
│  │ Catalog      │  │ Catalog      │                                │
│  └──────────────┘  └──────────────┘                                │
└─────────────────────────────────────────────────────────────────────┘
```

## Prerequisites

- **watsonx.data Developer Edition** running locally
  - Default URL: `https://localhost:6443`
  - You'll need valid credentials (see Quick Start for setup)
- **Node.js** v18+ and npm
- **Python** 3.8+ (for data generation scripts)
- **Docker** (optional, for containerized deployment)
- **Kubernetes** (optional, for production deployment)

## Project Structure

```
wxData-Bob/
├── backend/                    # Backend API server
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── services/          # Business logic services
│   │   ├── routes/            # API routes
│   │   ├── middleware/        # Express middleware
│   │   └── utils/             # Utility functions
│   ├── package.json
│   └── server.js
├── frontend/                   # React frontend
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── pages/             # Page components
│   │   ├── services/          # API client services
│   │   └── utils/             # Utility functions
│   ├── public/
│   └── package.json
├── scripts/                    # Automation scripts
│   ├── start.sh              # Start application
│   ├── stop.sh               # Stop application
│   ├── deploy-github.sh      # Deploy to GitHub
│   ├── generate-data.sh      # Generate sample data with venv
│   ├── upload-sample-data.sh # Upload data to MinIO
│   └── detect-minio-endpoint.sh # Detect MinIO endpoint
├── docs/                      # Documentation
│   ├── QUICKSTART.md         # Quick start guide (START HERE!)
│   ├── API.md                # API documentation
│   ├── ARCHITECTURE.md       # Architecture details
│   └── DEPLOYMENT.md         # Deployment guide
├── k8s/                       # Kubernetes manifests
│   ├── README.md             # Kubernetes deployment guide
│   ├── namespace.yaml
│   ├── configmap.yaml
│   ├── secret.yaml.template  # Secret template (copy to secret.yaml)
│   ├── backend-deployment.yaml
│   ├── frontend-deployment.yaml
│   └── ingress.yaml
├── sample-data/               # Sample datasets
├── .env.example              # Environment variables template
├── .gitignore
├── docker-compose.yml        # Docker Compose configuration
├── DOCKER_SETUP.md          # Docker deployment guide
├── SECURITY_FIXES.md        # Security enhancements documentation
└── README.md
```

## Quick Start

> 📚 **New to this application?** Check out the comprehensive [**Quick Start Guide**](docs/QUICKSTART.md) for step-by-step instructions on using the UI and testing watsonx.data capabilities!

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd wxData-Bob

# Make scripts executable
chmod +x scripts/*.sh

# Generate sample data (optional but recommended)
./scripts/generate-data.sh

# Upload sample data to MinIO (optional)
# Uses default credentials: admin/password
# For custom credentials, see: docs/MINIO_CREDENTIALS.md
./scripts/upload-sample-data.sh
```

### 2. Start the Application

```bash
# Start all services (backend + frontend)
./scripts/start.sh
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **watsonx.data**: https://localhost:6443

### 3. Stop the Application

```bash
./scripts/stop.sh
```

## Features

### 1. Authentication
- Automatic bearer token generation
- Token refresh mechanism
- Secure credential management

### 2. File Upload & Data Ingestion
- **Browser-based file upload** to MinIO/S3
- Support for multiple file formats (JSON, CSV, Parquet, Avro, ORC)
- Upload progress tracking
- Automatic file type detection
- Batch and streaming ingestion
- S3/MinIO integration
- Job monitoring and status tracking

### 3. Catalog Management
- Create and manage Iceberg catalogs
- Create and manage Hive catalogs
- Schema creation and modification
- Table metadata viewing

### 4. Query Interface
- **SQL Editor** with syntax highlighting
- **Schema Browser** for easy table discovery
- **Query History** with one-click reload
- **Result Visualization** in tabular format
- **Export Results** to CSV or JSON
- **Quick Examples** for common queries
- Support for multiple catalogs and schemas

### 5. Monitoring Dashboard
- **Real-time Metrics**: CPU, memory, and request tracking
- **System Health**: Component status monitoring
- **Performance Analytics**: Response times and success rates
- **Endpoint Metrics**: Per-endpoint performance tracking
- **Auto-refresh**: Live data updates every 5 seconds
- **Historical Data**: Query and request history

## Configuration

### Backend Configuration

Edit [`backend/src/config/watsonx.config.js`](backend/src/config/watsonx.config.js):

```javascript
module.exports = {
  watsonxData: {
    baseUrl: 'https://localhost:6443',
    username: 'ibmlhadmin',
    password: 'password',
    instanceId: '0000-0000-0000-0000'
  }
};
```

### Frontend Configuration

Edit [`frontend/src/config.js`](frontend/src/config.js):

```javascript
export const API_BASE_URL = 'http://localhost:5000';
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Generate bearer token
- `POST /api/auth/refresh` - Refresh token

### Ingestion
- `POST /api/ingestion/jobs` - Create ingestion job
- `GET /api/ingestion/jobs` - List all jobs
- `GET /api/ingestion/jobs/:id` - Get job status
- `DELETE /api/ingestion/jobs/:id` - Cancel job

### Catalogs
- `GET /api/catalogs` - List catalogs
- `POST /api/catalogs` - Create catalog
- `GET /api/catalogs/:name/schemas` - List schemas
- `POST /api/catalogs/:name/schemas` - Create schema

### Query
- `POST /api/query/execute` - Execute SQL query
- `GET /api/query/status/:queryId` - Get query status
- `DELETE /api/query/cancel/:queryId` - Cancel running query
- `GET /api/query/catalogs` - List available catalogs
- `GET /api/query/catalogs/:catalog/schemas` - List schemas
- `GET /api/query/catalogs/:catalog/schemas/:schema/tables` - List tables
- `GET /api/query/history` - Get query history
- `POST /api/query/export` - Export query results

### Monitoring
- `GET /api/monitoring/metrics` - Get current system metrics
- `GET /api/monitoring/dashboard` - Get comprehensive dashboard data
- `GET /api/monitoring/realtime` - Get real-time metrics
- `GET /api/monitoring/health` - Get watsonx.data health status
- `GET /api/monitoring/system` - Get system information

See [API Documentation](docs/API.md) for complete details.

## Sample Use Cases

### 1. Ingest JSON Data from S3

```bash
curl -X POST http://localhost:5000/api/ingestion/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "target": {
      "catalog": "iceberg_data",
      "schema": "sales",
      "table": "transactions"
    },
    "source": {
      "file_paths": "s3://my-bucket/data/transactions.json",
      "file_type": "json",
      "bucket_details": {
        "bucket_name": "my-bucket",
        "bucket_type": "minio"
      }
    },
    "job_id": "ingest-transactions-001"
  }'
```

### 2. Query Data

```bash
curl -X POST http://localhost:5000/api/queries/execute \
  -H "Content-Type: application/json" \
  -d '{
    "query": "SELECT * FROM iceberg_data.sales.transactions LIMIT 10"
  }'
```

## Development

### Backend Development

```bash
cd backend
npm install
npm run dev  # Start with hot reload
```

### Frontend Development

```bash
cd frontend
npm install
npm start    # Start with hot reload
```

### Run Tests

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## Deployment

### Local Development

```bash
# Start all services
./scripts/start.sh

# Stop all services
./scripts/stop.sh
```

### Docker Deployment

```bash
# Using Docker Compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Kubernetes Deployment

```bash
# Deploy to Kubernetes
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secret.yaml
kubectl apply -f k8s/backend-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml

# Check deployment status
kubectl get pods -n wxdata-demo
kubectl get svc -n wxdata-demo
```

See [Deployment Guide](docs/DEPLOYMENT.md) for detailed instructions on Docker and Kubernetes deployments, including production considerations, monitoring, and troubleshooting.

### GitHub Deployment

```bash
./scripts/deploy-github.sh
```

This script will:
1. Create `.gitignore` (excluding `_*` folders)
2. Initialize git repository
3. Commit all files
4. Push to GitHub

## Troubleshooting

### Connection Issues

If you can't connect to watsonx.data:

1. Verify watsonx.data is running: `docker ps`
2. Check the URL in configuration
3. Verify SSL certificate (use `-k` flag for self-signed certs)

### Authentication Errors

1. Verify credentials in configuration
2. Check instance ID matches your deployment
3. Regenerate bearer token

### Ingestion Failures

1. Check source file paths
2. Verify bucket permissions
3. Review engine logs in watsonx.data console

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: <repository-url>/issues
- Documentation: [IBM watsonx.data Docs](https://www.ibm.com/docs/en/watsonxdata)

## Acknowledgments

- IBM watsonx.data team
- Apache Iceberg community
- Presto/Trino community