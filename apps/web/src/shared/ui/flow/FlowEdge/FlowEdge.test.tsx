import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { FlowEdge } from '@/shared/ui/flow/FlowEdge/FlowEdge';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/flow/FlowEdge/FlowEdge.module.scss';

const PATH = 'M 0 0 L 0 50 L 100 50 L 100 100';
const MIDPOINT = { x: 50, y: 50 };

const renderInSvg = (edge: ReactNode) => render(<svg>{edge}</svg>);

describe('FlowEdge', () => {
  it('draws the path with an arrowhead at the target', () => {
    const { container } = renderInSvg(<FlowEdge path={PATH} />);

    const line = container.querySelector(`.${cssClass(styles.line)}`);
    expect(line).toHaveAttribute('d', PATH);
    expect(line?.getAttribute('marker-end')).toMatch(/^url\("#.+"\)$/);
    expect(container.querySelector('marker')).toBeInTheDocument();
  });

  it('draws the edge being drawn dashed, without an arrowhead or hit area', () => {
    const { container } = renderInSvg(<FlowEdge path={PATH} drawing />);

    expect(container.querySelector('g')).toHaveClass(cssClass(styles.drawing));
    expect(container.querySelector('marker')).toBeNull();
    expect(container.querySelector(`.${cssClass(styles.hit)}`)).toBeNull();
  });

  it('marks active and insertion-target edges', () => {
    const { container, rerender } = renderInSvg(<FlowEdge path={PATH} active />);
    expect(container.querySelector('g')).toHaveClass(cssClass(styles.active));

    rerender(
      <svg>
        <FlowEdge path={PATH} inserting />
      </svg>,
    );
    expect(container.querySelector('g')).toHaveClass(cssClass(styles.inserting));
  });

  it('shows the delete button at the midpoint only while selected', async () => {
    const onDelete = vi.fn<() => void>();
    const { rerender } = renderInSvg(
      <FlowEdge
        path={PATH}
        midpoint={MIDPOINT}
        onDelete={onDelete}
        deleteLabel="Delete connection"
      />,
    );
    expect(screen.queryByRole('button')).toBeNull();

    rerender(
      <svg>
        <FlowEdge
          path={PATH}
          midpoint={MIDPOINT}
          selected
          onDelete={onDelete}
          deleteLabel="Delete connection"
        />
      </svg>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Delete connection' }));

    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('exposes its id for hit testing', () => {
    const { container } = renderInSvg(<FlowEdge path={PATH} edgeId="e1" />);

    expect(container.querySelector('[data-edge-id="e1"]')).toBeInTheDocument();
  });
});
