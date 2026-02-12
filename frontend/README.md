# nself-chat Frontend

Multi-platform team communication app built with Next.js 15.1.6 and React 19.0.0.

## 🎯 Code Once, Deploy Everywhere

A single Next.js codebase that deploys to multiple platforms:

- 🌐 **Web** - Next.js web application (Vercel, Netlify, Docker)
- 📱 **iOS** - Native iOS app via Capacitor (App Store)
- 🤖 **Android** - Native Android app via Capacitor (Play Store)
- 🖥️ **Windows** - Electron desktop app (NSIS installer)
- 🍎 **macOS** - Electron desktop app (DMG)
- 🐧 **Linux** - Electron desktop app (AppImage, deb, rpm)

## 📁 Architecture

```
frontend/
├── src/              # Main Next.js application source
│   ├── app/          # Next.js App Router pages
│   ├── components/   # React components
│   ├── hooks/        # Custom React hooks
│   ├── lib/          # Utilities and helpers
│   ├── stores/       # Zustand state management
│   ├── services/     # API services
│   ├── config/       # App configuration
│   └── types/        # TypeScript types
├── public/           # Static assets
├── platforms/        # Platform-specific builds
│   ├── mobile/       # Capacitor (iOS + Android)
│   └── desktop/      # Electron (Windows + macOS + Linux)
├── variants/         # Platform-specific UI components
├── tests/            # Test suites
├── docs/             # Documentation
└── scripts/          # Build automation
```

## 🚀 Quick Start

```bash
# Install dependencies (from root)
pnpm install

# Development
pnpm dev              # Start web dev server (port 3000)
pnpm dev:mobile       # Start mobile dev (iOS/Android)
pnpm dev:desktop      # Start desktop dev (Electron)

# Building
pnpm build            # Build all platforms
pnpm build:web        # Build web only
pnpm build:mobile     # Build mobile apps
pnpm build:desktop    # Build desktop apps

# Testing
pnpm test             # Run all tests
pnpm test:watch       # Watch mode
pnpm test:coverage    # With coverage
pnpm test:e2e         # Playwright E2E tests

# Linting
pnpm lint             # ESLint
pnpm lint:fix         # Auto-fix
pnpm type-check       # TypeScript check
pnpm format           # Prettier format
```

## 🌐 Web App

**Technology**: Next.js 15.1.6 (App Router) + React 19.0.0

**Location**: `frontend/` (root)

**Features**:

- Server-side rendering (SSR)
- Static site generation (SSG)
- API routes
- Image optimization
- Automatic code splitting
- Progressive Web App (PWA)

**Deployment**:

```bash
# Vercel (recommended)
pnpm build
vercel deploy

# Docker
docker build -f Dockerfile -t nchat-web .
docker run -p 3000:3000 nchat-web

# Netlify
pnpm build
netlify deploy --prod
```

## 📱 Mobile Apps

**Technology**: Capacitor 6.x (iOS + Android)

**Location**: `platforms/mobile/`

**Features**:

- Native iOS and Android from one codebase
- Native capabilities (camera, push notifications, biometrics)
- App Store and Play Store ready
- Offline support
- Background sync

**Development**:

```bash
# iOS (requires macOS + Xcode)
pnpm dev:mobile:ios

# Android (requires Android Studio)
pnpm dev:mobile:android

# Build for production
pnpm build:mobile:ios      # Generates .ipa
pnpm build:mobile:android  # Generates .apk/.aab
```

**Publishing**:

- iOS: Submit `.ipa` to App Store Connect
- Android: Submit `.aab` to Google Play Console

## 🖥️ Desktop Apps

**Technology**: Electron 28.x (Windows + macOS + Linux)

**Location**: `platforms/desktop/`

**Features**:

- Native desktop apps for all platforms
- System tray integration
- Auto-updates
- Deep linking
- Native notifications

**Development**:

```bash
pnpm dev:desktop
```

**Building Installers**:

```bash
# Build for current platform
pnpm build:desktop

# Build for specific platforms
pnpm build:desktop:win     # Windows (NSIS)
pnpm build:desktop:mac     # macOS (DMG)
pnpm build:desktop:linux   # Linux (AppImage, deb, rpm)
```

**Distribution**:

- Windows: `.exe` NSIS installer
- macOS: `.dmg` disk image
- Linux: `.AppImage`, `.deb`, `.rpm`

## 📦 Source Organization

### src/components/

Radix UI components with Tailwind CSS:

- Button, Input, Dialog, Dropdown, etc.
- Dark/light mode support
- Accessible (WCAG 2.1 AA)
- Located in `src/components/ui/`

### src/config/

Application configuration:

- App config types
- Environment detection
- Feature flags

### src/lib/

Utility functions and helpers:

- Date formatting (date-fns)
- String helpers
- Validation
- Theme utilities
- API clients

### src/graphql/

GraphQL client and operations:

- Apollo Client setup
- Queries and mutations
- Subscriptions
- Type generation

### src/services/

Business logic and integrations:

- Authentication (Nhost)
- Session management
- Role-based access control (RBAC)
- External service integrations

### src/types/

TypeScript type definitions:

- User, Channel, Message types
- API response types
- Domain models
- Database schema types

## 🎨 Tech Stack

| Category  | Technology                              |
| --------- | --------------------------------------- |
| Framework | Next.js 15.1.6 + React 19.0.0           |
| Mobile    | Capacitor 6.x                           |
| Desktop   | Electron 28.x                           |
| State     | Zustand 5.0.3 + Apollo Client 3.12.8    |
| UI        | Radix UI + Tailwind CSS 3.4.17          |
| Forms     | React Hook Form 7.54.2 + Zod 3.24.1     |
| Editor    | TipTap 2.11.2                           |
| Real-time | Socket.io 4.8.1 + GraphQL subscriptions |
| Testing   | Jest 29.7.0 + Playwright 1.50.1         |
| Linting   | ESLint 9.18.0 + Prettier 3.4.2          |

## 🧪 Testing

```bash
# Unit tests (Jest)
pnpm test
pnpm test:watch
pnpm test:coverage

# E2E tests (Playwright)
pnpm test:e2e
pnpm test:e2e:ui  # Interactive UI

# Component tests
pnpm test:components
```

## 📝 Development Workflow

1. **Make changes** in `packages/` or `apps/`
2. **Run tests** - `pnpm test`
3. **Check types** - `pnpm type-check`
4. **Lint code** - `pnpm lint:fix`
5. **Build** - `pnpm build`
6. **Commit** - Follows conventional commits

## 🔧 Environment Variables

Create `.env.local` in `apps/web/`:

```bash
# Backend URLs
NEXT_PUBLIC_GRAPHQL_URL=http://api.localhost/v1/graphql
NEXT_PUBLIC_AUTH_URL=http://auth.localhost/v1/auth
NEXT_PUBLIC_STORAGE_URL=http://storage.localhost/v1/storage

# Optional: Development mode
NEXT_PUBLIC_USE_DEV_AUTH=true
NEXT_PUBLIC_ENV=development
```

## 📊 Bundle Size

Target sizes:

- Web: < 300KB gzipped
- Mobile: < 50MB app size
- Desktop: < 100MB installer

Check bundle size:

```bash
pnpm analyze:bundle
```

## 🔐 Security

- Content Security Policy (CSP)
- XSS protection
- CSRF protection
- Input sanitization
- Secure headers
- Rate limiting

## ♿ Accessibility

- WCAG 2.1 AA compliant
- Keyboard navigation
- Screen reader support
- Focus management
- ARIA labels

## 🌍 Internationalization

```typescript
// Coming soon
import { useTranslation } from "@nself-chat/i18n";

const { t } = useTranslation();
t("common.welcome"); // "Welcome"
```

## 🚀 Performance

- Code splitting
- Lazy loading
- Image optimization
- Bundle analysis
- Lighthouse CI

Target scores:

- Performance: > 90
- Accessibility: 100
- Best Practices: > 95
- SEO: 100

## 📚 Documentation

- [Complete Documentation](../.wiki/Home.md)
- [Deployment Guide](../.wiki/deployment/DEPLOYMENT-GUIDE.md)
- [Architecture Overview](../.wiki/Architecture-Overview.md)
- [Contributing Guide](../.wiki/CONTRIBUTING.md)

## 🔗 Related Links

- [Backend README](../backend/README.md)
- [Main Project README](../README.md)
- [Platform Documentation](./platforms/)
