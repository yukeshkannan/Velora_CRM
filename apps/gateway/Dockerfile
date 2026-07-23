# Base stage for common setup
FROM node:20-alpine AS base
WORKDIR /app

# Copy workspace metadata
COPY package.json package-lock.json* ./
COPY apps/gateway/package.json ./apps/gateway/
# Gateway might not need shared packages but we'll see. 
# Based on earlier views, it's just express-http-proxy.

# Install dependencies globally (monorepo style)
RUN npm install

# Copy app source
COPY apps/gateway ./apps/gateway

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=base /app /app

WORKDIR /app/apps/gateway
EXPOSE 5000
CMD ["npm", "start"]
