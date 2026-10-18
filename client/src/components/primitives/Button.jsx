import React from 'react';
import { clsx } from 'clsx';

const variantClass = {
  primary: 'jr-btn-primary',
  dark: 'jr-btn-dark',
  secondary: 'jr-btn-secondary',
  ghost: 'jr-btn-ghost',
  danger: 'jr-btn-danger',
  'accent-outline': 'jr-btn-accent-outline',
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
        size === 'lg' && 'jr-btn-lg',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
