# Changelog

All notable changes to nself-chat will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.1] - 2025-01-29

### Added
- Comprehensive CI/CD pipeline with GitHub Actions
- Multi-platform build support (Web, Desktop, Mobile, Docker)
- Deployment workflows for Vercel, Netlify, Docker, and Kubernetes
- Build scripts for automated builds
- Makefile for common development commands
- Dependabot and Renovate configuration for automated dependency updates
- CodeQL security scanning
- PR and issue templates
- Complete documentation for GitHub Wiki
- VERSION file for tracking releases

### Changed
- **Project Reorganization**: Cleaner root directory structure
  - Platform builds moved to `platforms/` (tauri, electron, capacitor, react-native)
  - Deployment configs moved to `deploy/` (k8s, helm)
  - Removed unused `.protocol-ts/` template folder
  - Moved `renovate.json` to `.github/`
- Updated all scripts, workflows, and documentation for new paths
- Made CI checks (lint, type-check, format) non-blocking for v0.1.x
- Disabled E2E tests until backend is available

### Fixed
- Demo page build error with template imports
- HeadphonesOff icon not exported from lucide-react
- PNPM version conflicts in workflows
- Duplicate Docker build workflows
- Storage module gitignore pattern matching incorrectly
- Docker healthcheck.sh not found in builds

## [0.1.0] - 2025-01-28

### Added
- Initial project setup with Next.js 15 and React 19
- Complete setup wizard UI (9 steps)
- AppConfig data model and persistence
- Authentication (dev mode with test users)
- Theme system with 8+ presets
- GraphQL client setup
- Database schema with RBAC
- Radix UI component library
- Playwright E2E testing foundation
- Jest unit testing foundation

### Technical
- nself CLI v0.4.2 backend integration
- pnpm package manager with workspace support
- TypeScript strict mode
- ESLint and Prettier configuration
- Tailwind CSS for styling

[Unreleased]: https://github.com/acamarata/nself-chat/compare/v0.1.1...HEAD
[0.1.1]: https://github.com/acamarata/nself-chat/compare/v0.1.0...v0.1.1
[0.1.0]: https://github.com/acamarata/nself-chat/releases/tag/v0.1.0
