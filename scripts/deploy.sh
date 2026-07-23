#!/bin/bash

# Company CRM - Deployment Script
# Automates code pulls, container rebuilding, service orchestration, and health checks.

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "=========================================="
echo "Company CRM - Deployment Pipeline"
echo "=========================================="
echo ""

if [ ! -f .env ]; then
    echo -e "${RED}[ERROR] Required configuration file .env not found.${NC}"
    echo "Please create a .env file with necessary environment variables."
    exit 1
fi

echo -e "${YELLOW}[INFO] Synchronizing latest codebase from repository...${NC}"
git pull origin main || git pull origin master

echo -e "${YELLOW}[INFO] Stopping active container cluster...${NC}"
docker-compose down

echo -e "${YELLOW}[INFO] Building fresh Docker images...${NC}"
docker-compose build --no-cache

echo -e "${YELLOW}[INFO] Launching service instances...${NC}"
docker-compose up -d

echo -e "${YELLOW}[INFO] Waiting for service initialization...${NC}"
sleep 10

echo ""
echo -e "${YELLOW}[INFO] Executing service health checks...${NC}"
echo ""

check_service() {
    local service=$1
    local port=$2
    
    if curl -s -f http://localhost:$port/health > /dev/null 2>&1 || curl -s -f http://localhost:$port/api > /dev/null 2>&1 || curl -s -f http://localhost:$port/ > /dev/null 2>&1; then
        echo -e "${GREEN}[OK] $service operational (port $port)${NC}"
    else
        echo -e "${RED}[FAIL] $service non-responsive (port $port)${NC}"
    fi
}


check_service "Gateway" 5000
check_service "Frontend" 3000

echo ""
echo -e "${YELLOW}[INFO] Container status summary:${NC}"
docker-compose ps

echo ""
echo -e "${YELLOW}[INFO] Recent application logs:${NC}"
docker-compose logs --tail=50

echo ""
echo "=========================================="
echo -e "${GREEN}[SUCCESS] Application Deployment Complete!${NC}"
echo "=========================================="
echo ""
echo "Deployment Endpoints:"
echo "  Frontend: http://$(curl -s ifconfig.me):3000"
echo "  API Gateway: http://$(curl -s ifconfig.me):5000"
echo ""
echo "Management Commands:"
echo "  Stream logs: docker-compose logs -f"
echo "  Restart:     docker-compose restart"
echo "  Shutdown:    docker-compose down"
echo ""

