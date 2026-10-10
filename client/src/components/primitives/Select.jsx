import React from 'react';
import { clsx } from 'clsx';

/**
 * Select primitive.
 * Native <select> with custom chevron via CSS background-image.
 * Consistent sizing, focus ring, and border tokens.
 */
export default function Select({ className, children, ...props }) {
  return (
    <select
      className={clsx('jr-select', className)}
      {...props}
    >
      {children}
    </select>
  );
}
