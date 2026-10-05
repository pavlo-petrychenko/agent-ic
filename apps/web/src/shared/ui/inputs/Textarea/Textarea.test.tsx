import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Textarea } from '@/shared/ui/inputs/Textarea/Textarea';

describe('Textarea', () => {
  it('accepts multi-line text', async () => {
    render(<Textarea aria-label="Description" />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Description' }), 'one{Enter}two');

    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue('one\ntwo');
  });

  it('marks itself invalid for assistive technology', () => {
    render(<Textarea aria-label="Description" invalid />);

    expect(screen.getByRole('textbox', { name: 'Description' })).toBeInvalid();
  });

  it('is valid by default', () => {
    render(<Textarea aria-label="Description" />);

    expect(screen.getByRole('textbox', { name: 'Description' })).toBeValid();
  });

  it('passes native attributes through in mono', () => {
    render(<Textarea aria-label="Payload" mono rows={5} placeholder="{}" />);

    expect(screen.getByRole('textbox', { name: 'Payload' })).toHaveAttribute('rows', '5');
    expect(screen.getByRole('textbox', { name: 'Payload' })).toHaveAttribute('placeholder', '{}');
  });

  it('does not accept typing when disabled', async () => {
    render(<Textarea aria-label="Description" disabled />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Description' }), 'text');

    expect(screen.getByRole('textbox', { name: 'Description' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Description' })).toHaveValue('');
  });
});
