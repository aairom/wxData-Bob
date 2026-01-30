#!/bin/bash

###############################################################################
# Sample Data Generation Script
#
# This script creates a Python virtual environment, installs dependencies,
# and generates sample data for testing the watsonx.data demo application
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
VENV_DIR="$PROJECT_ROOT/.venv"

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}║   Sample Data Generation Script                          ║${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}Error: Python 3 is not installed${NC}"
    echo "Please install Python 3.8+ from https://www.python.org/"
    exit 1
fi

PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
echo -e "${GREEN}✓ Python version: $PYTHON_VERSION${NC}"
echo ""

# Create virtual environment if it doesn't exist
if [ ! -d "$VENV_DIR" ]; then
    echo -e "${YELLOW}Creating Python virtual environment...${NC}"
    python3 -m venv "$VENV_DIR"
    echo -e "${GREEN}✓ Virtual environment created at: $VENV_DIR${NC}"
else
    echo -e "${GREEN}✓ Virtual environment already exists${NC}"
fi
echo ""

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source "$VENV_DIR/bin/activate"
echo -e "${GREEN}✓ Virtual environment activated${NC}"
echo ""

# Upgrade pip
echo -e "${YELLOW}Upgrading pip...${NC}"
pip install --upgrade pip --quiet
echo -e "${GREEN}✓ pip upgraded${NC}"
echo ""

# Install required packages
echo -e "${YELLOW}Installing required Python packages...${NC}"
pip install --quiet \
    pandas \
    pyarrow \
    faker \
    numpy

echo -e "${GREEN}✓ Required packages installed:${NC}"
echo -e "  - pandas (data manipulation)"
echo -e "  - pyarrow (Parquet support)"
echo -e "  - faker (fake data generation)"
echo -e "  - numpy (numerical operations)"
echo ""

# Create sample-data directory if it doesn't exist
SAMPLE_DATA_DIR="$PROJECT_ROOT/sample-data"
if [ ! -d "$SAMPLE_DATA_DIR" ]; then
    echo -e "${YELLOW}Creating sample-data directory...${NC}"
    mkdir -p "$SAMPLE_DATA_DIR"
    echo -e "${GREEN}✓ Directory created: $SAMPLE_DATA_DIR${NC}"
else
    echo -e "${GREEN}✓ sample-data directory exists${NC}"
fi
echo ""

# Run the data generation script
echo -e "${YELLOW}Generating sample data...${NC}"
echo -e "${BLUE}This may take a few moments...${NC}"
echo ""

cd "$PROJECT_ROOT"
python3 "$SCRIPT_DIR/generate-sample-data.py"

echo ""
echo -e "${GREEN}✓ Sample data generation complete!${NC}"
echo ""

# List generated files
echo -e "${BLUE}Generated files:${NC}"
ls -lh "$SAMPLE_DATA_DIR"
echo ""

# Calculate total size
TOTAL_SIZE=$(du -sh "$SAMPLE_DATA_DIR" | cut -f1)
echo -e "${GREEN}Total size: $TOTAL_SIZE${NC}"
echo ""

# Deactivate virtual environment
deactivate

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}║   Sample data ready for use!                             ║${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}║   Location: ./sample-data/                               ║${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}║   Next steps:                                             ║${NC}"
echo -e "${BLUE}║   1. Start the application: ./scripts/start.sh           ║${NC}"
echo -e "${BLUE}║   2. Navigate to Ingestion page                          ║${NC}"
echo -e "${BLUE}║   3. Create ingestion jobs using the sample data         ║${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"

# Made with Bob
