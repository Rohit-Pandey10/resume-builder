import React from 'react';
import { Check } from 'lucide-react';

/**
 * Checkbox primitive — custom styled toggle.
 * Renders as a button with aria-checked for accessibility.
 */
export default function Checkbox({ checked, onChange, className, ...props }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      data-checked={checked ? 'true' : 'false'}
      className={`jr-checkbox ${className || ''}`}
      onClick={() => onChange?.(!checked)}
      {...props}
    >
      {checked && <Check />}
    </button>
  );
}
