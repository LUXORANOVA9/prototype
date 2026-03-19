#!/bin/bash
# =============================================
# Luxor9 Ai Factory — Deploy Script
# Supports: Coolify, CapRover, Docker, VPS
# =============================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
AMBER='\033[0;33m'
NC='\033[0m'

print_header() {
    echo -e "${AMBER}"
    echo "  ╔══════════════════════════════════════════╗"
    echo "  ║       LUXOR9 AI FACTORY — DEPLOY         ║"
    echo "  ╚══════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_step() { echo -e "${BLUE}[STEP]${NC} $1"; }
print_ok() { echo -e "${GREEN}[OK]${NC} $1"; }
print_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
print_err() { echo -e "${RED}[ERROR]${NC} $1"; }

print_header

# Detect deployment method
echo "Select deployment method:"
echo "  1) Coolify (Self-hosted PaaS — RECOMMENDED)"
echo "  2) Docker Compose (Any server)"
echo "  3) Manual VPS (Install directly)"
echo "  4) CapRover"
echo ""
read -p "Choice [1-4]: " DEPLOY_METHOD

case $DEPLOY_METHOD in
    1)
        # ===== COOLIFY DEPLOYMENT =====
        print_step "Setting up Coolify deployment..."

        # Check if Coolify is installed
        if ! command -v docker &> /dev/null; then
            print_step "Installing Coolify..."
            curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
        fi

        print_ok "Coolify ready. Next steps:"
        echo ""
        echo "  1. Open Coolify dashboard: http://your-server:8000"
        echo "  2. Click 'New Resource' → 'Docker Compose'"
        echo "  3. Paste the contents of docker-compose.coolify.yml"
        echo "  4. Set these environment variables:"
        echo "     - API_KEY=your-gemini-api-key"
        echo "     - JWT_SECRET=$(openssl rand -hex 32)"
        echo "  5. Click Deploy!"
        echo ""
        print_step "Building frontend..."
        npx esbuild index.tsx --bundle --outfile=dist/index.js --format=esm --jsx=automatic --loader:.tsx=tsx --loader:.ts=ts --minify
        cp index.html dist/index.html
        print_ok "Frontend built to dist/"
        ;;

    2)
        # ===== DOCKER COMPOSE DEPLOYMENT =====
        print_step "Deploying with Docker Compose..."

        # Check Docker
        if ! command -v docker &> /dev/null; then
            print_err "Docker not installed. Install from https://docs.docker.com/get-docker/"
            exit 1
        fi

        # Build frontend
        print_step "Building frontend..."
        npx esbuild index.tsx --bundle --outfile=dist/index.js --format=esm --jsx=automatic --loader:.tsx=tsx --loader:.ts=ts --minify
        cp index.html dist/index.html
        print_ok "Frontend built"

        # Set environment
        if [ -z "$API_KEY" ]; then
            read -p "Enter Gemini API KEY (or press Enter to skip): " API_KEY
        fi
        if [ -z "$JWT_SECRET" ]; then
            JWT_SECRET=$(openssl rand -hex 32)
            print_warn "Generated JWT_SECRET: $JWT_SECRET"
        fi

        export API_KEY
        export JWT_SECRET

        # Deploy
        print_step "Starting services..."
        docker-compose -f docker-compose.coolify.yml up -d

        print_ok "Deployed!"
        echo ""
        echo "  Frontend: http://localhost:3000"
        echo "  API:      http://localhost:8080"
        echo "  Health:   http://localhost:8080/health"
        echo ""
        ;;

    3)
        # ===== MANUAL VPS DEPLOYMENT =====
        print_step "Setting up manual VPS deployment..."

        # Check Node.js
        if ! command -v node &> /dev/null; then
            print_step "Installing Node.js..."
            curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
            apt-get install -y nodejs
        fi

        # Install backend deps
        print_step "Installing backend dependencies..."
        cd service
        npm install --production
        cd ..

        # Build frontend
        print_step "Building frontend..."
        npx esbuild index.tsx --bundle --outfile=dist/index.js --format=esm --jsx=automatic --loader:.tsx=tsx --loader:.ts=ts --minify
        cp index.html dist/index.html

        # Install serve for frontend
        npm install -g serve

        # Create systemd services
        print_step "Creating system services..."

        cat > /etc/systemd/system/luxor9-api.service << EOF
[Unit]
Description=Luxor9 Ai Factory API
After=network.target

[Service]
Type=simple
User=root
WorkingDir=$(pwd)/service
ExecStart=/usr/bin/node server.js
Restart=always
Environment=PORT=8080
Environment=JWT_SECRET=${JWT_SECRET:-$(openssl rand -hex 32)}
Environment=API_KEY=${API_KEY:-}

[Install]
WantedBy=multi-user.target
EOF

        cat > /etc/systemd/system/luxor9-web.service << EOF
[Unit]
Description=Luxor9 Ai Factory Frontend
After=network.target

[Service]
Type=simple
User=root
WorkingDir=$(pwd)
ExecStart=/usr/bin/npx serve -s dist -l 3000
Restart=always

[Install]
WantedBy=multi-user.target
EOF

        systemctl daemon-reload
        systemctl enable luxor9-api luxor9-web
        systemctl start luxor9-api luxor9-web

        print_ok "Services started!"
        echo ""
        echo "  Frontend: http://localhost:3000"
        echo "  API:      http://localhost:8080"
        echo ""
        echo "  Manage: systemctl status luxor9-api"
        echo "  Logs:   journalctl -u luxor9-api -f"
        ;;

    4)
        # ===== CAPROVER DEPLOYMENT =====
        print_step "Setting up CapRover deployment..."

        if ! command -v caprover &> /dev/null; then
            print_step "Installing CapRover CLI..."
            npm install -g caprover
        fi

        # Build frontend
        print_step "Building frontend..."
        npx esbuild index.tsx --bundle --outfile=dist/index.js --format=esm --jsx=automatic --loader:.tsx=tsx --loader:.ts=ts --minify
        cp index.html dist/index.html

        print_ok "Ready for CapRover!"
        echo ""
        echo "  1. Run: caprover login"
        echo "  2. Run: caprover deploy"
        echo "  3. In CapRover dashboard, set environment variables:"
        echo "     - API_KEY"
        echo "     - JWT_SECRET"
        echo ""
        ;;

    *)
        print_err "Invalid choice"
        exit 1
        ;;
esac

echo ""
print_ok "Deployment complete! Visit your Luxor9 Ai Factory."
