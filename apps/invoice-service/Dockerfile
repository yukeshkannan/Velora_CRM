FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/ ./packages/
COPY apps/invoice-service/package.json ./apps/invoice-service/
RUN npm install
COPY apps/ ./apps/

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app /app
WORKDIR /app/apps/invoice-service
EXPOSE 5009
CMD ["npm", "start"]
