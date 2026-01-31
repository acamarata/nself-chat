/**
 * Base Resource Class
 *
 * Provides common functionality for all resource classes.
 */

import type { NChatClient } from '../client'

export abstract class BaseResource {
  protected client: NChatClient

  constructor(client: NChatClient) {
    this.client = client
  }

  /**
   * Make a GET request
   */
  protected async get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const queryString = params ? `?${new URLSearchParams(params as Record<string, string>).toString()}` : ''
    return this.client.request<T>('GET', `${path}${queryString}`)
  }

  /**
   * Make a POST request
   */
  protected async post<T>(path: string, data?: unknown): Promise<T> {
    return this.client.request<T>('POST', path, data)
  }

  /**
   * Make a PUT request
   */
  protected async put<T>(path: string, data?: unknown): Promise<T> {
    return this.client.request<T>('PUT', path, data)
  }

  /**
   * Make a PATCH request
   */
  protected async patch<T>(path: string, data?: unknown): Promise<T> {
    return this.client.request<T>('PATCH', path, data)
  }

  /**
   * Make a DELETE request
   */
  protected async delete<T>(path: string): Promise<T> {
    return this.client.request<T>('DELETE', path)
  }
}
