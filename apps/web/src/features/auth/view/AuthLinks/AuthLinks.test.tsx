import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthLinks } from '@/features/auth/view/AuthLinks/AuthLinks';

describe('AuthLinks', () => {
  it('groups the next steps of a screen as navigation', () => {
    render(
      <AuthLinks>
        <a href="/auth/login">Back to log in</a>
      </AuthLinks>,
    );

    expect(screen.getByRole('navigation')).toContainElement(
      screen.getByRole('link', { name: 'Back to log in' }),
    );
  });
});
