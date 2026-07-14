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
EXPOSE 3001
CMD ["node", "dist/server.js"]
