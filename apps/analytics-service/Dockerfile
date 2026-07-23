FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/ ./packages/
COPY apps/analytics-service/package.json ./apps/analytics-service/
RUN npm install
COPY apps/analytics-service ./apps/analytics-service

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app /app
WORKDIR /app/apps/analytics-service
EXPOSE 5006
CMD ["npm", "start"]
