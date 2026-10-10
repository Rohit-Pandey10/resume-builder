import React from 'react';
import { clsx } from 'clsx';

/**
 * CSS-powered tooltip primitive.
 * Appears on hover/focus above the trigger element.
 *
 * Usage:
 *   <Tooltip text="Delete entry">
 *     <IconButton danger><Trash2 /></IconButton>
 *   </Tooltip>
 */
export default function Tooltip({ text, children, className }) {
  if (!text) return children;

  return (
    <span className={clsx('jr-tooltip-trigger', className)}>
      {children}
      <span className="jr-tooltip-content" role="tooltip">
        {text}
      </span>
    </span>
  );
}
