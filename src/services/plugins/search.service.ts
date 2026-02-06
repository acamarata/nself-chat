/**
 * Advanced Search Plugin Service
 * Client-side service for interacting with Advanced Search plugin API
 */

export interface SearchResult {
  type: 'message' | 'channel' | 'user'
  id: string
  content: string
  channelId?: string
  channelName?: string
  userId?: string
  userName?: string
  timestamp?: string
  highlights?: string[]
}

export interface SearchResponse {
  results: SearchResult[]
  total: number
  query: string
  limit: number
  offset: number
}

export interface SearchSuggestion {
  type: 'user' | 'channel' | 'query'
  value: string
  label: string
  metadata?: Record<string, any>
}

export interface SearchSuggestionsResponse {
  suggestions: SearchSuggestion[]
  query: string
}

export interface SearchFilters {
  from?: string
  in?: string
  after?: string
  before?: string
  has?: string
}

class SearchService {
  private baseUrl = '/api/plugins/search'

  async search(
    query: string,
    filters?: SearchFilters,
    limit: number = 20,
    offset: number = 0
  ): Promise<SearchResponse> {
    const fullQuery = this.buildQuery(query, filters)
    const response = await fetch(
      `${this.baseUrl}/search?q=${encodeURIComponent(fullQuery)}&limit=${limit}&offset=${offset}`
    )

    if (!response.ok) {
      throw new Error(`Search failed: ${response.statusText}`)
    }

    return response.json()
  }

  async getSuggestions(query: string): Promise<SearchSuggestionsResponse> {
    const response = await fetch(
      `${this.baseUrl}/suggest?q=${encodeURIComponent(query)}`
    )

    if (!response.ok) {
      throw new Error(`Failed to get suggestions: ${response.statusText}`)
    }

    return response.json()
  }

  private buildQuery(query: string, filters?: SearchFilters): string {
    if (!filters) return query

    const parts = [query]

    if (filters.from) parts.push(`from:${filters.from}`)
    if (filters.in) parts.push(`in:${filters.in}`)
    if (filters.after) parts.push(`after:${filters.after}`)
    if (filters.before) parts.push(`before:${filters.before}`)
    if (filters.has) parts.push(`has:${filters.has}`)

    return parts.join(' ')
  }

  async checkHealth() {
    try {
      const response = await fetch(`${this.baseUrl}/health`)
      return response.json()
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }
}

export const searchService = new SearchService()
