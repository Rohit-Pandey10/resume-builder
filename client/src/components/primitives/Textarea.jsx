import React, { useRef, useEffect } from 'react';
import { clsx } from 'clsx';

/**
 * Textarea primitive.
 * Two modes:
 *  - default: bordered control for standalone editing
 *  - inline: transparent, minimal — for bullet-point inline editing with auto-grow
 */
export default function Textarea({
  inline,
  className,
  onInput,
  value,
  ...props
}) {
  const textareaRef = useRef(null);

  const adjustHeight = React.useCallback((el) => {
    if (!el || !inline) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(56, el.scrollHeight)}px`;
  }, [inline]);

  useEffect(() => {
    if (inline && textareaRef.current) {
      adjustHeight(textareaRef.current);
    }
  }, [inline, value, adjustHeight]);

  const handleInput = (e) => {
    adjustHeight(e.target);
    onInput?.(e);
  };

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onInput={handleInput}
      className={clsx(
        inline ? 'jr-textarea-inline' : 'jr-textarea',
        className,
      )}
      {...props}
    />
  );
}
