# Stage 1: Build & Dependencies
FROM node:26-alpine AS builder
RUN apk add --no-cache python3 make g++ 
WORKDIR /app
COPY package*.json ./
RUN npm install --legacy-peer-deps
COPY . .
RUN npm run build

# Stage 2: Production
FROM node:26-alpine
WORKDIR /app
ENV NODE_ENV=production

# curl für Coolify-Healthcheck (node:24-alpine bringt es nicht mit)
RUN apk add --no-cache curl

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
