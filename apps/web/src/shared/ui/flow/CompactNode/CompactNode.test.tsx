import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { CompactNode } from '@/shared/ui/flow/CompactNode/CompactNode';
import { CompactNodeShape } from '@/shared/ui/flow/CompactNode/CompactNode.constants';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/flow/CompactNode/CompactNode.module.scss';

describe('CompactNode', () => {
  it('is a focusable group named after its label', async () => {
    render(<CompactNode label="Parallel" kind={NodeKind.Par} />);

    await userEvent.tab();

    expect(screen.getByRole('group', { name: 'Parallel' })).toHaveFocus();
  });

  it('draws the kind tile', () => {
    const { container } = render(<CompactNode label="Parallel" kind={NodeKind.Par} />);

    expect(container.querySelector('[data-icon="par"]')).toBeInTheDocument();
  });

  it.each(Object.values(CompactNodeShape))('draws the %s shape', (shape) => {
    render(<CompactNode label="Step" kind={NodeKind.Router} shape={shape} />);

    expect(screen.getByRole('group')).toHaveClass(cssClass(styles[shape]));
  });

  it('marks the selected node as current', () => {
    render(<CompactNode label="Parallel" kind={NodeKind.Par} selected />);

    const node = screen.getByRole('group');
    expect(node).toHaveAttribute('aria-current', 'true');
    expect(node).toHaveClass(cssClass(styles.selected));
  });

  it('fades and disables', async () => {
    render(<CompactNode label="Parallel" kind={NodeKind.Par} faded disabled />);

    await userEvent.tab();

    const node = screen.getByRole('group');
    expect(node).toHaveClass(cssClass(styles.faded), cssClass(styles.disabled));
    expect(node).not.toHaveFocus();
  });
});
