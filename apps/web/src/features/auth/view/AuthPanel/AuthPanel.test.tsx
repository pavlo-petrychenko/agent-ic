import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthPanel } from '@/features/auth/view/AuthPanel/AuthPanel';

describe('AuthPanel', () => {
  it('titles the panel and shows its content and footer', () => {
    render(
      <AuthPanel title="Log in" subtitle="Welcome back" footer={<span>New here?</span>}>
        <p>Form</p>
      </AuthPanel>,
    );

    expect(screen.getByRole('heading', { level: 1, name: 'Log in' })).toBeInTheDocument();
    expect(screen.getByText('Welcome back')).toBeInTheDocument();
    expect(screen.getByText('Form')).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
    expect(screen.getByText('New here?')).toBeInTheDocument();
  });

  it('shows only the content when there is no title or footer', () => {
    render(
      <AuthPanel>
        <p>Message</p>
      </AuthPanel>,
    );

    expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });
});
