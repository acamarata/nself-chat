# Task 7: Test Coverage Analysis Report

**Date**: February 5, 2026
**Project**: nself-chat v0.9.1
**Task**: Enable and measure test coverage
**Status**: INCOMPLETE - Memory constraints

---

## Executive Summary

Test coverage measurement was attempted but could not be completed due to JavaScript heap memory exhaustion during the full test suite run. The project has comprehensive coverage infrastructure configured, but the large codebase (3,508 TypeScript files) and complex integration tests require memory optimization to complete coverage collection.

---

## Coverage Configuration

### Jest Configuration Analysis

The project has **excellent coverage configuration** in `jest.config.js`:

#### Global Thresholds (Target: 80%)

```javascript
coverageThreshold: {
  global: {
    branches: 80,
    functions: 80,
    lines: 80,
    statements: 80,
  }
}
```

#### Module-Specific Thresholds

**Authentication Services (90%)**:

```javascript
'src/services/auth/**/*.ts': {
  branches: 90,
  functions: 90,
  lines: 90,
  statements: 90,
}
```

**State Management (85%)**:

```javascript
'src/stores/**/*.ts': {
  branches: 85,
  functions: 85,
  lines: 85,
  statements: 85,
}
```

**Critical Utilities (100%)**:

```javascript
'src/lib/utils.ts': {
  branches: 100,
  functions: 100,
  lines: 100,
  statements: 100,
}
```

### Coverage Collection Settings

✅ **Coverage Directory**: `<rootDir>/coverage`
✅ **Reporters Configured**:

- `text` - Console summary
- `text-summary` - Brief console output
- `lcov` - Machine-readable format
- `html` - Browsable report at `coverage/index.html`
- `json-summary` - CI integration

### Files Included in Coverage

```javascript
collectCoverageFrom: [
  'src/**/*.{js,jsx,ts,tsx}',
  '!src/**/*.d.ts',
  '!src/**/*.stories.{js,jsx,ts,tsx}',
  '!src/**/_*.{js,jsx,ts,tsx}',
  '!src/test-utils/**',
  '!src/__tests__/**',
  '!src/types/generated/**',
  '!src/**/electron/**',
  '!src/**/capacitor/**',
  '!src/**/tauri/**',
  '!src/instrumentation*.ts',
  '!src/sentry*.ts',
]
```

**Smart Exclusions**:

- Test utilities (avoid inflating coverage)
- Generated code
- Platform-specific code (tested separately)
- Sentry instrumentation (external dependency)

---

## Coverage Measurement Attempt

### Test Execution

```bash
Command: pnpm test:coverage
Equivalent: jest --coverage --forceExit
Duration: ~2.5 hours before OOM
Workers: 50% CPU cores (default Jest config)
```

### Failure Analysis

**Issue**: JavaScript heap out of memory
**Affected Workers**: 2 processes terminated with SIGTERM
**Memory Usage**: 4GB+ per worker at time of failure

**Error Messages**:

```
FATAL ERROR: Ineffective mark-compacts near heap limit
Allocation failed - JavaScript heap out of memory

A jest worker process (pid=6381) was terminated by another process:
signal=SIGTERM, exitCode=null
```

### Root Causes

1. **Large Test Suite**: 318 test suites with complex integration tests
2. **Memory Accumulation**: Tests not releasing resources between suites
3. **Heavy Dependencies**: Apollo Client, Next.js, and large mocks consuming memory
4. **Concurrent Execution**: Multiple workers competing for memory

---

## Test Suite Results (Without Coverage)

### Overall Statistics

| Metric            | Value       |
| ----------------- | ----------- |
| Total Test Suites | 318         |
| Passing Suites    | 179 (56.3%) |
| Failing Suites    | 139 (43.7%) |
| Skipped Tests     | 0           |

### Test Distribution by Category

#### Passing Categories (56.3% pass rate)

1. **Platform Detection** ✅
   - `src/lib/platform/__tests__/platform-detector.test.ts`
   - 100% pass rate

2. **State Stores** ✅
   - `src/stores/__tests__/call-store.test.ts`
   - `src/stores/__tests__/channel-store.test.ts`
   - 67% pass rate (2/3 passing)

3. **Integration Tests** ✅
   - `src/__tests__/integration/wallet-payments-subscriptions.integration.test.ts`
   - Complex 30-second integration test passing

#### Failing Categories (43.7% failure rate)

1. **API Route Tests** ❌ (15+ failures)
   - Issue: `ReferenceError: Request is not defined`
   - Cause: Next.js 15 web runtime not fully mocked
   - Examples:
     - `src/app/api/__tests__/health.test.ts`
     - `src/__tests__/api/config.test.ts`
     - `src/__tests__/api/channels.test.ts`

2. **Hook Tests** ❌ (5+ failures)
   - Issue: JSX syntax errors
   - Cause: SWC/Babel configuration with React 19
   - Example:
     - `src/hooks/__tests__/use-channel-members.test.ts`
     - Error: "Unterminated regexp literal" in JSX transform

3. **Service Tests** ❌ (30+ failures)
   - Offline sync queue
   - Plugin integration
   - Moderation services
   - Auth context
   - WebRTC media manager
   - Notification system

4. **Memory-Intensive Tests** ❌ (2 OOM)
   - `src/hooks/__tests__/use-search-suggestions.test.ts`
   - `src/hooks/__tests__/use-attachments.test.ts`

---

## Coverage Data Analysis (Existing)

### Available Coverage Files

From previous successful run (January 31, 2026):

```bash
coverage/
├── clover.xml           (8.6 MB)
├── coverage-final.json  (31.2 MB)
├── lcov.info           (4.4 MB)
├── lcov-report/        (HTML report)
└── junit.xml           (9.2 MB)
```

**Note**: These files are from a partial run and show 0% coverage due to incomplete execution.

### Coverage Analysis Attempt

Attempted to parse `lcov.info`:

```
Total Coverage: 0.00%
```

**Reason**: File contains only metadata from initialization, no actual test execution completed with coverage collection.

---

## Code Metrics

### Source Code Scale

| Metric             | Count | Percentage |
| ------------------ | ----- | ---------- |
| **Total TS Files** | 3,508 | 100%       |
| **Test Files**     | 323   | 9.2%       |
| **Untested Files** | 3,185 | 90.8%      |

### Test File Distribution

```
src/__tests__/           ~80 test files
src/components/__tests__/ ~60 test files
src/lib/__tests__/       ~50 test files
src/services/__tests__/  ~40 test files
src/hooks/__tests__/     ~40 test files
src/stores/__tests__/    ~15 test files
src/app/api/__tests__/   ~15 test files
Other locations          ~23 test files
```

### Coverage Estimation

Based on test file count and typical coverage ratios:

**Estimated Coverage** (if all tests passed):

- **Optimistic**: 65-75% (assuming good test quality)
- **Realistic**: 50-60% (accounting for integration gaps)
- **Pessimistic**: 35-45% (conservative estimate)

**Rationale**:

- 323 test files for 3,508 source files = 9.2% test file ratio
- Industry standard: 1 test file covers 3-5 source files on average
- 323 tests × 4 avg files = ~1,300 files covered
- 1,300 / 3,508 = ~37% estimated coverage

---

## Critical Module Analysis

### High-Priority Modules (Must Have Coverage)

#### 1. Authentication Services

**Location**: `src/services/auth/`
**Target**: 90% coverage
**Test Files**: 3 files
**Status**: ⚠️ Tests failing due to environment issues

**Files**:

- `faux-auth.service.ts` - Development authentication
- `nhost-auth.service.ts` - Production authentication
- `real-auth.service.ts` - Real implementation

**Current Issues**:

- `nhost-auth.service.test.ts` - FAILING
- `auth-plugin.interface.test.ts` - FAILING

#### 2. State Management

**Location**: `src/stores/`
**Target**: 85% coverage
**Test Files**: 15+ files
**Status**: ✅ Mostly passing (67% pass rate)

**Tested Stores**:

- ✅ `call-store.test.ts` - PASSING
- ✅ `channel-store.test.ts` - PASSING
- ❌ `gallery-store.test.ts` - FAILING

#### 3. Core Utilities

**Location**: `src/lib/utils.ts`
**Target**: 100% coverage
**Test Files**: 1 file
**Status**: Unknown (not in failure list, likely passing)

#### 4. WebRTC Implementation

**Location**: `src/lib/webrtc/`
**Target**: 80% coverage
**Test Files**: 5+ files
**Status**: ❌ Multiple failures

**Tests**:

- ❌ `media-manager.test.ts` - FAILING
- ❌ `screen-capture.test.ts` - FAILING
- ❌ `peer-connection.test.ts` - FAILING
- ❌ `signaling.test.ts` - FAILING

#### 5. Encryption

**Location**: `src/lib/encryption/` & `src/lib/crypto/`
**Target**: 90% coverage
**Test Files**: 2+ files
**Status**: ❌ Failing

**Tests**:

- ❌ `message-encryption.test.ts` - FAILING

---

## Recommendations

### Immediate Actions (This Week)

#### 1. Fix Memory Issues (Priority: P0)

**Option A: Increase Node Memory**

```bash
NODE_OPTIONS="--max-old-space-size=16384" pnpm test:coverage
```

- Requires 16GB+ RAM available
- Quick fix but not sustainable

**Option B: Implement Test Sharding**

```bash
# Split tests into 4 shards
pnpm test:coverage -- --shard=1/4
pnpm test:coverage -- --shard=2/4
pnpm test:coverage -- --shard=3/4
pnpm test:coverage -- --shard=4/4

# Merge coverage reports
npx nyc merge coverage coverage/merged.json
```

- Sustainable solution
- Enables CI parallelization
- Recommended approach

#### 2. Fix Test Environment (Priority: P0)

**Update `jest.setup.js`** to add Next.js 15 polyfills:

```javascript
// Add to jest.setup.js
global.Request = class Request {
  constructor(input, init) {
    this.url = input
    this.method = init?.method || 'GET'
    this.headers = new Headers(init?.headers)
    this.body = init?.body
  }
}

global.Response = class Response {
  constructor(body, init) {
    this.body = body
    this.status = init?.status || 200
    this.headers = new Headers(init?.headers)
  }
  json() {
    return Promise.resolve(JSON.parse(this.body))
  }
}
```

Expected impact: +15-20 passing tests

#### 3. Run Coverage on Critical Modules Only (Priority: P1)

```bash
NODE_OPTIONS="--max-old-space-size=8192" pnpm test:coverage -- \
  --testPathPattern="(stores|services/auth|lib/utils)" \
  --maxWorkers=2
```

This will:

- Measure coverage on most critical 10% of codebase
- Verify if thresholds are met
- Complete in <30 minutes
- Use manageable memory

### Short-term Improvements (Next 2 Weeks)

#### 4. Implement CI Coverage Collection

**GitHub Actions Workflow**:

```yaml
name: Coverage
on: [push, pull_request]
jobs:
  coverage:
    runs-on: ubuntu-latest
    strategy:
      matrix:
        shard: [1, 2, 3, 4]
    steps:
      - name: Run tests
        run: |
          NODE_OPTIONS="--max-old-space-size=8192" \
          pnpm test:coverage -- --shard=${{ matrix.shard }}/4
      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

#### 5. Fix Failing Test Categories

**Prioritization**:

1. API route tests (15+) - 1-2 days
2. Hook JSX transform (5+) - 1 day
3. WebRTC mocking (4+) - 2-3 days
4. Service integration (30+) - 3-5 days

#### 6. Establish Coverage Baseline

Once critical modules pass:

1. Measure current coverage on passing tests
2. Set realistic initial thresholds (e.g., 60%)
3. Incrementally increase to target 80%

### Long-term Enhancements (Next Month)

#### 7. Coverage-Driven Development

- Add coverage badges to README
- Block PRs that reduce coverage
- Celebrate coverage milestones

#### 8. Visual Coverage Reports

- Publish HTML reports to GitHub Pages
- Track coverage trends over time
- Identify untested modules

#### 9. Mutation Testing

Once coverage >80%:

- Implement Stryker mutation testing
- Verify test quality, not just coverage
- Find gaps in test assertions

---

## Coverage Goals Roadmap

### Phase 1: Foundation (Week 1-2)

- [ ] Fix memory issues with sharding
- [ ] Fix test environment for API routes
- [ ] Achieve 50% coverage on critical modules
- **Target**: Measure baseline coverage

### Phase 2: Core Coverage (Week 3-4)

- [ ] Auth services: 90% coverage
- [ ] State stores: 85% coverage
- [ ] Utils: 100% coverage
- **Target**: Meet critical module thresholds

### Phase 3: Feature Coverage (Week 5-8)

- [ ] WebRTC: 80% coverage
- [ ] Encryption: 90% coverage
- [ ] Notifications: 75% coverage
- [ ] Payments: 85% coverage
- **Target**: 70% global coverage

### Phase 4: Excellence (Week 9-12)

- [ ] Global: 80% coverage
- [ ] Integration tests: 90% critical paths
- [ ] Mutation score: 70%+
- **Target**: Production-grade coverage

---

## Comparison: Claimed vs. Measured

### Original Claims (v0.9.1 Documentation)

> "Comprehensive test coverage (>80%)"
> "1,014 tests across 147 tasks"

### Actual Findings

| Metric         | Claimed      | Measured          | Status               |
| -------------- | ------------ | ----------------- | -------------------- |
| **Coverage**   | >80%         | Unable to measure | ⚠️ UNVERIFIED        |
| **Test Count** | 1,014 tests  | 318 test suites   | ⚠️ UNCLEAR           |
| **Pass Rate**  | Assumed 100% | 56.3%             | ❌ BELOW EXPECTATION |

**Note**: "1,014 tests" may refer to individual test cases across 318 test suites. Without completion, exact count cannot be verified.

---

## Conclusion

### Current State

⚠️ **Coverage Status**: UNKNOWN

- Cannot be measured due to memory constraints
- Test infrastructure is properly configured
- Estimated coverage: 35-60% (based on test file ratio)

### Blockers

1. **Memory exhaustion** preventing full test suite execution
2. **139 failing tests** (43.7%) due to environment issues
3. **Test environment** not configured for Next.js 15 + React 19

### Path Forward

**Immediate** (1-2 days):

1. Implement test sharding
2. Fix test environment polyfills
3. Measure coverage on critical modules

**Expected Outcome**:

- Baseline coverage measurement complete
- Critical modules meeting thresholds
- CI/CD pipeline operational

### Confidence Level

**Coverage Claims**: ⚠️ UNVERIFIED (cannot confirm >80%)
**Test Quality**: ⚠️ MODERATE (56% passing)
**Infrastructure**: ✅ EXCELLENT (well-configured)

**Recommendation**: Prioritize test stability before claiming coverage percentages. Current documentation should be updated to reflect actual measured coverage once available.

---

## Appendix: Coverage Commands

### Recommended Commands

```bash
# Full coverage (requires 16GB RAM)
NODE_OPTIONS="--max-old-space-size=16384" pnpm test:coverage

# Sharded coverage (recommended)
pnpm test:coverage -- --shard=1/4 --maxWorkers=2

# Critical modules only
pnpm test:coverage -- --testPathPattern="(stores|services|lib/utils)"

# View HTML report
open coverage/lcov-report/index.html

# Generate text summary
npx lcov-summary coverage/lcov.info
```

### Coverage Analysis Scripts

```bash
# Count coverage by category
npx lcov-summary coverage/lcov.info | grep -E "^  [0-9]" | \
  awk '{print $2}' | sed 's/src\///' | cut -d'/' -f1 | \
  sort | uniq -c

# Find files with low coverage
npx lcov-summary coverage/lcov.info | grep -E "^  [0-4][0-9]\." | \
  awk '{print $1, $2}'

# Calculate average coverage
npx lcov-summary coverage/lcov.info | grep "Total Coverage" | \
  awk '{print $3}'
```

---

**Report End**

Generated by: Claude Code
Task: #7 - Test Coverage Analysis
Date: February 5, 2026
Status: INCOMPLETE - Requires memory optimization
