# watsonx.data Developer Edition Demo Application

A comprehensive demonstration application showcasing IBM watsonx.data Developer Edition capabilities including data ingestion, catalog management, and query execution.

## Overview

This application demonstrates the key features of watsonx.data Developer Edition:
- **Authentication & Authorization**: Bearer token-based API authentication
- **Data Ingestion**: Automated data ingestion from various sources (S3, MinIO, local files)
- **Catalog Management**: Create and manage Iceberg and Hive catalogs
- **Query Execution**: Execute Presto/Spark queries against data lakehouse
- **Monitoring**: Track ingestion jobs and query performance
- **Web UI**: Interactive dashboard for managing watsonx.data operations

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Web UI (React)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │Dashboard │  │Ingestion │  │ Catalogs │  │ Queries  │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ REST API
                         │
┌────────────────────────▼────────────────────────────────────┐
│              Backend API Server (Node.js/Express)           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth Service │  │ Ingestion    │  │ Query        │     │
│  │              │  │ Service      │  │ Service      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTPS/REST
                         │
┌────────────────────────▼────────────────────────────────────┐
│           watsonx.data Developer Edition                    │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Presto       │  │ Spark        │  │ MinIO        │     │
│  │ Engine       │  │ Engine       │  │ Storage      │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │ Iceberg      │  │ Hive         │                        │
│  │ Catalog      │  │ Catalog      │                        │
│  └──────────────┘  └──────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Prerequisites

- **watsonx.data Developer Edition** running locally
  - Default URL: `https://localhost:6443`
  - Default credentials: `ibmlhadmin` / `password`
- **Node.js** v18+ and npm
- **Python** 3.8+ (for data generation scripts)
- **Docker** (optional, for containerized deployment)

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
│   └── generate-data.py      # Generate sample data
├── docs/                      # Documentation
│   ├── QUICKSTART.md         # Quick start guide (START HERE!)
│   ├── API.md                # API documentation
│   ├── ARCHITECTURE.md       # Architecture details
│   └── DEPLOYMENT.md         # Deployment guide
├── sample-data/               # Sample datasets
├── .gitignore
├── docker-compose.yml
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

### 2. Data Ingestion
- Support for multiple file formats (JSON, CSV, Parquet, Avro)
- Batch and streaming ingestion
- S3/MinIO integration
- Local file upload
- Job monitoring and status tracking

### 3. Catalog Management
- Create and manage Iceberg catalogs
- Create and manage Hive catalogs
- Schema creation and modification
- Table metadata viewing

### 4. Query Execution
- Interactive SQL query interface
- Query history
- Result visualization
- Export results (CSV, JSON)

### 5. Monitoring Dashboard
- Real-time job status
- Performance metrics
- Resource utilization
- Error tracking

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

### Queries
- `POST /api/queries/execute` - Execute query
- `GET /api/queries/history` - Query history
- `GET /api/queries/:id/results` - Get query results

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

### Docker Deployment

```bash
docker-compose up -d
```

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