import { describe, expect, it } from 'vitest';
import { PortName } from '@flow/document/constants/flow.constants';
import type { FlowDocument, FlowNode } from '@flow/document/typedefs/flow.typedefs';
import { CompletionRole, WaitFor } from '@flow/nodes/constants/step.constants';
import { OutputFieldType } from '@flow/outputs/constants/output.constants';
import { VariableSourceKind, VariableType } from '@flow/scope/constants/scope.constants';
import {
  createScopeLookup,
  resolveVariable,
  visibleVariables,
} from '@flow/scope/helpers/scope.helpers';
import type { VisibleVariable } from '@flow/scope/typedefs/scope.typedefs';
import { faqWithHandOffFlow } from '@test/support/fixtures/example-flow.fixture';
import {
  agent,
  apiRequest,
  completion,
  escalation,
  eventTrigger,
  field,
  flowOf,
  link,
  messageTrigger,
  parallel,
  rule,
  router,
  scheduleTrigger,
  sendText,
} from '@test/support/fixtures/flow-builder.fixture';

const scopeAt = (flow: FlowDocument, node: FlowNode): Map<string, VisibleVariable> =>
  new Map(visibleVariables(flow, node.id).map((variable) => [variable.path, variable]));

const nullability = (flow: FlowDocument, node: FlowNode): Record<string, boolean> =>
  Object.fromEntries([...scopeAt(flow, node)].map(([path, variable]) => [path, variable.nullable]));

describe('visibleVariables', () => {
  it('gives a step the trigger variables, today and earlier outputs', () => {
    const trigger = messageTrigger('incoming');
    const answer = agent('answer', [field('intent', OutputFieldType.Enum, false)]);
    const reply = sendText('reply', '');
    const flow = flowOf(
      [trigger, answer, reply],
      [link(trigger, PortName.Next, answer), link(answer, PortName.Next, reply)],
    );
    expect(nullability(flow, reply)).toEqual({
      'message.text': false,
      'message.attachments': false,
      'user.name': false,
      'user.language': false,
      channel: false,
      history: false,
      today: false,
      'answer.messages': false,
      'answer.intent': true,
    });
    expect(scopeAt(flow, reply).get('answer.intent')).toMatchObject({
      type: VariableType.Enum,
      values: ['a', 'b'],
      source: VariableSourceKind.Step,
      nodeId: answer.id,
    });
    expect(scopeAt(flow, answer).has('answer.messages')).toBe(false);
  });

  it('makes outputs nullable when only some paths run the step', () => {
    const trigger = messageTrigger('incoming');
    const route = router('route', [rule('first', 'message.text', undefined, null)]);
    const left = agent('left');
    const right = agent('right');
    const reply = sendText('reply', '');
    const flow = flowOf(
      [trigger, route, left, right, reply],
      [
        link(trigger, PortName.Next, route),
        link(route, 'first', left),
        link(route, PortName.Else, right),
        link(left, PortName.Next, reply),
        link(right, PortName.Next, reply),
      ],
    );
    const atReply = nullability(flow, reply);
    expect(atReply['left.messages']).toBe(true);
    expect(atReply['right.messages']).toBe(true);
    expect(scopeAt(flow, left).has('right.messages')).toBe(false);
  });

  it('hides the outputs of a step that failed into its error port', () => {
    const trigger = messageTrigger('incoming');
    const answer = agent('answer');
    const handoff = escalation('handoff');
    const flow = flowOf(
      [trigger, answer, handoff],
      [link(trigger, PortName.Next, answer), link(answer, PortName.Error, handoff)],
    );
    expect(scopeAt(flow, handoff).has('answer.messages')).toBe(false);
  });

  it('makes a trigger variable nullable unless every trigger that reaches the node provides it', () => {
    const message = messageTrigger('incoming');
    const schedule = scheduleTrigger('morning');
    const answer = agent('answer');
    const flow = flowOf(
      [message, schedule, answer],
      [link(message, PortName.Next, answer), link(schedule, PortName.Next, answer)],
    );
    const atAnswer = nullability(flow, answer);
    expect(atAnswer['message.text']).toBe(true);
    expect(atAnswer['conversation.id']).toBe(true);
    expect(atAnswer['user.name']).toBe(false);
    expect(atAnswer['history']).toBe(false);
    expect(atAnswer['channel']).toBe(false);
  });

  describe('after a parallel join', () => {
    const build = (waitFor: WaitFor) => {
      const trigger = messageTrigger('incoming');
      const fork = parallel('fork', waitFor);
      const guard = completion('guard', CompletionRole.Guard);
      const lookup = apiRequest('lookup');
      const observer = completion('topic', CompletionRole.Observer);
      const writer = agent('writer');
      const reply = sendText('reply', '');
      const flow = flowOf(
        [trigger, fork, guard, lookup, observer, writer, reply],
        [
          link(trigger, PortName.Next, fork),
          link(fork, PortName.Branches, guard),
          link(fork, PortName.Branches, lookup),
          link(lookup, PortName.Next, observer),
          link(fork, PortName.Branches, writer),
          link(fork, PortName.Next, reply),
        ],
      );
      return { flow, reply, guard, writer, lookup };
    };

    it('keeps outputs of every branch non-null when waiting for all', () => {
      const { flow, reply } = build(WaitFor.All);
      const atReply = nullability(flow, reply);
      expect(atReply['guard.verdict']).toBe(false);
      expect(atReply['writer.messages']).toBe(false);
      expect(atReply['lookup.ok']).toBe(false);
    });

    it('makes observer branches nullable when waiting for guards', () => {
      const { flow, reply } = build(WaitFor.Guards);
      const atReply = nullability(flow, reply);
      expect(atReply['guard.verdict']).toBe(false);
      expect(atReply['writer.messages']).toBe(false);
      expect(atReply['lookup.ok']).toBe(true);
    });

    it('makes every branch output nullable after the first branch', () => {
      const { flow, reply } = build(WaitFor.First);
      const atReply = nullability(flow, reply);
      expect(atReply['guard.verdict']).toBe(true);
      expect(atReply['writer.messages']).toBe(true);
    });

    it('never shows observer outputs', () => {
      const { flow, reply } = build(WaitFor.All);
      expect([...scopeAt(flow, reply).keys()].some((path) => path.startsWith('topic.'))).toBe(
        false,
      );
    });

    it('does not show one branch the outputs of another', () => {
      const { flow, writer } = build(WaitFor.All);
      expect(scopeAt(flow, writer).has('guard.verdict')).toBe(false);
    });
  });

  it('gives API request outputs with a nullable status and an open body', () => {
    const trigger = messageTrigger('incoming');
    const load = apiRequest('load');
    const reply = sendText('reply', '');
    const flow = flowOf(
      [trigger, load, reply],
      [link(trigger, PortName.Next, load), link(load, PortName.Next, reply)],
    );
    expect(nullability(flow, reply)).toMatchObject({
      'load.ok': false,
      'load.status': true,
      'load.body': true,
    });
    expect(scopeAt(flow, reply).get('load.body')).toMatchObject({
      open: true,
      type: VariableType.Unknown,
    });
  });

  it('types event variables from the example payload and keeps them nullable', () => {
    const trigger = eventTrigger('order_paid', 'order-paid', {
      order: { id: 'A-1', total: 10, gift: false, tags: ['vip'], lines: [{ sku: 'x' }] },
    });
    const reply = sendText('reply', '');
    const flow = flowOf([trigger, reply], [link(trigger, PortName.Next, reply)]);
    const scope = scopeAt(flow, reply);
    expect(scope.get('event.order.id')).toMatchObject({
      type: VariableType.String,
      nullable: true,
    });
    expect(scope.get('event.order.total')).toMatchObject({ type: VariableType.Number });
    expect(scope.get('event.order.gift')).toMatchObject({ type: VariableType.Boolean });
    expect(scope.get('event.order.tags')).toMatchObject({ type: VariableType.StringList });
    expect(scope.get('event.order.lines')).toMatchObject({ type: VariableType.List });
    expect(scope.get('event.order')).toMatchObject({ type: VariableType.Unknown, open: true });
    expect(scope.get('user_id')).toMatchObject({ nullable: false });
  });

  it('reads the example flow: guard outputs are certain after the guards join', () => {
    const route = faqWithHandOffFlow.nodes.find((node) => node.key === 'route');
    const handoff = faqWithHandOffFlow.nodes.find((node) => node.key === 'handoff');
    if (route === undefined || handoff === undefined) {
      throw new Error('the example flow has route and handoff');
    }
    expect(nullability(faqWithHandOffFlow, route)['guard.needs_human']).toBe(false);
    expect(nullability(faqWithHandOffFlow, handoff)['guard.reason']).toBe(false);
    expect(scopeAt(faqWithHandOffFlow, handoff).has('answer.messages')).toBe(false);
  });

  it('survives a cycle', () => {
    const trigger = messageTrigger('incoming');
    const first = agent('first');
    const second = agent('second');
    const flow = flowOf(
      [trigger, first, second],
      [
        link(trigger, PortName.Next, first),
        link(first, PortName.Next, second),
        link(second, PortName.Next, first),
      ],
    );
    expect(scopeAt(flow, second).get('first.messages')?.nullable).toBe(false);
  });
});

describe('createScopeLookup', () => {
  it('answers every node of one flow from one analysis', () => {
    const lookup = createScopeLookup(faqWithHandOffFlow);
    for (const node of faqWithHandOffFlow.nodes) {
      expect(lookup(node.id)).toEqual(visibleVariables(faqWithHandOffFlow, node.id));
    }
  });
});

describe('resolveVariable', () => {
  const trigger = eventTrigger('order_paid', 'order-paid', { order: { id: 'A-1' } });
  const answer = agent('answer', [field('intent', OutputFieldType.Enum)]);
  const load = apiRequest('load');
  const reply = sendText('reply', '');
  const flow = flowOf(
    [trigger, answer, load, reply],
    [
      link(trigger, PortName.Next, answer),
      link(answer, PortName.Next, load),
      link(load, PortName.Next, reply),
    ],
  );
  const variables = visibleVariables(flow, reply.id);

  it('finds a declared variable with its type', () => {
    expect(resolveVariable(variables, 'answer.intent')).toEqual({
      type: VariableType.Enum,
      nullable: false,
      values: ['a', 'b'],
    });
    expect(resolveVariable(variables, ' today ')).toMatchObject({ type: VariableType.String });
  });

  it('gives a list item a nullable item type', () => {
    expect(resolveVariable(variables, 'answer.messages[0]')).toEqual({
      type: VariableType.String,
      nullable: true,
      values: null,
    });
  });

  it('allows any path under an open variable', () => {
    expect(resolveVariable(variables, 'load.body.items[0].sku')).toEqual({
      type: VariableType.Unknown,
      nullable: true,
      values: null,
    });
    expect(resolveVariable(variables, 'event.customer.email')).toMatchObject({
      type: VariableType.Unknown,
    });
    expect(resolveVariable(variables, 'event.order.id')).toMatchObject({
      type: VariableType.String,
    });
  });

  it('refuses unknown paths, roots without a value and paths into scalars', () => {
    expect(resolveVariable(variables, 'answer.missing')).toBeNull();
    expect(resolveVariable(variables, 'answer')).toBeNull();
    expect(resolveVariable(variables, 'message.text')).toBeNull();
    expect(resolveVariable(variables, 'answer.intent.x')).toBeNull();
    expect(resolveVariable(variables, 'answer.intent[0]')).toBeNull();
    expect(resolveVariable(variables, 'answer..intent')).toBeNull();
  });
});
