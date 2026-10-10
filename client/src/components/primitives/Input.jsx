import React from 'react';
import { clsx } from 'clsx';

/**
 * Text input primitive.
 * Consumes design-system tokens for consistent 36px height, warm borders, focus ring.
 * Follows design direction: clean text inputs without internal icons.
 */
export default function Input({
  className,
  ...props
}) {
  return (
    <input
      className={clsx('jr-input', className)}
      {...props}
    />
  );
}
