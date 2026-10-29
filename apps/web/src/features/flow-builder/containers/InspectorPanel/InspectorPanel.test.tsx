import { ReasoningLevel } from '@agent-ic/contracts';
import {
  AgentExitKind,
  ChannelSelectionMode,
  ChannelType,
  ScheduleKind,
  ConditionOperator,
  EscalationMode,
  FailureMode,
  HttpMethod,
  FLOW_SCHEMA_VERSION,
  NO_FLOW_SETTINGS,
  MAX_LABEL_LENGTH,
  MAX_OUTPUT_FIELDS,
  ModelProviderKind,
  NodeType,
  PortName,
  MessageContentKind,
  NotifyChannel,
  QuickRepliesKind,
  RecipientsKind,
  RequestBodyKind,
  RuleMatch,
  OutputFieldType,
  WaitFor,
  validateFlow,
} from '@agent-ic/flow';
import type { AgentNode, FlowDocument, FlowNode } from '@agent-ic/flow';
import { act, fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEMO_AGENT_ID,
  DEMO_WORKSPACE_ID,
} from '@/features/flow-builder/communication/fixtures/flowBuilderDraft.fixture';
import {
  OPENAI_KEY_MODELS,
  llmKeyModelsFailedMock,
  llmKeyModelsMock,
} from '@/features/flow-builder/communication/fixtures/llmKeyModels.fixture';
import {
  OPENAI_KEY,
  PROXY_KEY,
  llmKeyOptionsMock,
} from '@/features/flow-builder/communication/fixtures/llmKeyOptions.fixture';
import { membersByRoleMock } from '@/features/flow-builder/communication/fixtures/membersByRole.fixture';
import {
  FLASH_MODEL,
  modelOptionsFailedMock,
  modelOptionsMock,
} from '@/features/flow-builder/communication/fixtures/modelOptions.fixture';
import {
  TEST_RESPONSE_BODY,
  testApiRequestMock,
} from '@/features/flow-builder/communication/fixtures/testApiRequest.fixture';
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
  settings: NO_FLOW_SETTINGS,
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
    { id: 'e5', source: 'tagger', sourcePort: PortName.Error, target: 'reply' },
  ],
};

const withAgent = (config: Partial<AgentNode['config']>): FlowDocument => ({
  ...AI_FLOW,
  nodes: AI_FLOW.nodes.map((candidate) =>
    candidate.type === NodeType.Agent
      ? { ...candidate, config: { ...candidate.config, ...config } }
      : candidate,
  ),
});

const store = useFlowBuilderStore.getState;
const WITH_KEYS = [
  modelOptionsMock(),
  llmKeyOptionsMock([OPENAI_KEY]),
  llmKeyModelsMock(OPENAI_KEY.id, OPENAI_KEY_MODELS),
];
const LUNA_LABEL = 'GPT-6 Luna';
const LUNA_PRICE = 'OpenAI · $0.20 / $1.60 per 1M tokens';
const FLASH_LABEL = 'GLM-5.3 Flash';
const open = (
  nodeId: string,
  document: FlowDocument = FLOW,
  mocks = [modelOptionsMock(), llmKeyOptionsMock()],
) => {
  store().load({ document, revision: 1, issues: validateFlow(document) });
  store().select({ nodeIds: [nodeId], edgeIds: [] });
  return renderWithProviders(
    <InspectorPanel workspaceId={DEMO_WORKSPACE_ID} agentId={DEMO_AGENT_ID} />,
    { mocks },
  );
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
        step('split', '', { type: NodeType.Parallel, config: { waitFor: WaitFor.First } }),
      ],
    };
    open('split', document);

    const inspector = screen.getByRole('complementary', { name: 'split' });
    expect(within(inspector).getByText('Parallel / join')).toBeVisible();
    await user.click(screen.getByRole('radio', { name: 'All branches finish' }));

    expect(node('split')).toMatchObject({ config: { waitFor: WaitFor.All } });
  });

  it('moves a parallel branch to the background and back', async () => {
    const user = userEvent.setup();
    const branch = (id: string, target: string) => ({
      id,
      source: 'split',
      sourcePort: PortName.Branches,
      target,
    });
    const document: FlowDocument = {
      ...FLOW,
      nodes: [
        ...FLOW.nodes,
        step('split', '', { type: NodeType.Parallel, config: { waitFor: WaitFor.All } }),
        step('tagger', 'Topic tagger', NODE_TEMPLATES[NodeType.Completion]),
        step('drafter', 'Drafter', NODE_TEMPLATES[NodeType.Agent]),
      ],
      edges: [branch('b1', 'tagger'), branch('b2', 'drafter')],
    };
    open('split', document);

    const tagger = screen.getByRole('switch', { name: 'Run Topic tagger in the background' });
    const drafter = screen.getByRole('switch', { name: 'Run Drafter in the background' });
    await user.click(tagger);

    expect(store().document.edges).toEqual([
      { ...branch('b1', 'tagger'), background: true },
      branch('b2', 'drafter'),
    ]);
    expect(tagger).toBeChecked();
    expect(drafter).toBeDisabled();
    expect(screen.getByText('The reply needs to wait for at least one branch.')).toBeVisible();

    await user.click(tagger);

    expect(store().document.edges[0]).toMatchObject({ background: false });
    expect(drafter).toBeEnabled();
    expect(screen.queryByText('The reply needs to wait for at least one branch.')).toBeNull();
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

  it('keeps enum values within the limits and shows them again after an undo', async () => {
    const user = userEvent.setup();
    open('agent', AI_FLOW);

    await user.click(screen.getByRole('button', { name: 'Add field' }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Type of field_1' }),
      OutputFieldType.Enum,
    );
    const values = () => screen.getByRole('textbox', { name: 'Values of field_1' });
    await user.clear(values());
    await user.type(values(), 'yes, no{Enter}');
    await user.clear(values());
    await user.type(values(), `${'x'.repeat(MAX_LABEL_LENGTH + 1)}{Enter}`);

    expect(screen.getByText('Up to 30 values, each up to 60 characters')).toBeVisible();
    expect(node('agent')).toMatchObject({ config: { output: [{ values: ['yes', 'no'] }] } });
    act(() => store().undo());
    expect(values()).toHaveValue('option_1');
  });

  it('lets an agent have the full number of custom output fields', () => {
    open(
      'agent',
      withAgent({
        output: Array.from({ length: MAX_OUTPUT_FIELDS - 1 }, (_, index) => ({
          name: `field_${index}`,
          type: OutputFieldType.String,
          description: '',
          required: true,
        })),
      }),
    );

    expect(screen.getByRole('button', { name: 'Add field' })).toBeEnabled();
  });

  it('asks for a prompt on a step that has none', () => {
    open('agent', withAgent({ prompt: null }));

    expect(screen.getByText('Write a prompt')).toBeVisible();
    expect(screen.getByRole('button', { name: 'Use a library prompt' })).toBeVisible();
  });

  it('explains a failed model list and loads it again', async () => {
    const user = userEvent.setup();
    open('agent', AI_FLOW, [modelOptionsFailedMock(), modelOptionsMock(), llmKeyOptionsMock()]);

    expect(await screen.findByText('The models couldn’t be loaded.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    await waitFor(() =>
      expect(screen.queryByText('The models couldn’t be loaded.')).not.toBeInTheDocument(),
    );
    await user.click(screen.getByRole('button', { name: 'Model' }));
    await screen.findByRole('button', { name: LUNA_LABEL });
    const platform = screen.getByRole('group', { name: 'Platform models' });
    expect(within(platform).getAllByRole('button')).toHaveLength(2);
  });

  it('picks a platform model, then a reasoning level that model offers', async () => {
    const user = userEvent.setup();
    open('agent', AI_FLOW);

    const model = screen.getByRole('button', { name: 'Model' });
    expect(model).toHaveAccessibleDescription('Pick a model');
    await user.click(model);
    const luna = await screen.findByRole('button', { name: LUNA_LABEL });
    expect(luna).toHaveAccessibleDescription(LUNA_PRICE);
    await user.click(luna);
    expect(model).toHaveTextContent(LUNA_LABEL);
    expect(model).not.toHaveTextContent(LUNA_PRICE);
    expect(screen.getByText('Platform-provided')).toBeVisible();
    const reasoning = screen.getByRole('combobox', { name: 'Reasoning' });
    expect(
      within(reasoning)
        .getAllByRole('option')
        .map((option) => option.textContent),
    ).toEqual(['Default (Low)', 'Low', 'High']);
    await user.selectOptions(reasoning, ReasoningLevel.High);
    await user.click(model);
    await user.click(screen.getByRole('button', { name: FLASH_LABEL }));

    expect(node('agent')).toMatchObject({
      config: {
        model: { provider: { kind: ModelProviderKind.Platform }, model: FLASH_MODEL.id },
        reasoning: null,
      },
    });
    expect(screen.queryByRole('combobox', { name: 'Reasoning' })).not.toBeInTheDocument();
  });

  it('does not offer a typed model id without a workspace key', async () => {
    const user = userEvent.setup();
    open('agent', AI_FLOW);

    await user.click(screen.getByRole('button', { name: 'Model' }));
    await screen.findByRole('button', { name: LUNA_LABEL });
    await user.type(screen.getByRole('searchbox', { name: 'Search models' }), 'o3-pro');

    expect(screen.getByText('No models found')).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Use “o3-pro”' })).not.toBeInTheDocument();
  });

  it('picks a model of a workspace key and names the key', async () => {
    const user = userEvent.setup();
    open('agent', AI_FLOW, WITH_KEYS);

    const model = screen.getByRole('button', { name: 'Model' });
    await user.click(model);
    const key = await screen.findByRole('group', { name: 'OpenAI · your key' });
    await user.click(await within(key).findByRole('button', { name: 'gpt-4o-mini' }));

    expect(node('agent')).toMatchObject({
      config: {
        model: {
          provider: { kind: ModelProviderKind.Workspace, providerKeyId: OPENAI_KEY.id },
          model: 'gpt-4o-mini',
        },
        reasoning: null,
      },
    });
    expect(model).toHaveTextContent('gpt-4o-mini');
    expect(screen.getByText('Your key · OpenAI')).toBeVisible();
  });

  it('uses a typed model id with the key', async () => {
    const user = userEvent.setup();
    open('agent', AI_FLOW, WITH_KEYS);

    const model = screen.getByRole('button', { name: 'Model' });
    await user.click(model);
    const key = await screen.findByRole('group', { name: 'OpenAI · your key' });
    await within(key).findByRole('button', { name: 'gpt-4o' });
    await user.type(screen.getByRole('searchbox', { name: 'Search models' }), 'o3-pro');
    await user.click(screen.getByRole('button', { name: 'Use “o3-pro”' }));

    expect(node('agent')).toMatchObject({
      config: {
        model: {
          provider: { kind: ModelProviderKind.Workspace, providerKeyId: OPENAI_KEY.id },
          model: 'o3-pro',
        },
      },
    });
    expect(model).toHaveTextContent('o3-pro');
  });

  it('explains a key whose models failed and loads them again', async () => {
    const user = userEvent.setup();
    open('agent', AI_FLOW, [
      modelOptionsMock(),
      llmKeyOptionsMock([OPENAI_KEY, PROXY_KEY]),
      llmKeyModelsMock(OPENAI_KEY.id, OPENAI_KEY_MODELS),
      llmKeyModelsFailedMock(PROXY_KEY.id),
      llmKeyModelsMock(PROXY_KEY.id, ['llama3:8b']),
    ]);

    await user.click(screen.getByRole('button', { name: 'Model' }));
    const proxy = await screen.findByRole('group', { name: 'Local proxy · your key' });
    expect(await within(proxy).findByText('This key’s models couldn’t be loaded.')).toBeVisible();
    await user.click(within(proxy).getByRole('button', { name: 'Try again' }));

    expect(await within(proxy).findByRole('button', { name: 'llama3:8b' })).toBeVisible();
    expect(
      within(screen.getByRole('group', { name: 'OpenAI · your key' })).getByRole('button', {
        name: 'gpt-4o',
      }),
    ).toBeVisible();
  });

  it('shows the failure path and changes the retries', async () => {
    const user = userEvent.setup();
    open('agent', AI_FLOW);

    expect(screen.getByText('The run fails')).toBeVisible();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Retries' }), '0');

    expect(node('agent')).toMatchObject({ config: { retries: 0 } });
  });

  it('turns an exit on with the default criterion and shows where it goes', async () => {
    const user = userEvent.setup();
    open('agent', AI_FLOW);

    expect(screen.getByText('Off: the agent always continues to Next.')).toBeVisible();
    await user.click(screen.getByRole('switch', { name: 'Hand off to a person' }));

    expect(node('agent')).toMatchObject({
      config: {
        exits: {
          [AgentExitKind.End]: null,
          [AgentExitKind.Handoff]: {
            when: 'the customer asks for a person, you can’t help after 2 tries, or it’s a complaint, a legal or a safety question',
          },
        },
      },
    });
    const routes = screen.getByRole('list', { name: 'Where each exit goes' });
    expect(within(routes).getByText('hand off')).toBeVisible();
    expect(within(routes).getByText('default · Flow settings hand-off')).toBeVisible();
  });

  it('warns about an empty criterion and a second customer message, and drops the edge when off', async () => {
    const user = userEvent.setup();
    const flow = withAgent({
      exits: { [AgentExitKind.End]: { when: '' }, [AgentExitKind.Handoff]: { when: 'help' } },
    });
    const escalation = step('notify', 'Hand to a person', {
      ...NODE_TEMPLATES[NodeType.Escalation],
      config: { ...NODE_TEMPLATES[NodeType.Escalation].config, customerMessage: 'One moment' },
    });
    open('agent', {
      ...flow,
      nodes: [...flow.nodes, escalation],
      edges: [
        ...flow.edges,
        { id: 'e9', source: 'agent', sourcePort: AgentExitKind.Handoff, target: 'notify' },
      ],
    });

    expect(screen.getByText('Describe when the “end” exit applies')).toBeVisible();
    expect(
      screen.getByText(
        'The customer gets two messages: the agent’s and the one from Hand to a person. Clear one of them.',
      ),
    ).toBeVisible();
    expect(
      within(screen.getByRole('list', { name: 'Where each exit goes' })).getByText(
        'Hand to a person',
      ),
    ).toBeVisible();
    await user.click(screen.getByRole('switch', { name: 'Hand off to a person' }));

    expect(node('agent')).toMatchObject({ config: { exits: { [AgentExitKind.Handoff]: null } } });
    expect(store().document.edges.some((edge) => edge.id === 'e9')).toBe(false);
  });

  it('leaves the current message out of a completion', async () => {
    const user = userEvent.setup();
    open('tagger', AI_FLOW);

    await user.click(screen.getByRole('button', { name: 'Model' }));
    const luna = await screen.findByRole('button', { name: LUNA_LABEL });
    expect(
      within(screen.getByRole('group', { name: 'Platform models' })).getAllByRole('button'),
    ).toEqual([luna]);
    await user.keyboard('{Escape}');
    await user.click(screen.getByRole('switch', { name: 'Include the current message' }));

    expect(node('tagger')).toMatchObject({ config: { input: { includeCurrentMessage: false } } });
    expect(screen.getByRole('button', { name: 'Remove result' })).toBeDisabled();
  });

  it('sends an agent list one item at a time with buttons under it', async () => {
    const user = userEvent.setup();
    open('reply', AI_FLOW);

    await user.click(screen.getByRole('radio', { name: 'From a list' }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'List to send' }),
      'agent.messages',
    );
    await user.click(screen.getByRole('switch', { name: 'Show “typing…” before each message' }));
    await user.click(screen.getByRole('switch', { name: 'Wait for delivery before the next one' }));
    expect(screen.getByText(/No quick replies/)).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Add buttons' }));
    await user.click(screen.getByRole('button', { name: 'Add button' }));
    await user.clear(screen.getByRole('textbox', { name: 'Button 2' }));
    await user.type(screen.getByRole('textbox', { name: 'Button 2' }), 'No');
    await user.tab();

    expect(node('reply')).toMatchObject({
      config: {
        content: { kind: MessageContentKind.List, variable: 'agent.messages' },
        typing: false,
        waitForDelivery: true,
        quickReplies: { kind: QuickRepliesKind.Static, buttons: ['Yes', 'No'] },
      },
    });
    const preview = screen.getByRole('region', { name: 'Preview' });
    expect(within(preview).getByText('One message per item of agent.messages')).toBeVisible();
    expect(within(preview).getByRole('button', { name: 'No' })).toBeDisabled();
  });

  it('cuts a quick-reply label to the longest label the flow allows', async () => {
    const user = userEvent.setup();
    const longest = 'x'.repeat(MAX_LABEL_LENGTH);
    open('reply', AI_FLOW);

    await user.click(screen.getByRole('button', { name: 'Add buttons' }));
    const label = screen.getByRole('textbox', { name: 'Button 1' });
    await user.clear(label);
    await user.type(label, `${longest}x`);
    await user.tab();

    expect(node('reply')).toMatchObject({ config: { quickReplies: { buttons: [longest] } } });
  });

  it('writes the message text and takes buttons from a field', async () => {
    const user = userEvent.setup();
    open('reply', AI_FLOW);

    await user.type(screen.getByRole('textbox', { name: 'Message text' }), 'Hello there');
    await user.tab();
    await user.click(screen.getByRole('button', { name: 'Add buttons' }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Where the buttons come from' }),
      'From a field',
    );

    expect(node('reply')).toMatchObject({
      config: {
        content: { kind: MessageContentKind.Text, text: 'Hello there' },
        quickReplies: { kind: QuickRepliesKind.Variable, variable: 'agent.messages' },
      },
    });
    expect(
      within(screen.getByRole('region', { name: 'Preview' })).getByText('Hello there'),
    ).toBeVisible();
  });
});

describe('InspectorPanel escalation', () => {
  const ESCALATION_FLOW: FlowDocument = {
    ...FLOW,
    nodes: [...FLOW.nodes, step('handoff', 'Notify operator', NODE_TEMPLATES[NodeType.Escalation])],
    edges: [
      ...FLOW.edges,
      { id: 'e3', source: 'route', sourcePort: PortName.Else, target: 'handoff' },
    ],
  };
  const openEscalation = () => open('handoff', ESCALATION_FLOW, [membersByRoleMock()]);

  it('notifies a role with its member count on the chosen channels', async () => {
    const user = userEvent.setup();
    openEscalation();

    const recipients = screen.getByRole('combobox', { name: 'Who to notify' });
    expect(
      await within(recipients).findByRole('option', { name: 'Operators · 2 people' }),
    ).toBeInTheDocument();
    await user.selectOptions(
      recipients,
      within(recipients).getByRole('option', { name: 'Owners · 1 person' }),
    );
    expect(screen.getByRole('checkbox', { name: 'In the platform' })).toBeDisabled();
    expect(screen.queryByRole('checkbox', { name: 'Telegram' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'Email' }));
    await user.type(screen.getByRole('textbox', { name: 'Reason shown in the Inbox' }), 'Refund');
    await user.tab();

    expect(node('handoff')).toMatchObject({
      config: {
        reason: 'Refund',
        notify: {
          recipients: { kind: RecipientsKind.Role, role: 'owner' },
          channels: [NotifyChannel.InPlatform, NotifyChannel.Email],
        },
      },
    });
    expect(screen.getByText('Add a message for the customer while they wait')).toBeVisible();
    expect(screen.getByText('Then tell the customer')).toBeVisible();
    expect(screen.getByRole('textbox', { name: 'Then tell the customer' })).toHaveAttribute(
      'aria-invalid',
      'false',
    );
    expect(
      screen.getByText('We’re still finding someone to help. Thanks for waiting!'),
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole('list', { name: 'Until someone takes it' })).getByText('30 min'),
    ).toBeVisible();
    await user.type(screen.getByRole('textbox', { name: 'Then tell the customer' }), 'Back soon');
    await user.tab();
    expect(node('handoff')).toMatchObject({ config: { fallbackMessage: 'Back soon' } });
    expect(screen.queryByText('Add a message for the customer while they wait')).toBeNull();
  });

  it('ends the conversation with a message and keeps it when escalating again', async () => {
    const user = userEvent.setup();
    openEscalation();

    await user.type(screen.getByRole('textbox', { name: 'Message to the customer' }), 'Bye');
    await user.tab();
    await user.click(screen.getByRole('radio', { name: 'End conversation' }));

    expect(node('handoff')?.config).toEqual({ mode: EscalationMode.End, customerMessage: 'Bye' });
    expect(screen.queryByRole('combobox', { name: 'Who to notify' })).not.toBeInTheDocument();
    await user.click(screen.getByRole('radio', { name: 'Escalate to a person' }));
    expect(node('handoff')).toMatchObject({
      config: { mode: EscalationMode.Escalate, customerMessage: 'Bye', reason: '' },
    });
  });
});

describe('InspectorPanel api request', () => {
  const API_FLOW: FlowDocument = {
    ...FLOW,
    nodes: [...FLOW.nodes, step('lookup', 'Load booking', NODE_TEMPLATES[NodeType.ApiRequest])],
    edges: [
      ...FLOW.edges,
      { id: 'e3', source: 'route', sourcePort: PortName.Else, target: 'lookup' },
    ],
  };

  it('edits the request, its headers, body and failure path', async () => {
    const user = userEvent.setup();
    open('lookup', API_FLOW, []);

    expect(screen.getByRole('list', { name: 'Output' })).toHaveTextContent(
      'statusnumber · HTTP status',
    );
    await user.selectOptions(screen.getByRole('combobox', { name: 'Method' }), HttpMethod.Post);
    await user.type(screen.getByRole('textbox', { name: 'URL' }), 'https://crm.example/bookings');
    await user.tab();
    await user.click(screen.getByRole('button', { name: 'Add header' }));
    await user.clear(screen.getByRole('textbox', { name: 'Header 1 value' }));
    await user.type(screen.getByRole('textbox', { name: 'Header 1 value' }), 'text/plain');
    await user.tab();
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Body type' }),
      RequestBodyKind.Json,
    );
    await user.type(screen.getByRole('textbox', { name: 'Body content' }), '[[1, 2]');
    await user.tab();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Retries' }), '0');
    await user.selectOptions(screen.getByRole('combobox', { name: 'Timeout' }), '15');
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'If the request fails' }),
      FailureMode.ErrorPort,
    );

    expect(node('lookup')).toMatchObject({
      config: {
        method: HttpMethod.Post,
        url: 'https://crm.example/bookings',
        headers: [{ name: 'Accept', value: 'text/plain' }],
        body: { kind: RequestBodyKind.Json, content: '[1, 2]' },
        retries: 0,
        timeoutSeconds: 15,
        onFailure: FailureMode.ErrorPort,
      },
    });
    expect(screen.getByText('Connect the “on error” port')).toBeVisible();
  });

  it('shows a timeout the list does not offer', () => {
    open('lookup', {
      ...API_FLOW,
      nodes: API_FLOW.nodes.map((candidate) =>
        candidate.type === NodeType.ApiRequest
          ? { ...candidate, config: { ...candidate.config, timeoutSeconds: 7 } }
          : candidate,
      ),
    });

    expect(screen.getByRole('combobox', { name: 'Timeout' })).toHaveValue('7');
  });

  it('explains a header problem and keeps focus after a name change', async () => {
    const user = userEvent.setup();
    const headers = [{ name: 'X-Id', value: '{{missing.field}}' }];
    open('lookup', {
      ...API_FLOW,
      nodes: API_FLOW.nodes.map((candidate) =>
        candidate.type === NodeType.ApiRequest
          ? { ...candidate, config: { ...candidate.config, headers } }
          : candidate,
      ),
    });

    expect(screen.getByText('missing.field isn’t available here')).toBeVisible();
    await user.type(screen.getByRole('textbox', { name: 'Header 1 name' }), '-Ref');
    await user.tab();

    expect(screen.getByRole('textbox', { name: 'Header 1 value' })).toHaveFocus();
    expect(node('lookup')).toMatchObject({ config: { headers: [{ name: 'X-Id-Ref' }] } });
  });

  it('tests the saved request and shows the answer', async () => {
    const user = userEvent.setup();
    open('lookup', API_FLOW, [testApiRequestMock('lookup')]);

    act(() => store().setSaveState(SaveState.Pending));
    expect(screen.getByRole('button', { name: 'Test request' })).toBeDisabled();
    act(() => store().setSaveState(SaveState.Idle));
    await user.click(screen.getByRole('button', { name: 'Test request' }));

    expect(await screen.findByText('Status 200 · 120 ms')).toBeVisible();
    expect(screen.getByText(TEST_RESPONSE_BODY)).toBeVisible();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Method' }), HttpMethod.Post);
    expect(screen.queryByText('Status 200 · 120 ms')).not.toBeInTheDocument();
  });
});

describe('InspectorPanel schedule trigger', () => {
  const SCHEDULE_FLOW: FlowDocument = {
    ...FLOW,
    nodes: [
      ...FLOW.nodes,
      step('daily', 'Daily follow-up', NODE_TEMPLATES[NodeType.TriggerSchedule]),
    ],
    edges: [
      ...FLOW.edges,
      { id: 'e3', source: 'daily', sourcePort: PortName.Next, target: 'reply' },
    ],
  };
  const openSchedule = (document: FlowDocument = SCHEDULE_FLOW) => open('daily', document);
  const schedule = () => {
    const found = node('daily');
    if (found?.type !== NodeType.TriggerSchedule) {
      throw new Error('no schedule trigger');
    }
    return found.config;
  };

  it('shows the schedule, the next three runs, the limits and the variables', () => {
    openSchedule();

    const inspector = screen.getByRole('complementary', { name: 'Daily follow-up' });
    expect(
      within(inspector).getByText('Starts a run on a schedule for the chats that match'),
    ).toBeVisible();
    expect(within(inspector).getByRole('radio', { name: 'Every day' })).toBeChecked();
    expect(within(inspector).getByLabelText('Time')).toHaveValue('10:00');
    expect(within(inspector).getByRole('button', { name: /Time zone/ })).toHaveTextContent('UTC');
    expect(
      within(screen.getByRole('list', { name: 'Next runs' })).getAllByRole('listitem'),
    ).toHaveLength(3);
    expect(within(inspector).getByLabelText('Customer silent for at least')).toHaveValue(1);
    expect(within(inspector).getByRole('combobox', { name: 'Unit' })).toHaveDisplayValue('days');
    expect(within(inspector).getByRole('checkbox', { name: 'Telegram' })).toBeChecked();
    expect(within(inspector).getByRole('checkbox', { name: 'API' })).toBeChecked();
    expect(within(inspector).getByLabelText('Max conversations per run')).toHaveValue(50);
    expect(
      within(inspector).getByText(
        'Telegram lets a bot message only people who already wrote to it.',
      ),
    ).toBeVisible();
    expect(
      within(screen.getByRole('list', { name: 'Available in the flow' })).getByText(
        'conversation.id',
      ),
    ).toBeVisible();
  });

  it('switches between daily, weekdays and a custom cron, keeping the time', async () => {
    const user = userEvent.setup();
    openSchedule();

    await user.click(screen.getByRole('radio', { name: 'Weekdays' }));
    expect(schedule().schedule).toEqual({
      kind: ScheduleKind.Weekdays,
      time: '10:00',
      timeZone: 'UTC',
    });
    await user.click(screen.getByRole('radio', { name: 'Custom cron' }));
    expect(schedule().schedule).toEqual({
      kind: ScheduleKind.Custom,
      cron: '0 10 * * 1-5',
      timeZone: 'UTC',
    });
    expect(screen.getByRole('textbox', { name: 'Cron expression' })).toHaveValue('0 10 * * 1-5');
    expect(screen.queryByLabelText('Time')).not.toBeInTheDocument();
  });

  it('explains a cron that is not valid and lists the runs once it is', async () => {
    const user = userEvent.setup();
    openSchedule();

    await user.click(screen.getByRole('radio', { name: 'Custom cron' }));
    const cron = screen.getByRole('textbox', { name: 'Cron expression' });
    await user.clear(cron);
    await user.type(cron, 'soon');
    await user.tab();

    expect(screen.getByText('“soon” isn’t a valid schedule')).toBeVisible();
    expect(screen.queryByRole('list', { name: 'Next runs' })).not.toBeInTheDocument();
    expect(screen.getByText('Fix the schedule to see the next runs.')).toBeVisible();
    await user.clear(cron);
    await user.type(cron, '30 8 * * *');
    await user.tab();

    expect(schedule().schedule).toMatchObject({ cron: '30 8 * * *' });
    expect(screen.getByRole('list', { name: 'Next runs' })).toBeVisible();
    expect(screen.queryByText('“soon” isn’t a valid schedule')).not.toBeInTheDocument();
  });

  it('changes the time and the time zone', async () => {
    const user = userEvent.setup();
    openSchedule();

    fireEvent.change(screen.getByLabelText('Time'), { target: { value: '18:30' } });
    await user.click(screen.getByRole('button', { name: /Time zone/ }));
    await user.type(screen.getByRole('searchbox', { name: 'Search time zones' }), 'kyiv');
    await user.click(screen.getByRole('button', { name: 'Europe/Kyiv' }));

    expect(schedule().schedule).toEqual({
      kind: ScheduleKind.Daily,
      time: '18:30',
      timeZone: 'Europe/Kyiv',
    });
  });

  it('turns the silence condition off and on, and rescales it', async () => {
    const user = userEvent.setup();
    openSchedule();

    await user.selectOptions(screen.getByRole('combobox', { name: 'Unit' }), 'hour');
    expect(schedule().conditions.silentForHours).toBe(1);
    await user.click(screen.getByRole('switch', { name: 'Only chats that went quiet' }));
    expect(schedule().conditions.silentForHours).toBeNull();
    expect(screen.queryByLabelText('Customer silent for at least')).not.toBeInTheDocument();
    await user.click(screen.getByRole('switch', { name: 'Only chats that went quiet' }));
    expect(schedule().conditions.silentForHours).toBe(24);
  });

  it('warns when auto-close ends the chat before the silence', () => {
    openSchedule({
      ...SCHEDULE_FLOW,
      settings: { ...NO_FLOW_SETTINGS, autoClose: { afterMinutes: 120 } },
    });

    expect(
      screen.getByText('Auto-close ends the chat before this silence is reached'),
    ).toBeVisible();
  });

  it('needs a channel, and hides the Telegram note without Telegram', async () => {
    const user = userEvent.setup();
    openSchedule();

    await user.click(screen.getByRole('checkbox', { name: 'Telegram' }));
    expect(schedule().conditions.channelTypes).toEqual([ChannelType.Api]);
    expect(screen.queryByText(/Telegram lets a bot/)).not.toBeInTheDocument();
    await user.click(screen.getByRole('checkbox', { name: 'API' }));

    expect(schedule().conditions.channelTypes).toEqual([]);
    expect(screen.getByText('Pick at least one channel type')).toBeVisible();
  });

  it('limits a run and sends each chat the message once or again', async () => {
    const user = userEvent.setup();
    openSchedule();

    const max = () => screen.getByLabelText('Max conversations per run');
    await user.clear(max());
    await user.type(max(), '250');
    await user.tab();
    expect(schedule().maxConversationsPerRun).toBe(250);
    expect(screen.getByText('A run can reach at most 200 conversations')).toBeVisible();
    await user.clear(max());
    await user.tab();
    expect(max()).toHaveValue(250);

    expect(screen.getByText('Each chat gets this message once.')).toBeVisible();
    await user.click(screen.getByRole('switch', { name: 'Once per conversation' }));
    expect(schedule().oncePerConversation).toBe(false);
    expect(
      screen.getByText('A chat can get it again after the customer writes and goes quiet.'),
    ).toBeVisible();
  });

  it('turns a skipped escalated chat off', async () => {
    const user = userEvent.setup();
    openSchedule();

    await user.click(screen.getByRole('switch', { name: 'Skip chats handed to a person' }));

    expect(schedule().conditions.notEscalated).toBe(false);
  });
});
