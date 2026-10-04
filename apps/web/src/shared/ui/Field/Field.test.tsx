import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Input } from '../Input';
import { Field } from './Field';

const renderField = (props: { hint?: string | null; error?: string | null }) =>
  render(
    <Field label="Email" {...props}>
      {({ invalid, ...control }) => <Input {...control} invalid={invalid} />}
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
});
