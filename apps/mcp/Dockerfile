FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/mcp/package*.json ./apps/mcp/
COPY apps/api/package*.json ./apps/api/
COPY packages/shared/package*.json ./packages/shared/
RUN npm install

COPY . .
RUN npm run -w @timekeeper/mcp-server build

FROM node:20-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app /app
CMD ["node", "apps/mcp/dist/main.js"]
