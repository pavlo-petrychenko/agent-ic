import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NodeKind } from '@/shared/ui/display/NodeTile/NodeTile.constants';
import { RunNode } from '@/shared/ui/flow/RunNode/RunNode';
import { RunNodeState } from '@/shared/ui/flow/RunNode/RunNode.constants';
import { cssClass } from '@test/support/helpers/cssModuleClass.helpers';
import styles from '@/shared/ui/flow/RunNode/RunNode.module.scss';

const renderNode = (state: RunNodeState, stateLabel: string) =>
  render(
    <ul>
      <RunNode name="Receptionist" kind={NodeKind.Agent} state={state} stateLabel={stateLabel} />
    </ul>,
  );

describe('RunNode', () => {
  it('is a list item that reads the name and the state', () => {
    renderNode(RunNodeState.Done, 'done');

    expect(screen.getByRole('listitem')).toHaveTextContent('Receptionistdone');
  });

  it('is busy and shows the spinner while running', () => {
    const { container } = renderNode(RunNodeState.Running, 'running');

    expect(screen.getByRole('listitem')).toHaveAttribute('aria-busy', 'true');
    expect(container.querySelector('[data-icon="spinner"]')).toBeInTheDocument();
    expect(screen.getByText('running')).toHaveClass(cssClass(styles.statusLabel));
  });

  it('shows a check when done', () => {
    const { container } = renderNode(RunNodeState.Done, 'done');

    expect(container.querySelector('[data-icon="check"]')).toBeInTheDocument();
    expect(screen.getByRole('listitem')).not.toHaveAttribute('aria-busy');
  });

  it('shows an alert when failed', () => {
    const { container } = renderNode(RunNodeState.Failed, 'failed');

    expect(container.querySelector('[data-icon="alert"]')).toBeInTheDocument();
  });

  it.each(Object.values(RunNodeState))('draws the %s state', (state) => {
    renderNode(state, state);

    expect(screen.getByRole('listitem')).toHaveClass(cssClass(styles[state]));
  });
});
