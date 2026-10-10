import { NodeType } from '@agent-ic/flow';
import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DEMO_AGENT_ID,
  TRIGGER_ONLY_FLOW,
  buildFlowBuilderDraftFailureMock,
  buildFlowBuilderDraftMock,
  buildRenameAgentMock,
} from '@/features/flow-builder/communication/fixtures/flowBuilderDraft.fixture';
import { Density } from '@/features/flow-builder/constants/density.constants';
import { EMPTY_FLOW } from '@/features/flow-builder/constants/flowBuilder.constants';
import { addNode } from '@/features/flow-builder/logic/helpers/graphEdit.helpers';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';
import {
  buildWorkspaceShellMock,
  DEMO_WORKSPACE,
} from '@/features/workspace/communication/fixtures/workspaceShell.fixture';
import { setWorkspaceId } from '@/shared/api/helpers/requestContext.helpers';
import { measureFlowNodes } from '@test/support/helpers/flowMeasure.helpers';
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
    useFlowBuilderStore.getState().setDensity(Density.Comfortable);
    setWorkspaceId(null);
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
    await signOutForTest();
  });

  it('opens the draft under the agent name and connects two steps by keyboard', async () => {
    const canvas = await openBuilder(
      addNode(TRIGGER_ONLY_FLOW, NodeType.SendMessage, { x: 0, y: 200 }, 'reply'),
    );

    expect(screen.getByRole('button', { name: 'Salon assistant' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByText('Draft · edited from v3')).toBeInTheDocument();
    screen.getByLabelText('Connect from Customer message · next').focus();
    await userEvent.keyboard('{Enter}{Enter}');

    expect(within(canvas).getByLabelText('send_message')).toBeInTheDocument();
    expect(edges()).toMatchObject([{ source: 'trigger', sourcePort: 'next', target: 'reply' }]);
  });

  it('asks a new agent for its first step and adds it after the trigger', async () => {
    measureFlowNodes({ width: 248, height: 72 });
    const canvas = await openBuilder();
    const hint = { name: 'Start with a trigger and a few steps' };
    expect(await within(canvas).findByRole('heading', hint)).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: /Add a step/ }));
    await userEvent.click(await screen.findByRole('option', { name: 'Agent' }));

    expect(within(canvas).getByLabelText('Agent')).toBeInTheDocument();
    expect(edges()).toMatchObject([{ source: 'trigger', sourcePort: 'next' }]);
    expect(screen.queryByRole('heading', hint)).toBeNull();
  });

  it('adds a step from the palette and filters the palette by search', async () => {
    const canvas = await openBuilder();

    await userEvent.click(screen.getByRole('button', { name: 'Send message' }));
    expect(within(canvas).getByLabelText('Send message')).toBeInTheDocument();

    await userEvent.type(
      screen.getByRole('searchbox', { name: 'Search steps and triggers' }),
      'api',
    );
    expect(screen.getByRole('button', { name: 'API request' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Agent' })).toBeNull();
  });

  it('renames the agent in the header and keeps the unsaved edits', async () => {
    renderRoute(builderPath, {
      mocks: [
        shell,
        buildFlowBuilderDraftMock(TRIGGER_ONLY_FLOW),
        buildRenameAgentMock('Front desk'),
      ],
    });
    const canvas = await screen.findByRole('region', { name: 'Flow canvas' });
    await userEvent.click(screen.getByRole('button', { name: 'Send message' }));

    await userEvent.click(screen.getByRole('button', { name: 'Salon assistant' }));
    const name = screen.getByRole('textbox', { name: 'Agent name' });
    await userEvent.clear(name);
    await userEvent.type(name, 'Front desk{Enter}');

    expect(await screen.findByText('Agent renamed')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Front desk' })).toBeInTheDocument();
    expect(within(canvas).getByLabelText('Send message')).toBeInTheDocument();
    expect(useFlowBuilderStore.getState().history.past).toHaveLength(1);
  });

  it('deletes and duplicates a step from its right-click menu', async () => {
    const canvas = await openBuilder();
    const step = () => within(canvas).getByLabelText('Customer message');

    fireEvent.contextMenu(step());
    await userEvent.click(screen.getByRole('option', { name: 'Delete' }));
    expect(within(canvas).queryByLabelText('Customer message')).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Undo' }));

    fireEvent.contextMenu(step());
    await userEvent.click(screen.getByRole('option', { name: 'Duplicate' }));
    expect(within(canvas).getAllByLabelText('Customer message')).toHaveLength(2);
    expect(screen.queryByRole('listbox', { name: 'Step actions' })).toBeNull();
  });

  it('switches density and lists the keyboard shortcuts', async () => {
    await openBuilder();
    expect(screen.getByText('All channels')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('radio', { name: 'Compact' }));
    expect(screen.queryByText('All channels')).toBeNull();

    await userEvent.click(screen.getByRole('button', { name: 'Keyboard shortcuts' }));
    expect(screen.getByText('⌘ D')).toBeInTheDocument();
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

  it('keeps the keyboard on the canvas after deleting the focused step', async () => {
    const canvas = await openBuilder();
    act(() => useFlowBuilderStore.getState().select({ nodeIds: ['trigger'], edgeIds: [] }));

    within(canvas).getByLabelText('Customer message').focus();
    await userEvent.keyboard('{Delete}');
    expect(canvas).toHaveFocus();

    await userEvent.keyboard('{Control>}z{/Control}');
    expect(within(canvas).getByLabelText('Customer message')).toBeInTheDocument();
  });

  it('offers a trigger on an empty flow', async () => {
    const canvas = await openBuilder(EMPTY_FLOW);

    await userEvent.click(within(canvas).getByRole('button', { name: 'Add a trigger' }));

    expect(within(canvas).getByLabelText('Incoming message')).toBeInTheDocument();
  });

  it('shows the collapsed rail instead of the workspace sidebar', async () => {
    await openBuilder();
    const rail = screen.getByRole('navigation', { name: 'Main' });

    expect(within(rail).getByRole('link', { name: 'Agents' })).toHaveAttribute(
      'href',
      `/w/${DEMO_WORKSPACE.id}/agents`,
    );
    expect(within(rail).getByRole('button', { name: DEMO_WORKSPACE.name })).toBeInTheDocument();
    expect(within(rail).queryByText('Build')).toBeNull();
  });

  it('explains a draft that cannot be loaded and offers a retry', async () => {
    renderRoute(builderPath, { mocks: [shell, buildFlowBuilderDraftFailureMock()] });

    expect(await screen.findByRole('alert')).toHaveTextContent('The flow couldn’t be opened.');
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
  });
});
