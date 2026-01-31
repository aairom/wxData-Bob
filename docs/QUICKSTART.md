# Quick Start Guide

This guide will help you get started with the watsonx.data Demo Application and explore its capabilities.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Starting the Application](#starting-the-application)
3. [Understanding the UI](#understanding-the-ui)
4. [Using the Query Interface](#using-the-query-interface)
5. [Monitoring System Performance](#monitoring-system-performance)
6. [Testing watsonx.data Capabilities](#testing-watsonxdata-capabilities)
7. [Common Use Cases](#common-use-cases)
8. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before you begin, ensure you have:

✅ **watsonx.data Developer Edition** running on your laptop
- Access URL: https://localhost:6443
- Default credentials: `ibmlhadmin` / `password`

✅ **Node.js v18+** installed
```bash
node --version  # Should show v18 or higher
```

✅ **Sample Data** (optional but recommended)
```bash
# Generate sample data locally
./scripts/generate-data.sh

# Upload to MinIO/S3 (uses default credentials: admin/password)
./scripts/upload-sample-data.sh
```
These scripts automatically handle data generation and upload to watsonx.data storage.

> 📝 **Need custom credentials?** See [`docs/MINIO_CREDENTIALS.md`](MINIO_CREDENTIALS.md) for help finding your MinIO access keys.

---

## Starting the Application

### 1. Start watsonx.data Developer Edition

First, ensure watsonx.data is running:
```bash
# Check if watsonx.data is accessible
curl -k https://localhost:6443/api/v2/health
```

### 2. Start the Demo Application

```bash
./scripts/start.sh
```

The script will:
- ✅ Check Node.js and npm versions
- ✅ Verify ports 3000 and 5001 are available
- ✅ Install dependencies (if needed)
- ✅ Start backend server on port 5001
- ✅ Start frontend server on port 3000
- ✅ Open browser automatically

### 3. Access the Application

Once started, open your browser to:
- **Frontend UI**: http://localhost:3000
- **Backend API**: http://localhost:5001

---

## Understanding the UI

### Dashboard Page (`/dashboard`)

The **Dashboard** is your command center for monitoring watsonx.data operations.

#### What You'll See:

1. **System Status Card**
   - Shows connection status to watsonx.data
   - Displays authentication state
   - Real-time health monitoring

2. **Quick Stats**
   - Total ingestion jobs created
   - Active jobs currently running
   - Completed jobs count
   - Failed jobs requiring attention

3. **Recent Activity**
   - Latest ingestion jobs
   - Job status updates
   - Quick access to job details

#### How to Use:
- **Green indicators** = System healthy
- **Red indicators** = Connection issues (check watsonx.data)
- Click **"Refresh"** to update stats
- Click job names to view details

---

### Ingestion Page (`/ingestion`)

The **Ingestion Page** lets you create data ingestion jobs to load data into watsonx.data.

#### Two Ways to Provide Source Data:

**Option 1: Upload File (NEW!)** 🎉
- Click **"Select File"** button
- Choose your data file (JSON, CSV, Parquet, Avro, ORC)
- Click **"Upload to MinIO"**
- Watch upload progress bar
- File path auto-fills after upload

**Option 2: Enter Path Manually**
- Type S3/MinIO path directly
- For files already in storage

#### Step-by-Step Guide:

**Step 1: Configure Source**

*Using File Upload:*
```
┌─────────────────────────────────────┐
│ Option 1: Upload File               │
├─────────────────────────────────────┤
│ [Select File] [data.json] [Upload]  │
│ ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░ 50%           │
│ ✓ Uploaded: s3://bucket/data.json   │
└─────────────────────────────────────┘
```

*Or Manual Entry:*
```
┌─────────────────────────────────────┐
│ Option 2: Enter Path Manually       │
├─────────────────────────────────────┤
│ Path: s3://iceberg-bucket/data.json │
└─────────────────────────────────────┘
```

**Step 2: Configure Target**
```
┌─────────────────────────────────────┐
│ Target Configuration                │
├─────────────────────────────────────┤
│ Catalog: [iceberg_data ▼]          │
│ Schema: sales                       │
│ Table: transactions                 │
└─────────────────────────────────────┘
```

**Step 3: Set Options**
```
┌─────────────────────────────────────┐
│ Ingestion Options                   │
├─────────────────────────────────────┤
│ Engine: [spark158 ▼]               │
│ Mode: [append/overwrite ▼]         │
│ Partition: date                     │
└─────────────────────────────────────┘
```

**Step 4: Submit**
- Click **"Create Ingestion Job"**
- Job will appear in Jobs page
- Monitor progress in real-time

#### Supported Formats:
- ✅ **Parquet** - Columnar format (recommended)
- ✅ **CSV** - Comma-separated values
- ✅ **JSON** - JavaScript Object Notation
- ✅ **Avro** - Binary format with schema
- ✅ **ORC** - Optimized Row Columnar

---

### Jobs Page (`/jobs`)

The **Jobs Page** displays all ingestion jobs with real-time status updates.

#### Job Status Indicators:

| Status | Icon | Meaning |
|--------|------|---------|
| **Pending** | ⏳ | Job queued, waiting to start |
| **Running** | ▶️ | Job actively processing data |
| **Completed** | ✅ | Job finished successfully |
| **Failed** | ❌ | Job encountered an error |

#### Job Actions:

1. **View Details**
   - Click job row to expand
   - See configuration, logs, metrics

2. **Refresh Status**
   - Click **"Refresh"** button
   - Auto-refresh every 30 seconds

3. **Filter Jobs**
   - Use search box to filter by name
   - Filter by status (All/Running/Completed/Failed)

#### Understanding Job Details:

```
Job ID: job-1234567890
Status: Running
Progress: 45%
Records Processed: 450,000 / 1,000,000
Duration: 2m 34s
Engine: spark158
Source: s3://iceberg-bucket/data/sales/
Target: iceberg_data.sales.transactions
---

## Using the Query Interface

### Query Page (`/query`)

The **Query Page** provides an interactive SQL editor for querying data in watsonx.data.

#### Key Features:

1. **SQL Editor**
   - Monospace font for better code readability
   - Multi-line query support
   - Copy SQL to clipboard

2. **Catalog Browser**
   - Select catalog (e.g., `iceberg_data`)
   - Choose schema (e.g., `default`, `sales`)
   - Browse available tables

3. **Schema Browser (Right Panel)**
   - View all tables in selected schema
   - Click table name to see details
   - Insert table name into query with one click

4. **Query History**
   - View all previously executed queries
   - One-click reload of past queries
   - See execution time and row counts
   - Filter by status (completed/failed)

5. **Result Visualization**
   - Tabular display of query results
   - Column names and data types
   - NULL value highlighting
   - Pagination for large result sets

6. **Export Results**
   - Download as CSV
   - Download as JSON
   - Preserve column names and data types

#### Step-by-Step Guide:

**Step 1: Select Catalog and Schema**
```
┌─────────────────────────────────────┐
│ Catalog: [iceberg_data ▼]          │
│ Schema:  [default ▼]                │
└─────────────────────────────────────┘
```

**Step 2: Write Your Query**
```sql
SELECT * FROM iceberg_data.default.customers 
WHERE country = 'USA' 
LIMIT 10;
```

**Step 3: Execute**
- Click **"Execute Query"** button
- Watch execution progress
- View results in table below

**Step 4: Export (Optional)**
- Click **"Export"** dropdown
- Choose CSV or JSON format
- File downloads automatically

#### Quick Examples:

The Query page includes pre-built examples:

1. **Select from customers**
   ```sql
   SELECT * FROM iceberg_data.default.customers LIMIT 10;
   ```

2. **Count records**
   ```sql
   SELECT COUNT(*) as total FROM iceberg_data.default.customers;
   ```

3. **Show tables**
   ```sql
   SHOW TABLES FROM iceberg_data.default;
   ```

#### Tips:

- Use **Ctrl+Enter** to execute query (coming soon)
- Click table names in Schema Browser to insert into query
- Query history persists across sessions
- Failed queries are saved for debugging
- Use LIMIT clause for large tables

---

## Monitoring System Performance

### Monitoring Page (`/monitoring`)

The **Monitoring Page** provides real-time insights into system performance and health.

#### Dashboard Sections:

**1. System Status Alert**
```
┌─────────────────────────────────────────┐
│ ✓ System Status: HEALTHY               │
│ Last updated: 2024-01-30 14:30:00      │
└─────────────────────────────────────────┘
```

**2. Key Metrics Cards**

*CPU Usage*
```
┌─────────────────────┐
│ CPU Usage           │
│ 45%                 │
│ ▓▓▓▓▓▓▓▓▓░░░░░░░░░ │
│ 8 cores             │
└─────────────────────┘
```

*Memory*
```
┌─────────────────────┐
│ Memory              │
│ 62%                 │
│ ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░ │
│ 5.2 GB / 8.0 GB     │
└─────────────────────┘
```

*Requests*
```
┌─────────────────────┐
│ Requests            │
│ 1,234               │
│ Success Rate: 98.5% │
│ Failed: 18          │
└─────────────────────┘
```

*Performance*
```
┌─────────────────────┐
│ Performance         │
│ 145ms               │
│ Avg Response Time   │
│ Uptime: 2d 5h 23m   │
└─────────────────────┘
```

**3. Real-time Charts**

*CPU & Memory Usage*
- Line chart showing last 20 data points
- Updates every 5 seconds
- Shows trends over time

*Request Volume*
- Area chart of total requests
- Real-time updates
- Helps identify traffic patterns

**4. Component Health**
```
┌─────────────────────────────────────┐
│ Component Health                    │
├─────────────────────────────────────┤
│ ✓ API Server      [healthy]        │
│ ⚠ Memory          [warning]        │
│ ✓ watsonx.data    [healthy]        │
└─────────────────────────────────────┘
```

**5. Endpoint Performance Table**

| Endpoint | Total | Success | Failed | Success Rate | Avg Time |
|----------|-------|---------|--------|--------------|----------|
| /api/query/execute | 234 | 230 | 4 | 98.3% | 234ms |
| /api/ingestion/jobs | 156 | 156 | 0 | 100% | 89ms |
| /api/monitoring/dashboard | 89 | 89 | 0 | 100% | 45ms |

#### Features:

1. **Auto-Refresh**
   - Toggle on/off with button
   - Updates every 5 seconds when enabled
   - Manual refresh button available

2. **Health Indicators**
   - ✅ Green = Healthy
   - ⚠️ Yellow = Warning
   - ❌ Red = Unhealthy/Degraded

3. **Performance Tracking**
   - Response time per endpoint
   - Success/failure rates
   - Request volume trends

4. **System Metrics**
   - CPU utilization
   - Memory usage
   - Uptime tracking

#### Use Cases:

**Monitoring During Load**
1. Navigate to Monitoring page
2. Enable auto-refresh
3. Create multiple ingestion jobs
4. Watch CPU and memory metrics
5. Monitor request success rates

**Troubleshooting Performance**
1. Check endpoint performance table
2. Identify slow endpoints
3. Review failed request counts
4. Check component health status

**Capacity Planning**
1. Monitor resource usage over time
2. Track request volume trends
3. Identify peak usage periods
4. Plan for scaling needs

```

---

## Testing watsonx.data Capabilities

### Test 1: Basic Data Ingestion (with File Upload)

**Objective**: Load sample data into watsonx.data using the new upload feature

**Steps**:
1. Generate sample data:
   ```bash
   ./scripts/generate-data.sh
   ```

2. Navigate to **Ingestion** page

3. **Upload a file**:
   - Click **"Select File"**
   - Choose `sample-data/customers.json`
   - Click **"Upload to MinIO"**
   - Wait for upload to complete
   - File path will auto-fill

4. Complete the job settings:
   - **File Path**: (auto-filled after upload)
   - **Format**: JSON (auto-detected)
   - **Catalog**: `iceberg_data`
   - **Schema**: `demo`
   - **Table**: `customers`
   - **Engine**: `spark158`
   - **Mode**: `append`

---

### Test 6: Query Interface Testing ✅ **NEW**

**Objective**: Test SQL query execution and result visualization

**Steps**:

1. Navigate to **Query** page

2. **Test Basic Query**:
   - Select catalog: `iceberg_data`
   - Select schema: `default`
   - Enter query:
     ```sql
     SELECT * FROM iceberg_data.default.customers LIMIT 5;
     ```
   - Click **"Execute Query"**
   - Verify results display in table

3. **Test Query History**:
   - Execute multiple queries
   - Switch to **History** tab
   - Click on a previous query
   - Verify it loads into editor

4. **Test Export**:
   - Execute a query with results
   - Click **"Export"** dropdown
   - Choose **CSV**
   - Verify file downloads
   - Repeat with **JSON** format

5. **Test Schema Browser**:
   - View tables in right panel
   - Click **Insert** icon next to a table
   - Verify table name added to query

6. **Test Quick Examples**:
   - Click on "Select from customers" example
   - Verify query loads
   - Execute and check results

**Expected Results**:
- Queries execute successfully
- Results display in tabular format
- History saves all queries
- Export works for both CSV and JSON
- Schema browser shows all tables

---

### Test 7: Monitoring Dashboard Testing ✅ **NEW**

**Objective**: Verify real-time monitoring and metrics collection

**Steps**:

1. Navigate to **Monitoring** page

2. **Check Initial State**:
   - Verify system status shows "HEALTHY"
   - Check all metric cards display values
   - Confirm component health indicators

3. **Test Auto-Refresh**:
   - Enable auto-refresh
   - Watch metrics update every 5 seconds
   - Verify charts animate with new data

4. **Generate Load**:
   - Open new tab
   - Navigate to Query page
   - Execute several queries
   - Return to Monitoring page
   - Verify request count increased
   - Check endpoint performance table updated

5. **Test Manual Refresh**:
   - Disable auto-refresh
   - Click **"Refresh"** button
   - Verify data updates

6. **Monitor Resource Usage**:
   - Watch CPU and memory charts
   - Create an ingestion job
   - Observe metrics change during processing

**Expected Results**:
- All metrics display correctly
- Auto-refresh updates data every 5 seconds
- Charts show real-time trends
- Endpoint performance tracks all API calls
- Component health reflects system state


5. Click **"Create Ingestion Job"**

6. Go to **Jobs** page and monitor progress

**Expected Result**: Job completes successfully, data loaded into `iceberg_data.demo.customers`

**Alternative**: You can also use the script method:
```bash
./scripts/upload-sample-data.sh
# Then manually enter the S3 path in the form
```

---

### Test 2: Multi-Format Ingestion

**Objective**: Test different file formats

**Steps**:
1. Create jobs for each format:
   - **CSV**: `/sample-data/sales.csv`
   - **JSON**: `/sample-data/products.json`
   - **Parquet**: `/sample-data/orders.parquet`

2. Monitor all jobs in **Jobs** page

3. Compare ingestion speeds and success rates

**Expected Result**: All formats ingest successfully, Parquet is fastest

---

### Test 3: Partitioned Data Loading

**Objective**: Load data with partitioning for better query performance

**Steps**:
1. Create ingestion job with:
   - **Source**: `/sample-data/transactions/`
   - **Target**: `iceberg_data.sales.transactions`
   - **Partition Column**: `date`
   - **Mode**: `append`

2. Monitor job completion

3. Verify partitions created in watsonx.data UI

**Expected Result**: Data partitioned by date, faster queries on date ranges

---

### Test 4: Overwrite vs Append

**Objective**: Understand data loading modes

**Test A - Append Mode**:
1. Create job with **Mode**: `append`
2. Run same job twice
3. Result: Data duplicated (2x records)

**Test B - Overwrite Mode**:
1. Create job with **Mode**: `overwrite`
2. Run same job twice
3. Result: Data replaced (same record count)

**Use Cases**:
- **Append**: Incremental loads, new data
- **Overwrite**: Full refreshes, corrections

---

### Test 5: Error Handling

**Objective**: Test application resilience

**Scenarios to Test**:

1. **Invalid Credentials**
   - Edit `backend/.env`
   - Change `WATSONX_PASSWORD` to wrong value
   - Restart backend: `./scripts/stop.sh && ./scripts/start.sh`
   - Try creating job
   - **Expected**: Error message displayed

2. **Non-existent Bucket**
   - Create job with bucket: `non-existent-bucket`
   - **Expected**: Job fails with clear error

3. **Invalid File Format**
   - Create job with wrong format (e.g., CSV for Parquet file)
   - **Expected**: Job fails during processing

4. **Network Issues**
   - Stop watsonx.data temporarily
   - Try creating job
   - **Expected**: Connection error displayed

---

## Common Use Cases

### Use Case 1: Daily Sales Data Load

**Scenario**: Load daily sales data from S3 into watsonx.data

**Configuration**:
```yaml
Source:
  Type: S3/MinIO
  Bucket: sales-data
  Path: /daily/sales-{YYYY-MM-DD}.parquet
  Format: Parquet

Target:
  Catalog: iceberg_data
  Schema: sales
  Table: daily_transactions
  Partition: date

Options:
  Engine: spark158
  Mode: append
```

**Automation**: Schedule with cron or Airflow

---

### Use Case 2: Data Lake Migration

**Scenario**: Migrate existing data from CSV to Iceberg format

**Steps**:
1. Create ingestion jobs for each CSV file
2. Use **Parquet** as target format
3. Enable partitioning for large datasets
4. Monitor progress in Jobs page
5. Verify data in watsonx.data

**Benefits**:
- ✅ Better compression (Parquet)
- ✅ Faster queries (columnar format)
- ✅ ACID transactions (Iceberg)
- ✅ Time travel capabilities

---

### Use Case 3: Real-time Analytics Pipeline

**Scenario**: Ingest streaming data for analytics

**Architecture**:
```
Kafka/Kinesis → S3 Landing Zone → watsonx.data → Analytics
                      ↓
              Demo App Ingestion
```

**Configuration**:
- **Mode**: `append` (incremental)
- **Partition**: `timestamp` or `date`
- **Schedule**: Every 5 minutes
- **Engine**: `spark158` (parallel processing)

---

## Troubleshooting

### Issue: "Cannot connect to watsonx.data"

**Symptoms**: Dashboard shows red status, jobs fail immediately

**Solutions**:
1. Check watsonx.data is running:
   ```bash
   curl -k https://localhost:6443/api/v2/health
   ```

2. Verify credentials in `backend/.env`:
   ```bash
   cat backend/.env | grep WATSONX
   ```

3. Check backend logs:
   ```bash
   tail -f backend.log
   ```

4. Restart application:
   ```bash
   ./scripts/stop.sh && ./scripts/start.sh
   ```

---

### Issue: "Port already in use"

**Symptoms**: Start script fails with port error

**Solutions**:
1. Stop existing processes:
   ```bash
   ./scripts/stop.sh
   ```

2. Manually kill processes:
   ```bash
   lsof -ti:5001 | xargs kill -9
   lsof -ti:3000 | xargs kill -9
   ```

3. Change ports in configuration if needed

---

### Issue: "Job stuck in Pending status"

**Symptoms**: Job never starts processing

**Solutions**:
1. Check Spark engine is running in watsonx.data
2. Verify engine ID in `backend/.env` matches watsonx.data
3. Check engine capacity (may be at max jobs)
4. Review backend logs for errors:
   ```bash
   tail -f backend.log | grep ERROR
   ```

---

### Issue: "Job fails with authentication error"

**Symptoms**: Job fails immediately with 401/403 error

**Solutions**:
1. Token may have expired - backend auto-refreshes
2. Check credentials are correct
3. Verify user has permissions in watsonx.data
4. Check backend logs for auth errors

---

### Issue: "Frontend not loading"

**Symptoms**: Browser shows blank page or errors

**Solutions**:
1. Check frontend is running:
   ```bash
   curl http://localhost:3000
   ```

2. Check frontend logs:
   ```bash
   tail -f frontend.log
   ```

3. Clear browser cache and reload
4. Check browser console for errors (F12)

---

## Next Steps

Now that you're familiar with the application:

1. **Explore API Documentation**: See [`docs/API.md`](API.md)
2. **Review Architecture**: See [`docs/ARCHITECTURE.md`](ARCHITECTURE.md)
3. **Deploy to Production**: See [`docs/DEPLOYMENT.md`](DEPLOYMENT.md)
4. **Customize**: Modify code to fit your needs
5. **Integrate**: Connect with your data pipelines

---

## Additional Resources

- **watsonx.data Documentation**: https://www.ibm.com/docs/en/watsonxdata
- **Iceberg Documentation**: https://iceberg.apache.org/docs/latest/
- **Spark Documentation**: https://spark.apache.org/docs/latest/
- **Project README**: [`README.md`](../README.md)

---

## Support

For issues or questions:
1. Check logs: `backend.log` and `frontend.log`
2. Review troubleshooting section above
3. Check watsonx.data status and logs
4. Consult IBM watsonx.data documentation

---

**Happy Data Engineering! 🚀**