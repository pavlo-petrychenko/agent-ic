import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { Density } from '@/features/flow-builder/constants/density.constants';
import { CanvasToolbar } from '@/features/flow-builder/view/CanvasToolbar/CanvasToolbar';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const renderToolbar = (compact: boolean) => {
  const onGuides = vi.fn<() => void>();
  renderWithProviders(
    <CanvasToolbar
      density={Density.Comfortable}
      onDensityChange={vi.fn<(density: Density) => void>()}
      settingsOpen={false}
      onSettingsOpen={vi.fn<() => void>()}
      onGuides={onGuides}
      compact={compact}
    />,
  );
  return onGuides;
};

describe('CanvasToolbar', () => {
  it('opens the guides from a button with an icon and a label', async () => {
    const onGuides = renderToolbar(false);

    const button = screen.getByRole('button', { name: 'Guides' });
    await userEvent.click(button);

    expect(button).toHaveTextContent('Guides');
    expect(onGuides).toHaveBeenCalledOnce();
  });

  it('shows only the icon, still named, in a compact layout', async () => {
    const onGuides = renderToolbar(true);

    const button = screen.getByRole('button', { name: 'Guides' });
    await userEvent.click(button);

    expect(button.textContent).toBe('');
    expect(onGuides).toHaveBeenCalledOnce();
  });
});
