import { NodeType } from '@agent-ic/flow';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DEMO_AGENT_ID,
  TRIGGER_ONLY_FLOW,
  buildFlowBuilderDraftMock,
} from '@/features/flow-builder/communication/fixtures/flowBuilderDraft.fixture';
import { Density } from '@/features/flow-builder/constants/density.constants';
import { addNode } from '@/features/flow-builder/logic/helpers/graphEdit.helpers';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';
import {
  buildWorkspaceShellMock,
  DEMO_WORKSPACE,
} from '@/features/workspace/communication/fixtures/workspaceShell.fixture';
import { setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { renderRoute } from '@test/support/helpers/router.helpers';
import { signInForTest, signOutForTest } from '@test/support/helpers/session.helpers';

const builderPath = `/w/${DEMO_WORKSPACE.id}/agents/${DEMO_AGENT_ID}`;
const shell = buildWorkspaceShellMock([DEMO_WORKSPACE]);
const store = () => useFlowBuilderStore.getState();
const NO_REPLY = 'Add at least one step that sends a message';

describe('flow builder issues', () => {
  beforeEach(() => signInForTest());

  afterEach(async () => {
    store().setDensity(Density.Comfortable);
    setWorkspaceId(null);
    await signOutForTest();
  });

  it('says why the flow is not ready and jumps to the step from the list', async () => {
    renderRoute(builderPath, { mocks: [shell, buildFlowBuilderDraftMock(TRIGGER_ONLY_FLOW)] });

    expect(await screen.findByText('Not ready to publish')).toBeInTheDocument();
    const canvas = screen.getByRole('region', { name: 'Flow canvas' });
    expect(within(canvas).getByTitle(NO_REPLY)).toBeInTheDocument();
    expect(screen.getAllByText(NO_REPLY)).toHaveLength(2);

    await userEvent.click(screen.getByRole('button', { name: 'Show 2 issues' }));
    const list = screen.getByRole('list', { name: 'Issues in this flow' });
    await userEvent.click(within(list).getByRole('button', { name: /Add at least one step/ }));

    expect(store().selection.nodeIds).toEqual(['trigger']);
  });

  it('marks a step with a blocking issue on the canvas', async () => {
    const flow = addNode(TRIGGER_ONLY_FLOW, NodeType.Agent, { x: 0, y: 200 }, 'agent');
    renderRoute(builderPath, { mocks: [shell, buildFlowBuilderDraftMock(flow)] });

    const canvas = await screen.findByRole('region', { name: 'Flow canvas' });

    expect(within(canvas).getByTitle('No trigger leads to this step')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: 'Compact' }));

    expect(within(canvas).getByTitle('No trigger leads to this step')).toBeInTheDocument();
  });
});
