FROM node:20-bookworm-slim AS builder
WORKDIR /app

# Build tools required for better-sqlite3 native module
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm_config_nodedir=/usr/local npm install --legacy-peer-deps

COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma generate

COPY . .
RUN npm run build

# ── Runner ────────────────────────────────────────────────────────────────────
FROM node:20-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/prisma.config.ts ./
COPY --from=builder /app/app/generated ./app/generated
COPY --from=builder /app/scripts ./scripts

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh && mkdir -p public/wines

# Images uploaded at runtime must be persisted via a volume mount on the host.
# Example: docker run -v /data/my-cellar/wines:/app/public/wines ...
# Or in docker-compose: volumes: - ./wines:/app/public/wines
VOLUME /app/public/wines

EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
CMD ["npm", "run", "start"]
