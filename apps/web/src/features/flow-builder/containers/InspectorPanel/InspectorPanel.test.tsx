import {
  ChannelSelectionMode,
  ConditionOperator,
  FLOW_SCHEMA_VERSION,
  NodeType,
  PortName,
  RuleMatch,
  validateFlow,
} from '@agent-ic/flow';
import type { FlowDocument, FlowNode } from '@agent-ic/flow';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { NODE_TEMPLATES } from '@/features/flow-builder/constants/nodeTemplate.constants';
import { InspectorPanel } from '@/features/flow-builder/containers/InspectorPanel/InspectorPanel';
import { useFlowBuilderStore } from '@/features/flow-builder/storage/hooks/useFlowBuilderStore';
import { renderWithProviders } from '@test/support/helpers/render.helpers';

const ORIGIN = { x: 0, y: 0 };
const step = (
  id: string,
  label: string,
  node: Omit<FlowNode, 'id' | 'key' | 'label' | 'position'>,
) => ({ id, key: id, label, position: ORIGIN, ...node }) as FlowNode;

const CONDITION = { variable: 'message.text', operator: ConditionOperator.Contains, value: 'x' };
const RULE = { id: 'refund', label: '', match: RuleMatch.All, conditions: [CONDITION] };

const FLOW: FlowDocument = {
  schemaVersion: FLOW_SCHEMA_VERSION,
  nodes: [
    step('trigger', 'Incoming message', {
      type: NodeType.TriggerMessage,
      config: { channels: { mode: ChannelSelectionMode.All } },
    }),
    step('route', 'Needs a person?', {
      type: NodeType.Router,
      config: { rules: [RULE] },
    }),
    step('reply', 'Reply', NODE_TEMPLATES[NodeType.SendMessage]),
  ],
  edges: [
    { id: 'e1', source: 'trigger', sourcePort: PortName.Next, target: 'route' },
    { id: 'e2', source: 'route', sourcePort: 'refund', target: 'reply' },
  ],
};

const store = useFlowBuilderStore.getState;
const open = (nodeId: string, document: FlowDocument = FLOW) => {
  store().load({ document, revision: 1, issues: validateFlow(document) });
  store().select({ nodeIds: [nodeId], edgeIds: [] });
  return renderWithProviders(<InspectorPanel />);
};
const node = (id: string) => store().document.nodes.find((candidate) => candidate.id === id);

describe('InspectorPanel', () => {
  beforeEach(() => {
    store().select({ nodeIds: [], edgeIds: [] });
  });

  it('shows the message trigger with its fields and the no-channels state', () => {
    open('trigger');

    const inspector = screen.getByRole('complementary', { name: 'Incoming message' });
    expect(within(inspector).getByText('Starts a run for every customer message')).toBeVisible();
    expect(within(inspector).getByText(/No channels connected yet/)).toBeVisible();
    expect(within(inspector).getByText('runs the flow')).toBeVisible();
    expect(
      within(screen.getByRole('list', { name: 'Available in the flow' })).getByText('message.text'),
    ).toBeVisible();
  });

  it('renames the step and its key after the confirmation', async () => {
    const user = userEvent.setup();
    open('route');

    await user.click(screen.getByRole('button', { name: 'Needs a person?' }));
    await user.clear(screen.getByRole('textbox', { name: 'Step name' }));
    await user.type(screen.getByRole('textbox', { name: 'Step name' }), 'Refund check{Enter}');
    await user.click(await screen.findByRole('button', { name: 'Rename key' }));

    expect(node('route')).toMatchObject({ label: 'Refund check', key: 'refund_check' });
  });

  it('closes by clearing the selection', async () => {
    const user = userEvent.setup();
    open('trigger');

    await user.click(screen.getByRole('button', { name: 'Close inspector' }));

    expect(store().selection.nodeIds).toEqual([]);
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });
});
