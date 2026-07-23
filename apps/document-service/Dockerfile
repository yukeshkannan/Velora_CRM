FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/ ./packages/
COPY apps/document-service/package.json ./apps/document-service/
RUN npm install
COPY apps/document-service ./apps/document-service

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app /app
WORKDIR /app/apps/document-service
EXPOSE 5007
CMD ["npm", "start"]
