# Quick Start Guide

This guide will help you get started with the watsonx.data Demo Application and explore its capabilities.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Starting the Application](#starting-the-application)
3. [Understanding the UI](#understanding-the-ui)
4. [Testing watsonx.data Capabilities](#testing-watsonxdata-capabilities)
5. [Common Use Cases](#common-use-cases)
6. [Troubleshooting](#troubleshooting)

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
python3 scripts/generate-sample-data.py
```

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

#### Step-by-Step Guide:

**Step 1: Configure Source**
```
┌─────────────────────────────────────┐
│ Source Configuration                │
├─────────────────────────────────────┤
│ Source Type: [S3/MinIO ▼]          │
│ Bucket: iceberg-bucket              │
│ Path: /data/sales/2024/             │
│ Format: [Parquet ▼]                 │
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
```

---

## Testing watsonx.data Capabilities

### Test 1: Basic Data Ingestion

**Objective**: Load sample data into watsonx.data

**Steps**:
1. Generate sample data:
   ```bash
   python3 scripts/generate-sample-data.py
   ```

2. Navigate to **Ingestion** page

3. Create a job with these settings:
   - **Source Type**: S3/MinIO
   - **Bucket**: `iceberg-bucket`
   - **Path**: `/sample-data/customers.parquet`
   - **Format**: Parquet
   - **Catalog**: `iceberg_data`
   - **Schema**: `demo`
   - **Table**: `customers`
   - **Engine**: `spark158`
   - **Mode**: `append`

4. Click **"Create Ingestion Job"**

5. Go to **Jobs** page and monitor progress

**Expected Result**: Job completes successfully, data loaded into `iceberg_data.demo.customers`

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