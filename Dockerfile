# Stage 1: Build & Dependencies
# glibc-Basis (Debian slim) statt Alpine/musl: Vite 8 nutzt den nativen
# Rolldown-Bundler, dessen musl-Binding beim Chunk-Rendering crasht (silent
# exit 255). Auf glibc läuft der Build stabil durch.
FROM node:lts-slim AS builder
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:lts-slim
WORKDIR /app
ENV NODE_ENV=production

# curl für Coolify-Healthcheck (node:lts-slim bringt es nicht mit)
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Verzeichnis für die Datenbank erstellen und Berechtigungen setzen
RUN mkdir -p /app/database && chown -R node:node /app/database

# Wir kopieren nur die notwendigen Artefakte. .env wird NICHT kopiert!
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/dist-server ./dist-server
COPY --from=builder /app/node_modules ./node_modules

# Remove devDependencies — native modules stay compiled from builder
RUN npm prune --omit=dev --legacy-peer-deps

USER node
EXPOSE 3000
CMD ["node", "dist-server/server.js"]
