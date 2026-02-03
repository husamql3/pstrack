#!/bin/bash
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
[ ! -d "$ROOT/packages/env" ] && [ -d "$(pwd)/packages/env" ] && ROOT="$(pwd)"
ENV_DIR="$ROOT/packages/env"


echo "📦 Copying environment files to the server"
cp -f "$ENV_DIR/.env.development" "$ROOT/apps/server/.env.development"
cp -f "$ENV_DIR/.env.production" "$ROOT/apps/server/.env.production"
echo "✅ Server environment files copied successfully"
echo ""

echo "🔑 Copying secrets to the web"
cp -f "$ENV_DIR/.env.development" "$ROOT/apps/web/.env.development"
cp -f "$ENV_DIR/.env.production" "$ROOT/apps/web/.env.production"
echo "✅ Web environment files copied successfully"
echo ""

echo "🔑 Copying secrets to the db"
cp -f "$ENV_DIR/.env.development" "$ROOT/packages/db/.env.development"
cp -f "$ENV_DIR/.env.production" "$ROOT/packages/db/.env.production"
echo "✅ DB environment files copied successfully"
echo ""

echo ""
echo "📦 Environment files copied successfully"
echo ""