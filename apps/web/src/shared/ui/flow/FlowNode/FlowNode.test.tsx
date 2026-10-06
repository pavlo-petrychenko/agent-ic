import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { CalloutTone } from '@/shared/ui/display/Callout/Callout.constants';
import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { FlowNode } from '@/shared/ui/flow/FlowNode/FlowNode';
import { FlowNodeSize } from '@/shared/ui/flow/FlowNode/FlowNode.constants';
import type { FlowNodeProps } from '@/shared/ui/flow/FlowNode/FlowNode.typedefs';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/flow/FlowNode/FlowNode.module.scss';

const NAME = 'Receptionist';

const renderNode = (props: Partial<FlowNodeProps> = {}) =>
  render(<FlowNode kind={NodeKind.Agent} overline="Agent" name={NAME} {...props} />);

describe('FlowNode', () => {
  it('is a focusable group named after the node', async () => {
    renderNode();

    await userEvent.tab();

    expect(screen.getByRole('group', { name: NAME })).toHaveFocus();
  });

  it('shows the meta line, chips and output', () => {
    renderNode({
      meta: 'Fast model',
      chips: [{ id: 'kb', label: 'Opening hours' }],
      output: 'reply',
    });

    expect(screen.getByText('Fast model')).toBeInTheDocument();
    expect(screen.getByText('Opening hours')).toBeInTheDocument();
    expect(screen.getByText('reply')).toBeInTheDocument();
  });

  it('shows a callout with its tone role', () => {
    renderNode({ callout: { tone: CalloutTone.Err, text: 'Model unavailable' } });

    expect(screen.getByRole('alert')).toHaveTextContent('Model unavailable');
  });

  it('keeps only the header in the condition size', () => {
    renderNode({ size: FlowNodeSize.Condition, meta: 'Fast model', output: 'reply' });

    expect(screen.queryByText('Fast model')).toBeNull();
    expect(screen.queryByText('reply')).toBeNull();
    expect(screen.getByRole('group')).toHaveClass(cssClass(styles.condition));
  });

  it('marks the selected node as current', () => {
    renderNode({ selected: true });

    const node = screen.getByRole('group', { name: NAME });
    expect(node).toHaveAttribute('aria-current', 'true');
    expect(node).toHaveClass(cssClass(styles.selected));
  });

  it('fades a node that cannot accept the edge being drawn', () => {
    renderNode({ faded: true });

    expect(screen.getByRole('group')).toHaveClass(cssClass(styles.faded));
  });

  it('takes a disabled node out of the tab order', async () => {
    renderNode({ disabled: true });

    await userEvent.tab();

    const node = screen.getByRole('group');
    expect(node).not.toHaveFocus();
    expect(node).toHaveAttribute('aria-disabled', 'true');
  });

  it('marks an invalid node and names the problem', () => {
    renderNode({ invalidLabel: 'No prompt' });

    expect(screen.getByRole('group')).toHaveClass(cssClass(styles.invalid));
    expect(screen.getByRole('img', { name: 'No prompt' })).toBeInTheDocument();
  });

  it('renders the port slots', () => {
    renderNode({
      inPort: <span data-testid="in" />,
      outPorts: <span data-testid="out" />,
    });

    expect(screen.getByTestId('in')).toBeInTheDocument();
    expect(screen.getByTestId('out')).toBeInTheDocument();
  });

  it('passes pointer and keyboard handlers through', async () => {
    const onClick = vi.fn<() => void>();
    const onKeyDown = vi.fn<() => void>();
    renderNode({ onClick, onKeyDown });

    await userEvent.click(screen.getByRole('group'));
    await userEvent.keyboard('{Enter}');

    expect(onClick).toHaveBeenCalledOnce();
    expect(onKeyDown).toHaveBeenCalled();
  });
});
