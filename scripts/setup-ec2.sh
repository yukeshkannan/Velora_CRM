#!/bin/bash

# Company CRM - EC2 Instance Setup Script
# Configures system packages, Docker runtime, swap memory, and firewall rules.

set -e

echo "=========================================="
echo "Company CRM - Server Environment Setup"
echo "=========================================="
echo ""

echo "[INFO] Updating system packages..."
sudo apt update && sudo apt upgrade -y

echo "[INFO] Installing base dependencies..."
sudo apt install -y git curl wget nano htop

echo "[INFO] Installing Docker engine..."
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
rm get-docker.sh

echo "[INFO] Granting Docker permissions to current user..."
sudo usermod -aG docker $USER

echo "[INFO] Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

echo ""
echo "[INFO] Verifying runtime installations..."
docker --version
docker-compose --version

echo ""
echo "[INFO] Configuring firewall rules (UFW)..."
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 5000/tcp  # API Gateway
sudo ufw allow 3000/tcp  # Frontend
echo "y" | sudo ufw enable

echo ""
echo "[INFO] Optimizing system file limits..."
sudo tee -a /etc/security/limits.conf > /dev/null <<EOF
* soft nofile 65536
* hard nofile 65536
EOF

echo ""
echo "[INFO] Configuring swap space (4GB)..."
if [ ! -f /swapfile ]; then
    sudo fallocate -l 4G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    echo "[INFO] Swap space created: 4GB"
else
    echo "[INFO] Swap file already present"
fi

echo ""
echo "[INFO] Initializing project workspace..."
mkdir -p ~/company-crm
cd ~/company-crm

echo ""
echo "=========================================="
echo "[SUCCESS] Environment Provisioning Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Logout and reconnect SSH session to update user group privileges."
echo "2. Clone application repository into ~/company-crm"
echo "3. Configure environment variables in .env"
echo "4. Execute: docker-compose up -d"
echo ""

