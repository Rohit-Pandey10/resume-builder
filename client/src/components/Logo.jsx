import React from 'react';
import markSvg from '../brand/mark.svg?raw';

export default function Logo({
  markOnly = false,
  size = 32,
  className = '',
  wordmarkClassName = '',
  ariaLabel = 'JakeResume',
  ...props
}) {
  return (
    <span
      className={`jr-logo inline-flex items-center gap-2.5 select-none ${className}`.trim()}
      aria-label={ariaLabel}
      {...props}
    >
      <span
        className="jr-logo-mark inline-flex items-center justify-center flex-shrink-0"
        style={{ width: `${size}px`, height: `${size}px` }}
        aria-hidden="true"
        dangerouslySetInnerHTML={{ __html: markSvg }}
      />
      {!markOnly && (
        <span
          className={`jr-logo-wordmark font-sans font-semibold tracking-[-0.01em] ${wordmarkClassName}`.trim()}
          style={{
            fontFamily: "'Inter', sans-serif",
            fontSize: '18px',
            lineHeight: '24px',
            color: 'var(--ink-900)',
          }}
        >
          JakeResume
        </span>
      )}
    </span>
  );
}

export function LogoMark({ size = 32, className = '', ...props }) {
  return <Logo markOnly size={size} className={className} {...props} />;
}
