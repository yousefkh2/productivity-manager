#!/bin/bash

# Hardmode Pomo - Digital Ocean Deployment Script
# This script helps you deploy to Digital Ocean App Platform

set -e  # Exit on error

echo "🚀 Hardmode Pomo - Digital Ocean Deployment"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo -e "${YELLOW}⚠️  doctl not found. Installing...${NC}"
    echo ""
    echo "Please install doctl manually:"
    echo "  macOS: brew install doctl"
    echo "  Linux: sudo snap install doctl"
    echo "  Or visit: https://docs.digitalocean.com/reference/doctl/how-to/install/"
    exit 1
fi

# Check if authenticated
if ! doctl account get &> /dev/null; then
    echo -e "${YELLOW}⚠️  Not authenticated with Digital Ocean${NC}"
    echo ""
    echo "Please run: doctl auth init"
    echo "You'll need your Digital Ocean API token"
    exit 1
fi

echo -e "${GREEN}✓${NC} doctl installed and authenticated"
echo ""

# Check if git repo is clean
if [[ -n $(git status -s) ]]; then
    echo -e "${YELLOW}⚠️  You have uncommitted changes${NC}"
    echo ""
    read -p "Commit and push changes first? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        read -p "Enter commit message: " commit_msg
        git commit -m "$commit_msg"
        git push origin master
        echo -e "${GREEN}✓${NC} Changes pushed to GitHub"
    else
        echo "Continuing with current state..."
    fi
fi

echo ""
echo "Choose deployment method:"
echo "  1) Deploy to App Platform (Recommended - Managed, $8/month)"
echo "  2) Deploy to Droplet (More control - $6/month)"
echo "  3) Cancel"
echo ""
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        echo ""
        echo -e "${BLUE}Deploying to App Platform...${NC}"
        echo ""
        
        # Check if app already exists
        APP_NAME="hardmode-pomo-app"
        if doctl apps list | grep -q "$APP_NAME"; then
            echo "App already exists. Updating..."
            APP_ID=$(doctl apps list --format ID,Name | grep "$APP_NAME" | awk '{print $1}')
            doctl apps update "$APP_ID" --spec .do/app.yaml
        else
            echo "Creating new app..."
            doctl apps create --spec .do/app.yaml
        fi
        
        echo ""
        echo -e "${GREEN}✓${NC} Deployment initiated!"
        echo ""
        echo "View deployment status:"
        echo "  doctl apps list"
        echo ""
        echo "View logs:"
        echo "  doctl apps logs <APP_ID> --type=build"
        echo "  doctl apps logs <APP_ID> --type=run"
        echo ""
        echo "Your app will be available at:"
        echo "  https://hardmode-pomo-app-xxxxx.ondigitalocean.app"
        ;;
        
    2)
        echo ""
        echo -e "${BLUE}Droplet deployment not yet implemented${NC}"
        echo "Please use App Platform (option 1) or deploy manually"
        echo ""
        echo "Manual droplet steps:"
        echo "  1. Create droplet: doctl compute droplet create ..."
        echo "  2. SSH to droplet: ssh root@droplet-ip"
        echo "  3. Install Docker: curl -fsSL https://get.docker.com | sh"
        echo "  4. Clone repo: git clone <your-repo>"
        echo "  5. Run: docker-compose -f docker-compose.production.yml up -d"
        ;;
        
    3)
        echo "Deployment cancelled"
        exit 0
        ;;
        
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
