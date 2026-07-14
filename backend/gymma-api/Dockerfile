FROM node:20-slim
WORKDIR /app

COPY package.json package-lock.json ./
RUN npm install

COPY tsconfig.json ./
COPY src ./src
RUN npm run build

COPY migrations ./migrations

ENV NODE_ENV=production
EXPOSE 3001
CMD ["node", "dist/server.js"]
