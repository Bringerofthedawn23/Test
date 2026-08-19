# ── Build stage ──────────────────────────────────────────────
FROM node:20-alpine AS build

WORKDIR /app

# Install dependencies (including dev deps for the TS build).
COPY package.json package-lock.json* ./
RUN npm install

# Compile TypeScript -> dist/
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Drop dev dependencies for a slim runtime image.
RUN npm prune --omit=dev

# ── Runtime stage ────────────────────────────────────────────
FROM node:20-alpine AS runtime

WORKDIR /app
ENV NODE_ENV=production

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./

# Register slash commands on boot, then start the bot.
CMD ["node", "dist/index.js"]
