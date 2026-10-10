import React from 'react';
import { clsx } from 'clsx';

/**
 * Textarea primitive.
 * Two modes:
 *  - default: bordered control for standalone editing
 *  - inline: transparent, minimal — for bullet-point inline editing
 */
export default function Textarea({
  inline,
  className,
  ...props
}) {
  return (
    <textarea
      className={clsx(
        inline ? 'jr-textarea-inline' : 'jr-textarea',
        className,
      )}
      {...props}
    />
  );
}
