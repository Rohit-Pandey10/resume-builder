import React from 'react';
import { Field, Input } from '../primitives';

export default function BasicsSection({ basics = {}, onChange }) {
  const handleChange = (field, value) => {
    onChange({
      ...basics,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4">
      {/* Section Title & Description */}
      <div>
        <h2
          className="text-lg font-semibold tracking-tight"
          style={{ color: 'var(--color-text-primary, #1C1917)' }}
        >
          Personal & contact
        </h2>
        <p
          className="text-xs mt-0.5"
          style={{ color: 'var(--color-text-secondary, #57534E)' }}
        >
          Your name, contact information, and primary online profiles.
        </p>
      </div>

      {/* Form Fields */}
      <div className="space-y-3">
        <Field label="Full name">
          <Input
            type="text"
            value={basics.fullName || ''}
            onChange={(e) => handleChange('fullName', e.target.value)}
            placeholder="Jane Doe"
          />
        </Field>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Email">
            <Input
              type="email"
              value={basics.email || ''}
              onChange={(e) => handleChange('email', e.target.value)}
              placeholder="jane@example.com"
            />
          </Field>

          <Field label="Phone">
            <Input
              type="text"
              value={basics.phone || ''}
              onChange={(e) => handleChange('phone', e.target.value)}
              placeholder="(555) 019-2834"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Location">
            <Input
              type="text"
              value={basics.location || ''}
              onChange={(e) => handleChange('location', e.target.value)}
              placeholder="Seattle, WA"
            />
          </Field>

          <Field label="LinkedIn">
            <Input
              type="url"
              value={basics.linkedinUrl || ''}
              onChange={(e) => handleChange('linkedinUrl', e.target.value)}
              placeholder="https://linkedin.com/in/username"
            />
          </Field>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="GitHub">
            <Input
              type="url"
              value={basics.githubUrl || ''}
              onChange={(e) => handleChange('githubUrl', e.target.value)}
              placeholder="https://github.com/username"
            />
          </Field>

          <Field label="Portfolio / Website">
            <Input
              type="url"
              value={basics.portfolioUrl || ''}
              onChange={(e) => handleChange('portfolioUrl', e.target.value)}
              placeholder="https://janedoe.dev"
            />
          </Field>
        </div>
      </div>
    </div>
  );
}
