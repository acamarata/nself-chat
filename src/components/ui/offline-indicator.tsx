'use client'

/**
 * Offline Indicator - Shows connection status and pending changes
 *
 * Displays when offline with pending message count and sync options.
 */

import { useState } from 'react';
import { WifiOff, Wifi, RefreshCw, AlertCircle, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOffline } from '@/hooks/use-offline';
import { useSync } from '@/hooks/use-sync';
import { Button } from './button';
import { Badge } from './badge';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from './collapsible';

// =============================================================================
// Types
// =============================================================================

export interface OfflineIndicatorProps {
  /** Position on screen */
  position?: 'top' | 'bottom';
  /** Show detailed info */
  detailed?: boolean;
  /** Allow dismissing */
  dismissible?: boolean;
  /** Custom class name */
  className?: string;
}

// =============================================================================
// Component
// =============================================================================

export function OfflineIndicator({
  position = 'top',
  detailed = true,
  dismissible = false,
  className,
}: OfflineIndicatorProps) {
  const { state, actions } = useOffline();
  const { syncNow, isSyncing } = useSync();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  // Don't show if online and no pending changes
  if (state.isOnline && state.pendingCount === 0) {
    return null;
  }

  // Don't show if dismissed
  if (isDismissed) {
    return null;
  }

  const handleSync = async () => {
    try {
      await syncNow();
    } catch (error) {
      console.error('Sync failed:', error);
    }
  };

  return (
    <div
      className={cn(
        'fixed left-0 right-0 z-50 transition-all duration-300',
        position === 'top' ? 'top-0' : 'bottom-0',
        className
      )}
    >
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div
          className={cn(
            'border-b shadow-md',
            state.isOnline
              ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
              : 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800'
          )}
        >
          {/* Header */}
          <div className="container mx-auto px-4 py-2 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Icon */}
              {state.isOnline ? (
                <Wifi className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
              ) : (
                <WifiOff className="h-5 w-5 text-red-600 dark:text-red-400" />
              )}

              {/* Status Text */}
              <div>
                <p
                  className={cn(
                    'font-medium',
                    state.isOnline
                      ? 'text-yellow-900 dark:text-yellow-100'
                      : 'text-red-900 dark:text-red-100'
                  )}
                >
                  {state.isOnline ? 'Reconnected' : 'You are offline'}
                </p>
                {state.pendingCount > 0 && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {state.pendingCount} pending {state.pendingCount === 1 ? 'change' : 'changes'}
                  </p>
                )}
              </div>

              {/* Pending Count Badge */}
              {state.pendingCount > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {state.pendingCount}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-2">
              {/* Sync Button */}
              {state.isOnline && state.pendingCount > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleSync}
                  disabled={isSyncing}
                  className="gap-2"
                >
                  <RefreshCw className={cn('h-4 w-4', isSyncing && 'animate-spin')} />
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </Button>
              )}

              {/* Expand Button */}
              {detailed && (
                <CollapsibleTrigger asChild>
                  <Button size="sm" variant="ghost">
                    {isExpanded ? 'Hide' : 'Details'}
                  </Button>
                </CollapsibleTrigger>
              )}

              {/* Dismiss Button */}
              {dismissible && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsDismissed(true)}
                  className="h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                  <span className="sr-only">Dismiss</span>
                </Button>
              )}
            </div>
          </div>

          {/* Expanded Details */}
          {detailed && (
            <CollapsibleContent>
              <div className="container mx-auto px-4 py-3 border-t border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  {/* Connection Info */}
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                      Connection
                    </h4>
                    <div className="space-y-1 text-gray-600 dark:text-gray-400">
                      <p>
                        Status:{' '}
                        <span className="font-medium">
                          {state.connectionInfo.state}
                        </span>
                      </p>
                      <p>
                        Quality:{' '}
                        <span className="font-medium">
                          {state.connectionInfo.quality}
                        </span>
                      </p>
                      {state.connectionInfo.rtt && (
                        <p>
                          Latency:{' '}
                          <span className="font-medium">
                            {state.connectionInfo.rtt}ms
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Sync Info */}
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                      Sync Status
                    </h4>
                    <div className="space-y-1 text-gray-600 dark:text-gray-400">
                      <p>
                        Status:{' '}
                        <span className="font-medium">
                          {state.syncState.status}
                        </span>
                      </p>
                      {state.lastSyncAt && (
                        <p>
                          Last sync:{' '}
                          <span className="font-medium">
                            {formatTimeAgo(state.lastSyncAt)}
                          </span>
                        </p>
                      )}
                      {state.syncState.error && (
                        <p className="text-red-600 dark:text-red-400 flex items-start gap-1">
                          <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                          <span>{state.syncState.error}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Cache Info */}
                  <div>
                    <h4 className="font-semibold mb-2 text-gray-900 dark:text-gray-100">
                      Cached Data
                    </h4>
                    <div className="space-y-1 text-gray-600 dark:text-gray-400">
                      <p>Messages: {state.cacheStats.messages}</p>
                      <p>Channels: {state.cacheStats.channels}</p>
                      <p>
                        Size: {formatBytes(state.cacheStats.estimatedSize)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={actions.refreshStats}
                  >
                    Refresh Stats
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={actions.retryFailed}
                    disabled={state.pendingCount === 0}
                  >
                    Retry Failed
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={actions.clearCache}
                  >
                    Clear Cache
                  </Button>
                </div>
              </div>
            </CollapsibleContent>
          )}
        </div>
      </Collapsible>
    </div>
  );
}

// =============================================================================
// Compact Variant
// =============================================================================

export function OfflineIndicatorCompact() {
  const { state } = useOffline();
  const { syncNow, isSyncing } = useSync();

  if (state.isOnline && state.pendingCount === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed bottom-4 right-4 z-50',
        'rounded-full shadow-lg px-4 py-2',
        'flex items-center gap-2',
        state.isOnline
          ? 'bg-yellow-100 dark:bg-yellow-900/50'
          : 'bg-red-100 dark:bg-red-900/50'
      )}
    >
      {state.isOnline ? (
        <Wifi className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
      ) : (
        <WifiOff className="h-4 w-4 text-red-600 dark:text-red-400" />
      )}

      {state.pendingCount > 0 && (
        <>
          <span className="text-sm font-medium">
            {state.pendingCount} pending
          </span>
          {state.isOnline && (
            <button
              onClick={() => syncNow()}
              disabled={isSyncing}
              className="text-sm underline hover:no-underline"
            >
              {isSyncing ? 'Syncing...' : 'Sync'}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// =============================================================================
// Utilities
// =============================================================================

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
