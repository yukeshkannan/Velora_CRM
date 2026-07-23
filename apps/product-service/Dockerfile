FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/ ./packages/
COPY apps/product-service/package.json ./apps/product-service/
RUN npm install
COPY apps/product-service ./apps/product-service

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app /app
WORKDIR /app/apps/product-service
EXPOSE 5008
CMD ["npm", "start"]
