# AI Features Library

This directory contains the core AI functionality for nself-chat, including message summarization and semantic search.

## Files

| File | Purpose | Exports |
|------|---------|---------|
| `message-summarizer.ts` | AI-powered message summarization | `MessageSummarizer`, `getMessageSummarizer()` |
| `smart-search.ts` | Semantic search with embeddings | `SmartSearch`, `getSmartSearch()` |

## Quick Start

### Message Summarization

```typescript
import { getMessageSummarizer } from '@/lib/ai/message-summarizer'

const summarizer = getMessageSummarizer()

// Check if AI is available
if (summarizer.available()) {
  const summary = await summarizer.summarizeMessages(messages, {
    style: 'brief'
  })
  console.log(summary)
}
```

### Smart Search

```typescript
import { getSmartSearch } from '@/lib/ai/smart-search'

const search = getSmartSearch()

// Perform search
const results = await search.search(
  'authentication bug',
  messages,
  { limit: 20 }
)
```

## Configuration

Add to your `.env.local`:

```bash
# For OpenAI (recommended)
OPENAI_API_KEY=sk-...
NEXT_PUBLIC_OPENAI_API_KEY=sk-...

# OR for Anthropic
ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_ANTHROPIC_API_KEY=sk-ant-...
```

## Features

### Message Summarizer

- ✅ Brief summaries (1-2 sentences)
- ✅ Detailed summaries with key points
- ✅ Channel digests with topics
- ✅ Thread summaries with decisions
- ✅ Catch-up summaries for missed messages
- ✅ Graceful degradation to basic summaries

### Smart Search

- ✅ Semantic search with embeddings (OpenAI)
- ✅ Natural language queries
- ✅ Context-aware results
- ✅ Advanced filtering (channel, user, date, thread)
- ✅ Multiple ranking strategies (relevance, date, hybrid)
- ✅ Graceful degradation to keyword search

## Graceful Degradation

Both services automatically fall back to local implementations when API keys are not configured:

**Summarizer (No API Key):**
- Generates basic statistical summaries
- Shows participant count, message count, time range
- Displays recent messages

**Search (No API Key):**
- Uses keyword-based search
- Supports exact phrase matching
- Includes partial word matching

## Performance

### Caching

- Embedding cache: 1,000 entries (LRU)
- Automatic cache eviction
- Based on first 100 characters

### Rate Limiting

Implement rate limiting to control API costs:

```typescript
// Example: Limit to 10 requests per minute
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '1 m'),
})
```

### Cost Optimization

- Limit message count (e.g., last 50 messages)
- Cache summaries in database
- Use smaller models (`gpt-4o-mini`)
- Set `max_tokens` to limit output

## Examples

See `/Users/admin/Sites/nself-chat/docs/guides/features/ai-features.md` for comprehensive examples and usage patterns.

## API Routes

Server-side API endpoints:

- `POST /api/ai/summarize` - Generate summaries
- `POST /api/ai/search` - Perform semantic search
- `GET /api/ai/status` - Check AI availability

## Related Components

- `/src/components/chat/MessageSummary.tsx` - Summary UI
- `/src/components/search/SmartSearch.tsx` - Search UI

## Support

For issues or questions:
1. Check documentation: `docs/guides/features/ai-features.md`
2. Review examples in documentation
3. Open GitHub issue
4. Contact support@nself.org
