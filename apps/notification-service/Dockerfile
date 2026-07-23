FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/ ./packages/
COPY apps/notification-service/package.json ./apps/notification-service/
RUN npm install
COPY apps/notification-service ./apps/notification-service

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app /app
WORKDIR /app/apps/notification-service
EXPOSE 5005
CMD ["npm", "start"]
