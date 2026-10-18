import React from 'react';
import { clsx } from 'clsx';

export default function Card({ interactive = false, className, children, ...props }) {
  return (
    <div className={clsx('jr-card', interactive && 'jr-card-interactive', className)} {...props}>
      {children}
    </div>
  );
}
