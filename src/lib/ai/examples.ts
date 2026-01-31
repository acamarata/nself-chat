/**
 * AI Features Usage Examples
 *
 * This file contains example code snippets demonstrating how to use
 * the AI-powered message summarization and smart search features.
 */

import { getMessageSummarizer, type Message } from './message-summarizer'
import { getSmartSearch, type SearchableMessage } from './smart-search'

// ============================================================================
// EXAMPLE 1: Basic Message Summarization
// ============================================================================

export async function example1_BasicSummarization() {
  const messages: Message[] = [
    {
      id: '1',
      content: 'We need to fix the authentication bug before the release.',
      userId: 'user1',
      userName: 'Alice',
      createdAt: new Date('2025-01-31T10:00:00Z'),
    },
    {
      id: '2',
      content: 'I can work on that this afternoon.',
      userId: 'user2',
      userName: 'Bob',
      createdAt: new Date('2025-01-31T10:05:00Z'),
    },
    {
      id: '3',
      content: 'Great! I\'ll review the PR when it\'s ready.',
      userId: 'user1',
      userName: 'Alice',
      createdAt: new Date('2025-01-31T10:10:00Z'),
    },
  ]

  const summarizer = getMessageSummarizer()

  // Generate brief summary
  const summary = await summarizer.summarizeMessages(messages, {
    style: 'brief',
  })

  console.log('Brief Summary:', summary)
  // Output: "Discussion about fixing an authentication bug before release,
  // with Bob volunteering to work on it and Alice agreeing to review."
}

// ============================================================================
// EXAMPLE 2: Channel Digest Generation
// ============================================================================

export async function example2_ChannelDigest() {
  const messages: Message[] = [] // ... load channel messages

  const summarizer = getMessageSummarizer()

  const digest = await summarizer.generateChannelDigest(messages)

  console.log('Channel Digest:', digest)
  /* Output:
  {
    summary: "Main discussion topics included...",
    keyPoints: [
      "Authentication bug needs fixing before release",
      "Bob will work on the fix this afternoon",
      "Alice will review the PR when ready"
    ],
    messageCount: 45,
    participantCount: 8,
    timeRange: {
      start: Date('2025-01-31T10:00:00Z'),
      end: Date('2025-01-31T18:00:00Z')
    },
    topics: ["Authentication", "Bug Fix", "Release Planning"]
  }
  */
}

// ============================================================================
// EXAMPLE 3: Thread Summary
// ============================================================================

export async function example3_ThreadSummary() {
  const threadMessages: Message[] = [] // ... load thread messages

  const summarizer = getMessageSummarizer()

  const threadSummary = await summarizer.summarizeThread(threadMessages)

  console.log('Thread Summary:', threadSummary)
  /* Output:
  {
    summary: "Thread discussing authentication bug fix strategy...",
    participantCount: 4,
    messageCount: 12,
    keyDecisions: [
      "Bob will implement the fix using JWT refresh tokens",
      "Alice will review by end of day",
      "Deploy to staging first before production"
    ]
  }
  */
}

// ============================================================================
// EXAMPLE 4: Catch-Up Summary
// ============================================================================

export async function example4_CatchUpSummary() {
  const missedMessages: Message[] = [] // ... load messages since last seen

  const summarizer = getMessageSummarizer()

  const catchUp = await summarizer.generateCatchUpSummary(missedMessages)

  console.log('Catch-Up:', catchUp)
  /* Output:
  You missed 23 messages. Here's what happened:

  • Team discussed authentication bug fix strategy
  • Bob implemented JWT refresh token solution
  • Alice approved the PR
  • Code deployed to staging environment
  • Planning production deployment for tomorrow
  */
}

// ============================================================================
// EXAMPLE 5: Smart Search - Basic
// ============================================================================

export async function example5_BasicSearch() {
  const messages: SearchableMessage[] = [] // ... load all messages

  const search = getSmartSearch()

  const results = await search.search(
    'authentication bug',
    messages,
    { limit: 10 }
  )

  console.log(`Found ${results.length} results`)
  results.forEach((result) => {
    console.log(`- [${result.score.toFixed(2)}] ${result.message.content}`)
  })
}

// ============================================================================
// EXAMPLE 6: Smart Search - Advanced Filtering
// ============================================================================

export async function example6_AdvancedSearch() {
  const messages: SearchableMessage[] = [] // ... load all messages

  const search = getSmartSearch()

  const results = await search.search(
    'deployment issues',
    messages,
    {
      limit: 20,
      threshold: 0.7, // Only return results with >70% similarity
      includeContext: true, // Include surrounding messages
      contextSize: 2, // 2 messages before/after
      filters: {
        channelId: 'engineering',
        dateFrom: new Date('2025-01-01'),
        dateTo: new Date('2025-01-31'),
        hasThread: true, // Only messages with threads
      },
      rankBy: 'hybrid', // Balance relevance + recency
    }
  )

  results.forEach((result) => {
    console.log('Message:', result.message.content)
    console.log('Score:', result.score)
    console.log('Match Type:', result.matchType)
    console.log('Highlights:', result.highlights)
    console.log('Context Before:', result.context?.before)
    console.log('Context After:', result.context?.after)
  })
}

// ============================================================================
// EXAMPLE 7: Check AI Availability
// ============================================================================

export async function example7_CheckAvailability() {
  const summarizer = getMessageSummarizer()
  const search = getSmartSearch()

  console.log('AI Status:')
  console.log('- Summarization:', {
    available: summarizer.available(),
    provider: summarizer.getProvider(),
  })
  console.log('- Search:', {
    available: search.available(),
    provider: search.getProvider(),
    semantic: search.getProvider() !== 'local',
  })

  // Or use the status API endpoint
  const response = await fetch('/api/ai/status')
  const status = await response.json()
  console.log('API Status:', status)
}

// ============================================================================
// EXAMPLE 8: Daily Digest Automation
// ============================================================================

export async function example8_DailyDigest(channelId: string) {
  // Get messages from last 24 hours
  const yesterday = new Date()
  yesterday.setHours(yesterday.getHours() - 24)

  const messages: Message[] = [] // ... fetch messages since yesterday

  if (messages.length === 0) {
    return 'No activity in the last 24 hours.'
  }

  const summarizer = getMessageSummarizer()
  const digest = await summarizer.generateChannelDigest(messages)

  // Format as email or notification
  const emailBody = `
    # Daily Digest for ${channelId}

    ${digest.summary}

    ## Key Points
    ${digest.keyPoints?.map((point) => `- ${point}`).join('\n')}

    ## Activity
    - ${digest.messageCount} messages
    - ${digest.participantCount} participants
    - ${digest.timeRange.end.getTime() - digest.timeRange.start.getTime()} hours of activity

    ## Topics Discussed
    ${digest.topics?.map((topic) => `- ${topic}`).join('\n')}
  `

  return emailBody
}

// ============================================================================
// EXAMPLE 9: Search with Result Ranking
// ============================================================================

export async function example9_RankedSearch(query: string, messages: SearchableMessage[]) {
  const search = getSmartSearch()

  // Search with different ranking strategies
  const relevanceResults = await search.search(query, messages, {
    rankBy: 'relevance',
    limit: 10,
  })

  const dateResults = await search.search(query, messages, {
    rankBy: 'date',
    limit: 10,
  })

  const hybridResults = await search.search(query, messages, {
    rankBy: 'hybrid',
    limit: 10,
  })

  return {
    mostRelevant: relevanceResults[0],
    mostRecent: dateResults[0],
    balanced: hybridResults[0],
  }
}

// ============================================================================
// EXAMPLE 10: API Route Usage (Server-Side)
// ============================================================================

export async function example10_APIUsage() {
  // Summarization API
  const summarizeResponse = await fetch('/api/ai/summarize', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messages: [
        /* ... */
      ],
      type: 'digest',
      options: { style: 'detailed' },
    }),
  })

  const summarizeResult = await summarizeResponse.json()
  console.log('Summary:', summarizeResult.summary)
  console.log('Provider:', summarizeResult.provider)

  // Search API
  const searchResponse = await fetch('/api/ai/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: 'authentication bug',
      messages: [
        /* ... */
      ],
      options: { limit: 20 },
    }),
  })

  const searchResult = await searchResponse.json()
  console.log('Results:', searchResult.results)
  console.log('Count:', searchResult.count)
  console.log('Semantic:', searchResult.isSemanticSearch)

  // Status API
  const statusResponse = await fetch('/api/ai/status')
  const status = await statusResponse.json()
  console.log('AI Status:', status)
}

// ============================================================================
// EXAMPLE 11: Error Handling and Fallbacks
// ============================================================================

export async function example11_ErrorHandling(messages: Message[]) {
  const summarizer = getMessageSummarizer()

  try {
    const summary = await summarizer.summarizeMessages(messages)
    console.log('AI Summary:', summary)
  } catch (error) {
    // Automatically falls back to local summarization
    // No need for manual fallback handling
    console.log('Using fallback summary')
  }

  // Check provider to know if using AI or fallback
  const provider = summarizer.getProvider()
  if (provider === 'local') {
    console.log('Using basic summarization (no API key configured)')
  } else {
    console.log(`Using AI provider: ${provider}`)
  }
}

// ============================================================================
// EXAMPLE 12: Cache Management
// ============================================================================

export async function example12_CacheManagement() {
  const search = getSmartSearch()

  // Check cache stats
  const stats = search.getCacheStats()
  console.log(`Cache: ${stats.size}/${stats.maxSize} entries`)

  // Clear cache if needed (e.g., when switching contexts)
  search.clearCache()
  console.log('Cache cleared')

  // Cache is automatically managed with LRU eviction
  // Up to 1000 embeddings are cached based on first 100 chars
}
