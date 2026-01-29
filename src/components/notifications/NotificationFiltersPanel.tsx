'use client';

/**
 * NotificationFiltersPanel - Filter notification types
 */

import * as React from 'react';
import { cn } from '@/lib/utils';

export interface NotificationFiltersPanelProps {
  className?: string;
}

export function NotificationFiltersPanel({
  className,
}: NotificationFiltersPanelProps) {
  return (
    <div className={cn('space-y-4 p-4', className)}>
      <h3 className="text-lg font-medium">Notification Filters</h3>
      <p className="text-sm text-muted-foreground">
        Choose which types of notifications to receive.
      </p>
      {/* Placeholder content */}
      <div className="rounded-lg border p-4">
        <p className="text-sm">Notification filters coming soon.</p>
      </div>
    </div>
  );
}

export default NotificationFiltersPanel;
