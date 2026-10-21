import { ReasoningLevel } from '@agent-ic/contracts';
import {
  ChannelSelectionMode,
  ConditionOperator,
  EscalationMode,
  FailureMode,
  HttpMethod,
  FLOW_SCHEMA_VERSION,
  MAX_LABEL_LENGTH,
  MAX_OUTPUT_FIELDS,
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
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  DEMO_AGENT_ID,
  DEMO_WORKSPACE_ID,
} from '@/features/flow-builder/communication/fixtures/flowBuilderDraft.fixture';
import { membersByRoleMock } from '@/features/flow-builder/communication/fixtures/membersByRole.fixture';
import {
  FLASH_MODEL,
  LUNA_MODEL,
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
const open = (nodeId: string, document: FlowDocument = FLOW, mocks = [modelOptionsMock()]) => {
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
    open('agent', AI_FLOW, [modelOptionsFailedMock(), modelOptionsMock()]);

    expect(await screen.findByText('The models couldn’t be loaded.')).toBeVisible();
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    const model = screen.getByRole('combobox', { name: 'Model' });
    await waitFor(() => expect(within(model).getAllByRole('option')).toHaveLength(3));
    expect(screen.queryByText('The models couldn’t be loaded.')).not.toBeInTheDocument();
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

  it('shows the failure path and changes the retries', async () => {
    const user = userEvent.setup();
    open('agent', AI_FLOW);

    expect(screen.getByText('The run fails')).toBeVisible();
    await user.selectOptions(screen.getByRole('combobox', { name: 'Retries' }), '0');

    expect(node('agent')).toMatchObject({ config: { retries: 0 } });
  });

  it('leaves the current message out of a completion', async () => {
    const user = userEvent.setup();
    open('tagger', AI_FLOW);

    const model = screen.getByRole('combobox', { name: 'Model' });
    await waitFor(() => expect(within(model).getAllByRole('option')).toHaveLength(2));
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
