import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { FlowThumbnail } from '@/shared/ui/flow/FlowThumbnail/FlowThumbnail';
import {
  FLOW_THUMBNAIL_ELLIPSIS,
  FlowThumbnailSize,
} from '@/shared/ui/flow/FlowThumbnail/FlowThumbnail.constants';
import type {
  FlowThumbnailEdge,
  FlowThumbnailNode,
} from '@/shared/ui/flow/FlowThumbnail/FlowThumbnail.typedefs';
import { IconName } from '@/shared/ui/foundations/Icon/Icon.constants';

const LONG_LABEL = 'A very long step name that cannot fit in a small tile';

const nodes: readonly FlowThumbnailNode[] = [
  { id: 'a', kind: NodeKind.Trig, label: 'Message', x: 0, y: 0 },
  { id: 'b', kind: NodeKind.Agent, label: LONG_LABEL, x: 0, y: 170, highlighted: true },
  { id: 'c', kind: NodeKind.Esc, label: 'Hand off', x: 300, y: 340, icon: IconName.Hand },
];

const edges: readonly FlowThumbnailEdge[] = [
  { id: 'ab', source: 'a', target: 'b' },
  { id: 'bc', source: 'b', target: 'c' },
  { id: 'missing', source: 'b', target: 'gone' },
];

const renderThumbnail = (props: Partial<Parameters<typeof FlowThumbnail>[0]> = {}) =>
  render(<FlowThumbnail nodes={nodes} edges={edges} ariaLabel="Support flow" {...props} />);

describe('FlowThumbnail', () => {
  it('is an image named by its aria label', () => {
    renderThumbnail();

    expect(screen.getByRole('img', { name: 'Support flow' })).toBeInTheDocument();
  });

  it('draws one element per node', () => {
    const { container } = renderThumbnail();

    expect(container.querySelectorAll('[data-node-id]')).toHaveLength(nodes.length);
  });

  it('draws one path per edge whose ends exist', () => {
    const { container } = renderThumbnail();

    expect(container.querySelectorAll('[data-edge-id]')).toHaveLength(2);
  });

  it('marks the highlighted node and no other', () => {
    const { container } = renderThumbnail();

    const marked = container.querySelectorAll('[data-highlighted]');
    expect(marked).toHaveLength(1);
    expect(marked[0]).toHaveAttribute('data-node-id', 'b');
  });

  it('marks no node when none is highlighted', () => {
    const { container } = renderThumbnail({
      nodes: nodes.map((node) => ({ ...node, highlighted: false })),
    });

    expect(container.querySelector('[data-highlighted]')).toBeNull();
  });

  it('cuts a long label with an ellipsis and keeps the full name as the title', () => {
    renderThumbnail();

    expect(screen.getByText(LONG_LABEL, { selector: 'title' })).toBeInTheDocument();
    const text = screen.getByText(new RegExp(`${FLOW_THUMBNAIL_ELLIPSIS}$`));
    expect(text.tagName.toLowerCase()).toBe('text');
    expect(text.textContent?.length).toBeLessThan(LONG_LABEL.length);
  });

  it('keeps a short label whole', () => {
    renderThumbnail();

    expect(screen.getByText('Message', { selector: 'text' })).toBeInTheDocument();
  });

  it('hides the labels in the small size', () => {
    const { container } = renderThumbnail({ size: FlowThumbnailSize.Sm });

    expect(container.querySelector('text')).toBeNull();
    expect(container.querySelectorAll('[data-node-id]')).toHaveLength(nodes.length);
  });

  it('shows the icon of the kind or the explicit one', () => {
    const { container } = renderThumbnail();

    expect(container.querySelector('[data-icon="msg"]')).toBeInTheDocument();
    expect(container.querySelector('[data-icon="hand"]')).toBeInTheDocument();
  });

  it('fits a fixed height', () => {
    renderThumbnail({ height: 120 });

    expect(screen.getByRole('img')).toHaveStyle({ height: '120px' });
  });

  it('renders an empty flow without nodes', () => {
    const { container } = renderThumbnail({ nodes: [], edges: [] });

    expect(container.querySelectorAll('[data-node-id]')).toHaveLength(0);
    expect(screen.getByRole('img', { name: 'Support flow' })).toBeInTheDocument();
  });
});
