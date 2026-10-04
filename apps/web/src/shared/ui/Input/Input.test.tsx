import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Input } from './Input';

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
});
