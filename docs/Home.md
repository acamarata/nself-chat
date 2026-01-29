# nself-chat Documentation

Welcome to the **nself-chat** documentation - your complete guide to building and deploying a white-label team communication platform.

---

## Quick Navigation

| Section | Description |
|---------|-------------|
| [Getting Started](Getting-Started) | Install and run in 5 minutes |
| [Installation](Installation) | Detailed installation guide |
| [Configuration](Configuration) | Environment and settings |
| [White-Label Guide](White-Label-Guide) | Customize branding and features |
| [Features](Features) | Complete feature reference |
| [Authentication](Authentication) | Auth providers setup |
| [Bots](Bots) | Bot SDK and examples |
| [Plugins](Plugins) | Modular plugin system |
| [Architecture](Architecture) | System design |
| [Deployment](Deployment-Docker) | Docker deployment |
| [Changelog](Changelog) | Version history |

---

## What is nself-chat?

nself-chat is a **production-ready, white-label** team communication platform combining the best of:

- **Slack** - Channels, threads, integrations
- **Discord** - Roles, permissions, rich embeds
- **Telegram** - Stickers, voice messages, bots
- **WhatsApp** - Direct messages, read receipts

### Key Highlights

| Metric | Value |
|--------|-------|
| Components | 75+ directories |
| Custom Hooks | 60+ hooks |
| Feature Flags | 60+ toggles |
| Auth Methods | 11 providers |
| Theme Presets | 8+ themes |

---

## Quick Start

```bash
# Clone
git clone https://github.com/acamarata/nself-chat.git
cd nself-chat

# Install
pnpm install

# Run
pnpm dev
```

Visit **http://localhost:3000**

See [Getting Started](Getting-Started) for full instructions.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 15, React 19, TypeScript |
| **Styling** | Tailwind CSS, Radix UI |
| **State** | Zustand, Apollo Client |
| **Real-time** | Socket.io, GraphQL Subscriptions |
| **Backend** | nself CLI (Hasura, PostgreSQL, Nhost) |
| **Storage** | MinIO (S3-compatible) |
| **Desktop** | Tauri, Electron |
| **Mobile** | Capacitor, React Native |

---

## Project Structure

```
nself-chat/
├── src/                    # Application source
│   ├── app/               # Next.js App Router
│   ├── components/        # React components (75+ dirs)
│   ├── hooks/             # Custom hooks (60+)
│   ├── lib/               # Libraries & utilities
│   ├── contexts/          # React contexts
│   ├── services/          # Service layer
│   └── graphql/           # GraphQL operations
├── platforms/              # Desktop & mobile
│   ├── tauri/             # Tauri desktop
│   ├── electron/          # Electron desktop
│   ├── capacitor/         # Capacitor mobile
│   └── react-native/      # React Native
├── deploy/                 # Deployment configs
│   ├── k8s/               # Kubernetes
│   └── helm/              # Helm charts
├── docs/                   # Documentation
├── scripts/                # Build scripts
└── docker/                 # Docker helpers
```

---

## Version

**Current Version:** 0.1.1

See [Changelog](Changelog) for version history.

---

## Support

- [GitHub Issues](https://github.com/acamarata/nself-chat/issues)
- [Contributing Guide](Contributing)

---

**nself-chat** - Build your own Slack in minutes.
