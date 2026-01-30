# Finding MinIO Credentials in watsonx.data Developer Edition

This guide explains how to find your MinIO access credentials for uploading sample data.

## 🚀 Automatic Detection (Recommended)

Run the detection script to automatically find your MinIO endpoint and credentials:

```bash
./scripts/detect-minio-endpoint.sh
```

This script will:
- ✅ Test common MinIO endpoints
- ✅ Try different credential combinations
- ✅ Show you the working configuration
- ✅ Provide export commands ready to use

---

## Quick Answer

For **watsonx.data Developer Edition**, the default MinIO credentials are:

```bash
# Try these common endpoints (one should work):
export MINIO_ENDPOINT=https://localhost:9000   # Standard MinIO port
# OR
export MINIO_ENDPOINT=https://localhost:9443   # Alternative port
# OR
export MINIO_ENDPOINT=https://localhost:6443   # watsonx.data UI port (may proxy to MinIO)

export MINIO_ACCESS_KEY=admin
export MINIO_SECRET_KEY=password
```

These are the **default credentials** that come with watsonx.data Developer Edition installation.

> ⚠️ **Connection Refused Error?** See [Troubleshooting MinIO Connection](#troubleshooting-minio-connection) below to find your correct endpoint.

---

## Method 1: Using Default Credentials (Recommended)

The upload script [`scripts/upload-sample-data.sh`](../scripts/upload-sample-data.sh) already uses these defaults, so you can simply run:

```bash
./scripts/upload-sample-data.sh
```

No configuration needed! The script will automatically use:
- **Endpoint**: `https://localhost:9000`
- **Access Key**: `admin`
- **Secret Key**: `password`
- **Bucket**: `iceberg-bucket`

---

## Method 2: Finding Credentials in watsonx.data UI

If you've changed the default credentials or need to verify them:

### Step 1: Access watsonx.data UI

1. Open your browser to: **https://localhost:6443**
2. Login with:
   - Username: `ibmlhadmin`
   - Password: `password`

### Step 2: Navigate to Infrastructure

1. Click on **"Infrastructure"** in the left sidebar
2. Click on **"MinIO"** or **"Object Storage"**

### Step 3: View Credentials

You should see:
- **Endpoint URL**: Usually `https://localhost:9000`
- **Access Key**: The MinIO access key
- **Secret Key**: Click "Show" to reveal the secret key

---

## Method 3: Check Docker Container Environment

If watsonx.data is running in Docker, you can check the MinIO container:

```bash
# List running containers
docker ps | grep minio

# Check MinIO environment variables
docker inspect <minio-container-id> | grep -A 10 "Env"
```

Look for:
- `MINIO_ROOT_USER` or `MINIO_ACCESS_KEY`
- `MINIO_ROOT_PASSWORD` or `MINIO_SECRET_KEY`

---

## Method 4: Check Configuration Files

MinIO credentials might be stored in watsonx.data configuration files:

```bash
# Common locations (adjust based on your installation)
cat ~/.watsonx/config.yaml
cat /opt/watsonx/config/minio.conf
```

---

## Using Custom Credentials

If you have custom credentials, set them before running the upload script:

```bash
# Set your custom credentials
export MINIO_ENDPOINT=https://your-endpoint:9000
export MINIO_ACCESS_KEY=your-access-key
export MINIO_SECRET_KEY=your-secret-key
export MINIO_BUCKET=your-bucket-name

# Run the upload script
./scripts/upload-sample-data.sh
```

---

## Verifying Credentials

Test your credentials using the MinIO client directly:

```bash
# Configure MinIO client
mc alias set watsonx https://localhost:9000 admin password --insecure

# Test connection
mc ls watsonx/

# If successful, you'll see a list of buckets
```

---

## Common Issues

### Issue: "Access Denied" Error

**Solution**: Your credentials are incorrect. Try:
1. Use default credentials: `admin` / `password`
2. Check watsonx.data UI for correct credentials
3. Verify MinIO is running: `curl -k https://localhost:9000/minio/health/live`

### Issue: "Connection Refused"

**Solution**: MinIO service is not running or wrong endpoint

**Step 1: Check if watsonx.data is running**
```bash
# Check if watsonx.data UI is accessible
curl -k https://localhost:6443/api/v2/health

# Check for running containers
docker ps | grep -E "minio|watsonx"
```

**Step 2: Find the correct MinIO port**

MinIO in watsonx.data Developer Edition can run on different ports:

```bash
# Try common ports
curl -k https://localhost:9000/minio/health/live   # Standard MinIO
curl -k https://localhost:9443/minio/health/live   # Alternative
curl -k https://localhost:6443/minio/health/live   # Via watsonx.data proxy

# Check which ports are listening
lsof -i -P | grep LISTEN | grep -E "9000|9443|6443"
# OR on Linux:
netstat -tuln | grep -E "9000|9443|6443"
```

**Step 3: Check Docker port mappings**
```bash
# If running in Docker, check port mappings
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep minio
```

**Step 4: Try different endpoints**
```bash
# Test with mc client
mc alias set test1 https://localhost:9000 admin password --insecure
mc alias set test2 https://localhost:9443 admin password --insecure
mc alias set test3 http://localhost:9000 admin password --insecure
mc alias set test4 http://localhost:9443 admin password --insecure

# Check which one works
mc ls test1/ 2>/dev/null && echo "✓ Port 9000 HTTPS works"
mc ls test2/ 2>/dev/null && echo "✓ Port 9443 HTTPS works"
mc ls test3/ 2>/dev/null && echo "✓ Port 9000 HTTP works"
mc ls test4/ 2>/dev/null && echo "✓ Port 9443 HTTP works"
```

**Step 5: Check watsonx.data documentation**

The MinIO endpoint depends on your watsonx.data installation method:
- **Docker Compose**: Check `docker-compose.yml` for port mappings
- **Kubernetes**: Check service definitions
- **Standalone**: Check installation logs

**Common Solutions:**
1. **Use HTTP instead of HTTPS**: `http://localhost:9000`
2. **Try port 9443**: Some installations use this port
3. **Access via watsonx.data proxy**: Use port 6443
4. **Check if MinIO is embedded**: May not have separate endpoint

### Issue: "Bucket Not Found" or "405 Not Allowed"

**Symptoms**:
- Error: `Unable to make bucket`
- HTTP 405 Not Allowed
- nginx error page

**Root Cause**: You're connecting to watsonx.data UI (port 6443) which proxies to MinIO but doesn't support bucket creation via mc client.

**Solution A: Create bucket via watsonx.data UI (Recommended)**

1. Open https://localhost:6443 in your browser
2. Login with `ibmlhadmin` / `password`
3. Navigate to **Infrastructure** → **Buckets** (or **Storage** → **Buckets**)
4. Click **"Add Bucket"** or **"Create Bucket"**
5. Enter bucket name: `iceberg-bucket`
6. Select bucket type: **MinIO** or **S3**
7. Click **"Create"**
8. Then run the upload script again:
   ```bash
   export MINIO_ENDPOINT=https://localhost:6443
   ./scripts/upload-sample-data.sh
   ```

**Solution B: Find and use direct MinIO endpoint**

The watsonx.data UI (port 6443) is a proxy. Find the direct MinIO endpoint:

```bash
# Check Docker containers for MinIO
docker ps --format "table {{.Names}}\t{{.Ports}}" | grep minio

# Look for a port mapping like: 0.0.0.0:9000->9000/tcp
# Example output: ibm-lh-minio  0.0.0.0:9000->9000/tcp

# Use that port directly
export MINIO_ENDPOINT=https://localhost:9000
export MINIO_ACCESS_KEY=admin
export MINIO_SECRET_KEY=password
./scripts/upload-sample-data.sh
```

**Solution C: Skip bucket creation (if bucket exists)**

If the bucket already exists in watsonx.data, you can upload directly:

```bash
# List existing buckets first
mc ls watsonx/ --insecure

# If iceberg-bucket exists, upload directly
export MINIO_ENDPOINT=https://localhost:6443
./scripts/upload-sample-data.sh
```

**Solution D: Use watsonx.data REST API**

Create bucket programmatically:

```bash
# Get authentication token first
TOKEN=$(curl -k -X POST https://localhost:6443/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"ibmlhadmin","password":"password"}' \
  | jq -r '.token')

# Create bucket
curl -k -X POST https://localhost:6443/api/v2/buckets \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bucket_name": "iceberg-bucket",
    "bucket_type": "minio"
  }'
```

---

## Security Best Practices

⚠️ **Important Security Notes**:

1. **Default Credentials**: Change default credentials in production
2. **HTTPS**: Always use HTTPS in production (the `--insecure` flag is only for development)
3. **Access Control**: Limit MinIO access to authorized users only
4. **Secrets Management**: Never commit credentials to git

For production deployments:
```bash
# Use environment variables or secrets management
export MINIO_ACCESS_KEY=$(vault read -field=access_key secret/minio)
export MINIO_SECRET_KEY=$(vault read -field=secret_key secret/minio)
```

---

## Additional Resources

- **MinIO Client Documentation**: https://min.io/docs/minio/linux/reference/minio-mc.html
- **watsonx.data Documentation**: https://www.ibm.com/docs/en/watsonxdata
- **MinIO Security**: https://min.io/docs/minio/linux/administration/identity-access-management.html

---

## Quick Reference Card

```bash
# Default watsonx.data Developer Edition Credentials
MINIO_ENDPOINT=https://localhost:9000
MINIO_ACCESS_KEY=admin
MINIO_SECRET_KEY=password
MINIO_BUCKET=iceberg-bucket

# Test Connection
mc alias set watsonx https://localhost:9000 admin password --insecure
mc ls watsonx/

# Upload Sample Data
./scripts/upload-sample-data.sh

# Custom Configuration
export MINIO_ACCESS_KEY=your-key
export MINIO_SECRET_KEY=your-secret
./scripts/upload-sample-data.sh
```

---

## Need Help?

If you're still having trouble finding your credentials:

1. Check the watsonx.data installation logs
2. Review the watsonx.data documentation for your specific version
3. Contact your system administrator
4. Check IBM watsonx.data support resources

The upload script provides helpful error messages if credentials are incorrect, so you can try running it and follow the guidance provided.