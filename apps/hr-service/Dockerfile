FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/ ./packages/
COPY apps/hr-service/package.json ./apps/hr-service/
RUN npm install
COPY apps/hr-service ./apps/hr-service

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app /app
WORKDIR /app/apps/hr-service
EXPOSE 5012
CMD ["npm", "start"]
