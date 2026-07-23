FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/ ./packages/
COPY apps/search-service/package.json ./apps/search-service/
RUN npm install
COPY apps/search-service ./apps/search-service

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app /app
WORKDIR /app/apps/search-service
EXPOSE 5011
CMD ["npm", "start"]
