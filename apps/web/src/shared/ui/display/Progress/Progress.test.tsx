import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Progress } from '@/shared/ui/display/Progress/Progress';
import { ProgressTone } from '@/shared/ui/display/Progress/Progress.constants';

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

  it('draws the failed state in the error tone at the reached value', () => {
    render(<Progress value={40} label="Indexing" tone={ProgressTone.Err} />);

    const bar = screen.getByRole('progressbar');
    expect(bar.className).toMatch(ProgressTone.Err);
    expect(bar.firstElementChild).toHaveStyle({ width: '40%' });
  });

  it('renders a caption below the bar', () => {
    render(<Progress value={64} label="Indexing" caption="64%" />);

    const caption = screen.getByText('64%');
    expect(caption).toBeVisible();
    expect(screen.getByRole('progressbar').nextElementSibling).toBe(caption);
  });

  it('renders a component as the caption', () => {
    render(<Progress value={100} label="Indexing" caption={<span>Indexed</span>} />);

    expect(screen.getByText('Indexed')).toBeVisible();
  });

  it('renders no caption slot without a caption', () => {
    render(<Progress value={64} label="Indexing" />);

    expect(screen.getByRole('progressbar').nextElementSibling).toBeNull();
  });

  it('keeps the caption outside the progressbar', () => {
    render(<Progress value={null} label="Indexing" caption="Waiting" />);

    expect(screen.getByRole('progressbar')).not.toHaveTextContent('Waiting');
  });
});
