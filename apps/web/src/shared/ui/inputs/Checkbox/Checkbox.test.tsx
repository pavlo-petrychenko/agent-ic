import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';
import { Checkbox } from '@/shared/ui/inputs/Checkbox/Checkbox';
import { CheckboxAlign } from '@/shared/ui/inputs/Checkbox/Checkbox.constants';

const NOOP = () => undefined;

describe('Checkbox', () => {
  it('exposes a checkbox named by its label', () => {
    render(<Checkbox checked={false} onCheckedChange={NOOP} label="Email notifications" />);

    expect(screen.getByRole('checkbox', { name: 'Email notifications' })).not.toBeChecked();
  });

  it('reflects the checked state', () => {
    render(<Checkbox checked onCheckedChange={NOOP} label="Email notifications" />);

    expect(screen.getByRole('checkbox', { name: 'Email notifications' })).toBeChecked();
  });

  it('reports the next value when the box is clicked', async () => {
    const onCheckedChange = vi.fn<(checked: boolean) => void>();
    render(<Checkbox checked={false} onCheckedChange={onCheckedChange} label="Notify" />);

    await userEvent.click(screen.getByRole('checkbox', { name: 'Notify' }));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('toggles when the label text is clicked', async () => {
    const onCheckedChange = vi.fn<(checked: boolean) => void>();
    render(<Checkbox checked={false} onCheckedChange={onCheckedChange} label="Notify" />);

    await userEvent.click(screen.getByText('Notify'));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('toggles with the space key', async () => {
    const onCheckedChange = vi.fn<(checked: boolean) => void>();
    render(<Checkbox checked onCheckedChange={onCheckedChange} label="Notify" />);

    await userEvent.tab();
    await userEvent.keyboard(' ');

    expect(onCheckedChange).toHaveBeenCalledWith(false);
  });

  it('reports the indeterminate state to assistive technology and resolves to checked', async () => {
    const onCheckedChange = vi.fn<(checked: boolean) => void>();
    render(<Checkbox checked="indeterminate" onCheckedChange={onCheckedChange} label="All" />);

    expect(screen.getByRole('checkbox', { name: 'All' })).toBePartiallyChecked();

    await userEvent.click(screen.getByRole('checkbox', { name: 'All' }));

    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it.each([
    { checked: true as const, icon: IconName.Check },
    { checked: 'indeterminate' as const, icon: IconName.Minus },
  ])('draws the $icon icon at 11px with a 2.2 stroke', ({ checked, icon }) => {
    render(<Checkbox checked={checked} onCheckedChange={NOOP} label="Notify" />);

    const svg = screen.getByRole('checkbox', { name: 'Notify' }).querySelector('svg');

    expect(svg).toHaveAttribute('data-icon', icon);
    expect(svg).toHaveAttribute('width', '11');
    expect(svg).toHaveAttribute('height', '11');
    expect(svg).toHaveAttribute('stroke-width', '2.2');
  });

  it('is named by aria-label when it has no visible label', () => {
    render(<Checkbox checked={false} onCheckedChange={NOOP} aria-label="View agents" />);

    expect(screen.getByRole('checkbox', { name: 'View agents' })).toBeInTheDocument();
  });

  it('shows the description beside the label when aligned to the top', () => {
    render(
      <Checkbox
        checked={false}
        onCheckedChange={NOOP}
        align={CheckboxAlign.Top}
        label="message.received"
        description="A customer sent a message"
      />,
    );

    expect(screen.getByText('A customer sent a message')).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: /message\.received/ })).toBeInTheDocument();
  });

  it('marks itself invalid for assistive technology', () => {
    render(<Checkbox checked={false} onCheckedChange={NOOP} label="Terms" invalid />);

    expect(screen.getByRole('checkbox', { name: 'Terms' })).toBeInvalid();
  });

  it('ignores presses when disabled', async () => {
    const onCheckedChange = vi.fn<(checked: boolean) => void>();
    render(<Checkbox checked={false} onCheckedChange={onCheckedChange} label="Notify" disabled />);

    await userEvent.click(screen.getByText('Notify'));

    expect(onCheckedChange).not.toHaveBeenCalled();
    expect(screen.getByRole('checkbox', { name: 'Notify' })).toBeDisabled();
  });
});
