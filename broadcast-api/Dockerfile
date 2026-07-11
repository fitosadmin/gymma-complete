FROM node:20-slim
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src
COPY migrations ./migrations
RUN npm run build

# Default process is the REST + WebSocket server. The worker deploys from
# this SAME image on Render — create a second service pointing at this repo
# with Docker Command overridden to `node dist/worker.js`.
EXPOSE 3002 3001
CMD ["node", "dist/server.js"]
