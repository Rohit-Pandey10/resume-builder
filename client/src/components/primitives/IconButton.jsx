import React from 'react';
import { clsx } from 'clsx';

/**
 * Icon-only button primitive.
 * Use for compact actions like delete, copy, move.
 * Add `danger` variant for destructive actions.
 */
export default function IconButton({
  danger,
  children,
  className,
  ...props
}) {
  return (
    <button
      type="button"
      className={clsx(
        'jr-icon-btn',
        danger && 'jr-icon-btn-danger',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
