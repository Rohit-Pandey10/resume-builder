import React from 'react';
import { clsx } from 'clsx';

/**
 * Field primitive — wraps a label, control, and optional hint/error.
 *
 * Usage:
 *   <Field label="Email" hint="We won't share this" error={errors.email}>
 *     <Input type="email" ... />
 *   </Field>
 */
export default function Field({
  label,
  htmlFor,
  hint,
  error,
  className,
  children,
}) {
  return (
    <div className={clsx('jr-field', className)}>
      {label && (
        <label htmlFor={htmlFor} className="jr-field-label">
          {label}
        </label>
      )}
      {children}
      {error && <span className="jr-field-error">{error}</span>}
      {!error && hint && <span className="jr-field-hint">{hint}</span>}
    </div>
  );
}
