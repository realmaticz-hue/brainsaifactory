#!/bin/bash

# 🔧 AI Ad Generator - Build Fix & Verification Script
# This script diagnoses and fixes common build issues

echo "🚀 AI Ad Generator - Build Diagnostic Tool"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check Node.js version
echo -e "${BLUE}📋 Checking Node.js version...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js $NODE_VERSION installed${NC}"
else
    echo -e "${RED}❌ Node.js not found. Please install Node.js v16 or higher.${NC}"
    exit 1
fi

# Check npm version
echo -e "${BLUE}📋 Checking npm version...${NC}"
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    echo -e "${GREEN}✅ npm $NPM_VERSION installed${NC}"
else
    echo -e "${RED}❌ npm not found. Please install npm.${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}🔍 Scanning for common issues...${NC}"
echo ""

# Check if node_modules exists
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ node_modules directory exists${NC}"
else
    echo -e "${YELLOW}⚠️  node_modules not found - will install dependencies${NC}"
fi

# Check if package.json exists
if [ -f "package.json" ]; then
    echo -e "${GREEN}✅ package.json found${NC}"
else
    echo -e "${RED}❌ package.json not found. Are you in the correct directory?${NC}"
    exit 1
fi

# Check for App.tsx
if [ -f "App.tsx" ]; then
    echo -e "${GREEN}✅ App.tsx found${NC}"
else
    echo -e "${RED}❌ App.tsx not found${NC}"
fi

# Check for ErrorBoundary.tsx
if [ -f "components/ErrorBoundary.tsx" ]; then
    echo -e "${GREEN}✅ ErrorBoundary.tsx found${NC}"
else
    echo -e "${YELLOW}⚠️  ErrorBoundary.tsx not found in components directory${NC}"
fi

echo ""
echo -e "${BLUE}🧹 Cleaning previous builds...${NC}"
rm -rf node_modules package-lock.json dist .vite

echo ""
echo -e "${BLUE}📦 Installing dependencies...${NC}"
npm install

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    echo ""
    echo -e "${YELLOW}Troubleshooting tips:${NC}"
    echo "  1. Check your internet connection"
    echo "  2. Clear npm cache: npm cache clean --force"
    echo "  3. Try using: npm install --legacy-peer-deps"
    exit 1
fi

echo ""
echo -e "${BLUE}🔨 Starting development server...${NC}"
echo -e "${YELLOW}Note: If the server starts successfully, open http://localhost:5173/ in your browser${NC}"
echo ""

npm run dev
