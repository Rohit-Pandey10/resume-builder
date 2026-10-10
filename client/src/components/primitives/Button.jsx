import React from 'react';
import { clsx } from 'clsx';

const variantClass = {
  primary: 'jr-btn-primary',
  secondary: 'jr-btn-secondary',
  ghost: 'jr-btn-ghost',
  danger: 'jr-btn-danger',
};

/**
 * Button primitive.
 * Variants: primary | secondary | ghost | danger
 * Sizes: sm | default
 */
export default function Button({
  variant = 'secondary',
  size,
  children,
  className,
  ...props
}) {
  return (
    <button
      className={clsx(
        'jr-btn',
        variantClass[variant],
        size === 'sm' && 'jr-btn-sm',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
