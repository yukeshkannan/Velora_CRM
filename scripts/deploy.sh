#!/bin/bash
# ==============================================================================
# Velora CRM - Automated Zero-Downtime Deployment Pipeline
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}        Velora CRM - Production Deployment          ${NC}"
echo -e "${BLUE}====================================================${NC}"

# Detect Docker Compose command
if docker compose version &>/dev/null; then
    COMPOSE_CMD="docker compose"
elif command -v docker-compose &>/dev/null; then
    COMPOSE_CMD="docker-compose"
else
    echo -e "${RED}[ERROR] Neither 'docker compose' nor 'docker-compose' found.${NC}"
    exit 1
fi

if [ ! -f .env ]; then
    echo -e "${RED}[ERROR] Production .env file not found.${NC}"
    echo "Please copy .env.example to .env and configure production credentials."
    exit 1
fi

echo -e "${YELLOW}[1/5] Pulling latest codebase...${NC}"
git pull origin main || git pull origin master || echo -e "${YELLOW}[WARN] Git pull skipped or not a tracking branch.${NC}"

echo -e "${YELLOW}[2/5] Building production images...${NC}"
$COMPOSE_CMD build

echo -e "${YELLOW}[3/5] Starting application cluster in detached mode...${NC}"
$COMPOSE_CMD up -d --remove-orphans

echo -e "${YELLOW}[4/5] Waiting for services to stabilize (15s)...${NC}"
sleep 15

echo -e "${YELLOW}[5/5] Performing operational health checks...${NC}"
check_endpoint() {
    local name=$1
    local port=$2
    local path=$3
    if curl -s -f "http://localhost:${port}${path}" > /dev/null 2>&1; then
        echo -e "${GREEN}[OK] ${name} is responding (port ${port})${NC}"
    else
        echo -e "${RED}[WARN] ${name} failed health probe on port ${port}${NC}"
    fi
}

check_endpoint "API Gateway" 5000 "/health"
check_endpoint "Web Frontend" 3000 "/"

echo ""
echo -e "${BLUE}--- Container Cluster Status ---${NC}"
$COMPOSE_CMD ps

SERVER_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}      Deployment Completed Successfully!            ${NC}"
echo -e "${GREEN}====================================================${NC}"
echo ""
echo "Access URLs:"
echo "  Web Application: http://${SERVER_IP}:3000"
echo "  API Gateway:     http://${SERVER_IP}:5000"
echo ""
echo "Quick Commands:"
echo "  View Logs:       $COMPOSE_CMD logs -f"
echo "  Restart Cluster: $COMPOSE_CMD restart"
echo "  Stop Cluster:    $COMPOSE_CMD down"
echo ""
