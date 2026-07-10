FROM node:20-slim AS base
WORKDIR /app
ENV NODE_ENV=production

FROM base AS deps
ENV NODE_ENV=development
COPY package.json package-lock.json* ./
RUN npm ci

FROM base AS build
ENV NODE_ENV=development
COPY package.json package-lock.json* ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM base AS runtime
COPY package.json ./
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY migrations ./migrations
EXPOSE 3002 3001
# Default process is the REST + WebSocket server. The worker deploys from
# this SAME image on Render — create a second service pointing at this repo
# with Docker Command overridden to `node dist/worker.js`.
CMD ["node", "dist/server.js"]
