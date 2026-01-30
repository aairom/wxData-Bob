#!/bin/bash

###############################################################################
# watsonx.data Demo Application - GitHub Deployment Script
#
# This script initializes git, commits all files, and pushes to GitHub
# Automatically excludes folders starting with underscore (_)
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
echo -e "${BLUE}║   watsonx.data Demo - GitHub Deployment Script           ║${NC}"
echo -e "${BLUE}║                                                           ║${NC}"
echo -e "${BLUE}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo -e "${RED}Error: git is not installed${NC}"
    echo "Please install git from https://git-scm.com/"
    exit 1
fi

echo -e "${GREEN}✓ Git version: $(git --version)${NC}"
echo ""

cd "$PROJECT_ROOT"

# Check if .gitignore exists
if [ ! -f ".gitignore" ]; then
    echo -e "${RED}Error: .gitignore file not found${NC}"
    exit 1
fi

echo -e "${GREEN}✓ .gitignore file found${NC}"

# Verify .gitignore contains underscore exclusion
if ! grep -q "^_\*" .gitignore; then
    echo -e "${YELLOW}Warning: .gitignore doesn't exclude _* folders${NC}"
    echo -e "${YELLOW}Adding exclusion rule...${NC}"
    echo "" >> .gitignore
    echo "# Exclude folders starting with underscore" >> .gitignore
    echo "_*/" >> .gitignore
    echo "_*" >> .gitignore
fi

echo -e "${GREEN}✓ .gitignore configured to exclude _* folders${NC}"
echo ""

# Check if already a git repository
if [ -d ".git" ]; then
    echo -e "${YELLOW}Git repository already initialized${NC}"
    
    # Check for uncommitted changes
    if ! git diff-index --quiet HEAD -- 2>/dev/null; then
        echo -e "${YELLOW}Uncommitted changes detected${NC}"
    fi
else
    echo -e "${YELLOW}Initializing git repository...${NC}"
    git init
    echo -e "${GREEN}✓ Git repository initialized${NC}"
fi
echo ""

# Get GitHub repository URL
if [ -z "$1" ]; then
    echo -e "${YELLOW}Please enter your GitHub repository URL:${NC}"
    echo -e "${BLUE}Example: https://github.com/username/wxData-Bob.git${NC}"
    read -p "Repository URL: " REPO_URL
else
    REPO_URL=$1
fi

if [ -z "$REPO_URL" ]; then
    echo -e "${RED}Error: Repository URL is required${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Repository URL: $REPO_URL${NC}"
echo ""

# Check if remote already exists
if git remote | grep -q "^origin$"; then
    echo -e "${YELLOW}Remote 'origin' already exists${NC}"
    CURRENT_REMOTE=$(git remote get-url origin)
    if [ "$CURRENT_REMOTE" != "$REPO_URL" ]; then
        echo -e "${YELLOW}Updating remote URL...${NC}"
        git remote set-url origin "$REPO_URL"
        echo -e "${GREEN}✓ Remote URL updated${NC}"
    fi
else
    echo -e "${YELLOW}Adding remote 'origin'...${NC}"
    git remote add origin "$REPO_URL"
    echo -e "${GREEN}✓ Remote added${NC}"
fi
echo ""

# Get branch name
DEFAULT_BRANCH="main"
echo -e "${YELLOW}Enter branch name (default: main):${NC}"
read -p "Branch: " BRANCH
BRANCH=${BRANCH:-$DEFAULT_BRANCH}

echo -e "${GREEN}✓ Using branch: $BRANCH${NC}"
echo ""

# Show files to be committed (excluding _* folders)
echo -e "${YELLOW}Files to be committed:${NC}"
git status --short
echo ""

# Confirm before proceeding
echo -e "${YELLOW}Ready to commit and push to GitHub${NC}"
echo -e "${YELLOW}Repository: $REPO_URL${NC}"
echo -e "${YELLOW}Branch: $BRANCH${NC}"
echo ""
read -p "Continue? (y/n): " CONFIRM

if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo -e "${RED}Deployment cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${YELLOW}Adding files to git...${NC}"
git add .

# Check if there are changes to commit
if git diff-index --quiet HEAD -- 2>/dev/null; then
    echo -e "${YELLOW}No changes to commit${NC}"
else
    echo -e "${YELLOW}Committing changes...${NC}"
    
    # Get commit message
    echo -e "${YELLOW}Enter commit message (default: 'Initial commit - watsonx.data demo application'):${NC}"
    read -p "Message: " COMMIT_MSG
    COMMIT_MSG=${COMMIT_MSG:-"Initial commit - watsonx.data demo application"}
    
    git commit -m "$COMMIT_MSG"
    echo -e "${GREEN}✓ Changes committed${NC}"
fi
echo ""

# Push to GitHub
echo -e "${YELLOW}Pushing to GitHub...${NC}"

# Check if branch exists on remote
if git ls-remote --heads origin "$BRANCH" | grep -q "$BRANCH"; then
    echo -e "${YELLOW}Branch exists on remote, pushing changes...${NC}"
    git push origin "$BRANCH"
else
    echo -e "${YELLOW}Creating new branch on remote...${NC}"
    git push -u origin "$BRANCH"
fi

echo -e "${GREEN}✓ Successfully pushed to GitHub${NC}"
echo ""

# Show repository info
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║   Deployment completed successfully!                      ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║   Repository: $REPO_URL${NC}"
echo -e "${GREEN}║   Branch: $BRANCH${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}║   Note: Folders starting with _ are excluded              ║${NC}"
echo -e "${GREEN}║                                                           ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════╝${NC}"
echo ""

# Show excluded folders
echo -e "${YELLOW}Excluded folders (starting with _):${NC}"
find . -maxdepth 1 -type d -name "_*" 2>/dev/null | sed 's|^\./||' || echo "None found"
echo ""

# Made with Bob
