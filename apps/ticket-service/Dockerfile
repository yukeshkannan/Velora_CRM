FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/ ./packages/
COPY apps/ticket-service/package.json ./apps/ticket-service/
RUN npm install
COPY apps/ticket-service ./apps/ticket-service

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app /app
WORKDIR /app/apps/ticket-service
EXPOSE 5010
CMD ["npm", "start"]
