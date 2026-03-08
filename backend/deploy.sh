#!/bin/bash

# Deployment script for EC2
# This script updates the backend with the new chatbot features

set -e  # Exit on error

echo "=========================================="
echo "Deploying Chatbot Updates to EC2"
echo "=========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running on EC2
if [ ! -f /sys/hypervisor/uuid ] || ! grep -q ec2 /sys/hypervisor/uuid 2>/dev/null; then
    echo -e "${YELLOW}⚠ Warning: This doesn't appear to be an EC2 instance${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

echo "📁 Working directory: $SCRIPT_DIR"
echo ""

# Step 1: Backup current code
echo "1️⃣  Creating backup..."
BACKUP_DIR="../backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
cp -r . "$BACKUP_DIR/"
echo -e "${GREEN}✓ Backup created at $BACKUP_DIR${NC}"
echo ""

# Step 2: Check Python version
echo "2️⃣  Checking Python version..."
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
echo "   Python version: $PYTHON_VERSION"
if ! python3 -c "import sys; sys.exit(0 if sys.version_info >= (3, 8) else 1)"; then
    echo -e "${RED}✗ Python 3.8+ required${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python version OK${NC}"
echo ""

# Step 3: Activate virtual environment or create one
echo "3️⃣  Setting up virtual environment..."
if [ -d "venv" ]; then
    echo "   Activating existing virtual environment..."
    source venv/bin/activate
else
    echo "   Creating new virtual environment..."
    python3 -m venv venv
    source venv/bin/activate
fi
echo -e "${GREEN}✓ Virtual environment ready${NC}"
echo ""

# Step 4: Install/update dependencies
echo "4️⃣  Installing dependencies..."
pip install --upgrade pip > /dev/null 2>&1
pip install -r requirements.txt
echo -e "${GREEN}✓ Dependencies installed${NC}"
echo ""

# Step 5: Check AWS configuration
echo "5️⃣  Checking AWS configuration..."
if [ -z "$AWS_REGION" ]; then
    echo -e "${YELLOW}⚠ AWS_REGION not set in environment${NC}"
    echo "   Checking .env file..."
    if [ -f ".env" ]; then
        if grep -q "AWS_REGION" .env; then
            echo -e "${GREEN}✓ AWS_REGION found in .env${NC}"
        else
            echo -e "${YELLOW}⚠ AWS_REGION not in .env - adding default${NC}"
            echo "AWS_REGION=us-east-1" >> .env
        fi
    else
        echo -e "${YELLOW}⚠ No .env file found - creating from example${NC}"
        if [ -f ".env.example" ]; then
            cp .env.example .env
            echo -e "${GREEN}✓ Created .env from .env.example${NC}"
        else
            echo -e "${RED}✗ No .env.example found${NC}"
        fi
    fi
else
    echo -e "${GREEN}✓ AWS_REGION: $AWS_REGION${NC}"
fi
echo ""

# Step 6: Test Bedrock connection (optional)
echo "6️⃣  Testing AWS Bedrock connection..."
read -p "   Test Bedrock now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if [ -f "test_bedrock.py" ]; then
        python3 test_bedrock.py
    else
        echo -e "${YELLOW}⚠ test_bedrock.py not found - skipping${NC}"
    fi
else
    echo "   Skipped - you can test later with: python3 test_bedrock.py"
fi
echo ""

# Step 7: Check if server is running
echo "7️⃣  Checking for running server..."
if pgrep -f "uvicorn main:app" > /dev/null; then
    echo -e "${YELLOW}⚠ Server is currently running${NC}"
    read -p "   Restart server? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "   Stopping server..."
        pkill -f "uvicorn main:app"
        sleep 2
        echo -e "${GREEN}✓ Server stopped${NC}"
        
        echo "   Starting server..."
        nohup uvicorn main:app --host 0.0.0.0 --port 8000 > server.log 2>&1 &
        sleep 3
        
        if pgrep -f "uvicorn main:app" > /dev/null; then
            echo -e "${GREEN}✓ Server restarted successfully${NC}"
        else
            echo -e "${RED}✗ Failed to start server - check server.log${NC}"
            exit 1
        fi
    fi
else
    echo "   No server running"
    read -p "   Start server now? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "   Starting server..."
        nohup uvicorn main:app --host 0.0.0.0 --port 8000 > server.log 2>&1 &
        sleep 3
        
        if pgrep -f "uvicorn main:app" > /dev/null; then
            echo -e "${GREEN}✓ Server started successfully${NC}"
        else
            echo -e "${RED}✗ Failed to start server - check server.log${NC}"
            exit 1
        fi
    fi
fi
echo ""

# Step 8: Test health endpoint
echo "8️⃣  Testing health endpoint..."
sleep 2
if curl -s http://localhost:8000/health > /dev/null; then
    echo -e "${GREEN}✓ Server is responding${NC}"
    echo "   Response:"
    curl -s http://localhost:8000/health | python3 -m json.tool
else
    echo -e "${RED}✗ Server not responding${NC}"
    echo "   Check server.log for errors"
fi
echo ""

# Step 9: Summary
echo "=========================================="
echo "Deployment Summary"
echo "=========================================="
echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 What was deployed:"
echo "   • New chatbot endpoint: /api/v1/chat/document"
echo "   • AWS Bedrock Claude integration"
echo "   • Fallback mode for offline operation"
echo "   • Chat history tracking"
echo ""
echo "🔧 Next steps:"
echo "   1. Test the chatbot in your frontend"
echo "   2. Verify AWS Bedrock access (if not done)"
echo "   3. Monitor server.log for any errors"
echo "   4. Check CloudWatch for Bedrock usage"
echo ""
echo "📚 Documentation:"
echo "   • AWS-BEDROCK-CLAUDE-SETUP.md - Setup guide"
echo "   • CHATBOT-TESTING-GUIDE.md - Testing procedures"
echo "   • IMPLEMENTATION-SUMMARY.md - Complete overview"
echo ""
echo "🔍 Useful commands:"
echo "   • View logs: tail -f server.log"
echo "   • Test Bedrock: python3 test_bedrock.py"
echo "   • Restart server: pkill -f uvicorn && uvicorn main:app --host 0.0.0.0 --port 8000"
echo "   • Check status: curl http://localhost:8000/health"
echo ""
echo "=========================================="
