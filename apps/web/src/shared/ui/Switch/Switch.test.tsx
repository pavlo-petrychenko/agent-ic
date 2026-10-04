import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Switch } from '@/shared/ui/Switch/Switch';

const NOOP = () => undefined;

describe('Switch', () => {
  it('exposes a switch named by its label', () => {
    render(<Switch checked={false} onCheckedChange={NOOP} label="Send email alerts" />);

    expect(screen.getByRole('switch', { name: 'Send email alerts' })).not.toBeChecked();
  });

  it('reflects the checked state', () => {
    render(<Switch checked onCheckedChange={NOOP} label="Send email alerts" />);

    expect(screen.getByRole('switch', { name: 'Send email alerts' })).toBeChecked();
  });

  it('reports the next value when pressed', async () => {
    const onCheckedChange = vi.fn<(checked: boolean) => void>();
    render(<Switch checked={false} onCheckedChange={onCheckedChange} label="Alerts" />);

    await userEvent.click(screen.getByRole('switch', { name: 'Alerts' }));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('toggles when the label text is clicked', async () => {
    const onCheckedChange = vi.fn<(checked: boolean) => void>();
    render(<Switch checked onCheckedChange={onCheckedChange} label="Alerts" />);

    await userEvent.click(screen.getByText('Alerts'));

    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  it('toggles with the space key', async () => {
    const onCheckedChange = vi.fn<(checked: boolean) => void>();
    render(<Switch checked={false} onCheckedChange={onCheckedChange} label="Alerts" />);

    await userEvent.tab();
    await userEvent.keyboard(' ');

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('is named by aria-label when it has no visible label', () => {
    render(<Switch checked={false} onCheckedChange={NOOP} aria-label="Send email alerts" />);

    expect(screen.getByRole('switch', { name: 'Send email alerts' })).toBeInTheDocument();
  });

  it('ignores presses when disabled', async () => {
    const onCheckedChange = vi.fn<(checked: boolean) => void>();
    render(<Switch checked={false} onCheckedChange={onCheckedChange} label="Alerts" disabled />);

    await userEvent.click(screen.getByText('Alerts'));

    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(screen.getByRole('switch', { name: 'Alerts' })).toBeDisabled();
  });
});
