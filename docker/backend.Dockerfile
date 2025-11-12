# syntax=docker/dockerfile:1.7

FROM node:20-alpine AS base
WORKDIR /app

FROM base AS deps
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --legacy-peer-deps

FROM base AS builder
WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --legacy-peer-deps
COPY backend ./ 
COPY prisma ../prisma
RUN npx prisma generate --schema ../prisma/schema.prisma
RUN npm run build

FROM base AS production
ENV NODE_ENV=production
WORKDIR /app/backend

COPY --from=deps /app/backend/node_modules ./node_modules
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/package.json ./package.json
COPY --from=builder /app/prisma ../prisma

EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy --schema=/app/prisma/schema.prisma && node dist/main.js"]
