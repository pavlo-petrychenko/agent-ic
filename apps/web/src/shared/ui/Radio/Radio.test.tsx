import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Radio } from '@/shared/ui/Radio/Radio';
import { RadioOrientation } from '@/shared/ui/Radio/Radio.constants';
import type { RadioOption } from '@/shared/ui/Radio/Radio.typedefs';

const OPTIONS: readonly RadioOption[] = [
  { value: 'pinned', label: 'Pin v4' },
  { value: 'latest', label: 'Follow latest' },
  { value: 'manual', label: 'Manual', disabled: true },
];

const renderRadio = (
  props: { value?: string | null; disabled?: boolean; invalid?: boolean } = {},
) => {
  const onValueChange = vi.fn<(value: string) => void>();
  render(
    <Radio
      name="version-mode"
      ariaLabel="Version mode"
      value={props.value === undefined ? 'pinned' : props.value}
      onValueChange={onValueChange}
      options={OPTIONS}
      disabled={props.disabled}
      invalid={props.invalid}
    />,
  );
  return onValueChange;
};

describe('Radio', () => {
  it('renders a named radio group with the options in order', () => {
    renderRadio();

    expect(screen.getByRole('radiogroup', { name: 'Version mode' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio').map((radio) => radio.getAttribute('value'))).toEqual([
      'pinned',
      'latest',
      'manual',
    ]);
  });

  it('checks the option that matches the value', () => {
    renderRadio({ value: 'latest' });

    expect(screen.getByRole('radio', { name: 'Follow latest' })).toBeChecked();
    expect(screen.getByRole('radio', { name: 'Pin v4' })).not.toBeChecked();
  });

  it('checks nothing when the value is null', () => {
    renderRadio({ value: null });

    expect(screen.queryByRole('radio', { checked: true })).not.toBeInTheDocument();
  });

  it('reports the chosen value when an option is clicked', async () => {
    const onValueChange = renderRadio();

    await userEvent.click(screen.getByRole('radio', { name: 'Follow latest' }));

    expect(onValueChange).toHaveBeenCalledWith('latest');
  });

  it('selects when the label text is clicked', async () => {
    const onValueChange = renderRadio();

    await userEvent.click(screen.getByText('Follow latest'));

    expect(onValueChange).toHaveBeenCalledWith('latest');
  });

  it('moves between options with arrow keys', async () => {
    const onValueChange = renderRadio();

    await userEvent.tab();
    expect(screen.getByRole('radio', { name: 'Pin v4' })).toHaveFocus();

    await userEvent.keyboard('{ArrowRight}');

    expect(screen.getByRole('radio', { name: 'Follow latest' })).toHaveFocus();

    await userEvent.keyboard(' ');

    expect(onValueChange).toHaveBeenCalledWith('latest');
  });

  it('does not select a disabled option', async () => {
    const onValueChange = renderRadio();

    await userEvent.click(screen.getByText('Manual'));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: 'Manual' })).toBeDisabled();
  });

  it('ignores presses when the whole group is disabled', async () => {
    const onValueChange = renderRadio({ disabled: true });

    await userEvent.click(screen.getByText('Follow latest'));

    expect(onValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: 'Follow latest' })).toBeDisabled();
  });

  it('marks the group invalid for assistive technology', () => {
    renderRadio({ invalid: true });

    expect(screen.getByRole('radiogroup', { name: 'Version mode' })).toBeInvalid();
  });

  it('exposes the vertical orientation', () => {
    render(
      <Radio
        name="version-mode"
        ariaLabel="Version mode"
        value="pinned"
        onValueChange={vi.fn<(value: string) => void>()}
        options={OPTIONS}
        orientation={RadioOrientation.Vertical}
      />,
    );

    expect(screen.getByRole('radiogroup', { name: 'Version mode' })).toHaveAttribute(
      'aria-orientation',
      'vertical',
    );
  });
});
