import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Progress } from '@/shared/ui/Progress/Progress';

describe('Progress', () => {
  it('exposes a named progressbar with its range', () => {
    render(<Progress value={30} max={60} label="Indexing" />);

    const bar = screen.getByRole('progressbar', { name: 'Indexing' });
    expect(bar).toHaveAttribute('aria-valuenow', '30');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '60');
  });

  it('fills the track in proportion to the value', () => {
    render(<Progress value={30} max={60} label="Indexing" />);

    expect(screen.getByRole('progressbar').firstElementChild).toHaveStyle({ width: '50%' });
  });

  it('omits the current value when indeterminate', () => {
    render(<Progress value={null} label="Indexing" />);

    expect(screen.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow');
    expect(screen.getByRole('progressbar').firstElementChild).not.toHaveAttribute('style');
  });

  it('defaults the maximum to 100', () => {
    render(<Progress value={10} label="Usage" />);

    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '100');
  });

  it('clamps the fill between empty and full', () => {
    const { rerender } = render(<Progress value={-5} max={10} label="Usage" />);
    expect(screen.getByRole('progressbar').firstElementChild).toHaveStyle({ width: '0%' });

    rerender(<Progress value={15} max={10} label="Usage" />);
    expect(screen.getByRole('progressbar').firstElementChild).toHaveStyle({ width: '100%' });
  });

  it('draws an empty fill for a non-positive maximum', () => {
    render(<Progress value={5} max={0} label="Usage" />);

    expect(screen.getByRole('progressbar').firstElementChild).toHaveStyle({ width: '0%' });
  });
});
