import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Divider } from '@/shared/ui/Divider/Divider';
import { DividerOrientation } from '@/shared/ui/Divider/Divider.constants';

describe('Divider', () => {
  it('is hidden from assistive technology by default', () => {
    render(<Divider />);

    expect(screen.queryByRole('separator')).not.toBeInTheDocument();
  });

  it('exposes a horizontal separator when not decorative', () => {
    render(<Divider decorative={false} />);

    expect(screen.getByRole('separator')).toHaveAttribute('data-orientation', 'horizontal');
  });

  it('announces the vertical orientation', () => {
    render(<Divider decorative={false} orientation={DividerOrientation.Vertical} />);

    expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
  });
});
