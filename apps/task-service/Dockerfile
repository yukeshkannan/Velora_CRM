FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/ ./packages/
COPY apps/task-service/package.json ./apps/task-service/
RUN npm install
COPY apps/task-service ./apps/task-service

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app /app
WORKDIR /app/apps/task-service
EXPOSE 5004
CMD ["npm", "start"]
