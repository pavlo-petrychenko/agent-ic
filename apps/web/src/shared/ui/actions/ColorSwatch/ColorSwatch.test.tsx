import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ColorSwatch } from '@/shared/ui/actions/ColorSwatch/ColorSwatch';

const COLOR = '#0F6B6B';

describe('ColorSwatch', () => {
  it('is a toggle button named after the colour', () => {
    render(<ColorSwatch color={COLOR} label="Teal" onSelect={() => undefined} />);

    expect(screen.getByRole('button', { name: 'Teal' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('fills itself with the given colour', () => {
    render(<ColorSwatch color={COLOR} label="Teal" onSelect={() => undefined} />);

    expect(screen.getByRole('button', { name: 'Teal' })).toHaveStyle({ background: COLOR });
  });

  it('reports a pressed state when selected', () => {
    render(<ColorSwatch color={COLOR} label="Teal" selected onSelect={() => undefined} />);

    expect(screen.getByRole('button', { name: 'Teal' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('calls onSelect on click and on keyboard activation', async () => {
    const onSelect = vi.fn<() => void>();
    render(<ColorSwatch color={COLOR} label="Teal" onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: 'Teal' }));
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');

    expect(onSelect).toHaveBeenCalledTimes(3);
  });

  it('ignores presses when disabled', async () => {
    const onSelect = vi.fn<() => void>();
    render(<ColorSwatch color={COLOR} label="Teal" disabled onSelect={onSelect} />);

    await userEvent.click(screen.getByRole('button', { name: 'Teal' }));

    expect(onSelect).not.toHaveBeenCalled();
  });
});
