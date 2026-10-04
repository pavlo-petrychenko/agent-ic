import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Select } from '@/shared/ui/Select/Select';
import { SelectSize } from '@/shared/ui/Select/Select.constants';

const OPTIONS = [
  { value: 'latest', label: 'Follow latest' },
  { value: 'v4', label: 'Pin v4' },
  { value: 'v3', label: 'Pin v3', disabled: true },
];

describe('Select', () => {
  it('lists its options in order inside a named combobox', () => {
    render(<Select aria-label="Version" options={OPTIONS} />);

    expect(screen.getByRole('combobox', { name: 'Version' })).toBeInTheDocument();
    expect(screen.getAllByRole('option').map((option) => option.textContent)).toEqual([
      'Follow latest',
      'Pin v4',
      'Pin v3',
    ]);
  });

  it('reports the chosen value', async () => {
    const onChange = vi.fn<(value: string) => void>();
    render(
      <Select
        aria-label="Version"
        options={OPTIONS}
        onChange={(event) => onChange(event.target.value)}
      />,
    );

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Version' }), 'v4');

    expect(onChange).toHaveBeenCalledWith('v4');
  });

  it('disables individual options', () => {
    render(<Select aria-label="Version" options={OPTIONS} />);

    expect(screen.getByRole('option', { name: 'Pin v3' })).toBeDisabled();
    expect(screen.getByRole('option', { name: 'Pin v4' })).toBeEnabled();
  });

  it('marks itself invalid for assistive technology', () => {
    render(<Select aria-label="Version" options={OPTIONS} invalid />);

    expect(screen.getByRole('combobox', { name: 'Version' })).toBeInvalid();
  });

  it('renders at the small size and stays usable', async () => {
    render(<Select aria-label="Version" options={OPTIONS} size={SelectSize.Sm} />);

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Version' }), 'v4');

    expect(screen.getByRole('combobox', { name: 'Version' })).toHaveValue('v4');
  });

  it('is disabled when asked', () => {
    render(<Select aria-label="Version" options={OPTIONS} disabled />);

    expect(screen.getByRole('combobox', { name: 'Version' })).toBeDisabled();
  });
});
