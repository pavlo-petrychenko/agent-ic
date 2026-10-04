import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ThemePreference } from '@/shared/theme/constants/theme.constants';
import { ThemeToggle } from '@/shared/ui/ThemeToggle/ThemeToggle';

const OPTION_LABELS = {
  [ThemePreference.Light]: 'Light',
  [ThemePreference.Dark]: 'Dark',
  [ThemePreference.System]: 'System',
};

const renderToggle = (props: { withLabels?: boolean; disabled?: boolean } = {}) => {
  const onChange = vi.fn<(value: ThemePreference) => void>();
  render(
    <ThemeToggle
      value={ThemePreference.System}
      onChange={onChange}
      label="Theme"
      optionLabels={OPTION_LABELS}
      {...props}
    />,
  );
  return onChange;
};

describe('ThemeToggle', () => {
  it('renders a named radio group with the options in order and the value checked', () => {
    renderToggle();

    expect(screen.getByRole('radiogroup', { name: 'Theme' })).toBeInTheDocument();
    expect(screen.getAllByRole('radio').map((radio) => radio.textContent)).toEqual([
      'Light',
      'Dark',
      'System',
    ]);
    expect(screen.getByRole('radio', { name: 'System' })).toBeChecked();
  });

  it('reports the chosen preference', async () => {
    const onChange = renderToggle();

    await userEvent.click(screen.getByRole('radio', { name: 'Dark' }));

    expect(onChange).toHaveBeenCalledWith(ThemePreference.Dark);
  });

  it('moves between options with arrow keys and selects with space', async () => {
    const onChange = renderToggle();

    await userEvent.tab();
    expect(screen.getByRole('radio', { name: 'System' })).toHaveFocus();

    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('radio', { name: 'Dark' })).toHaveFocus();

    await userEvent.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith(ThemePreference.Dark);
  });

  it('names icon-only options through aria-label', () => {
    renderToggle({ withLabels: false });

    expect(screen.getByRole('radio', { name: 'Light' })).toHaveTextContent('');
  });

  it('ignores presses when disabled', async () => {
    const onChange = renderToggle({ disabled: true });

    await userEvent.click(screen.getByRole('radio', { name: 'Light' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('radio', { name: 'Light' })).toBeDisabled();
  });
});
