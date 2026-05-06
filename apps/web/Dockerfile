FROM node:20-bookworm-slim AS builder
WORKDIR /app

COPY package*.json ./
COPY apps/web/package*.json ./apps/web/
COPY apps/api/package*.json ./apps/api/
COPY apps/mcp/package*.json ./apps/mcp/
COPY packages/shared/package*.json ./packages/shared/
RUN npm install

COPY . .
RUN npm run -w @timekeeper/web build

FROM nginx:1.27-alpine
COPY apps/web/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY --from=builder /app/apps/web/dist/web/browser /usr/share/nginx/html
EXPOSE 80
