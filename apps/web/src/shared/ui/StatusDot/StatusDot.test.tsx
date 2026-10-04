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

  it('is an image when the caller names it without a visible label', () => {
    render(<StatusDot kind={StatusKind.Err} aria-label="Disconnected" />);

    const dot = screen.getByRole('img', { name: 'Disconnected' });
    expect(dot).not.toHaveAttribute('aria-hidden');
  });

  it('shows the label as visible text beside the dot', () => {
    render(<StatusDot kind={StatusKind.Ok} label="Connected" />);

    expect(screen.getByText('Connected')).toBeVisible();
  });

  it('hides the dot from assistive technology when a label is shown', () => {
    const { container } = render(<StatusDot kind={StatusKind.Warn} label="Waiting" />);

    expect(container.querySelector('[data-kind="warn"]')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it.each(Object.values(StatusKind))('draws the %s kind', (kind) => {
    const { container } = render(<StatusDot kind={kind} label="State" />);

    expect(container.querySelector(`[data-kind="${kind}"]`)).toBeInTheDocument();
  });

  it('passes the class name to the outermost element', () => {
    const { container } = render(
      <StatusDot kind={StatusKind.Run} label="Indexing" className="extra" />,
    );

    expect(container.firstElementChild).toHaveClass('extra');
  });
});
