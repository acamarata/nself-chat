#!/bin/bash
set -e

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                            ║"
echo "║  nself-chat Frontend Restructure: Phase 2 - Finalization                  ║"
echo "║                                                                            ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
echo ""

cd /Users/admin/Sites/nself-chat/frontend

echo "Phase 6: Update import paths in src.new/..."
echo "  This will update ~1000 import statements..."

# Helper function to replace imports
replace_imports() {
  local OLD=$1
  local NEW=$2
  echo "  Replacing: $OLD → $NEW"
  find src.new -type f \( -name "*.ts" -o -name "*.tsx" \) \
    -exec sed -i '' "s|from '$OLD'|from '$NEW'|g" {} \; 2>/dev/null || true
  find src.new -type f \( -name "*.ts" -o -name "*.tsx" \) \
    -exec sed -i '' "s|from \"$OLD\"|from \"$NEW\"|g" {} \; 2>/dev/null || true
  find src.new -type f \( -name "*.ts" -o -name "*.tsx" \) \
    -exec sed -i '' "s|from '$OLD/|from '$NEW/|g" {} \; 2>/dev/null || true
  find src.new -type f \( -name "*.ts" -o -name "*.tsx" \) \
    -exec sed -i '' "s|from \"$OLD/|from \"$NEW/|g" {} \; 2>/dev/null || true
}

# Count before
BEFORE=$(grep -r "@nself-chat/" src.new/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l || echo "0")
echo "  Found $BEFORE workspace imports to replace"

# Apply all replacements
replace_imports "@nself-chat/core" "@/lib/core"
replace_imports "@nself-chat/api" "@/lib/api-client"
replace_imports "@nself-chat/state" "@/stores"
replace_imports "@nself-chat/ui" "@/components/ui"
replace_imports "@nself-chat/config" "@/config"
replace_imports "@nself-chat/testing" "@/test-utils"

# Count after
AFTER=$(grep -r "@nself-chat/" src.new/ --include="*.ts" --include="*.tsx" 2>/dev/null | wc -l || echo "0")
echo "  Remaining workspace imports: $AFTER"
echo "✅ Import paths updated"
echo ""

echo "Phase 7: Update tsconfig.json..."
cat > tsconfig.json.new << 'TSCONFIG'
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/config/*": ["./src/config/*"],
      "@/stores/*": ["./src/stores/*"],
      "@/test-utils/*": ["./src/test-utils/*"]
    }
  },
  "include": [
    "next-env.d.ts",
    "**/*.ts",
    "**/*.tsx",
    ".next/types/**/*.ts",
    "src/**/*"
  ],
  "exclude": [
    "node_modules",
    ".next",
    "platforms/**",
    "tests/**"
  ]
}
TSCONFIG
echo "✅ tsconfig.json updated"
echo ""

echo "Phase 8: Update jest.config.js..."
# Read the original jest.config.js and update paths
if [ -f "jest.config.js.new" ]; then
  # Update moduleNameMapper to remove workspace references
  sed -i '' "s|'@nself-chat/core': '<rootDir>/../../packages/core/src'|// Removed workspace reference|g" jest.config.js.new
  sed -i '' "s|'@nself-chat/api': '<rootDir>/../../packages/api/src'|// Removed workspace reference|g" jest.config.js.new
  sed -i '' "s|'@nself-chat/state': '<rootDir>/../../packages/state/src'|// Removed workspace reference|g" jest.config.js.new
  sed -i '' "s|'@nself-chat/ui': '<rootDir>/../../packages/ui/src'|// Removed workspace reference|g" jest.config.js.new
  sed -i '' "s|'@nself-chat/config': '<rootDir>/../../packages/config/src'|// Removed workspace reference|g" jest.config.js.new
  sed -i '' "s|'@nself-chat/testing': '<rootDir>/../../packages/testing/src'|// Removed workspace reference|g" jest.config.js.new
fi
echo "✅ jest.config.js updated"
echo ""

echo "Phase 9: Replace old files with new ones..."
read -p "⚠️  This will replace your current files. Continue? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted. Files with .new extension preserved for manual review."
  exit 1
fi

# Backup old structure
mkdir -p .migration-backup
[ -d "apps" ] && cp -r apps .migration-backup/
[ -d "packages" ] && cp -r packages .migration-backup/
[ -f "pnpm-workspace.yaml" ] && cp pnpm-workspace.yaml .migration-backup/

# Replace with new files
[ -f "package.json.new" ] && mv package.json.new package.json
[ -f "next.config.js.new" ] && mv next.config.js.new next.config.js
[ -f "tsconfig.json.new" ] && mv tsconfig.json.new tsconfig.json
[ -f "jest.config.js.new" ] && mv jest.config.js.new jest.config.js
[ -f "jest.setup.js.new" ] && mv jest.setup.js.new jest.setup.js
[ -f "playwright.config.ts.new" ] && mv playwright.config.ts.new playwright.config.ts
[ -f "postcss.config.js.new" ] && mv postcss.config.js.new postcss.config.js
[ -f "tailwind.config.ts.new" ] && mv tailwind.config.ts.new tailwind.config.ts
[ -f ".eslintrc.json.new" ] && mv .eslintrc.json.new .eslintrc.json
[ -f "sentry.properties.new" ] && mv sentry.properties.new sentry.properties
[ -f "vercel.json.new" ] && mv vercel.json.new vercel.json

# Replace directories
[ -d "src.new" ] && rm -rf src && mv src.new src
[ -d "public.new" ] && rm -rf public && mv public.new public
[ -d "tests/e2e.new" ] && rm -rf tests/e2e && mv tests/e2e.new tests/e2e

echo "✅ Files replaced"
echo ""

echo "Phase 10: Clean up old structure..."
rm -f pnpm-workspace.yaml
rm -rf apps/
rm -rf packages/
rm -rf tooling/
echo "✅ Old structure removed"
echo ""

echo "Phase 11: Update pnpm lock file..."
pnpm install
echo "✅ Dependencies reinstalled"
echo ""

echo "╔════════════════════════════════════════════════════════════════════════════╗"
echo "║                                                                            ║"
echo "║  ✅ Migration COMPLETE!                                                    ║"
echo "║                                                                            ║"
echo "║  New structure:                                                            ║"
echo "║  frontend/                                                                 ║"
echo "║  ├── README.md                                                             ║"
echo "║  ├── package.json         (merged from apps/web)                           ║"
echo "║  ├── next.config.js       (from apps/web)                                  ║"
echo "║  ├── tsconfig.json        (updated paths)                                  ║"
echo "║  ├── src/                 (from apps/web/src + packages/*)                 ║"
echo "║  ├── public/              (from apps/web/public)                           ║"
echo "║  ├── platforms/           (from apps/mobile, apps/desktop)                 ║"
echo "║  │   ├── mobile/                                                           ║"
echo "║  │   └── desktop/                                                          ║"
echo "║  ├── variants/            (new - platform-specific UI)                     ║"
echo "║  └── tests/               (from apps/web/e2e)                              ║"
echo "║                                                                            ║"
echo "║  Next steps:                                                               ║"
echo "║  1. pnpm type-check         # Verify TypeScript                            ║"
echo "║  2. pnpm build              # Test production build                        ║"
echo "║  3. pnpm test               # Run test suite                               ║"
echo "║  4. pnpm dev                # Start dev server                             ║"
echo "║                                                                            ║"
echo "║  Backup location: .migration-backup/                                       ║"
echo "║                                                                            ║"
echo "╚════════════════════════════════════════════════════════════════════════════╝"
