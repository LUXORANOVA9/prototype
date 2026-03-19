#!/bin/bash
# =============================================
# Luxor9 Ai Factory — AUTONOMOUS SETUP
# Run this ONE script. Everything else is automatic.
# =============================================
set -e

AMBER='\033[0;33m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${AMBER}"
cat << 'BANNER'
  ╔══════════════════════════════════════════════╗
  ║                                              ║
  ║        LUXOR9 AI FACTORY                     ║
  ║        Autonomous Full-Stack Setup           ║
  ║                                              ║
  ║   "A Boy, A Chair, A World of Code"          ║
  ║                                              ║
  ╚══════════════════════════════════════════════╝
BANNER
echo -e "${NC}"

cd "$(dirname "$0")"

# ==========================================
# STEP 1: Check prerequisites
# ==========================================
echo -e "${BLUE}[1/6]${NC} Checking prerequisites..."

# Check Docker
if command -v docker &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} Docker $(docker --version | awk '{print $3}')"
    HAS_DOCKER=1
else
    echo -e "  ${RED}✗${NC} Docker not found"
    HAS_DOCKER=0
fi

# Check Node.js
if command -v node &> /dev/null; then
    echo -e "  ${GREEN}✓${NC} Node.js $(node --version)"
    HAS_NODE=1
else
    echo -e "  ${RED}✗${NC} Node.js not found"
    HAS_NODE=0
fi

# ==========================================
# STEP 2: Generate secrets
# ==========================================
echo -e "\n${BLUE}[2/6]${NC} Generating secrets..."

if [ -f .env ]; then
    echo -e "  ${GREEN}✓${NC} .env exists, loading..."
    source .env
else
    JWT_SECRET=$(openssl rand -hex 32 2>/dev/null || head -c 64 /dev/urandom | od -An -tx1 | tr -d ' \n')
    cat > .env << EOF
# Luxor9 Ai Factory — Environment
PORT=8080
JWT_SECRET=${JWT_SECRET}
API_KEY=${API_KEY:-}
NODE_ENV=production
EOF
    echo -e "  ${GREEN}✓${NC} Generated .env with JWT_SECRET"
fi

# ==========================================
# STEP 3: Build frontend
# ==========================================
echo -e "\n${BLUE}[3/6]${NC} Building frontend..."

if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    mkdir -p dist
    cp index.html dist/index.html
    echo -e "  ${GREEN}✓${NC} Frontend HTML ready"
else
    echo -e "  ${GREEN}✓${NC} Frontend already built"
fi

# ==========================================
# STEP 4: Prepare backend
# ==========================================
echo -e "\n${BLUE}[4/6]${NC} Preparing backend..."

mkdir -p service/data/uploads
echo -e "  ${GREEN}✓${NC} Data directories created"

# ==========================================
# STEP 5: Choose deployment method
# ==========================================
echo -e "\n${BLUE}[5/6]${NC} Choosing deployment method..."

if [ "$HAS_DOCKER" = "1" ]; then
    echo -e "  Using Docker Compose (recommended)"
    
    # Stop any existing containers
    docker-compose down 2>/dev/null || true
    
    # Build and start
    echo -e "\n${BLUE}[6/6]${NC} Starting services..."
    
    # Export env vars for docker-compose
    export API_KEY="${API_KEY:-}"
    export JWT_SECRET="${JWT_SECRET}"
    export PORT=8080
    
    docker-compose up -d --build
    
    echo -e "\n  ${GREEN}✓${NC} Backend API starting on port 8080"
    echo -e "  ${GREEN}✓${NC} Frontend will be available on port 3000"
    
    # Wait for health check
    echo -e "\n  Waiting for backend to be healthy..."
    for i in $(seq 1 30); do
        if curl -s http://localhost:8080/health > /dev/null 2>&1; then
            echo -e "  ${GREEN}✓${NC} Backend is healthy!"
            break
        fi
        sleep 1
    done
    
elif [ "$HAS_NODE" = "1" ]; then
    echo -e "  Using Node.js directly"
    
    echo -e "\n${BLUE}[6/6]${NC} Starting services..."
    
    # Install backend deps
    cd service
    if [ ! -d "node_modules" ]; then
        npm install --production 2>/dev/null
    fi
    cd ..
    
    # Start backend
    cd service
    PORT=8080 JWT_SECRET="${JWT_SECRET}" API_KEY="${API_KEY:-}" node server.js &
    API_PID=$!
    cd ..
    
    # Start frontend
    if command -v npx &> /dev/null; then
        npx serve -s dist -l 3000 &
        WEB_PID=$!
    fi
    
    echo $API_PID > .api.pid
    echo $WEB_PID > .web.pid
    
    echo -e "  ${GREEN}✓${NC} Backend PID: $API_PID"
    echo -e "  ${GREEN}✓${NC} Frontend PID: $WEB_PID"
    
    sleep 2
    if curl -s http://localhost:8080/health > /dev/null 2>&1; then
        echo -e "  ${GREEN}✓${NC} Backend is healthy!"
    fi
    
else
    echo -e "  ${RED}Error: Neither Docker nor Node.js found.${NC}"
    echo -e "  Install one of them and run this script again."
    exit 1
fi

# ==========================================
# STEP 6: Seed demo data
# ==========================================
echo -e "\n${BLUE}[Bonus]${NC} Seeding demo data..."

cd service
if [ -f "seed.js" ]; then
    PORT=8080 JWT_SECRET="${JWT_SECRET}" node seed.js 2>/dev/null || true
    echo -e "  ${GREEN}✓${NC} Demo user created: demo / demo123"
fi
cd ..

# ==========================================
# DONE
# ==========================================
echo -e "\n${AMBER}"
cat << 'DONE'
  ╔══════════════════════════════════════════════╗
  ║                                              ║
  ║          SETUP COMPLETE!                     ║
  ║                                              ║
  ║  Frontend:  http://localhost:3000            ║
  ║  API:       http://localhost:8080            ║
  ║  Health:    http://localhost:8080/health     ║
  ║                                              ║
  ║  Demo Login: demo / demo123                  ║
  ║                                              ║
  ╚══════════════════════════════════════════════╝
DONE
echo -e "${NC}"

# Open browser if possible
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:3000 2>/dev/null &
elif command -v open &> /dev/null; then
    open http://localhost:3000 2>/dev/null &
fi
