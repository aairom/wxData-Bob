#!/bin/bash

###############################################################################
# watsonx.data Demo Application - Stop Script
#
# This script stops both the backend and frontend services
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
echo -e "${BLUE}║   watsonx.data Demo Application - Stop Script            ║${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Function to stop a service by PID file
stop_service() {
    local service_name=$1
    local pid_file=$2
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if ps -p $pid > /dev/null 2>&1; then
            echo -e "${YELLOW}Stopping $service_name (PID: $pid)...${NC}"
            kill $pid 2>/dev/null || true
            
            # Wait for process to stop
            for i in {1..10}; do
                if ! ps -p $pid > /dev/null 2>&1; then
                    echo -e "${GREEN}✓ $service_name stopped${NC}"
                    rm -f "$pid_file"
                    return 0
                fi
                sleep 1
            done
            
            # Force kill if still running
            if ps -p $pid > /dev/null 2>&1; then
                echo -e "${YELLOW}Force stopping $service_name...${NC}"
                kill -9 $pid 2>/dev/null || true
                echo -e "${GREEN}✓ $service_name force stopped${NC}"
            fi
            rm -f "$pid_file"
        else
            echo -e "${YELLOW}$service_name is not running${NC}"
            rm -f "$pid_file"
        fi
    else
        echo -e "${YELLOW}$service_name PID file not found${NC}"
    fi
}

# Function to kill processes by port
kill_by_port() {
    local port=$1
    local service_name=$2
    
    if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}Stopping $service_name on port $port...${NC}"
        lsof -ti:$port | xargs kill -9 2>/dev/null || true
        echo -e "${GREEN}✓ $service_name stopped${NC}"
    fi
}

# Stop backend
stop_service "Backend server" "$PROJECT_ROOT/.backend.pid"

# Stop frontend
stop_service "Frontend server" "$PROJECT_ROOT/.frontend.pid"

# Fallback: kill by port if PID files didn't work
echo ""
echo -e "${YELLOW}Checking for remaining processes...${NC}"
kill_by_port 5001 "Backend (port 5001)"
kill_by_port 3000 "Frontend (port 3000)"

# Clean up log files (optional)
if [ "$1" == "--clean" ]; then
    echo ""
    echo -e "${YELLOW}Cleaning up log files...${NC}"
    rm -f "$PROJECT_ROOT/backend.log"
    rm -f "$PROJECT_ROOT/frontend.log"
    rm -f "$PROJECT_ROOT/backend/logs/*.log"
    echo -e "${GREEN}✓ Log files cleaned${NC}"
fi

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║   Application stopped successfully!                       ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║   To start again: ./scripts/start.sh                      ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Made with Bob
