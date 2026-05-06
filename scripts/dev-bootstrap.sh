#!/usr/bin/env sh
set -e
cd /opt/data/workspace/mcp-timekeeper
npm install
npm run -w @timekeeper/api build
npm run -w @timekeeper/mcp-server build
npm run -w @timekeeper/api migrate
npm run -w @timekeeper/api seed
