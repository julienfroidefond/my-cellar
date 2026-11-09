# Node 24 is the current Active LTS (Node 20 reached end-of-life in April 2026:
# no more security updates from the official image).
FROM node:24-bookworm-slim AS builder
WORKDIR /app

# Build tools required for better-sqlite3 native module
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm_config_nodedir=/usr/local npm ci --legacy-peer-deps

COPY prisma ./prisma/
COPY prisma.config.ts ./
RUN NODE_TLS_REJECT_UNAUTHORIZED=0 npx prisma generate

COPY . .
RUN npm run build

# Keep only production dependencies in the runtime image: ESLint, Vitest and
# the TypeScript toolchain are build-time only and would otherwise ship their
# transitive CVEs to production.
RUN npm prune --omit=dev

# ── Runner ────────────────────────────────────────────────────────────────────
FROM node:24-bookworm-slim AS runner
WORKDIR /app

# Prisma's schema engine probes the system OpenSSL to select its binary, and
# outbound HTTPS needs a CA bundle: the slim image ships neither.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

# npm is only needed to build: removing it also removes its bundled dependency
# tree (undici, brace-expansion, …) from the production image. The app runs the
# Next and Prisma binaries directly instead.
RUN rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

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
CMD ["node", "node_modules/next/dist/bin/next", "start"]
