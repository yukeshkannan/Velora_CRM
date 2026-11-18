#!/bin/bash
# ==============================================================================
# Velora CRM - Oracle Cloud Infrastructure (OCI) Environment Provisioning Script
# Supports: Ubuntu 20.04/22.04/24.04 & Oracle Linux 8/9 (UEK/RHEL)
# ==============================================================================

set -euo pipefail

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}====================================================${NC}"
echo -e "${BLUE}   Velora CRM - OCI Server Provisioning Pipeline    ${NC}"
echo -e "${BLUE}====================================================${NC}"

# 1. Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS_NAME=$ID
else
    echo -e "${RED}[ERROR] Unable to detect operating system distribution.${NC}"
    exit 1
fi

echo -e "${YELLOW}[1/6] Detected OS: ${OS_NAME} (${VERSION_ID:-unknown})${NC}"

# 2. Package updates & Base Dependencies
echo -e "${YELLOW}[2/6] Updating system packages and installing core tools...${NC}"
if [[ "$OS_NAME" == "ubuntu" || "$OS_NAME" == "debian" ]]; then
    export DEBIAN_FRONTEND=noninteractive
    sudo apt update -y && sudo apt upgrade -y
    sudo apt install -y git curl wget nano htop ca-certificates gnupg lsb-release iptables-persistent netfilter-persistent
elif [[ "$OS_NAME" == "ol" || "$OS_NAME" == "rhel" || "$OS_NAME" == "centos" ]]; then
    sudo dnf update -y
    sudo dnf install -y git curl wget nano htop ca-certificates iptables-services firewalld
else
    echo -e "${YELLOW}[WARN] Unrecognized OS family. Proceeding with generic package installation...${NC}"
fi

# 3. Configure Swap Memory (4GB Recommended for OCI Micro & Flex Shapes)
echo -e "${YELLOW}[3/6] Configuring virtual swap memory (4GB)...${NC}"
if [ ! -f /swapfile ]; then
    sudo fallocate -l 4G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=4096
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    if ! grep -q '/swapfile' /etc/fstab; then
        echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    fi
    echo -e "${GREEN}[OK] 4GB swap space allocated and active.${NC}"
else
    echo -e "${GREEN}[OK] Swapfile already exists. Skipping creation.${NC}"
fi

# 4. Critical OCI Firewall & Iptables Configuration
# NOTE: Oracle Cloud images enforce strict local iptables drop rules by default.
echo -e "${YELLOW}[4/6] Opening OCI OS-level firewall ports (22, 80, 443, 3000, 5000)...${NC}"

if command -v iptables &>/dev/null; then
    sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT || true
    sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT || true
    sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT || true
    sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 5000 -j ACCEPT || true
fi

if [[ "$OS_NAME" == "ubuntu" || "$OS_NAME" == "debian" ]]; then
    if command -v netfilter-persistent &>/dev/null; then
        sudo netfilter-persistent save || true
    fi
    if command -v ufw &>/dev/null; then
        sudo ufw allow 22/tcp || true
        sudo ufw allow 80/tcp || true
        sudo ufw allow 443/tcp || true
        sudo ufw allow 3000/tcp || true
        sudo ufw allow 5000/tcp || true
        echo "y" | sudo ufw enable || true
    fi
elif [[ "$OS_NAME" == "ol" || "$OS_NAME" == "rhel" ]]; then
    if command -v firewall-cmd &>/dev/null; then
        sudo systemctl enable --now firewalld || true
        sudo firewall-cmd --permanent --add-port=22/tcp || true
        sudo firewall-cmd --permanent --add-port=80/tcp || true
        sudo firewall-cmd --permanent --add-port=443/tcp || true
        sudo firewall-cmd --permanent --add-port=3000/tcp || true
        sudo firewall-cmd --permanent --add-port=5000/tcp || true
        sudo firewall-cmd --reload || true
    fi
fi
echo -e "${GREEN}[OK] Host firewall configured.${NC}"

# 5. Install Docker & Docker Compose
echo -e "${YELLOW}[5/6] Installing Docker Engine & Docker Compose...${NC}"
if ! command -v docker &>/dev/null; then
    curl -fsSL https://get.docker.com -o /tmp/get-docker.sh
    sudo sh /tmp/get-docker.sh
    rm -f /tmp/get-docker.sh
    sudo systemctl enable --now docker
    sudo usermod -aG docker "$USER"
    echo -e "${GREEN}[OK] Docker engine installed.${NC}"
else
    echo -e "${GREEN}[OK] Docker is already installed: $(docker --version)${NC}"
fi

# Ensure docker compose plugin exists
if ! docker compose version &>/dev/null && ! command -v docker-compose &>/dev/null; then
    sudo curl -SL "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    sudo chmod +x /usr/local/bin/docker-compose
fi

# 6. Optimize System Limits
echo -e "${YELLOW}[6/6] Tuning kernel and file descriptor limits...${NC}"
sudo tee -a /etc/security/limits.conf > /dev/null <<EOF
* soft nofile 65536
* hard nofile 65536
EOF
sudo sysctl -w vm.max_map_count=262144 || true

echo ""
echo -e "${GREEN}====================================================${NC}"
echo -e "${GREEN}   OCI Server Environment Provisioning Complete!    ${NC}"
echo -e "${GREEN}====================================================${NC}"
echo ""
echo -e "${BLUE}IMPORTANT OCI CLOUD CONSOLE CHECKLIST:${NC}"
echo "1. In OCI Console -> Networking -> Virtual Cloud Networks -> Your VCN"
echo "2. Open 'Default Security List' -> Add Ingress Rules:"
echo "   - Source: 0.0.0.0/0"
echo "   - IP Protocol: TCP"
echo "   - Destination Port Range: 80, 443, 3000, 5000"
echo ""
echo -e "${BLUE}NEXT STEPS:${NC}"
echo "1. Run: newgrp docker (or log out and re-ssh to activate docker group)"
echo "2. Navigate to project root: cd ~/company-crm"
echo "3. Copy environment file: cp .env.example .env"
echo "4. Configure credentials: nano .env"
echo "5. Deploy cluster: docker compose up -d --build"
echo ""
