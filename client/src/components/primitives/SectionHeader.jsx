import React from 'react';
import { clsx } from 'clsx';

/**
 * Section header — a small uppercase label used to group form regions.
 * Right slot for optional action buttons.
 */
export default function SectionHeader({ children, action, className }) {
  return (
    <div className={clsx('jr-section-header', className)}>
      <span className="jr-section-header-title">{children}</span>
      {action && <div>{action}</div>}
    </div>
  );
}
