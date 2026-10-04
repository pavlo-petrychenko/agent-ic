import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Field } from '@/shared/ui/Field/Field';
import { Input } from '@/shared/ui/Input';

const renderField = (props: {
  hint?: string | null;
  error?: string | null;
  required?: boolean;
  requiredLabel?: string | null;
}) =>
  render(
    <Field label="Email" {...props}>
      {({ invalid, required, ...control }) => (
        <Input {...control} invalid={invalid} required={required} />
      )}
    </Field>,
  );

describe('Field', () => {
  it('labels the control it wraps', () => {
    renderField({});

    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument();
  });

  it('describes the control with its hint', () => {
    renderField({ hint: 'Used to sign in' });

    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAccessibleDescription(
      'Used to sign in',
    );
  });

  it('announces the error and marks the control invalid', () => {
    renderField({ error: 'Enter a valid email' });

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a valid email');
    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInvalid();
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAccessibleDescription(
      'Enter a valid email',
    );
  });

  it('replaces the hint with the error', () => {
    renderField({ hint: 'Used to sign in', error: 'Enter a valid email' });

    expect(screen.queryByText('Used to sign in')).not.toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveAccessibleDescription(
      'Enter a valid email',
    );
  });

  it('marks a required control and names the requirement for assistive technology', () => {
    renderField({ required: true, requiredLabel: 'required' });

    expect(screen.getByRole('textbox', { name: 'Email required' })).toBeRequired();
  });

  it('does not mark the control required by default', () => {
    renderField({});

    expect(screen.getByRole('textbox', { name: 'Email' })).not.toBeRequired();
  });
});
