import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AuthForm } from '@/features/auth/view/AuthForm/AuthForm';

describe('AuthForm', () => {
  it('hands the submit to the screen instead of reloading the page', async () => {
    const onSubmit = vi.fn<() => void>();
    render(
      <AuthForm onSubmit={onSubmit}>
        <button type="submit">Send</button>
      </AuthForm>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'Send' }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });
});
