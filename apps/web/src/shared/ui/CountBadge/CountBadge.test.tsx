import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CountBadge } from '@/shared/ui/CountBadge/CountBadge';

describe('CountBadge', () => {
  it('shows the count', () => {
    render(<CountBadge count={3} />);

    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('collapses counts above the maximum', () => {
    render(<CountBadge count={128} max={99} />);

    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('never collapses without a maximum', () => {
    render(<CountBadge count={1000} />);

    expect(screen.getByText('1000')).toBeInTheDocument();
  });

  it('shows a count equal to the maximum in full', () => {
    render(<CountBadge count={99} max={99} />);

    expect(screen.getByText('99')).toBeInTheDocument();
  });
});
