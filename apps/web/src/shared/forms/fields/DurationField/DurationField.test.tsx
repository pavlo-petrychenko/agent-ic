import { Locale } from '@agent-ic/contracts';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { DurationUnit } from '@/shared/forms/constants/duration.constants';
import { DurationField } from '@/shared/forms/fields/DurationField';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

interface HarnessProps {
  initial: number;
  base?: DurationUnit;
  onChange?: (value: number) => void;
}

function Harness({ initial, base = DurationUnit.Minute, onChange }: HarnessProps) {
  const [value, setValue] = useState(initial);
  return (
    <DurationField
      label="Silent for"
      value={value}
      base={base}
      onChange={(next) => {
        setValue(next);
        onChange?.(next);
      }}
    />
  );
}

describe('DurationField', () => {
  it('shows the value in the largest unit that fits', () => {
    renderWithProviders(<Harness initial={120} />);

    expect(screen.getByLabelText('Silent for')).toHaveValue(2);
    expect(screen.getByRole('combobox', { name: 'Unit' })).toHaveValue(DurationUnit.Hour);
  });

  it('commits a typed amount in the shown unit when the field loses focus', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(value: number) => void>();
    renderWithProviders(<Harness initial={120} onChange={onChange} />);

    const input = screen.getByLabelText('Silent for');
    await user.clear(input);
    await user.type(input, '3');
    await user.tab();

    expect(onChange).toHaveBeenCalledWith(180);
  });

  it('keeps the amount and rescales it when the unit changes', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(value: number) => void>();
    renderWithProviders(<Harness initial={30} base={DurationUnit.Hour} onChange={onChange} />);

    await user.selectOptions(screen.getByRole('combobox', { name: 'Unit' }), DurationUnit.Day);

    expect(onChange).toHaveBeenCalledWith(720);
    expect(screen.getByRole('combobox', { name: 'Unit' })).toHaveValue(DurationUnit.Day);
  });

  it('ignores an empty or zero amount and restores the previous one', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn<(value: number) => void>();
    renderWithProviders(<Harness initial={120} onChange={onChange} />);

    const input = screen.getByLabelText('Silent for');
    await user.clear(input);
    await user.tab();

    expect(onChange).not.toHaveBeenCalled();
  });

  it('labels the unit in Ukrainian', () => {
    renderWithProviders(<Harness initial={60} />, { locale: Locale.Uk });

    expect(screen.getByRole('combobox', { name: 'Одиниця' })).toHaveDisplayValue('годин');
  });

  it('shows the error under the field', () => {
    renderWithProviders(
      <DurationField
        label="Silent for"
        value={60}
        base={DurationUnit.Minute}
        onChange={() => undefined}
        error="Too short"
      />,
    );

    expect(screen.getByText('Too short')).toBeInTheDocument();
  });
});
