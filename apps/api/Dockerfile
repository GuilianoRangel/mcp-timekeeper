FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/api/package*.json ./apps/api/
COPY apps/mcp/package*.json ./apps/mcp/
COPY packages/shared/package*.json ./packages/shared/
RUN npm install

COPY . .
RUN npm run -w @timekeeper/api build

FROM node:20-bookworm-slim
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app /app
EXPOSE 3000
CMD ["node", "apps/api/dist/main.js"]
