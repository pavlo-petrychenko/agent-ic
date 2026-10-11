import { ReasoningLevel } from '@agent-ic/contracts';
import {
  ChannelSelectionMode,
  CompletionRole,
  ConditionOperator,
  FLOW_SCHEMA_VERSION,
  NodeType,
  PortName,
  PromptSourceKind,
  RuleMatch,
  OutputFieldType,
  WaitFor,
  validateFlow,
} from '@agent-ic/flow';
import type { FlowDocument, FlowNode } from '@agent-ic/flow';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  FLASH_MODEL,
  LUNA_MODEL,
  modelOptionsMock,
} from '@/features/flow-builder/communication/fixtures/modelOptions.fixture';
import { NODE_TEMPLATES } from '@/features/flow-builder/constants/nodeTemplate.constants';
import { SaveState } from '@/features/flow-builder/constants/saveState.constants';
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

const AI_FLOW: FlowDocument = {
  ...FLOW,
  nodes: [
    ...FLOW.nodes,
    step('guard', 'Guard', NODE_TEMPLATES[NodeType.Completion]),
    step('agent', 'Receptionist', NODE_TEMPLATES[NodeType.Agent]),
    step('tagger', 'Tagger', NODE_TEMPLATES[NodeType.Completion]),
  ],
  edges: [
    { id: 'e1', source: 'trigger', sourcePort: PortName.Next, target: 'guard' },
    { id: 'e2', source: 'guard', sourcePort: PortName.Next, target: 'agent' },
    { id: 'e3', source: 'agent', sourcePort: PortName.Next, target: 'route' },
    { id: 'e4', source: 'route', sourcePort: 'refund', target: 'tagger' },
  ],
};

const store = useFlowBuilderStore.getState;
const open = (nodeId: string, document: FlowDocument = FLOW) => {
  store().load({ document, revision: 1, issues: validateFlow(document) });
  store().select({ nodeIds: [nodeId], edgeIds: [] });
  return renderWithProviders(<InspectorPanel />, { mocks: [modelOptionsMock()] });
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

  it('keeps the key prompt with its step when the selection is cleared', async () => {
    const user = userEvent.setup();
    open('route');

    await user.click(screen.getByRole('button', { name: 'Needs a person?' }));
    await user.clear(screen.getByRole('textbox', { name: 'Step name' }));
    await user.type(screen.getByRole('textbox', { name: 'Step name' }), 'Refund check{Enter}');
    act(() => store().select({ nodeIds: [], edgeIds: [] }));

    expect(screen.getByRole('dialog', { name: 'Rename the key too?' })).toBeVisible();
    await user.keyboard('{Escape}');
    act(() => store().select({ nodeIds: ['trigger'], edgeIds: [] }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(node('route')).toMatchObject({ label: 'Refund check', key: 'route' });
  });

  it('closes by clearing the selection', async () => {
    const user = userEvent.setup();
    open('trigger');

    await user.click(screen.getByRole('button', { name: 'Close inspector' }));

    expect(store().selection.nodeIds).toEqual([]);
    expect(screen.queryByRole('complementary')).not.toBeInTheDocument();
  });

  it('edits a router rule in the document', async () => {
    const user = userEvent.setup();
    open('route');

    const route = screen.getByRole('region', { name: 'Route 1' });
    expect(within(route).getByText('→ Reply')).toBeVisible();
    await user.selectOptions(
      within(route).getByRole('combobox', { name: 'Operator' }),
      'starts_with',
    );
    await user.clear(within(route).getByRole('textbox', { name: 'Value' }));
    await user.type(within(route).getByRole('textbox', { name: 'Value' }), 'hi{Enter}');
    await user.click(screen.getByRole('button', { name: 'Add route' }));

    expect(node('route')).toMatchObject({
      config: {
        rules: [
          { conditions: [{ operator: ConditionOperator.StartsWith, value: 'hi' }] },
          { conditions: [{ variable: 'message.text' }] },
        ],
      },
    });
  });

  it('commits typed list and number values and shows the invalid value', async () => {
    const user = userEvent.setup();
    const output = { description: '', required: true };
    const guard = step('guard', 'Guard', {
      ...NODE_TEMPLATES[NodeType.Completion],
      config: {
        ...NODE_TEMPLATES[NodeType.Completion].config,
        output: [
          { ...output, name: 'priority', type: OutputFieldType.Enum, values: ['low', 'high'] },
          { ...output, name: 'score', type: OutputFieldType.Number },
        ],
      },
    });
    const conditions = [
      { variable: 'guard.priority', operator: ConditionOperator.In, value: ['low'] },
      { variable: 'guard.score', operator: ConditionOperator.Gt, value: 1 },
      { variable: 'guard.score', operator: ConditionOperator.IsEmpty, value: '' },
    ];
    open('route', {
      ...FLOW,
      nodes: [
        ...FLOW.nodes.map((candidate) =>
          candidate.id === 'route'
            ? step('route', '', {
                type: NodeType.Router,
                config: { rules: [{ ...RULE, conditions }] },
              })
            : candidate,
        ),
        guard,
      ],
      edges: [
        { id: 'e0', source: 'trigger', sourcePort: PortName.Next, target: 'guard' },
        { id: 'e1', source: 'guard', sourcePort: PortName.Next, target: 'route' },
      ],
    });

    const list = screen.getByRole('textbox', { name: 'Value' });
    const number = screen.getByRole('spinbutton', { name: 'Value' });
    await user.clear(list);
    await user.type(list, 'low, high');
    await user.tab();
    await user.clear(number);
    await user.tab();
    act(() => store().setSaveState(SaveState.Pending));

    expect(node('route')).toMatchObject({
      config: { rules: [{ conditions: [{ value: ['low', 'high'] }, { value: '' }, {}] }] },
    });
    expect(screen.getByText(/The value doesn’t fit .* on a number field/)).toBeVisible();
    expect(number).toHaveAttribute('aria-invalid', 'true');
    const operator = screen.getAllByRole('combobox', { name: 'Operator' })[2];
    expect(operator).toHaveValue(ConditionOperator.IsEmpty);
    expect(operator).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByText(/doesn’t work on a number field/)).toBeVisible();
  });

  it('shows the field error for a field the router can not use', () => {
    open('route', {
      ...FLOW,
      nodes: FLOW.nodes.map((candidate) =>
        candidate.type === NodeType.Router
          ? step('route', 'Needs a person?', {
              type: NodeType.Router,
              config: {
                rules: [{ ...RULE, conditions: [{ ...CONDITION, variable: 'reply.gone' }] }],
              },
            })
          : candidate,
      ),
    });

    expect(screen.getByText('reply.gone isn’t available here')).toBeVisible();
    expect(screen.getByRole('combobox', { name: 'Field' })).toHaveAttribute('aria-invalid', 'true');
  });

  it('removes a route with its connection', async () => {
    const user = userEvent.setup();
    open('route');

    await user.click(screen.getByRole('button', { name: 'Remove Route 1' }));

    expect(node('route')).toMatchObject({ config: { rules: [] } });
    expect(store().document.edges.map((edge) => edge.id)).toEqual(['e1']);
  });

  it('changes when a parallel step continues', async () => {
    const user = userEvent.setup();
    const document: FlowDocument = {
      ...FLOW,
      nodes: [
        ...FLOW.nodes,
        step('split', '', { type: NodeType.Parallel, config: { waitFor: WaitFor.Guards } }),
        step('tagger', 'Topic tagger', {
          ...NODE_TEMPLATES[NodeType.Completion],
          config: { ...NODE_TEMPLATES[NodeType.Completion].config, role: CompletionRole.Observer },
        }),
      ],
      edges: [{ id: 'b1', source: 'split', sourcePort: PortName.Branches, target: 'tagger' }],
    };
    open('split', document);

    const inspector = screen.getByRole('complementary', { name: 'split' });
    expect(within(inspector).getByText('Parallel / join')).toBeVisible();
    expect(screen.getByText('observer')).toBeVisible();
    expect(screen.getByText('Observer branches can’t stop the flow.')).toBeVisible();
    await user.click(screen.getByRole('radio', { name: 'All branches finish' }));

    expect(node('split')).toMatchObject({ config: { waitFor: WaitFor.All } });
  });

  it('offers only the fields visible to the step in the prompt autocomplete', async () => {
    const user = userEvent.setup();
    open('agent', AI_FLOW);

    await user.type(screen.getByRole('textbox', { name: 'Prompt' }), '{{{{');
    const options = within(await screen.findByRole('listbox', { name: 'Fields' }))
      .getAllByRole('option')
      .map((option) => option.textContent);

    expect(options).toContain('message.textTrigger');
    expect(options).toContain('guard.resultGuard');
    expect(options.some((option) => option?.startsWith('tagger.'))).toBe(false);
    expect(options.some((option) => option?.startsWith('agent.'))).toBe(false);
  });

  it('shows a variable the prompt can not use under the prompt', () => {
    open('agent', {
      ...AI_FLOW,
      nodes: AI_FLOW.nodes.map((candidate) =>
        candidate.type === NodeType.Agent
          ? {
              ...candidate,
              config: {
                ...candidate.config,
                prompt: { kind: PromptSourceKind.Inline, text: 'Hi {{missing.field}}' },
              },
            }
          : candidate,
      ),
    });

    expect(screen.getByText('missing.field isn’t available here')).toBeVisible();
  });

  it('adds an output field that later steps can use', async () => {
    const user = userEvent.setup();
    open('agent', AI_FLOW);

    expect(screen.getByRole('list', { name: 'Built-in output' })).toHaveTextContent('messages');
    await user.click(screen.getByRole('button', { name: 'Add field' }));
    const name = screen.getByRole('textbox', { name: 'Field name' });
    await user.clear(name);
    await user.type(name, 'Topic');
    expect(screen.getByText(/Use lowercase letters/)).toBeVisible();
    await user.clear(name);
    await user.type(name, 'topic{Enter}');
    act(() => store().select({ nodeIds: ['route'], edgeIds: [] }));

    expect(
      within(screen.getByRole('list', { name: 'Fields you can use' })).getByText('agent.topic'),
    ).toBeVisible();
  });

  it('picks a model, then a reasoning level that model offers', async () => {
    const user = userEvent.setup();
    open('agent', AI_FLOW);

    const model = screen.getByRole('combobox', { name: 'Model' });
    expect(model).toHaveAccessibleDescription('Pick a model');
    await waitFor(() => expect(within(model).getAllByRole('option')).toHaveLength(3));
    expect(
      within(model).getByRole('option', {
        name: 'GPT-6 Luna · OpenAI · $0.20 / $1.60 per 1M tokens',
      }),
    ).toBeInTheDocument();
    await user.selectOptions(model, LUNA_MODEL.id);
    const reasoning = screen.getByRole('combobox', { name: 'Reasoning' });
    expect(
      within(reasoning)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Default (Low)', 'Low', 'High']);
    await user.selectOptions(reasoning, ReasoningLevel.High);
    await user.selectOptions(model, FLASH_MODEL.id);

    expect(node('agent')).toMatchObject({
      config: { model: { model: FLASH_MODEL.id }, reasoning: null },
    });
    expect(screen.queryByRole('combobox', { name: 'Reasoning' })).not.toBeInTheDocument();
  });
});
