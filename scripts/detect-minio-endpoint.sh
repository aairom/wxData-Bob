#!/bin/bash

###############################################################################
# MinIO Endpoint Detection Script
#
# This script automatically detects the correct MinIO endpoint for your
# watsonx.data Developer Edition installation
###############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}║   MinIO Endpoint Detection                               ║${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Test endpoints
ENDPOINTS=(
    "https://localhost:9000"
    "https://localhost:9443"
    "http://localhost:9000"
    "http://localhost:9443"
    "https://localhost:6443"
)

CREDENTIALS=(
    "admin:password"
    "ibmlhadmin:password"
    "minioadmin:minioadmin"
)

echo -e "${YELLOW}Testing common MinIO endpoints...${NC}"
echo ""

FOUND=false

for endpoint in "${ENDPOINTS[@]}"; do
    echo -e "${BLUE}Testing: $endpoint${NC}"
    
    # Test health endpoint
    if curl -k -s --connect-timeout 2 "$endpoint/minio/health/live" >/dev/null 2>&1; then
        echo -e "${GREEN}  ✓ Endpoint is reachable${NC}"
        
        # Test with different credentials
        for cred in "${CREDENTIALS[@]}"; do
            IFS=':' read -r user pass <<< "$cred"
            
            if command -v mc &> /dev/null; then
                # Test with mc client
                mc alias set test-endpoint "$endpoint" "$user" "$pass" --insecure >/dev/null 2>&1
                if mc ls test-endpoint/ --insecure >/dev/null 2>&1; then
                    echo -e "${GREEN}  ✓ Credentials work: $user / $pass${NC}"
                    echo ""
                    echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
                    echo -e "${GREEN}║                                                           ║${NC}"
                    echo -e "${GREEN}║   MinIO Endpoint Found!                                  ║${NC}"
                    echo -e "${GREEN}║                                                           ║${NC}"
                    echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
                    echo ""
                    echo -e "${BLUE}Endpoint:${NC} $endpoint"
                    echo -e "${BLUE}Access Key:${NC} $user"
                    echo -e "${BLUE}Secret Key:${NC} $pass"
                    echo ""
                    echo -e "${YELLOW}To use these credentials, run:${NC}"
                    echo ""
                    echo -e "export MINIO_ENDPOINT=\"$endpoint\""
                    echo -e "export MINIO_ACCESS_KEY=\"$user\""
                    echo -e "export MINIO_SECRET_KEY=\"$pass\""
                    echo -e "./scripts/upload-sample-data.sh"
                    echo ""
                    
                    # Clean up test alias
                    mc alias remove test-endpoint 2>/dev/null
                    
                    FOUND=true
                    break 2
                fi
                mc alias remove test-endpoint 2>/dev/null
            fi
        done
        
        if [ "$FOUND" = false ]; then
            echo -e "${YELLOW}  ⚠ Endpoint reachable but credentials didn't work${NC}"
        fi
    else
        echo -e "${RED}  ✗ Endpoint not reachable${NC}"
    fi
    echo ""
done

if [ "$FOUND" = false ]; then
    echo -e "${RED}╔═══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║                                                           ║${NC}"
    echo -e "${RED}║   No working MinIO endpoint found                        ║${NC}"
    echo -e "${RED}║                                                           ║${NC}"
    echo -e "${RED}╚═══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting steps:${NC}"
    echo ""
    echo "1. Check if watsonx.data is running:"
    echo "   curl -k https://localhost:6443/api/v2/health"
    echo ""
    echo "2. Check for running containers:"
    echo "   docker ps | grep -E 'minio|watsonx'"
    echo ""
    echo "3. Check listening ports:"
    echo "   lsof -i -P | grep LISTEN | grep -E '9000|9443|6443'"
    echo ""
    echo "4. Check watsonx.data logs for MinIO configuration"
    echo ""
    echo "5. Consult: docs/MINIO_CREDENTIALS.md"
    echo ""
    exit 1
fi

# Made with Bob
