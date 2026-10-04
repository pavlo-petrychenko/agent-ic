import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Badge } from '@/shared/ui/Badge/Badge';
import { BadgeTone } from '@/shared/ui/Badge/Badge.constants';

describe('Badge', () => {
  it('renders its label as text', () => {
    render(<Badge tone={BadgeTone.Ok}>Live</Badge>);

    expect(screen.getByText('Live')).toBeInTheDocument();
  });

  it('adds a decorative dot only when asked', () => {
    const { container, rerender } = render(<Badge>Live</Badge>);
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();

    rerender(<Badge dot>Live</Badge>);
    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
  });

  it('keeps the dot out of the accessible text', () => {
    const { container } = render(<Badge dot>Indexed</Badge>);

    expect(container.firstElementChild).toHaveTextContent(/^Indexed$/);
  });
});
