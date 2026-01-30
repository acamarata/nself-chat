# CI/CD Fixes Needed

**Date**: January 30, 2026
**Status**: 🔴 Multiple workflows failing

---

## 🚨 Critical Issues

### 1. Security Vulnerability - Next.js ⭐⭐⭐⭐⭐

**Severity**: HIGH
**Issue**: Next.js HTTP request deserialization DoS vulnerability

```
Package: next
Current: 15.5.9 (via @nhost/nextjs, @sentry/nextjs)
Required: >=15.5.10
CVE: GHSA-h25m-26qc-wcjf
```

**Fix**:
```bash
# Force update Next.js to latest
pnpm update next@latest
# Or specifically
pnpm add next@15.5.10

# This will update peer dependencies in:
# - @nhost/nextjs@2.3.1
# - @sentry/nextjs@8.55.0
```

**Impact**: Blocks CI security scan
**Priority**: CRITICAL - Fix immediately

---

### 2. Docker Build Workflow Failure ⭐⭐⭐⭐

**File**: `.github/workflows/docker-build.yml`
**Line**: 66
**Issue**: Invalid secret condition syntax

**Current (BROKEN)**:
```yaml
- name: Log in to Docker Hub (optional)
  if: ${{ secrets.DOCKERHUB_USERNAME != '' }}  # ❌ Can't evaluate secrets in conditions
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}
```

**Fix**:
```yaml
- name: Log in to Docker Hub (optional)
  if: ${{ env.DOCKERHUB_USERNAME != '' }}  # ✅ Use env variable
  env:
    DOCKERHUB_USERNAME: ${{ secrets.DOCKERHUB_USERNAME }}
  uses: docker/login-action@v3
  with:
    username: ${{ env.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}
```

OR simpler:
```yaml
- name: Log in to Docker Hub (optional)
  # Skip condition - just let it fail gracefully if secret not set
  continue-on-error: true
  uses: docker/login-action@v3
  with:
    username: ${{ secrets.DOCKERHUB_USERNAME }}
    password: ${{ secrets.DOCKERHUB_TOKEN }}
```

**Impact**: Workflow fails immediately on push
**Priority**: HIGH - Prevents Docker image builds

---

## ⚠️ Non-Critical Issues

### 3. ESLint Warnings (43 total) ⭐⭐

**Issue**: Unused variables not prefixed with `_`

**Examples**:
```typescript
// src/app/activity/page.tsx:12
import { ActivityFeed } from '@/components/activity'  // ❌ unused

// src/app/admin/analytics/page.tsx:11
import { Clock } from 'lucide-react'  // ❌ unused

// Fix: Prefix with underscore
import { Clock as _Clock } from 'lucide-react'
// Or remove if truly unused
```

**Auto-Fix Available**:
```bash
pnpm run fix:unused-vars
# or
node scripts/fix-all-unused.js
```

**Impact**: CI warnings but doesn't fail build
**Priority**: MEDIUM - Clean up for cleaner CI

---

### 4. Next.js Lint Deprecation Warning ⭐

**Warning**: `next lint` is deprecated in Next.js 16

**Current**:
```json
{
  "scripts": {
    "lint": "next lint"
  }
}
```

**Migration**:
```bash
npx @next/codemod@canary next-lint-to-eslint-cli .
```

**Or manually**:
```json
{
  "scripts": {
    "lint": "eslint . --ext .js,.jsx,.ts,.tsx --fix"
  }
}
```

**Impact**: None currently, but will break in Next.js 16
**Priority**: LOW - Future-proofing

---

### 5. CI Timeout/Cancellation ⭐⭐

**Issue**: CI workflow cancelled after 5-6 minutes

**Possible Causes**:
1. Long build times
2. Concurrent workflow limit
3. Resource constraints

**Fix**:
```yaml
# In .github/workflows/ci.yml
jobs:
  build:
    timeout-minutes: 15  # Increase from default 10
```

**Or optimize**:
```yaml
# Cache dependencies better
- uses: actions/cache@v4
  with:
    path: |
      ~/.pnpm-store
      .next/cache
    key: ${{ runner.os }}-pnpm-${{ hashFiles('**/pnpm-lock.yaml') }}
```

**Impact**: CI doesn't complete
**Priority**: MEDIUM - Prevents full CI validation

---

## 📋 Fix Priority Order

### Immediate (This Session)
1. ✅ Update Next.js to 15.5.10+ (security fix)
2. ✅ Fix docker-build.yml secret condition
3. ⚠️ Run unused var fix script

### Short Term (Next Session)
4. Investigate CI timeout
5. Migrate from `next lint` to ESLint CLI
6. Optimize CI caching

---

## 🔧 Quick Fix Commands

```bash
# 1. Fix security vulnerability
pnpm update next@latest

# 2. Fix docker-build.yml
# (edit .github/workflows/docker-build.yml line 66)

# 3. Fix unused variables
pnpm run fix:unused-vars
# or
node scripts/fix-all-unused.js

# 4. Verify fixes locally
pnpm type-check  # Should pass
pnpm lint        # Should pass or have fewer warnings
pnpm audit --audit-level=high  # Should pass

# 5. Commit and push
git add -A
git commit -m "fix(ci): resolve security vulnerability and workflow errors"
git push
```

---

## 🎯 Expected Outcome

After fixes:
- ✅ Docker Build: Passing
- ✅ Security Scan: Passing
- ✅ Lint: Passing or warnings only
- ✅ Type Check: Passing
- ✅ CI: Completing (not cancelled)

---

**Action**: Start with Next.js update and docker-build.yml fix
