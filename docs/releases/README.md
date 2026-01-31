# Release Notes & Version History

Release documentation, migration guides, and version-specific information for nself-chat.

## Contents

### Current Release (v0.5.0)

- **[v0.5.0 Plan](v0.5.0-PLAN.md)** - Detailed release plan and feature breakdown
- **[v0.5.0 Changelog](CHANGELOG-v0.5.0.md)** - Complete changelog for v0.5.0
- **[v0.5.0 Compliance Summary](v0.5.0-COMPLIANCE-SUMMARY.md)** - Compliance features and certifications

### Previous Release (v0.4.0)

- **[v0.4.0 Release Notes](v0.4.0-RELEASE-NOTES.md)** - What's new in v0.4.0
- **[v0.4.0 Upgrade Guide](v0.4.0-UPGRADE-GUIDE.md)** - How to upgrade from v0.3.x
- **[v0.4.0 Migration Guide](v0.4.0-MIGRATION-GUIDE.md)** - Detailed migration steps
- **[v0.4.0 Breaking Changes](v0.4.0-BREAKING-CHANGES.md)** - Breaking changes and fixes

## Quick Navigation

### For Users

**What's New:**
- Latest features: [v0.5.0 Changelog](CHANGELOG-v0.5.0.md)
- Previous release: [v0.4.0 Release Notes](v0.4.0-RELEASE-NOTES.md)

**Upgrading:**
- From v0.4.x to v0.5.0: Coming soon
- From v0.3.x to v0.4.0: [v0.4.0 Upgrade Guide](v0.4.0-UPGRADE-GUIDE.md)

### For Developers

**Migration:**
- v0.4.0 breaking changes: [v0.4.0 Breaking Changes](v0.4.0-BREAKING-CHANGES.md)
- Step-by-step migration: [v0.4.0 Migration Guide](v0.4.0-MIGRATION-GUIDE.md)

**Planning:**
- Future features: [v0.5.0 Plan](v0.5.0-PLAN.md)

### For Compliance Teams

- **Compliance Updates**: [v0.5.0 Compliance Summary](v0.5.0-COMPLIANCE-SUMMARY.md)
- **Audit Information**: See individual release notes for security updates

## Version Overview

### v0.5.0 (Current) - January 2026

**Status:** In Development

**Major Features:**
- Multi-tenant SaaS architecture
- Billing and subscription management (Stripe)
- Advanced AI moderation (TensorFlow.js)
- Analytics and telemetry (OpenTelemetry)
- Compliance features (GDPR, data retention)
- Enhanced integrations (Slack, GitHub, Jira, Google Drive)

**Documentation:**
- [v0.5.0 Plan](v0.5.0-PLAN.md) - Complete feature breakdown
- [v0.5.0 Changelog](CHANGELOG-v0.5.0.md) - Detailed changelog
- [v0.5.0 Compliance](v0.5.0-COMPLIANCE-SUMMARY.md) - Compliance updates

### v0.4.0 - January 2026

**Status:** Stable

**Major Features:**
- End-to-end encryption (E2EE)
- Voice and video calling
- Live streaming
- Screen sharing
- Advanced messaging (polls, stickers, voice messages)
- Enhanced security (2FA, PIN lock)
- Mobile optimizations

**Documentation:**
- [v0.4.0 Release Notes](v0.4.0-RELEASE-NOTES.md) - Full release notes
- [v0.4.0 Upgrade Guide](v0.4.0-UPGRADE-GUIDE.md) - Upgrade instructions
- [v0.4.0 Migration Guide](v0.4.0-MIGRATION-GUIDE.md) - Migration steps
- [v0.4.0 Breaking Changes](v0.4.0-BREAKING-CHANGES.md) - Breaking changes

### v0.3.0 - January 2026

**Status:** Legacy

**Major Features:**
- Core messaging platform
- Channel management
- User authentication
- Basic real-time features
- Setup wizard
- Theme system

**Documentation:**
- See [About section](../about/RELEASE-NOTES-v0.3.0.md) for legacy release notes

## Upgrade Paths

### Supported Upgrade Paths

```
v0.3.x → v0.4.0 → v0.5.0 (supported)
v0.3.x → v0.5.0 (not recommended, use incremental)
v0.4.x → v0.5.0 (coming soon)
```

### Migration Strategy

**For Major Version Upgrades (e.g., v0.3 → v0.4):**
1. Read the release notes
2. Review breaking changes
3. Follow migration guide step-by-step
4. Test in staging environment
5. Backup production data
6. Execute upgrade
7. Verify functionality

**For Minor Version Upgrades (e.g., v0.4.0 → v0.4.1):**
1. Review changelog
2. Update dependencies
3. Run database migrations (if any)
4. Deploy

## Release Cadence

**Major Releases (x.0.0):**
- Frequency: Every 3-4 months
- Contains: New features, breaking changes, major improvements
- Documentation: Full release notes, migration guides, upgrade guides

**Minor Releases (0.x.0):**
- Frequency: Monthly
- Contains: New features, improvements, no breaking changes
- Documentation: Release notes, changelog

**Patch Releases (0.0.x):**
- Frequency: As needed
- Contains: Bug fixes, security patches
- Documentation: Changelog only

## Breaking Changes Policy

**Definition:**
A breaking change is any modification that:
- Requires code changes in existing implementations
- Changes API contracts or responses
- Modifies database schema in incompatible ways
- Removes or renames features

**Communication:**
- Breaking changes are documented in dedicated BREAKING-CHANGES.md files
- Migration guides provide step-by-step upgrade instructions
- Deprecation warnings are included 1 major version before removal

**Support Window:**
- Current version (v0.5.x): Full support
- Previous major version (v0.4.x): Security patches only
- Older versions (< v0.4.x): No support

## Changelog Format

All changelogs follow the [Keep a Changelog](https://keepachangelog.com/) format:

**Categories:**
- **Added**: New features
- **Changed**: Changes to existing features
- **Deprecated**: Features marked for removal
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Security improvements

**Example:**
```markdown
## [0.5.0] - 2026-01-31

### Added
- Multi-tenant SaaS architecture
- Stripe billing integration

### Changed
- Improved performance for large channels

### Fixed
- Voice calling connection issues
```

## Version Numbering

nself-chat follows [Semantic Versioning 2.0.0](https://semver.org/):

**Format:** MAJOR.MINOR.PATCH

- **MAJOR**: Incompatible API changes or breaking changes
- **MINOR**: New features (backward-compatible)
- **PATCH**: Bug fixes (backward-compatible)

**Pre-release Identifiers:**
- `alpha`: Early development, unstable
- `beta`: Feature-complete, testing phase
- `rc`: Release candidate, final testing

**Example:** `0.5.0-beta.1`

## Related Documentation

- [Changelog](../about/Changelog.md) - Complete version history
- [Roadmap](../about/Roadmap.md) - Future plans
- [Contributing](../about/Contributing.md) - How to contribute
- [Upgrade Guide](../about/UPGRADE-GUIDE.md) - General upgrade instructions

## Support

### Getting Help with Upgrades

- **Documentation**: Check upgrade guides and migration docs
- **Community**: [GitHub Discussions](https://github.com/nself/nself-chat/discussions)
- **Discord**: [nself Community](https://discord.gg/nself)
- **Email**: support@nself.org

### Reporting Issues

Found a bug in a release?

1. Check [Troubleshooting](../troubleshooting/TROUBLESHOOTING.md)
2. Search [GitHub Issues](https://github.com/nself/nself-chat/issues)
3. Submit new issue: [Bug Report](https://github.com/nself/nself-chat/issues/new?template=bug_report.md)

## Version Information

**Current Version:** 0.5.0 (in development)
**Stable Version:** 0.4.0
**Documentation Version:** 0.5.0
**Last Updated:** January 31, 2026

---

[← Back to Documentation Home](../Home.md)
