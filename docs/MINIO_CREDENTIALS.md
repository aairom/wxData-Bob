# Finding MinIO Credentials in watsonx.data Developer Edition

This guide explains how to find your MinIO access credentials for uploading sample data.

## Quick Answer

For **watsonx.data Developer Edition**, the default MinIO credentials are:

```bash
export MINIO_ENDPOINT=https://localhost:9000
export MINIO_ACCESS_KEY=admin
export MINIO_SECRET_KEY=password
```

These are the **default credentials** that come with watsonx.data Developer Edition installation.

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
1. Check watsonx.data is running
2. Verify endpoint URL (usually port 9000)
3. Try with/without `https://` prefix

### Issue: "Bucket Not Found"

**Solution**: The bucket doesn't exist
1. The upload script will create it automatically
2. Or create manually: `mc mb watsonx/iceberg-bucket --insecure`

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