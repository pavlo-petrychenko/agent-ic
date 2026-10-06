import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NodeTile } from '@/shared/ui/display/NodeTile/NodeTile';
import {
  NODE_KIND_DEFAULT_ICONS,
  NodeKind,
  TILE_ICON_SIZES,
  TileSize,
} from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

describe('NodeTile', () => {
  it('shows the default icon of its kind', () => {
    const { container } = render(<NodeTile kind={NodeKind.Gen} />);

    expect(container.querySelector('[data-icon="sparkle"]')).toBeInTheDocument();
  });

  it('prefers an explicit icon', () => {
    const { container } = render(<NodeTile kind={NodeKind.Tool} icon={IconName.Key} />);

    expect(container.querySelector('[data-icon="key"]')).toBeInTheDocument();
    expect(container.querySelector('[data-icon="tool"]')).toBeNull();
  });

  it('sizes the icon by the tile size', () => {
    const { container } = render(<NodeTile size={TileSize.Lg} />);

    expect(container.querySelector('svg')).toHaveAttribute('width', String(TILE_ICON_SIZES.lg));
  });

  it('is decorative by default and hides its icon', () => {
    const { container } = render(<NodeTile kind={NodeKind.Agent} />);

    expect(screen.queryByRole('img')).toBeNull();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });

  it('is an image named by aria-label when used alone', () => {
    render(<NodeTile kind={NodeKind.Agent} aria-label="Agent" />);

    expect(screen.getByRole('img', { name: 'Agent' })).toBeInTheDocument();
  });

  it('renders the label beside the tile', () => {
    render(<NodeTile kind={NodeKind.Agent} label="Support agent" />);

    expect(screen.getByText('Support agent')).toBeInTheDocument();
    expect(screen.queryByRole('img')).toBeNull();
  });

  it('has a default icon for every kind', () => {
    for (const kind of Object.values(NodeKind)) {
      expect(NODE_KIND_DEFAULT_ICONS[kind]).toBeDefined();
    }
  });
});
