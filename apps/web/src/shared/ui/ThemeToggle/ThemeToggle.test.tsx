import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ThemePreference } from '@/shared/theme/constants/theme.constants';
import { ThemeToggle } from '@/shared/ui/ThemeToggle/ThemeToggle';
import { ThemeToggleVariant } from '@/shared/ui/ThemeToggle/ThemeToggle.constants';

const LABELS = {
  [ThemePreference.Light]: 'Light',
  [ThemePreference.Dark]: 'Dark',
  [ThemePreference.System]: 'System',
};

interface RenderOptions {
  variant?: ThemeToggleVariant;
  value?: ThemePreference;
  disabled?: boolean;
}

const renderToggle = ({
  variant = ThemeToggleVariant.Settings,
  value = ThemePreference.System,
  disabled,
}: RenderOptions = {}) => {
  const onChange = vi.fn<(next: ThemePreference) => void>();
  const view = render(
    <ThemeToggle
      value={value}
      onChange={onChange}
      variant={variant}
      labels={LABELS}
      ariaLabel="Theme"
      disabled={disabled}
    />,
  );
  return { onChange, ...view };
};

describe('ThemeToggle', () => {
  it('renders a named group of pressed-state buttons in order', () => {
    renderToggle();

    expect(screen.getByRole('group', { name: 'Theme' })).toBeInTheDocument();
    expect(screen.getAllByRole('button').map((button) => button.textContent)).toEqual([
      'Light',
      'Dark',
      'System',
    ]);
  });

  it('presses only the button that matches the value', () => {
    renderToggle({ value: ThemePreference.Dark });

    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'System' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('follows the value prop when it changes', () => {
    const { rerender, onChange } = renderToggle({ value: ThemePreference.Light });

    rerender(
      <ThemeToggle
        value={ThemePreference.System}
        onChange={onChange}
        variant={ThemeToggleVariant.Settings}
        labels={LABELS}
        ariaLabel="Theme"
      />,
    );

    expect(screen.getByRole('button', { name: 'System' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Light' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('reports the chosen preference on click', async () => {
    const { onChange } = renderToggle();

    await userEvent.click(screen.getByRole('button', { name: 'Dark' }));

    expect(onChange).toHaveBeenCalledWith(ThemePreference.Dark);
  });

  it('does not report a click on the pressed button, which would clear the value', async () => {
    const { onChange } = renderToggle({ value: ThemePreference.System });

    await userEvent.click(screen.getByRole('button', { name: 'System' }));

    expect(onChange).not.toHaveBeenCalled();
  });

  it('moves between buttons with arrow keys and selects with space', async () => {
    const { onChange } = renderToggle();

    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'System' })).toHaveFocus();

    await userEvent.keyboard('{ArrowLeft}');
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveFocus();

    await userEvent.keyboard(' ');
    expect(onChange).toHaveBeenCalledWith(ThemePreference.Dark);
  });

  it('keeps horizontal arrow keys from reaching a surrounding menu', async () => {
    const onMenuKeyDown = vi.fn<() => void>();
    render(
      <div role="presentation" onKeyDown={onMenuKeyDown}>
        <ThemeToggle
          value={ThemePreference.System}
          onChange={() => undefined}
          variant={ThemeToggleVariant.Menu}
          labels={LABELS}
          ariaLabel="Theme"
        />
      </div>,
    );

    await userEvent.tab();
    await userEvent.keyboard('{ArrowLeft}');
    await userEvent.keyboard('{ArrowRight}');

    expect(onMenuKeyDown).not.toHaveBeenCalled();
  });

  it('lets other keys reach a surrounding menu', () => {
    const onMenuKeyDown = vi.fn<() => void>();
    render(
      <div role="presentation" onKeyDown={onMenuKeyDown}>
        <ThemeToggle
          value={ThemePreference.System}
          onChange={() => undefined}
          variant={ThemeToggleVariant.Menu}
          labels={LABELS}
          ariaLabel="Theme"
        />
      </div>,
    );

    fireEvent.keyDown(screen.getByRole('button', { name: 'Light' }), { key: 'Escape' });

    expect(onMenuKeyDown).toHaveBeenCalledTimes(1);
  });

  it('renders icons named through aria-label in the menu variant', () => {
    renderToggle({ variant: ThemeToggleVariant.Menu });

    Object.values(LABELS).forEach((label) => {
      expect(screen.getByRole('button', { name: label })).toHaveTextContent('');
    });
    expect(document.querySelectorAll('svg')).toHaveLength(Object.values(LABELS).length);
  });

  it('shows each label as a tooltip on the icon buttons in the menu variant', async () => {
    renderToggle({ variant: ThemeToggleVariant.Menu, value: ThemePreference.Light });

    await userEvent.hover(screen.getByRole('button', { name: 'Dark' }));

    expect(within(await screen.findByRole('tooltip')).getByText('Dark')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Dark' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('shows the tooltip on keyboard focus in the menu variant only', async () => {
    const { unmount } = renderToggle({ variant: ThemeToggleVariant.Menu });
    await userEvent.tab();
    expect(within(await screen.findByRole('tooltip')).getByText('System')).toBeInTheDocument();
    unmount();

    renderToggle({ variant: ThemeToggleVariant.Settings });
    await userEvent.tab();
    expect(screen.getByRole('button', { name: 'System' })).toHaveFocus();
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('renders text without icons or aria-label in the settings variant', () => {
    renderToggle({ variant: ThemeToggleVariant.Settings });

    expect(document.querySelectorAll('svg')).toHaveLength(0);
    expect(screen.getByRole('button', { name: 'Light' })).not.toHaveAttribute('aria-label');
  });

  it('ignores presses when disabled', async () => {
    const { onChange } = renderToggle({ disabled: true });

    await userEvent.click(screen.getByRole('button', { name: 'Light' }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Light' })).toBeDisabled();
  });
});
