FROM node:18-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/ ./packages/
COPY apps/contact-service/package.json ./apps/contact-service/
RUN npm install
COPY apps/contact-service ./apps/contact-service

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app /app
WORKDIR /app/apps/contact-service
EXPOSE 5002
CMD ["npm", "start"]
