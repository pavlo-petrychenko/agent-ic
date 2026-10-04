import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusDot } from '@/shared/ui/StatusDot/StatusDot';
import { StatusKind } from '@/shared/ui/StatusDot/StatusDot.constants';

describe('StatusDot', () => {
  it('is hidden from assistive technology without a label', () => {
    const { container } = render(<StatusDot kind={StatusKind.Ok} />);

    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('is an image named by its label', () => {
    render(<StatusDot kind={StatusKind.Err} label="Disconnected" />);

    const dot = screen.getByRole('img', { name: 'Disconnected' });
    expect(dot).not.toHaveAttribute('aria-hidden');
  });
});
