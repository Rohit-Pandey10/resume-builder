import React from 'react';
import { clsx } from 'clsx';

/**
 * Empty state — displayed when a collection has zero items.
 * Shows a message and an optional action button.
 */
export default function EmptyState({ children, action, className }) {
  return (
    <div className={clsx('jr-empty', className)}>
      <p className="jr-empty-text">{children}</p>
      {action}
    </div>
  );
}
