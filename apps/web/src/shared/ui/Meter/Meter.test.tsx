import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Meter } from '@/shared/ui/Meter/Meter';

describe('Meter', () => {
  it('exposes a meter named by its visible label', () => {
    render(<Meter label="Quality" value={8} max={10} valueLabel="8 / 10" />);

    const meter = screen.getByRole('meter', { name: 'Quality' });
    expect(meter).toHaveAttribute('aria-valuenow', '8');
    expect(meter).toHaveAttribute('aria-valuemin', '0');
    expect(meter).toHaveAttribute('aria-valuemax', '10');
    expect(meter).toHaveAttribute('aria-valuetext', '8 / 10');
  });

  it('shows the value label as visible text', () => {
    render(<Meter label="Cost" value={5} max={10} valueLabel="$5.00" />);

    expect(screen.getByText('$5.00')).toBeVisible();
  });

  it('sizes the fill by the share of the total', () => {
    render(<Meter label="Cost" value={5} max={20} valueLabel="$5.00" />);

    const track = screen.getByRole('meter').lastElementChild;
    expect(track?.firstElementChild).toHaveStyle({ width: '25%' });
  });
});
