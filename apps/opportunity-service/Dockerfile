FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/ ./packages/
COPY apps/opportunity-service/package.json ./apps/opportunity-service/
RUN npm install
COPY apps/ ./apps/

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app /app
WORKDIR /app/apps/opportunity-service
EXPOSE 5003
CMD ["npm", "start"]
