import React from 'react';
import { clsx } from 'clsx';

const variantClass = {
  default: '',
  success: 'jr-badge-success',
  warning: 'jr-badge-warning',
  danger:  'jr-badge-danger',
  accent:  'jr-badge-accent',
};

/**
 * Badge primitive.
 * Small status indicator with optional dot.
 * Variants: default | success | warning | danger | accent
 */
export default function Badge({
  variant = 'default',
  dot,
  children,
  className,
  ...props
}) {
  return (
    <span
      className={clsx('jr-badge', variantClass[variant], className)}
      {...props}
    >
      {dot && (
        <span
          className="jr-badge-dot"
          style={{
            background: typeof dot === 'string' ? dot : undefined,
          }}
        />
      )}
      {children}
    </span>
  );
}
