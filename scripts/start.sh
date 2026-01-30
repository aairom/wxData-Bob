#!/bin/bash

###############################################################################
# watsonx.data Demo Application - Start Script
#
# This script starts both the backend and frontend services
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

echo -e "${BLUE}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}║   watsonx.data Demo Application - Startup Script         ║${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Error: Node.js is not installed${NC}"
    echo "Please install Node.js v18+ from https://nodejs.org/"
    exit 1
fi

echo -e "${GREEN}✓ Node.js version: $(node --version)${NC}"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo -e "${RED}Error: npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ npm version: $(npm --version)${NC}"
echo ""

# Function to check if port is in use
check_port() {
    local port=$1
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Check if ports are available
echo -e "${YELLOW}Checking port availability...${NC}"

if check_port 5001; then
    echo -e "${RED}Error: Port 5001 is already in use${NC}"
    echo "Please stop the service using port 5001 or run: ./scripts/stop.sh"
    exit 1
fi

if check_port 3000; then
    echo -e "${RED}Error: Port 3000 is already in use${NC}"
    echo "Please stop the service using port 3000 or run: ./scripts/stop.sh"
    exit 1
fi

echo -e "${GREEN}✓ Ports 3000 and 5001 are available${NC}"
echo ""

# Install backend dependencies
echo -e "${YELLOW}Installing backend dependencies...${NC}"
cd "$PROJECT_ROOT/backend"

if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Backend dependencies already installed${NC}"
fi
echo ""

# Install frontend dependencies
echo -e "${YELLOW}Installing frontend dependencies...${NC}"
cd "$PROJECT_ROOT/frontend"

if [ ! -d "node_modules" ]; then
    npm install
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi
echo ""

# Create .env file if it doesn't exist
if [ ! -f "$PROJECT_ROOT/backend/.env" ]; then
    echo -e "${YELLOW}Creating backend .env file...${NC}"
    cat > "$PROJECT_ROOT/backend/.env" << EOF
# watsonx.data Configuration
WATSONX_BASE_URL=https://localhost:6443
WATSONX_USERNAME=ibmlhadmin
WATSONX_PASSWORD=password
WATSONX_INSTANCE_ID=0000-0000-0000-0000
WATSONX_ENGINE_ID=spark158
WATSONX_BUCKET_NAME=iceberg-bucket

# Server Configuration
PORT=5001
HOST=0.0.0.0
CORS_ORIGIN=http://localhost:3000

# Environment
NODE_ENV=development
LOG_LEVEL=info
EOF
    echo -e "${GREEN}✓ Backend .env file created${NC}"
fi
echo ""

# Start backend server
echo -e "${YELLOW}Starting backend server...${NC}"
cd "$PROJECT_ROOT/backend"
npm start > "$PROJECT_ROOT/backend.log" 2>&1 &
BACKEND_PID=$!
echo $BACKEND_PID > "$PROJECT_ROOT/.backend.pid"
echo -e "${GREEN}✓ Backend server started (PID: $BACKEND_PID)${NC}"
echo -e "${BLUE}  Backend URL: http://localhost:5000${NC}"
echo -e "${BLUE}  Backend logs: $PROJECT_ROOT/backend.log${NC}"
echo ""

# Wait for backend to be ready
echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
for i in {1..30}; do
    if curl -s http://localhost:5001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Backend is ready${NC}"
        break
    fi
    if [ $i -eq 30 ]; then
        echo -e "${RED}Error: Backend failed to start${NC}"
        echo "Check logs at: $PROJECT_ROOT/backend.log"
        kill $BACKEND_PID 2>/dev/null || true
        exit 1
    fi
    sleep 1
done
echo ""

# Start frontend server
echo -e "${YELLOW}Starting frontend server...${NC}"
cd "$PROJECT_ROOT/frontend"
npm start > "$PROJECT_ROOT/frontend.log" 2>&1 &
FRONTEND_PID=$!
echo $FRONTEND_PID > "$PROJECT_ROOT/.frontend.pid"
echo -e "${GREEN}✓ Frontend server started (PID: $FRONTEND_PID)${NC}"
echo -e "${BLUE}  Frontend URL: http://localhost:3000${NC}"
echo -e "${BLUE}  Frontend logs: $PROJECT_ROOT/frontend.log${NC}"
echo ""

# Wait a moment for frontend to start
sleep 3

echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║   Application started successfully!                       ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║   Frontend: http://localhost:3000                         ║${NC}"
echo -e "${GREEN}║   Backend:  http://localhost:5001                         ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║   To stop: ./scripts/stop.sh                              ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Note: The frontend will open automatically in your browser${NC}"
echo -e "${YELLOW}Press Ctrl+C to view logs, or run ./scripts/stop.sh to stop${NC}"

# Made with Bob
