/**
 * Widget Data Web Fallback
 *
 * Provides a web fallback implementation for the Widget plugin.
 * On web, widget data is stored in localStorage for potential PWA integration.
 */

import type { WidgetPlugin } from './widget-data'

const STORAGE_KEY_PREFIX = 'nchat_widget_'

export class WidgetDataWeb implements WidgetPlugin {
  private appGroupId: string = ''

  /**
   * Initialize widget data sharing (no-op on web)
   */
  async initialize(options: { appGroupId: string }): Promise<void> {
    this.appGroupId = options.appGroupId
    console.log('Widget data initialized (web fallback)', { appGroupId: this.appGroupId })
  }

  /**
   * Update widget data
   */
  async updateWidgetData(options: {
    widgetType: string
    data: Record<string, unknown>
  }): Promise<void> {
    try {
      const key = `${STORAGE_KEY_PREFIX}${options.widgetType}`
      localStorage.setItem(key, JSON.stringify(options.data))
      console.log(`Widget data updated (web): ${options.widgetType}`)
    } catch (error) {
      console.error('Failed to update widget data (web):', error)
    }
  }

  /**
   * Get current widget data
   */
  async getWidgetData(options: {
    widgetType: string
  }): Promise<{ data: Record<string, unknown> | null }> {
    try {
      const key = `${STORAGE_KEY_PREFIX}${options.widgetType}`
      const stored = localStorage.getItem(key)

      if (stored) {
        return { data: JSON.parse(stored) }
      }

      return { data: null }
    } catch (error) {
      console.error('Failed to get widget data (web):', error)
      return { data: null }
    }
  }

  /**
   * Request widget refresh (no-op on web)
   */
  async reloadWidgets(_options: { kind?: string }): Promise<void> {
    // No-op on web - widgets don't exist
    console.log('Widget reload requested (web - no-op)')
  }

  /**
   * Check if widgets are supported
   */
  async isSupported(): Promise<{ supported: boolean; widgetTypes: string[] }> {
    // Web doesn't support native widgets
    // Could return true for PWA with partial support in the future
    return {
      supported: false,
      widgetTypes: [],
    }
  }
}
