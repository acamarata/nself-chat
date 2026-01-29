# ɳChat API Documentation

**Version**: 0.3.0
**Last Updated**: 2026-01-29

This document describes the API architecture for ɳChat, including GraphQL, REST endpoints, and WebSocket connections.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [GraphQL API](#graphql-api)
- [REST API](#rest-api)
- [WebSocket / Real-Time](#websocket--real-time)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Architecture Overview

ɳChat uses a hybrid API architecture:

- **GraphQL** (Hasura) - Primary data access layer
- **REST** - Configuration, setup, and special operations
- **WebSocket** - Real-time updates via GraphQL subscriptions

```
┌─────────────┐
│   Client    │
│  (Next.js)  │
└──────┬──────┘
       │
       ├─────────────── GraphQL (queries, mutations, subscriptions)
       │                ↓
       │              ┌────────────┐
       │              │   Hasura   │ :8080
       │              │  GraphQL   │
       │              └──────┬─────┘
       │                     │
       ├─────────────── REST (/api/*)
       │                ↓
       │              ┌────────────┐
       │              │  Next.js   │ :3000
       │              │ API Routes │
       │              └──────┬─────┘
       │                     │
       └─────────────── WebSocket (GraphQL subscriptions)
                             │
                       ┌─────▼─────┐
                       │ PostgreSQL │ :5432
                       │  Database  │
                       └───────────┘
```

---

## GraphQL API

**Endpoint**: `http://api.localhost/v1/graphql` (dev) / `https://api.yourdomain.com/v1/graphql` (prod)
**WebSocket**: `ws://api.localhost/v1/graphql` (dev) / `wss://api.yourdomain.com/v1/graphql` (prod)

### Client Configuration

```typescript
// src/lib/apollo-client.ts
import { ApolloClient, InMemoryCache, split } from '@apollo/client'
import { GraphQLWsLink } from '@apollo/client/link/subscriptions'
import { getMainDefinition } from '@apollo/client/utilities'
import { createClient } from 'graphql-ws'

const httpLink = createHttpLink({
  uri: process.env.NEXT_PUBLIC_GRAPHQL_URL,
  headers: {
    Authorization: `Bearer ${getAccessToken()}`,
  },
})

const wsLink = new GraphQLWsLink(
  createClient({
    url: process.env.NEXT_PUBLIC_WS_URL,
    connectionParams: {
      headers: {
        Authorization: `Bearer ${getAccessToken()}`,
      },
    },
  })
)

const splitLink = split(
  ({ query }) => {
    const definition = getMainDefinition(query)
    return (
      definition.kind === 'OperationDefinition' &&
      definition.operation === 'subscription'
    )
  },
  wsLink,
  httpLink
)

export const apolloClient = new ApolloClient({
  link: splitLink,
  cache: new InMemoryCache(),
})
```

### Database Schema

All tables use the `nchat_` prefix:

```sql
-- Core Tables
nchat_users              -- User accounts and profiles
nchat_channels           -- Chat channels (public/private)
nchat_messages           -- Channel messages
nchat_direct_messages    -- Direct messages between users

-- Relationships
nchat_channel_members    -- Channel membership
nchat_user_roles         -- User role assignments
nchat_channel_roles      -- Channel-specific role overrides

-- Features
nchat_message_reactions  -- Emoji reactions on messages
nchat_message_threads    -- Message threading/replies
nchat_message_attachments -- File attachments
nchat_pins               -- Pinned messages
nchat_bookmarks          -- User-saved messages
nchat_drafts             -- Message drafts

-- Organization
nchat_roles              -- Role definitions (owner, admin, etc.)
nchat_role_permissions   -- Granular permission matrix
nchat_user_preferences   -- User settings
nchat_user_presence      -- Online status

-- System
app_configuration        -- Application configuration
```

### Common Queries

#### Fetch Channels

```graphql
query GetChannels($userId: uuid!) {
  nchat_channels(
    where: {
      _or: [
        { type: { _eq: "public" } }
        { channel_members: { user_id: { _eq: $userId } } }
      ]
      is_archived: { _eq: false }
    }
    order_by: { last_message_at: desc_nulls_last }
  ) {
    id
    name
    slug
    description
    type
    topic
    icon
    color
    is_archived
    is_default
    member_count
    last_message_at
    last_message_preview
    created_at
    updated_at
  }
}
```

#### Fetch Messages

```graphql
query GetMessages($channelId: uuid!, $limit: Int = 50, $offset: Int = 0) {
  nchat_messages(
    where: { channel_id: { _eq: $channelId } }
    order_by: { created_at: desc }
    limit: $limit
    offset: $offset
  ) {
    id
    content
    type
    created_at
    updated_at
    is_edited
    is_pinned
    reply_to_id
    user {
      id
      username
      display_name
      avatar_url
      role
    }
    reactions {
      emoji
      count
      users {
        id
        username
        display_name
      }
    }
    attachments {
      id
      type
      url
      filename
      size
    }
  }
}
```

### Common Mutations

#### Send Message

```graphql
mutation SendMessage($input: nchat_messages_insert_input!) {
  insert_nchat_messages_one(object: $input) {
    id
    content
    type
    created_at
    user {
      id
      username
      display_name
      avatar_url
    }
  }
}

# Variables
{
  "input": {
    "channel_id": "uuid-here",
    "content": "Hello, world!",
    "type": "text",
    "user_id": "uuid-here"
  }
}
```

#### Create Channel

```graphql
mutation CreateChannel($input: nchat_channels_insert_input!) {
  insert_nchat_channels_one(object: $input) {
    id
    name
    slug
    description
    type
    created_at
  }
}

# Variables
{
  "input": {
    "name": "new-channel",
    "slug": "new-channel",
    "description": "A new channel",
    "type": "public",
    "created_by": "uuid-here"
  }
}
```

#### React to Message

```graphql
mutation ReactToMessage($input: nchat_message_reactions_insert_input!) {
  insert_nchat_message_reactions_one(
    object: $input
    on_conflict: {
      constraint: message_reactions_message_user_emoji_key
      update_columns: []
    }
  ) {
    message_id
    emoji
    user_id
  }
}

# Variables
{
  "input": {
    "message_id": "uuid-here",
    "emoji": "thumbs_up",
    "user_id": "uuid-here"
  }
}
```

### Subscriptions

#### Subscribe to New Messages

```graphql
subscription OnNewMessage($channelId: uuid!) {
  nchat_messages(
    where: { channel_id: { _eq: $channelId } }
    order_by: { created_at: desc }
    limit: 1
  ) {
    id
    content
    type
    created_at
    user {
      id
      username
      display_name
      avatar_url
    }
  }
}
```

#### Subscribe to Typing Indicators

```graphql
subscription OnTypingIndicator($channelId: uuid!) {
  nchat_typing_indicators(
    where: {
      channel_id: { _eq: $channelId }
      started_at: { _gte: "now() - interval '10 seconds'" }
    }
  ) {
    user_id
    user {
      username
      display_name
    }
    started_at
  }
}
```

#### Subscribe to Presence Updates

```graphql
subscription OnPresenceUpdate {
  nchat_user_presence(
    where: { updated_at: { _gte: "now() - interval '5 minutes'" } }
  ) {
    user_id
    status
    custom_status
    last_seen_at
    updated_at
  }
}
```

---

## REST API

**Base URL**: `http://localhost:3000/api` (dev) / `https://yourdomain.com/api` (prod)

### Configuration Endpoints

#### GET /api/config

Retrieve application configuration.

**Response**:
```json
{
  "setup": {
    "isCompleted": true,
    "currentStep": 12,
    "visitedSteps": [1, 2, 3, ...]
  },
  "owner": {
    "name": "John Doe",
    "email": "john@example.com",
    "company": "Acme Corp"
  },
  "branding": {
    "appName": "ɳChat",
    "logo": "/logo.svg",
    "favicon": "/favicon.ico"
  },
  "theme": {
    "preset": "nself",
    "colorScheme": "light"
  },
  ...
}
```

#### POST /api/config

Update application configuration.

**Request**:
```json
{
  "branding": {
    "appName": "My Chat",
    "tagline": "Team communication made easy"
  }
}
```

**Response**:
```json
{
  "success": true,
  "config": { ...updated config... }
}
```

### Authentication Endpoints

#### POST /api/auth/signin

Sign in with email and password.

**Request**:
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid-here",
    "email": "user@example.com",
    "displayName": "John Doe",
    "role": "member"
  }
}
```

#### POST /api/auth/signup

Create a new user account.

**Request**:
```json
{
  "email": "newuser@example.com",
  "password": "securepassword",
  "displayName": "New User"
}
```

**Response**:
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid-here",
    "email": "newuser@example.com",
    "displayName": "New User",
    "role": "member"
  }
}
```

### Utility Endpoints

#### POST /api/save-svg

Generate and save SVG logo.

**Request**:
```json
{
  "svg": "<svg>...</svg>",
  "filename": "logo.svg"
}
```

**Response**:
```json
{
  "success": true,
  "path": "/uploads/logo.svg",
  "url": "http://localhost:3000/uploads/logo.svg"
}
```

#### GET /api/health

Health check endpoint for monitoring.

**Response**:
```json
{
  "status": "ok",
  "timestamp": "2026-01-29T10:00:00Z",
  "version": "0.3.0",
  "services": {
    "database": "ok",
    "graphql": "ok",
    "auth": "ok"
  }
}
```

#### POST /api/search

Global search across messages, files, and users.

**Request**:
```json
{
  "query": "project deadline",
  "filters": {
    "type": "messages",
    "channelId": "uuid-here",
    "dateRange": {
      "start": "2026-01-01",
      "end": "2026-01-31"
    }
  },
  "limit": 20,
  "offset": 0
}
```

**Response**:
```json
{
  "results": [
    {
      "type": "message",
      "id": "msg-123",
      "content": "Don't forget the project deadline...",
      "channelId": "uuid-here",
      "channelName": "general",
      "createdAt": "2026-01-15T10:30:00Z",
      "user": {
        "id": "user-123",
        "displayName": "John Doe"
      }
    }
  ],
  "total": 42,
  "hasMore": true
}
```

---

## WebSocket / Real-Time

ɳChat uses GraphQL subscriptions over WebSocket for real-time features.

### Connection

```typescript
import { createClient } from 'graphql-ws'

const wsClient = createClient({
  url: 'ws://api.localhost/v1/graphql',
  connectionParams: () => ({
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  }),
  retryAttempts: 5,
  retryWait: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
})
```

### Events

| Event | Description | Payload |
|-------|-------------|---------|
| `message:new` | New message in channel | Message object |
| `message:updated` | Message edited | Message object |
| `message:deleted` | Message deleted | Message ID |
| `typing:start` | User started typing | User ID, Channel ID |
| `typing:stop` | User stopped typing | User ID, Channel ID |
| `presence:update` | User status changed | User ID, Status |
| `reaction:add` | Reaction added to message | Message ID, Emoji, User ID |
| `reaction:remove` | Reaction removed | Message ID, Emoji, User ID |

---

## Authentication

### JWT Tokens

ɳChat uses JWT (JSON Web Tokens) for authentication:

- **Access Token**: Short-lived (15 minutes), used for API requests
- **Refresh Token**: Long-lived (7 days), used to obtain new access tokens

### Token Structure

```json
{
  "sub": "user-id-here",
  "email": "user@example.com",
  "role": "member",
  "iat": 1706540400,
  "exp": 1706541300
}
```

### Headers

Include the access token in the `Authorization` header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

### Token Refresh

When access token expires (401 response), use refresh token:

```typescript
POST /api/auth/refresh
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

Response:
```json
{
  "accessToken": "new-access-token",
  "refreshToken": "new-refresh-token"
}
```

---

## Rate Limiting

### Global Limits

| Endpoint Type | Limit | Window |
|--------------|-------|--------|
| GraphQL Queries | 1000 req/min | Per user |
| GraphQL Mutations | 100 req/min | Per user |
| REST Endpoints | 60 req/min | Per IP |
| WebSocket Connections | 5 connections | Per user |

### Headers

Rate limit info is returned in response headers:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 987
X-RateLimit-Reset: 1706540460
```

### Exceeding Limits

Response when limit exceeded:

```json
{
  "error": "Rate limit exceeded",
  "retryAfter": 30,
  "limit": 1000,
  "window": "1 minute"
}
```

HTTP Status: `429 Too Many Requests`

---

## Error Handling

### Error Response Format

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid or expired token",
    "details": {
      "reason": "Token signature invalid"
    }
  },
  "timestamp": "2026-01-29T10:00:00Z",
  "path": "/api/auth/signin"
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `UNAUTHORIZED` | 401 | Invalid or missing authentication |
| `FORBIDDEN` | 403 | Insufficient permissions |
| `NOT_FOUND` | 404 | Resource not found |
| `VALIDATION_ERROR` | 400 | Invalid request data |
| `RATE_LIMIT_EXCEEDED` | 429 | Too many requests |
| `INTERNAL_ERROR` | 500 | Server error |
| `SERVICE_UNAVAILABLE` | 503 | Service temporarily down |

### GraphQL Errors

```json
{
  "errors": [
    {
      "message": "Field 'invalidField' doesn't exist on type 'User'",
      "locations": [{ "line": 2, "column": 3 }],
      "path": ["user", "invalidField"],
      "extensions": {
        "code": "GRAPHQL_VALIDATION_FAILED"
      }
    }
  ]
}
```

---

## Examples

### Complete Message Flow

```typescript
import { useMutation, useSubscription } from '@apollo/client'
import { SEND_MESSAGE, ON_NEW_MESSAGE } from '@/graphql/messages'

// Send a message
function SendMessageButton({ channelId }) {
  const [sendMessage] = useMutation(SEND_MESSAGE)

  const handleSend = async () => {
    await sendMessage({
      variables: {
        input: {
          channel_id: channelId,
          content: 'Hello!',
          type: 'text',
          user_id: currentUser.id,
        },
      },
    })
  }

  return <button onClick={handleSend}>Send</button>
}

// Subscribe to new messages
function MessageList({ channelId }) {
  const { data } = useSubscription(ON_NEW_MESSAGE, {
    variables: { channelId },
  })

  return (
    <div>
      {data?.nchat_messages.map((msg) => (
        <div key={msg.id}>{msg.content}</div>
      ))}
    </div>
  )
}
```

### Typing Indicators

```typescript
import { useMutation } from '@apollo/client'
import { SET_TYPING } from '@/graphql/typing'

function MessageInput({ channelId }) {
  const [setTyping] = useMutation(SET_TYPING)
  const typingTimeout = useRef<NodeJS.Timeout>()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Set typing indicator
    setTyping({ variables: { channelId, isTyping: true } })

    // Clear previous timeout
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current)
    }

    // Auto-clear after 3 seconds
    typingTimeout.current = setTimeout(() => {
      setTyping({ variables: { channelId, isTyping: false } })
    }, 3000)
  }

  return <input onChange={handleChange} />
}
```

### File Upload

```typescript
async function uploadFile(file: File, channelId: string) {
  // 1. Get presigned upload URL
  const { uploadUrl, fileId } = await fetch('/api/upload', {
    method: 'POST',
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size,
    }),
  }).then((r) => r.json())

  // 2. Upload to storage
  await fetch(uploadUrl, {
    method: 'PUT',
    body: file,
    headers: {
      'Content-Type': file.type,
    },
  })

  // 3. Create message with attachment
  await sendMessage({
    variables: {
      input: {
        channel_id: channelId,
        content: '',
        type: 'file',
        user_id: currentUser.id,
        attachments: {
          data: [
            {
              file_id: fileId,
              filename: file.name,
              type: file.type,
              size: file.size,
            },
          ],
        },
      },
    },
  })
}
```

---

## API Versioning

Current API version: **v1**

Future versions will be accessed via:
- GraphQL: `/v2/graphql`
- REST: `/api/v2/*`

Breaking changes will result in a new API version. Non-breaking changes will be added to existing versions.

---

## SDKs and Client Libraries

### Official Clients

- **JavaScript/TypeScript**: Apollo Client (recommended)
- **React Hooks**: Custom hooks in `src/hooks/`
- **Zustand Stores**: State management in `src/stores/`

### Community SDKs

Coming soon:
- Python SDK
- Ruby SDK
- Go SDK
- Rust SDK

---

## Support

For API questions and issues:
- **GitHub Issues**: https://github.com/acamarata/nself-chat/issues
- **Documentation**: https://docs.nself.org
- **Email**: support@nself.org

---

*Last updated: 2026-01-29*
