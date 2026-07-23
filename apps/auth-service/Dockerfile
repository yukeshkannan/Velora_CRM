# Build stage
FROM node:18-alpine AS builder
WORKDIR /app

# Copy root configs
COPY package.json package-lock.json* ./
COPY packages/ ./packages/
COPY apps/auth-service/package.json ./apps/auth-service/

# Install dependencies (Root and Workspaces)
RUN npm install

# Copy service source
COPY apps/auth-service ./apps/auth-service

# Final stage
FROM node:18-alpine
WORKDIR /app

# Copy all node_modules and code from builder
COPY --from=builder /app /app

WORKDIR /app/apps/auth-service
EXPOSE 5001

CMD ["npm", "start"]
