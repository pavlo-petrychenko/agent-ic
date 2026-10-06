import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Icon } from '@/shared/ui/foundations/Icon/Icon';
import { ICON_SHAPES, IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

const DESIGNED_ICON_COUNT = 61;

describe('Icon', () => {
  it('is decorative and hidden from assistive technology without a title', () => {
    const { container } = render(<Icon name={IconName.Moon} />);

    const svg = container.querySelector('[data-icon="moon"]');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).not.toHaveAttribute('role');
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('exposes an image named by its title', () => {
    render(<Icon name={IconName.Alert} title="Warning" />);

    const image = screen.getByRole('img', { name: 'Warning' });
    expect(image).toHaveAttribute('data-icon', 'alert');
    expect(image).not.toHaveAttribute('aria-hidden');
  });

  it('applies size and stroke width', () => {
    const { container } = render(<Icon name={IconName.Logo} size={15} strokeWidth={1.8} />);

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '15');
    expect(svg).toHaveAttribute('height', '15');
    expect(svg).toHaveAttribute('stroke-width', '1.8');
    expect(svg).toHaveAttribute('stroke', 'currentColor');
  });

  it('has path data for every designed icon', () => {
    const names = Object.values(IconName);

    expect(names).toHaveLength(DESIGNED_ICON_COUNT);
    for (const name of names) {
      expect(ICON_SHAPES[name].length).toBeGreaterThan(0);
    }
  });
});
