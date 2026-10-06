import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Input } from '@/shared/ui/inputs/Input/Input';
import { InputSize } from '@/shared/ui/inputs/Input/Input.constants';

describe('Input', () => {
  it('accepts typed text', async () => {
    render(<Input aria-label="Email" />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'ada@example.com');

    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('ada@example.com');
  });

  it('marks itself invalid for assistive technology', () => {
    render(<Input aria-label="Email" invalid />);

    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInvalid();
  });

  it('is valid by default', () => {
    render(<Input aria-label="Email" />);

    expect(screen.getByRole('textbox', { name: 'Email' })).toBeValid();
  });

  it('passes native attributes through at the large mono variant', () => {
    render(<Input aria-label="Path" size={InputSize.Lg} placeholder="agents/booking" mono />);

    expect(screen.getByRole('textbox', { name: 'Path' })).toHaveAttribute(
      'placeholder',
      'agents/booking',
    );
  });

  it('does not accept typing when disabled', async () => {
    render(<Input aria-label="Email" disabled />);

    await userEvent.type(screen.getByRole('textbox', { name: 'Email' }), 'ada');

    expect(screen.getByRole('textbox', { name: 'Email' })).toBeDisabled();
    expect(screen.getByRole('textbox', { name: 'Email' })).toHaveValue('');
  });
});
