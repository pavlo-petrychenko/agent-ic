import { NodeType } from '@agent-ic/flow';
import { act, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  DEMO_AGENT_ID,
  TRIGGER_ONLY_FLOW,
  buildFlowBuilderDraftFailureMock,
  buildFlowBuilderDraftMock,
} from '@/features/flow-builder/communication/fixtures/flowBuilderDraft.fixture';
import { EMPTY_FLOW } from '@/features/flow-builder/constants/flowBuilder.constants';
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
const edges = () => useFlowBuilderStore.getState().document.edges;

const openBuilder = async (flow: unknown = TRIGGER_ONLY_FLOW) => {
  renderRoute(builderPath, { mocks: [shell, buildFlowBuilderDraftMock(flow)] });
  return screen.findByRole('region', { name: 'Flow canvas' });
};

describe('flow builder canvas', () => {
  beforeEach(() => signInForTest());

  afterEach(async () => {
    setWorkspaceId(null);
    await signOutForTest();
  });

  it('opens the draft under the agent breadcrumb and connects two steps by keyboard', async () => {
    const canvas = await openBuilder(
      addNode(TRIGGER_ONLY_FLOW, NodeType.SendMessage, { x: 0, y: 200 }, 'reply'),
    );

    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toHaveTextContent(
      'Salon assistant',
    );
    screen.getByLabelText('Connect from Customer message · next').focus();
    await userEvent.keyboard('{Enter}{Enter}');

    expect(within(canvas).getByLabelText('send_message')).toBeInTheDocument();
    expect(edges()).toMatchObject([{ source: 'trigger', sourcePort: 'next', target: 'reply' }]);
  });

  it('deletes the selected step and brings it back with undo', async () => {
    const canvas = await openBuilder();
    act(() => useFlowBuilderStore.getState().select({ nodeIds: ['trigger'], edgeIds: [] }));

    canvas.focus();
    await userEvent.keyboard('{Delete}');
    expect(within(canvas).queryByLabelText('Customer message')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(within(canvas).getByLabelText('Customer message')).toBeInTheDocument();
  });

  it('offers a trigger on an empty flow', async () => {
    const canvas = await openBuilder(EMPTY_FLOW);

    await userEvent.click(within(canvas).getByRole('button', { name: 'Add a trigger' }));

    expect(within(canvas).getByLabelText('trigger_message')).toBeInTheDocument();
  });

  it('explains a draft that cannot be loaded and offers a retry', async () => {
    renderRoute(builderPath, { mocks: [shell, buildFlowBuilderDraftFailureMock()] });

    expect(await screen.findByRole('alert')).toHaveTextContent('The flow couldn’t be opened.');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
