#!/bin/bash

###############################################################################
# Upload Sample Data to MinIO/S3 Script
#
# This script uploads generated sample data to watsonx.data MinIO storage
# using the MinIO client (mc)
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SAMPLE_DATA_DIR="$PROJECT_ROOT/sample-data"

# Default configuration (can be overridden by environment variables)
# These are the default credentials for watsonx.data Developer Edition
# For custom credentials, see: docs/MINIO_CREDENTIALS.md
MINIO_ALIAS="${MINIO_ALIAS:-watsonx}"
MINIO_ENDPOINT="${MINIO_ENDPOINT:-https://localhost:9000}"
MINIO_ACCESS_KEY="${MINIO_ACCESS_KEY:-admin}"
MINIO_SECRET_KEY="${MINIO_SECRET_KEY:-password}"
MINIO_BUCKET="${MINIO_BUCKET:-iceberg-bucket}"
TARGET_PATH="${TARGET_PATH:-data}"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}║   Upload Sample Data to MinIO/S3                         ║${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if MinIO client is installed
if ! command -v mc &> /dev/null; then
    echo -e "${RED}Error: MinIO client (mc) is not installed${NC}"
    echo ""
    echo "Please install the MinIO client:"
    echo ""
    echo "macOS:"
    echo "  brew install minio/stable/mc"
    echo ""
    echo "Linux:"
    echo "  wget https://dl.min.io/client/mc/release/linux-amd64/mc"
    echo "  chmod +x mc"
    echo "  sudo mv mc /usr/local/bin/"
    echo ""
    echo "Windows:"
    echo "  Download from: https://dl.min.io/client/mc/release/windows-amd64/mc.exe"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ MinIO client (mc) is installed${NC}"
MC_VERSION=$(mc --version | head -n 1)
echo -e "  Version: $MC_VERSION"
echo ""

# Check if sample data directory exists
if [ ! -d "$SAMPLE_DATA_DIR" ]; then
    echo -e "${RED}Error: Sample data directory not found: $SAMPLE_DATA_DIR${NC}"
    echo ""
    echo "Please generate sample data first:"
    echo "  ./scripts/generate-data.sh"
    echo ""
    exit 1
fi

# Check if sample data exists
FILE_COUNT=$(find "$SAMPLE_DATA_DIR" -type f \( -name "*.json" -o -name "*.csv" -o -name "*.parquet" \) | wc -l | tr -d ' ')
if [ "$FILE_COUNT" -eq 0 ]; then
    echo -e "${RED}Error: No sample data files found in $SAMPLE_DATA_DIR${NC}"
    echo ""
    echo "Please generate sample data first:"
    echo "  ./scripts/generate-data.sh"
    echo ""
    exit 1
fi

echo -e "${GREEN}✓ Found $FILE_COUNT sample data files${NC}"
echo ""

# Configure MinIO client alias
echo -e "${YELLOW}Configuring MinIO client...${NC}"
echo -e "${BLUE}Endpoint: $MINIO_ENDPOINT${NC}"
echo -e "${BLUE}Alias: $MINIO_ALIAS${NC}"
echo ""

# Remove existing alias if it exists
mc alias remove "$MINIO_ALIAS" 2>/dev/null || true

# Add new alias
if mc alias set "$MINIO_ALIAS" "$MINIO_ENDPOINT" "$MINIO_ACCESS_KEY" "$MINIO_SECRET_KEY" --insecure 2>/dev/null; then
    echo -e "${GREEN}✓ MinIO client configured successfully${NC}"
else
    echo -e "${RED}Error: Failed to configure MinIO client${NC}"
    echo ""
    echo "Please check your MinIO credentials and endpoint:"
    echo "  Endpoint: $MINIO_ENDPOINT"
    echo "  Access Key: $MINIO_ACCESS_KEY"
    echo ""
    echo "You can override these with environment variables:"
    echo "  export MINIO_ENDPOINT=https://your-endpoint:9000"
    echo "  export MINIO_ACCESS_KEY=your-access-key"
    echo "  export MINIO_SECRET_KEY=your-secret-key"
    echo ""
    echo "For help finding your credentials, see:"
    echo "  docs/MINIO_CREDENTIALS.md"
    echo ""
    exit 1
fi
echo ""

# Check if bucket exists
echo -e "${YELLOW}Checking if bucket exists...${NC}"
if mc ls "$MINIO_ALIAS/$MINIO_BUCKET" --insecure >/dev/null 2>&1; then
    echo -e "${GREEN}✓ Bucket '$MINIO_BUCKET' exists${NC}"
else
    echo -e "${YELLOW}Bucket '$MINIO_BUCKET' does not exist. Creating...${NC}"
    if mc mb "$MINIO_ALIAS/$MINIO_BUCKET" --insecure; then
        echo -e "${GREEN}✓ Bucket '$MINIO_BUCKET' created successfully${NC}"
    else
        echo -e "${RED}Error: Failed to create bucket '$MINIO_BUCKET'${NC}"
        exit 1
    fi
fi
echo ""

# Upload files
echo -e "${YELLOW}Uploading sample data files...${NC}"
echo -e "${BLUE}Target: $MINIO_ALIAS/$MINIO_BUCKET/$TARGET_PATH/${NC}"
echo ""

UPLOAD_COUNT=0
FAILED_COUNT=0

# Upload JSON files
if ls "$SAMPLE_DATA_DIR"/*.json >/dev/null 2>&1; then
    echo -e "${BLUE}Uploading JSON files...${NC}"
    for file in "$SAMPLE_DATA_DIR"/*.json; do
        filename=$(basename "$file")
        echo -n "  Uploading $filename... "
        if mc cp "$file" "$MINIO_ALIAS/$MINIO_BUCKET/$TARGET_PATH/$filename" --insecure >/dev/null 2>&1; then
            echo -e "${GREEN}✓${NC}"
            ((UPLOAD_COUNT++))
        else
            echo -e "${RED}✗${NC}"
            ((FAILED_COUNT++))
        fi
    done
fi

# Upload CSV files
if ls "$SAMPLE_DATA_DIR"/*.csv >/dev/null 2>&1; then
    echo -e "${BLUE}Uploading CSV files...${NC}"
    for file in "$SAMPLE_DATA_DIR"/*.csv; do
        filename=$(basename "$file")
        echo -n "  Uploading $filename... "
        if mc cp "$file" "$MINIO_ALIAS/$MINIO_BUCKET/$TARGET_PATH/$filename" --insecure >/dev/null 2>&1; then
            echo -e "${GREEN}✓${NC}"
            ((UPLOAD_COUNT++))
        else
            echo -e "${RED}✗${NC}"
            ((FAILED_COUNT++))
        fi
    done
fi

# Upload Parquet files
if ls "$SAMPLE_DATA_DIR"/*.parquet >/dev/null 2>&1; then
    echo -e "${BLUE}Uploading Parquet files...${NC}"
    for file in "$SAMPLE_DATA_DIR"/*.parquet; do
        filename=$(basename "$file")
        echo -n "  Uploading $filename... "
        if mc cp "$file" "$MINIO_ALIAS/$MINIO_BUCKET/$TARGET_PATH/$filename" --insecure >/dev/null 2>&1; then
            echo -e "${GREEN}✓${NC}"
            ((UPLOAD_COUNT++))
        else
            echo -e "${RED}✗${NC}"
            ((FAILED_COUNT++))
        fi
    done
fi

echo ""

# Summary
if [ $FAILED_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ All files uploaded successfully!${NC}"
else
    echo -e "${YELLOW}⚠ Upload completed with errors${NC}"
    echo -e "  Successful: $UPLOAD_COUNT"
    echo -e "  Failed: $FAILED_COUNT"
fi
echo ""

# List uploaded files
echo -e "${YELLOW}Verifying uploaded files...${NC}"
mc ls "$MINIO_ALIAS/$MINIO_BUCKET/$TARGET_PATH/" --insecure
echo ""

# Calculate total size
TOTAL_SIZE=$(mc du "$MINIO_ALIAS/$MINIO_BUCKET/$TARGET_PATH/" --insecure 2>/dev/null | awk '{print $1, $2}' || echo "N/A")
echo -e "${GREEN}Total size in MinIO: $TOTAL_SIZE${NC}"
echo ""

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}║   Sample data uploaded successfully!                     ║${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}║   Location: $MINIO_ALIAS/$MINIO_BUCKET/$TARGET_PATH/                    ║${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}║   Next steps:                                             ║${NC}"
echo -e "${BLUE}║   1. Start the application: ./scripts/start.sh           ║${NC}"
echo -e "${BLUE}║   2. Navigate to Ingestion page                          ║${NC}"
echo -e "${BLUE}║   3. Create ingestion jobs using:                        ║${NC}"
echo -e "${BLUE}║      - Bucket: $MINIO_BUCKET                                    ║${NC}"
echo -e "${BLUE}║      - Path: /$TARGET_PATH/<filename>                           ║${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"

# Made with Bob
