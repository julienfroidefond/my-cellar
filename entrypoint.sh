#!/bin/sh
set -e

# Ensure upload directory exists at runtime (survives volume mounts that replace image layers)
mkdir -p /app/public/wines

echo "Running database migrations..."
./node_modules/.bin/prisma migrate deploy

exec "$@"
