import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DisplayTitle } from '@/shared/ui/DisplayTitle/DisplayTitle';

describe('DisplayTitle', () => {
  it('renders the title as the page heading with the supporting sentence under it', () => {
    render(<DisplayTitle title="Set up your agent" subtitle="It takes about two minutes." />);

    expect(
      screen.getByRole('heading', { level: 1, name: 'Set up your agent' }),
    ).toBeInTheDocument();
    expect(screen.getByText('It takes about two minutes.')).toBeInTheDocument();
  });

  it('renders no supporting sentence when it has none', () => {
    const { container } = render(<DisplayTitle title="Welcome" />);

    expect(container.querySelector('p')).toBeNull();
  });
});
