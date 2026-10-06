import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Meter } from '@/shared/ui/display/Meter/Meter';
import { ChartColor } from '@/shared/ui/display/Meter/Meter.constants';

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

  it('draws the fill in the first chart colour by default', () => {
    render(<Meter label="Cost" value={5} max={20} valueLabel="$5.00" />);

    const fill = screen.getByRole('meter').lastElementChild?.firstElementChild;
    expect(fill?.className).toMatch(ChartColor.Chart1);
  });

  it.each([ChartColor.Chart2, ChartColor.Chart3, ChartColor.Chart4])(
    'draws the fill in %s',
    (color) => {
      render(<Meter label="Cost" value={5} max={20} valueLabel="$5.00" color={color} />);

      const fill = screen.getByRole('meter').lastElementChild?.firstElementChild;
      expect(fill?.className).toMatch(color);
      expect(fill?.className).not.toMatch(ChartColor.Chart1);
    },
  );
});
