# watsonx.data Demo Application - API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Catalog API](#catalog-api)
4. [Upload API](#upload-api)
5. [Ingestion API](#ingestion-api)
6. [Query API](#query-api)
7. [Monitoring API](#monitoring-api)
8. [Error Handling](#error-handling)
9. [Rate Limiting](#rate-limiting)
10. [Examples](#examples)

## Overview

The watsonx.data Demo Application provides a RESTful API for interacting with IBM watsonx.data Developer Edition. All API endpoints are prefixed with `/api`.

**Base URL**: `http://localhost:5001/api`

**Content Type**: `application/json`

**Response Format**: All responses follow this structure:
```json
{
  "success": true|false,
  "data": { ... },      // Present on success
  "error": "message"    // Present on failure
}
```

## Authentication

### Generate Bearer Token

Generate a new bearer token for authenticating with watsonx.data.

**Endpoint**: `POST /api/auth/login`

**Request Body**: None (uses configured credentials)

**Response**:
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "tokenInfo": {
      "hasToken": true,
      "isExpired": false,
      "expiresAt": "2024-01-30T15:00:00.000Z",
      "expiresIn": 3600000
    }
  }
}
```

**Example**:
```bash
curl -X POST http://localhost:5000/api/auth/login
```

---

### Refresh Token

Manually refresh the bearer token.

**Endpoint**: `POST /api/auth/refresh`

**Request Body**: None

---

## Catalog API

### List All Catalogs

Get a list of all available catalogs.

**Endpoint**: `GET /api/catalog`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "name": "iceberg_data",
      "type": "iceberg",
      "description": "Iceberg catalog for data lakehouse"
    }
  ]
}
```

**Example**:
```bash
curl http://localhost:3001/api/catalog
```

---

### Get Catalog Details

Get detailed information about a specific catalog.

**Endpoint**: `GET /api/catalog/:name`

**Parameters**:
- `name` (path, required): Catalog name

**Response**:
```json
{
  "success": true,
  "data": {
    "name": "iceberg_data",
    "type": "iceberg",
    "description": "Iceberg catalog",
    "properties": {}
  }
}
```

**Example**:
```bash
curl http://localhost:3001/api/catalog/iceberg_data
```

---

### Create Catalog

Create a new catalog.

**Endpoint**: `POST /api/catalog`

**Request Body**:
```json
{
  "name": "my_catalog",
  "type": "iceberg",
  "description": "My new catalog",
  "properties": {}
}
```

**Parameters**:
- `name` (string, required): Catalog name (alphanumeric, underscore, hyphen only)
- `type` (string, required): Catalog type (iceberg, hive, delta)
- `description` (string, optional): Catalog description
- `properties` (object, optional): Additional properties

**Response**:
```json
{
  "success": true,
  "data": {
    "name": "my_catalog",
    "type": "iceberg",
    "message": "Catalog created successfully"
  }
}
```

**Example**:
```bash
curl -X POST http://localhost:3001/api/catalog \
  -H "Content-Type: application/json" \
  -d '{
    "name": "my_catalog",
    "type": "iceberg",
    "description": "My new catalog"
  }'
```

---

### Update Catalog

Update an existing catalog.

**Endpoint**: `PATCH /api/catalog/:name`

**Parameters**:
- `name` (path, required): Catalog name

**Request Body**:
```json
{
  "description": "Updated description",
  "properties": {
    "key": "value"
  }
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "message": "Catalog updated successfully"
  }
}
```

**Example**:
```bash
curl -X PATCH http://localhost:3001/api/catalog/my_catalog \
  -H "Content-Type: application/json" \
  -d '{
    "description": "Updated description"
  }'
```

---

### Delete Catalog

Delete a catalog.

**Endpoint**: `DELETE /api/catalog/:name`

**Parameters**:
- `name` (path, required): Catalog name

**Response**:
```json
{
  "success": true,
  "data": {
    "success": true,
    "message": "Catalog deleted successfully"
  }
}
```

**Example**:
```bash
curl -X DELETE http://localhost:3001/api/catalog/my_catalog
```

---

### Get Catalog Statistics

Get statistics for a catalog (schema count, table count).

**Endpoint**: `GET /api/catalog/:name/stats`

**Parameters**:
- `name` (path, required): Catalog name

**Response**:
```json
{
  "success": true,
  "data": {
    "catalogName": "iceberg_data",
    "schemaCount": 3,
    "tableCount": 15
  }
}
```

**Example**:
```bash
curl http://localhost:3001/api/catalog/iceberg_data/stats
```

---

### Get Schema Tree

Get hierarchical view of schemas and tables in a catalog.

**Endpoint**: `GET /api/catalog/:name/tree`

**Parameters**:
- `name` (path, required): Catalog name

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "name": "default",
      "type": "schema",
      "tables": [
        {
          "name": "customers",
          "type": "TABLE"
        },
        {
          "name": "orders",
          "type": "TABLE"
        }
      ]
    }
  ]
}
```

**Example**:
```bash
curl http://localhost:3001/api/catalog/iceberg_data/tree
```

---

### Get Table Metadata

Get detailed metadata for a specific table.

**Endpoint**: `GET /api/catalog/:catalog/schema/:schema/table/:table/metadata`

**Parameters**:
- `catalog` (path, required): Catalog name
- `schema` (path, required): Schema name
- `table` (path, required): Table name

**Response**:
```json
{
  "success": true,
  "data": {
    "name": "customers",
    "type": "TABLE",
    "columns": [
      {
        "name": "id",
        "type": "bigint",
        "nullable": false
      },
      {
        "name": "name",
        "type": "varchar",
        "nullable": true
      }
    ],
    "properties": {
      "format": "parquet",
      "location": "s3://bucket/path"
    }
  }
}
```

**Example**:
```bash
curl http://localhost:3001/api/catalog/iceberg_data/schema/default/table/customers/metadata
```

---

**Response**: Same as login

**Example**:

## Upload API

### Upload Single File

Upload a file to MinIO/S3 storage.

**Endpoint**: `POST /api/upload`

**Content-Type**: `multipart/form-data`

**Request Parameters**:
- `file` (file, required): The file to upload
- `bucket` (string, required): Target bucket name
- `path` (string, optional): Path within bucket (default: root)

**Supported File Types**:
- JSON (`.json`)
- CSV (`.csv`)
- Parquet (`.parquet`)
- Avro (`.avro`)
- ORC (`.orc`)

**File Size Limit**: 100MB

**Example Request** (using curl):
```bash
curl -X POST http://localhost:5001/api/upload \
  -F "file=@/path/to/data.json" \
  -F "bucket=iceberg-bucket" \
  -F "path=uploads"
```

**Example Request** (using JavaScript):
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('bucket', 'iceberg-bucket');
formData.append('path', 'uploads');

const response = await axios.post('/api/upload', formData, {
  headers: {
    'Content-Type': 'multipart/form-data',
  },
  onUploadProgress: (progressEvent) => {
    const percentCompleted = Math.round(
      (progressEvent.loaded * 100) / progressEvent.total
    );
    console.log(`Upload progress: ${percentCompleted}%`);
  },
});
```

**Response**:
```json
{
  "success": true,
  "data": {
    "fileName": "data.json",
    "bucket": "iceberg-bucket",
    "key": "uploads/data.json",
    "size": 1024567,
    "contentType": "application/json",
    "s3Path": "s3://iceberg-bucket/uploads/data.json"
  }
}
```

**Error Response**:
```json
{
  "success": false,
  "error": "File type not allowed. Allowed types: .json, .csv, .parquet, .avro, .orc"
}
```

---

### Upload Multiple Files

Upload multiple files to MinIO/S3 storage in a single request.

**Endpoint**: `POST /api/upload/multiple`

**Content-Type**: `multipart/form-data`

**Request Parameters**:
- `files` (files, required): Array of files to upload (max 10)
- `bucket` (string, required): Target bucket name
- `path` (string, optional): Path within bucket

**Example Request** (using curl):
```bash
curl -X POST http://localhost:5001/api/upload/multiple \
  -F "files=@/path/to/data1.json" \
  -F "files=@/path/to/data2.csv" \
  -F "bucket=iceberg-bucket" \
  -F "path=uploads"
```

**Response**:
```json
{
  "success": true,
  "data": {
    "uploaded": [
      {
        "fileName": "data1.json",
        "bucket": "iceberg-bucket",
        "key": "uploads/data1.json",
        "size": 1024567,
        "s3Path": "s3://iceberg-bucket/uploads/data1.json",
        "success": true
      },
      {
        "fileName": "data2.csv",
        "bucket": "iceberg-bucket",
        "key": "uploads/data2.csv",
        "size": 2048123,
        "s3Path": "s3://iceberg-bucket/uploads/data2.csv",
        "success": true
      }
    ],
    "failed": [],
    "total": 2,
    "successful": 2,
    "failed": 0
  }
}
```

---

```bash
curl -X POST http://localhost:5000/api/auth/refresh
```

---

### Get Authentication Status

Check current authentication status and token information.

**Endpoint**: `GET /api/auth/status`

**Response**:
```json
{
  "success": true,
  "data": {
    "hasToken": true,
    "isExpired": false,
    "expiresAt": "2024-01-30T15:00:00.000Z",
    "expiresIn": 3600000
  }
}
```

**Example**:
```bash
curl http://localhost:5000/api/auth/status
```

---

### Logout

Invalidate the current bearer token.

**Endpoint**: `POST /api/auth/logout`

**Response**:
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Example**:
```bash
curl -X POST http://localhost:5000/api/auth/logout
```

---

## Ingestion API

### Create Ingestion Job

Create a new data ingestion job.

**Endpoint**: `POST /api/ingestion/jobs`

**Request Body**:
```json
{
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
  "job_id": "ingestion-001",
  "engine_id": "spark158",
  "execute_config": {
    "driver_memory": "4G",
    "driver_cores": 2,
    "executor_memory": "4G",
    "executor_cores": 2,
    "num_executors": 1
  }
}
```

**Required Fields**:
- `target.catalog` - Target catalog name
- `target.schema` - Target schema name
- `target.table` - Target table name
- `source.file_paths` - Source file path(s)
- `source.file_type` - File type (json, csv, parquet, avro, orc)

**Optional Fields**:
- `job_id` - Custom job ID (auto-generated if not provided)
- `engine_id` - Spark engine ID (uses default if not provided)
- `execute_config` - Engine execution configuration (uses defaults if not provided)

**Response**:
```json
{
  "success": true,
  "data": {
    "instance_id": "0000-0000-0000-0000",
    "job_id": "ingestion-001",
    "application_id": "8418c042-645b-4125-94dc-fe9871f2b203",
    "username": "ibmlhadmin",
    "start_timestamp": "1759247749366117610",
    "status": "starting",
    "source_data_files": "s3://my-bucket/data/transactions.json",
    "target_table": "iceberg_data.sales.transactions"
  }
}
```

**Example**:
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
    }
  }'
```

---

### List Ingestion Jobs

List all ingestion jobs with optional filtering.

**Endpoint**: `GET /api/ingestion/jobs`

**Query Parameters**:
- `status` (optional) - Filter by status (starting, running, completed, failed)
- `limit` (optional) - Number of results (default: 50)
- `offset` (optional) - Pagination offset (default: 0)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "job_id": "ingestion-001",
      "status": "completed",
      "start_timestamp": "1759247749366117610",
      "end_timestamp": "1759247849366117610",
      "source_data_files": "s3://my-bucket/data/transactions.json",
      "target_table": "iceberg_data.sales.transactions"
    }
  ]
}
```

**Example**:
```bash
# List all jobs
curl http://localhost:5000/api/ingestion/jobs

# List completed jobs
curl "http://localhost:5000/api/ingestion/jobs?status=completed"

# List with pagination
curl "http://localhost:5000/api/ingestion/jobs?limit=10&offset=0"
```

---

### Get Job Status

Get the status of a specific ingestion job.

**Endpoint**: `GET /api/ingestion/jobs/:jobId`

**Path Parameters**:
- `jobId` - The job ID

**Response**:
```json
{
  "success": true,
  "data": {
    "instance_id": "0000-0000-0000-0000",
    "job_id": "ingestion-001",
    "application_id": "8418c042-645b-4125-94dc-fe9871f2b203",
    "username": "ibmlhadmin",
    "start_timestamp": "1759247749366117610",
    "end_timestamp": "1759247849366117610",
    "status": "completed",
    "source_data_files": "s3://my-bucket/data/transactions.json",
    "target_table": "iceberg_data.sales.transactions",
    "details": "Ingestion completed successfully"
  }
}
```

**Job Statuses**:
- `starting` - Job is initializing
- `running` - Job is in progress
- `completed` - Job completed successfully
- `failed` - Job failed with errors
- `cancelled` - Job was cancelled

**Example**:
```bash
curl http://localhost:5000/api/ingestion/jobs/ingestion-001
```

---

### Cancel Ingestion Job

Cancel a running ingestion job.

**Endpoint**: `DELETE /api/ingestion/jobs/:jobId`

**Path Parameters**:
- `jobId` - The job ID to cancel

**Response**:
```json
{
  "success": true,
  "data": {
    "job_id": "ingestion-001",
    "status": "cancelled",
    "message": "Job cancelled successfully"
  }
}
```

**Example**:
```bash
curl -X DELETE http://localhost:5000/api/ingestion/jobs/ingestion-001
```

---

### Get Default Configuration

Get the default ingestion configuration.

**Endpoint**: `GET /api/ingestion/config/default`

**Response**:
```json
{
  "success": true,
  "data": {
    "engine_id": "spark158",
    "execute_config": {
      "driver_memory": "4G",
      "driver_cores": 2,
      "executor_memory": "4G",
      "executor_cores": 2,
      "num_executors": 1
    },
    "bucket_details": {
      "bucket_name": "iceberg-bucket",
      "bucket_type": "minio"
    }
  }
}
```

**Example**:
```bash
curl http://localhost:5000/api/ingestion/config/default
```

---

### Get Supported File Types

Get list of supported file types for ingestion.

**Endpoint**: `GET /api/ingestion/file-types`

**Response**:
```json
{
  "success": true,
  "data": ["json", "csv", "parquet", "avro", "orc"]
}
```

**Example**:
```bash
curl http://localhost:5000/api/ingestion/file-types
```

---

### Validate Configuration

Validate an ingestion configuration without creating a job.

**Endpoint**: `POST /api/ingestion/validate`

**Request Body**: Same as create ingestion job

**Response**:
```json
{
  "success": true,
  "data": {
    "valid": true,
    "errors": []
  }
}
```

Or if invalid:
```json
{
  "success": true,
  "data": {
    "valid": false,
    "errors": [
      "Target catalog is required",
      "Invalid file type. Must be one of: json, csv, parquet, avro, orc"
    ]
  }
}
```

**Example**:
```bash
curl -X POST http://localhost:5000/api/ingestion/validate \
  -H "Content-Type: application/json" \
  -d '{
    "target": {
      "catalog": "iceberg_data",
      "schema": "sales",
      "table": "transactions"
    },
    "source": {
      "file_paths": "s3://my-bucket/data/transactions.json",
      "file_type": "json"
    }
  }'
```

---
## Monitoring API

The Monitoring API provides real-time system metrics, resource utilization, and performance analytics.

### Get System Metrics

Get current system metrics including CPU, memory, and request statistics.

**Endpoint**: `GET /api/monitoring/metrics`

**Response**:
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-01-30T14:30:00.000Z",
    "uptime": 3600,
    "requests": {
      "total": 150,
      "success": 145,
      "failed": 5,
      "successRate": "96.67"
    },
    "performance": {
      "avgResponseTime": "125.50",
      "recentResponseTimes": [120, 130, 115, ...]
    },
    "system": {
      "uptime": 3600,
      "memory": {
        "total": 17179869184,
        "free": 8589934592,
        "used": 8589934592,
        "usagePercent": "50.00"
      },
      "cpu": {
        "cores": 8,
        "model": "Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz",
        "loadAverage": [2.5, 2.3, 2.1],
        "usage": 45
      },
      "platform": {
        "type": "Darwin",
        "platform": "darwin",
        "arch": "x64",
        "release": "21.6.0"
      }
    },
    "endpoints": [
      {
        "endpoint": "/api/ingestion/jobs",
        "total": 50,
        "success": 48,
        "failed": 2,
        "avgResponseTime": "150.25",
        "successRate": "96.00"
      }
    ]
  }
}
```

**Example**:
```bash
curl http://localhost:5001/api/monitoring/metrics
```

---

### Get Dashboard Data

Get comprehensive dashboard data including system metrics and watsonx.data health.

**Endpoint**: `GET /api/monitoring/dashboard`

**Response**:
```json
{
  "success": true,
  "data": {
    "timestamp": "2024-01-30T14:30:00.000Z",
    "uptime": 3600,
    "requests": {
      "total": 150,
      "success": 145,
      "failed": 5,
      "successRate": "96.67"
    },
    "performance": {
      "avgResponseTime": "125.50",
      "recentResponseTimes": [120, 130, 115, ...]
    },
    "system": { ... },
    "watsonx": {
      "status": "healthy",
      "connected": true,
      "details": { ... }
    },
    "health": {
      "overall": "healthy",
      "components": {
        "api": "healthy",
        "memory": "healthy",
        "watsonx": "healthy"
      }
    },
    "endpoints": [ ... ]
  }
}
```

**Example**:
```bash
curl http://localhost:5001/api/monitoring/dashboard
```

---

### Get Real-time Metrics

Get real-time metrics for streaming and live updates.

**Endpoint**: `GET /api/monitoring/realtime`

**Response**:
```json
{
  "success": true,
  "data": {
    "timestamp": 1706623800000,
    "cpu": 45,
    "memory": 50.00,
    "requests": {
      "total": 150,
      "success": 145,
      "failed": 5
    },
    "performance": {
      "avgResponseTime": "125.50"
    }
  }
}
```

**Example**:
```bash
curl http://localhost:5001/api/monitoring/realtime
```

**Usage**: Poll this endpoint every 5 seconds for real-time dashboard updates.

---

### Get watsonx.data Health

Check the health status of watsonx.data connection.

**Endpoint**: `GET /api/monitoring/health`

**Response**:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "connected": true,
    "details": {
      "version": "2.0.0",
      "services": ["presto", "spark", "minio"]
    }
  }
}
```

**Example**:
```bash
curl http://localhost:5001/api/monitoring/health
```

---

### Get System Information

Get detailed system information.

**Endpoint**: `GET /api/monitoring/system`

**Response**:
```json
{
  "success": true,
  "data": {
    "system": {
      "uptime": 3600,
      "memory": {
        "total": 17179869184,
        "free": 8589934592,
        "used": 8589934592,
        "usagePercent": "50.00"
      },
      "cpu": {
        "cores": 8,
        "model": "Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz",
        "loadAverage": [2.5, 2.3, 2.1],
        "usage": 45
      },
      "platform": {
        "type": "Darwin",
        "platform": "darwin",
        "arch": "x64",
        "release": "21.6.0"
      }
    },
    "uptime": 3600
  }
}
```

**Example**:
```bash
curl http://localhost:5001/api/monitoring/system
```

---

### Reset Metrics

Reset all collected metrics (admin operation).

**Endpoint**: `POST /api/monitoring/reset`

**Response**:
```json
{
  "success": true,
  "message": "Metrics reset successfully"
}
```

**Example**:
```bash
curl -X POST http://localhost:5001/api/monitoring/reset
```

---


## Error Handling

### Error Response Format

All errors follow this format:

```json
{
  "success": false,
  "error": "Error message describing what went wrong"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created (for POST requests)
- `400` - Bad Request (validation errors)
- `401` - Unauthorized (authentication failed)
- `404` - Not Found
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

### Common Errors

**Authentication Failed**:
```json
{
  "success": false,
  "error": "Authentication failed: Invalid credentials"
}
```

**Validation Error**:
```json
{
  "success": false,
  "errors": [
    "Target catalog is required",
    "Source file paths are required"
  ]
}
```

**Job Not Found**:
```json
{
  "success": false,
  "error": "Failed to get job status: Job not found"
}
```

---

## Rate Limiting

The API implements rate limiting to prevent abuse:

- **Window**: 15 minutes
- **Max Requests**: 100 per IP address
- **Response Header**: `X-RateLimit-Remaining`

When rate limit is exceeded:
```json
{
  "success": false,
  "error": "Too many requests from this IP, please try again later."
}
```

---

## Examples

### Complete Ingestion Workflow

```bash
# 1. Check authentication status
curl http://localhost:5000/api/auth/status

# 2. Get default configuration
curl http://localhost:5000/api/ingestion/config/default

# 3. Validate configuration
curl -X POST http://localhost:5000/api/ingestion/validate \
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
    }
  }'

# 4. Create ingestion job
JOB_ID=$(curl -X POST http://localhost:5000/api/ingestion/jobs \
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
    }
  }' | jq -r '.data.job_id')

# 5. Monitor job status
while true; do
  STATUS=$(curl -s http://localhost:5000/api/ingestion/jobs/$JOB_ID | jq -r '.data.status')
  echo "Job status: $STATUS"
  if [ "$STATUS" = "completed" ] || [ "$STATUS" = "failed" ]; then
    break
  fi
  sleep 5
done

# 6. Get final job details
curl http://localhost:5000/api/ingestion/jobs/$JOB_ID
```

### Using with JavaScript/Node.js

```javascript
const axios = require('axios');

const API_BASE = 'http://localhost:5000/api';

// Create ingestion job
async function createIngestionJob() {
  try {
    const response = await axios.post(`${API_BASE}/ingestion/jobs`, {
      target: {
        catalog: 'iceberg_data',
        schema: 'sales',
        table: 'transactions'
      },
      source: {
        file_paths: 's3://my-bucket/data/transactions.json',
        file_type: 'json',
        bucket_details: {
          bucket_name: 'my-bucket',
          bucket_type: 'minio'
        }
      }
    });
    
    console.log('Job created:', response.data.data.job_id);
    return response.data.data.job_id;
  } catch (error) {
    console.error('Error:', error.response.data.error);
  }
}

// Monitor job status
async function monitorJob(jobId) {
  const checkStatus = async () => {
    const response = await axios.get(`${API_BASE}/ingestion/jobs/${jobId}`);
    const status = response.data.data.status;
    console.log(`Job status: ${status}`);
    
    if (status === 'completed' || status === 'failed') {
      return status;
    }
    
    await new Promise(resolve => setTimeout(resolve, 5000));
    return checkStatus();
  };
  
  return checkStatus();
}

// Run workflow
(async () => {
  const jobId = await createIngestionJob();
  if (jobId) {
    await monitorJob(jobId);
  }
})();
```

### Using with Python

```python
import requests
import time

API_BASE = 'http://localhost:5000/api'

def create_ingestion_job():
    """Create a new ingestion job"""
    response = requests.post(f'{API_BASE}/ingestion/jobs', json={
        'target': {
            'catalog': 'iceberg_data',
            'schema': 'sales',
            'table': 'transactions'
        },
        'source': {
            'file_paths': 's3://my-bucket/data/transactions.json',
            'file_type': 'json',
            'bucket_details': {
                'bucket_name': 'my-bucket',
                'bucket_type': 'minio'
            }
        }
    })
    
    if response.status_code == 201:
        job_id = response.json()['data']['job_id']
        print(f'Job created: {job_id}')
        return job_id
    else:
        print(f'Error: {response.json()["error"]}')
        return None

def monitor_job(job_id):
    """Monitor job status until completion"""
    while True:
        response = requests.get(f'{API_BASE}/ingestion/jobs/{job_id}')
        status = response.json()['data']['status']
        print(f'Job status: {status}')
        
        if status in ['completed', 'failed']:
            return status
        
        time.sleep(5)

# Run workflow
if __name__ == '__main__':
    job_id = create_ingestion_job()
    if job_id:
        final_status = monitor_job(job_id)
        print(f'Job finished with status: {final_status}')
```

---

## Health Check

Check if the API server is running.

**Endpoint**: `GET /health`

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-30T14:00:00.000Z",
  "uptime": 3600,
  "environment": "development"
}
```

**Example**:
```bash
curl http://localhost:5000/health