# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy monorepo config
COPY package.json package-lock.json* ./
COPY apps/client/package.json ./apps/client/

# Install dependencies
RUN npm install

# Copy source and build
COPY apps/client ./apps/client
WORKDIR /app/apps/client
# Handle Env Vars
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# Production stage (using Nginx to serve the static files)
FROM nginx:stable-alpine
COPY --from=builder /app/apps/client/dist /usr/share/nginx/html

# Add a simple nginx config to handle React Router (SPA)
RUN echo "server { \
    listen 80; \
    location / { \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    try_files \$uri \$uri/ /index.html; \
    } \
    location /api/opportunities { \
    proxy_pass http://opportunity-service:5003; \
    } \
    location /api { \
    proxy_pass http://gateway:5000; \
    } \
    }" > /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
