import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Select } from '@/shared/ui/inputs/Select/Select';
import { SelectSize } from '@/shared/ui/inputs/Select/Select.constants';

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

  it('shows the error under the control and links it with aria-describedby', () => {
    render(<Select aria-label="Version" options={OPTIONS} error="Pick a version" />);

    const select = screen.getByRole('combobox', { name: 'Version' });

    expect(select).toBeInvalid();
    expect(select).toHaveAccessibleDescription('Pick a version');
  });

  it('keeps a caller aria-describedby next to the error', () => {
    render(
      <>
        <p id="outside-hint">Choose carefully</p>
        <Select
          aria-label="Version"
          aria-describedby="outside-hint"
          options={OPTIONS}
          error="Pick a version"
        />
      </>,
    );

    expect(screen.getByRole('combobox', { name: 'Version' })).toHaveAccessibleDescription(
      'Pick a version Choose carefully',
    );
  });

  it('renders no error text when there is no error', () => {
    render(<Select aria-label="Version" options={OPTIONS} error={null} />);

    expect(screen.getByRole('combobox', { name: 'Version' })).toBeValid();
    expect(screen.getByRole('combobox', { name: 'Version' })).not.toHaveAccessibleDescription();
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
