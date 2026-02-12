#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                            ║"
echo "║  nself-chat Frontend Restructure: Monorepo → Flat Structure               ║"
echo "║                                                                            ║"
echo "║  This script automates the migration from pnpm workspace to flat structure ║"
echo "║                                                                            ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

cd /Users/admin/Sites/nself-chat/frontend

echo "Phase 1: Pre-flight checks..."
if [ ! -f "apps/web/package.json" ]; then
  echo "❌ ERROR: apps/web/package.json not found"
  exit 1
fi
echo "✅ Pre-flight complete"
echo ""

echo "Phase 2: Merge packages into src/..."
echo "  Creating package target directories..."
mkdir -p src/lib/core
mkdir -p src/lib/api-client
mkdir -p variants/shared

# Only copy if packages exist and have content
if [ -d "packages/core/src" ] && [ "$(ls -A packages/core/src 2>/dev/null)" ]; then
  echo "  Moving packages/core → src/lib/core..."
  cp -r packages/core/src/* src/lib/core/
fi

if [ -d "packages/api/src" ] && [ "$(ls -A packages/api/src 2>/dev/null)" ]; then
  echo "  Moving packages/api → src/lib/api-client..."
  cp -r packages/api/src/* src/lib/api-client/
fi

echo "✅ Packages merged"
echo ""

echo "Phase 3: Move apps/web to frontend root..."
echo "  Moving Next.js config files..."
[ -f "apps/web/next.config.js" ] && cp apps/web/next.config.js ./next.config.js.new
[ -f "apps/web/tsconfig.json" ] && cp apps/web/tsconfig.json ./tsconfig.json.new
[ -f "apps/web/jest.config.js" ] && cp apps/web/jest.config.js ./jest.config.js.new
[ -f "apps/web/jest.setup.js" ] && cp apps/web/jest.setup.js ./jest.setup.js.new
[ -f "apps/web/playwright.config.ts" ] && cp apps/web/playwright.config.ts ./playwright.config.ts.new
[ -f "apps/web/postcss.config.js" ] && cp apps/web/postcss.config.js ./postcss.config.js.new
[ -f "apps/web/tailwind.config.ts" ] && cp apps/web/tailwind.config.ts ./tailwind.config.ts.new
[ -f "apps/web/.eslintrc.json" ] && cp apps/web/.eslintrc.json ./.eslintrc.json.new
[ -f "apps/web/sentry.properties" ] && cp apps/web/sentry.properties ./sentry.properties.new
[ -f "apps/web/vercel.json" ] && cp apps/web/vercel.json ./vercel.json.new

echo "  Moving src/ directory..."
if [ -d "apps/web/src" ]; then
  rm -rf src.new
  cp -r apps/web/src ./src.new
fi

echo "  Moving public/ directory..."
if [ -d "apps/web/public" ]; then
  rm -rf public.new
  cp -r apps/web/public ./public.new
fi

echo "  Moving e2e tests..."
if [ -d "apps/web/e2e" ]; then
  mkdir -p tests
  cp -r apps/web/e2e ./tests/e2e.new
fi

echo "✅ Files moved (with .new extension for safety)"
echo ""

echo "Phase 4: Create platforms structure..."
mkdir -p platforms/mobile
mkdir -p platforms/desktop

if [ -d "apps/mobile" ]; then
  echo "  Moving apps/mobile → platforms/mobile..."
  cp -r apps/mobile/* platforms/mobile/
fi

if [ -d "apps/desktop" ]; then
  echo "  Moving apps/desktop → platforms/desktop..."
  cp -r apps/desktop/* platforms/desktop/
fi

echo "✅ Platforms created"
echo ""

echo "Phase 5: Create new package.json..."
cat > package.json.new << 'PKGJSON'
{
  "name": "@nself-chat/web",
  "version": "0.9.2",
  "private": true,
  "packageManager": "pnpm@9.15.4",
  "description": "nself-chat - White-label team communication platform",
  "scripts": {
    "dev": "next dev",
    "dev:turbo": "next dev --turbo",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json,md}\"",
    "format:check": "prettier --check \"src/**/*.{ts,tsx,js,jsx,json,md}\"",
    "test": "NODE_OPTIONS='--max-old-space-size=8192' jest --forceExit --maxWorkers=2",
    "test:watch": "jest --watch --maxWorkers=2",
    "test:coverage": "NODE_OPTIONS='--max-old-space-size=8192' jest --coverage --forceExit --maxWorkers=2",
    "test:e2e": "playwright test",
    "type-check": "tsc --noEmit",
    "mobile:sync": "cd platforms/mobile && npx cap sync",
    "mobile:ios": "cd platforms/mobile && npx cap run ios",
    "mobile:android": "cd platforms/mobile && npx cap run android",
    "desktop:dev": "cd platforms/desktop && electron .",
    "desktop:build": "cd platforms/desktop && electron-builder"
  }
}
PKGJSON

# Merge dependencies from apps/web/package.json (excluding workspace refs)
node << 'NODESCRIPT'
const fs = require('fs');
const webPkg = JSON.parse(fs.readFileSync('apps/web/package.json', 'utf8'));
const newPkg = JSON.parse(fs.readFileSync('package.json.new', 'utf8'));

// Copy dependencies, filtering out workspace packages
newPkg.dependencies = {};
for (const [name, version] of Object.entries(webPkg.dependencies || {})) {
  if (!name.startsWith('@nself-chat/')) {
    newPkg.dependencies[name] = version;
  }
}

// Copy devDependencies
newPkg.devDependencies = webPkg.devDependencies || {};

// Write merged package.json
fs.writeFileSync('package.json.new', JSON.stringify(newPkg, null, 2) + '\n');
console.log('✅ Dependencies merged');
NODESCRIPT

echo ""

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                            ║"
echo "║  Migration Phase 1 COMPLETE!                                              ║"
echo "║                                                                            ║"
echo "║  Files created with .new extension for your review:                       ║"
echo "║  - package.json.new                                                        ║"
echo "║  - next.config.js.new                                                      ║"
echo "║  - tsconfig.json.new                                                       ║"
echo "║  - src.new/                                                                ║"
echo "║  - public.new/                                                             ║"
echo "║  - platforms/mobile/                                                       ║"
echo "║  - platforms/desktop/                                                      ║"
echo "║                                                                            ║"
echo "║  Next steps:                                                               ║"
echo "║  1. Review the .new files                                                  ║"
echo "║  2. Run ./finalize-migration.sh to complete                                ║"
echo "║                                                                            ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
