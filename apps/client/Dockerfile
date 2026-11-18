 # Build stage - Vite Client
FROM node:20-alpine AS builder
WORKDIR /app/apps/client

# Copy client manifest and install client dependencies only
COPY apps/client/package.json ./
RUN npm install --no-audit

# Copy client source code
COPY apps/client/ ./

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Production stage - Nginx
FROM nginx:stable-alpine
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html

# Nginx config for Single Page Application and API Gateway proxying
RUN echo "server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files \$uri \$uri/ /index.html; \
    } \
    location /api { \
        proxy_pass http://gateway:5000; \
        proxy_http_version 1.1; \
        proxy_set_header Upgrade \$http_upgrade; \
        proxy_set_header Connection 'upgrade'; \
        proxy_set_header Host \$host; \
        proxy_cache_bypass \$http_upgrade; \
        proxy_set_header X-Real-IP \$remote_addr; \
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for; \
        proxy_set_header X-Forwarded-Proto \$scheme; \
    } \
}" > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
