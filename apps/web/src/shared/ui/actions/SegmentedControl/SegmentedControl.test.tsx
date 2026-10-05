import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SegmentedControl } from '@/shared/ui/actions/SegmentedControl/SegmentedControl';
import type { SegmentedControlOption } from '@/shared/ui/actions/SegmentedControl/SegmentedControl.typedefs';

type Range = '7' | '30' | '90';

const OPTIONS: readonly SegmentedControlOption<Range>[] = [
  { value: '7', label: '7 days' },
  { value: '30', label: '30 days' },
  { value: '90', label: '90 days', disabled: true },
];

describe('SegmentedControl', () => {
  it('is a named group with the current value checked', () => {
    render(
      <SegmentedControl
        options={OPTIONS}
        value="30"
        onValueChange={vi.fn<(value: Range) => void>()}
        ariaLabel="Range"
      />,
    );

    expect(screen.getByRole('radiogroup', { name: 'Range' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '30 days' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '7 days' })).not.toBeChecked();
  });

  it('reports the chosen value', async () => {
    const onValueChange = vi.fn<(value: Range) => void>();
    render(
      <SegmentedControl
        options={OPTIONS}
        value="30"
        onValueChange={onValueChange}
        ariaLabel="Range"
      />,
    );

    await userEvent.click(screen.getByRole('radio', { name: '7 days' }));

    expect(onValueChange).toHaveBeenCalledWith('7');
  });

  it('does nothing when the selected option is clicked again', async () => {
    const onValueChange = vi.fn<(value: Range) => void>();
    render(
      <SegmentedControl
        options={OPTIONS}
        value="30"
        onValueChange={onValueChange}
        ariaLabel="Range"
      />,
    );

    await userEvent.click(screen.getByRole('radio', { name: '30 days' }));

    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('moves the choice with the arrow keys', async () => {
    const onValueChange = vi.fn<(value: Range) => void>();
    render(
      <SegmentedControl
        options={OPTIONS}
        value="7"
        onValueChange={onValueChange}
        ariaLabel="Range"
      />,
    );

    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}{Enter}');

    expect(onValueChange).toHaveBeenCalledWith('30');
  });

  it('ignores a disabled option', async () => {
    const onValueChange = vi.fn<(value: Range) => void>();
    render(
      <SegmentedControl
        options={OPTIONS}
        value="7"
        onValueChange={onValueChange}
        ariaLabel="Range"
      />,
    );

    await userEvent.click(screen.getByRole('radio', { name: '90 days' }));

    expect(screen.getByRole('radio', { name: '90 days' })).toBeDisabled();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('disables every option when the whole group is disabled', async () => {
    const onValueChange = vi.fn<(value: Range) => void>();
    render(
      <SegmentedControl
        options={OPTIONS}
        value="7"
        onValueChange={onValueChange}
        ariaLabel="Range"
        disabled
      />,
    );

    await userEvent.click(screen.getByRole('radio', { name: '30 days' }));

    expect(screen.getByRole('radio', { name: '30 days' })).toBeDisabled();
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
