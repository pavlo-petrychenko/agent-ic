import { describe, expect, it } from 'vitest';
import { ConditionOperator } from '@flow/conditions/constants/condition.constants';
import { PortName } from '@flow/document/constants/flow.constants';
import type { FlowDocument, FlowNode } from '@flow/document/typedefs/flow.typedefs';
import { CompletionRole, FailureMode, WaitFor } from '@flow/nodes/constants/step.constants';
import { ReplyMode } from '@flow/nodes/constants/trigger.constants';
import { OutputFieldType } from '@flow/outputs/constants/output.constants';
import { FlowIssueCode, FlowIssueSeverity } from '@flow/validation/constants/issue.constants';
import { hasBlockingIssues, validateFlow } from '@flow/validation/helpers/validation.helpers';
import { exampleFlows, faqWithHandOffFlow } from '@test/support/fixtures/example-flow.fixture';
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
  sendList,
  sendText,
} from '@test/support/fixtures/flow-builder.fixture';

const trigger = messageTrigger('incoming');
const answer = agent('answer');
const reply = sendList('reply', 'answer.messages');
const handoff = escalation('handoff');

const cleanFlow = (extraNodes: FlowNode[] = [], extraEdges: FlowDocument['edges'] = []) =>
  flowOf(
    [trigger, answer, reply, handoff, ...extraNodes],
    [
      link(trigger, PortName.Next, answer),
      link(answer, PortName.Next, reply),
      link(answer, PortName.Error, handoff),
      ...extraEdges,
    ],
  );

const withStep = (step: FlowNode) => cleanFlow([step], [link(reply, PortName.Next, step)]);

const routeOn = (variable: string, operator: ConditionOperator, value: string | number | null) =>
  withStep(router('route', [rule('first', variable, operator, value)]));

const branchFlow = (branches: FlowNode[], waitFor = WaitFor.All) => {
  const fork = parallel('fork', waitFor);
  return flowOf(
    [trigger, fork, ...branches],
    branches
      .map((branch) => link(fork, PortName.Branches, branch))
      .concat(link(trigger, PortName.Next, fork)),
  );
};

const guard = (key: string) => {
  const node = completion(key, CompletionRole.Guard);
  return node;
};

const failingFlows: Record<FlowIssueCode, () => unknown> = {
  [FlowIssueCode.UnsupportedVersion]: () => ({ ...cleanFlow(), schemaVersion: 2 }),
  [FlowIssueCode.InvalidDocument]: () => ({
    ...cleanFlow(),
    nodes: [{ ...answer, config: undefined }],
  }),
  [FlowIssueCode.DuplicateNodeId]: () => cleanFlow([{ ...agent('other'), id: answer.id }]),
  [FlowIssueCode.DuplicateNodeKey]: () => cleanFlow([{ ...agent('answer'), id: 'n_copy' }]),
  [FlowIssueCode.InvalidNodeKey]: () => withStep({ ...agent('x'), key: 'Bad Key' }),
  [FlowIssueCode.ReservedNodeKey]: () => withStep(agent('message')),
  [FlowIssueCode.DuplicateEdgeId]: () =>
    cleanFlow([], [{ ...link(reply, PortName.Next, handoff), id: 'e_incoming_next_answer' }]),
  [FlowIssueCode.EdgeMissingNode]: () =>
    cleanFlow(
      [],
      [{ id: 'e_lost', source: reply.id, sourcePort: PortName.Next, target: 'n_lost' }],
    ),
  [FlowIssueCode.EdgeMissingPort]: () => cleanFlow([], [link(reply, PortName.Error, handoff)]),
  [FlowIssueCode.EdgeIntoTrigger]: () => {
    const second = scheduleTrigger('morning');
    return cleanFlow(
      [second],
      [link(second, PortName.Next, answer), link(reply, PortName.Next, second)],
    );
  },
  [FlowIssueCode.PortHasManyEdges]: () => cleanFlow([], [link(answer, PortName.Next, handoff)]),
  [FlowIssueCode.NoTrigger]: () => flowOf([answer], []),
  [FlowIssueCode.Cycle]: () => cleanFlow([], [link(reply, PortName.Next, answer)]),
  [FlowIssueCode.UnreachableNode]: () => cleanFlow([agent('orphan')]),
  [FlowIssueCode.UnknownVariable]: () => withStep(sendText('more', 'Hi {{missing.value}}')),
  [FlowIssueCode.InvalidTemplate]: () => withStep(sendText('more', 'Hi {{ user name }}')),
  [FlowIssueCode.OperatorTypeMismatch]: () =>
    routeOn('answer.messages', ConditionOperator.IsTrue, null),
  [FlowIssueCode.InvalidConditionValue]: () => routeOn('message.text', ConditionOperator.Eq, 3),
  [FlowIssueCode.VariableTypeMismatch]: () => withStep(sendList('more', 'message.text')),
  [FlowIssueCode.MissingPrompt]: () =>
    withStep({ ...agent('more'), config: { ...agent('more').config, prompt: null } }),
  [FlowIssueCode.MissingModel]: () =>
    withStep({ ...agent('more'), config: { ...agent('more').config, model: null } }),
  [FlowIssueCode.MissingEventName]: () => cleanFlow([eventTrigger('paid', null)]),
  [FlowIssueCode.MissingChannel]: () => {
    const event = eventTrigger('paid');
    return cleanFlow(
      [{ ...event, config: { ...event.config, channelId: null } }],
      [link(event, PortName.Next, answer)],
    );
  },
  [FlowIssueCode.RuleWithoutConditions]: () =>
    withStep(router('route', [{ ...rule('first', 'message.text'), conditions: [] }])),
  [FlowIssueCode.DuplicateRuleId]: () =>
    withStep(
      router('route', [
        rule('first', 'today', ConditionOperator.IsNotEmpty),
        rule('first', 'today', ConditionOperator.IsEmpty),
      ]),
    ),
  [FlowIssueCode.InvalidRuleId]: () =>
    withStep(router('route', [rule(PortName.Else, 'today', ConditionOperator.IsNotEmpty)])),
  [FlowIssueCode.ParallelBranchLeak]: () => {
    const fork = parallel('fork', WaitFor.All);
    const left = guard('left');
    const right = guard('right');
    const after = sendText('after', 'done');
    return flowOf(
      [trigger, fork, left, right, after],
      [
        link(trigger, PortName.Next, fork),
        link(fork, PortName.Branches, left),
        link(fork, PortName.Branches, right),
        link(fork, PortName.Next, after),
        link(left, PortName.Next, after),
      ],
    );
  },
  [FlowIssueCode.SendInParallelBranch]: () => branchFlow([guard('left'), sendText('right', 'hi')]),
  [FlowIssueCode.TooFewBranches]: () => branchFlow([guard('left')]),
  [FlowIssueCode.TooManyBranches]: () =>
    branchFlow(['a', 'b', 'c', 'd', 'e', 'f'].map((key) => guard(key))),
  [FlowIssueCode.ObserverHasEdges]: () => {
    const observer = completion('topic', CompletionRole.Observer);
    return cleanFlow(
      [observer],
      [link(reply, PortName.Next, observer), link(observer, PortName.Next, handoff)],
    );
  },
  [FlowIssueCode.ErrorPortNotConnected]: () =>
    withStep(apiRequest('load', 'https://x.test', FailureMode.ErrorPort)),
  [FlowIssueCode.DuplicateEventName]: () => {
    const first = eventTrigger('paid', 'order-paid');
    const second = eventTrigger('paid_again', 'order-paid');
    return cleanFlow(
      [first, second],
      [link(first, PortName.Next, answer), link(second, PortName.Next, answer)],
    );
  },
  [FlowIssueCode.InvalidCron]: () => {
    const schedule = scheduleTrigger('nightly', '61 * * * *');
    return cleanFlow([schedule], [link(schedule, PortName.Next, answer)]);
  },
  [FlowIssueCode.InvalidTimeZone]: () => {
    const schedule = scheduleTrigger('nightly');
    return cleanFlow(
      [
        {
          ...schedule,
          config: {
            ...schedule.config,
            schedule: { ...schedule.config.schedule, timeZone: 'Mars/Base' },
          },
        },
      ],
      [link(schedule, PortName.Next, answer)],
    );
  },
  [FlowIssueCode.DuplicateOutputField]: () => withStep(agent('more', [field('messages')])),
  [FlowIssueCode.PortNotConnected]: () => withStep(apiRequest('load')),
  [FlowIssueCode.NoErrorPath]: () => withStep(agent('more')),
  [FlowIssueCode.WaitForResultWithoutReply]: () => {
    const event = eventTrigger('paid', 'order-paid', {}, ReplyMode.WaitForResult);
    const load = apiRequest('load');
    return cleanFlow([event, load], [link(event, PortName.Next, load)]);
  },
  [FlowIssueCode.NoFallbackMessage]: () => {
    const route = router('route', [rule('first', 'today', ConditionOperator.IsNotEmpty)]);
    const quiet = escalation('quiet', 'help', '  ');
    return cleanFlow(
      [route, quiet],
      [
        link(reply, PortName.Next, route),
        link(route, 'first', quiet),
        link(route, PortName.Else, handoff),
      ],
    );
  },
};

const codes = (input: unknown): FlowIssueCode[] => validateFlow(input).map((issue) => issue.code);

describe('validateFlow', () => {
  it('finds nothing in the clean base flow', () => {
    expect(validateFlow(cleanFlow())).toEqual([]);
  });

  it.each(exampleFlows.map((flow, index) => [index, flow]))(
    'finds no errors in example flow %i',
    (_index, flow) => {
      expect(
        validateFlow(flow).filter((issue) => issue.severity === FlowIssueSeverity.Error),
      ).toEqual([]);
    },
  );

  it('warns about the guard without an error path in the FAQ example', () => {
    expect(validateFlow(faqWithHandOffFlow)).toEqual([
      expect.objectContaining({ code: FlowIssueCode.NoErrorPath, nodeId: 'n_guard' }),
    ]);
  });

  it.each(Object.values(FlowIssueCode))('reports %s', (code) => {
    expect(codes(failingFlows[code]())).toContain(code);
  });

  it('gives warnings the warning severity', () => {
    const issue = validateFlow(failingFlows[FlowIssueCode.NoErrorPath]()).find(
      (candidate) => candidate.code === FlowIssueCode.NoErrorPath,
    );
    expect(issue).toMatchObject({ severity: FlowIssueSeverity.Warning, nodeId: 'n_more' });
  });

  it('points a schema issue at its node and path', () => {
    expect(validateFlow(failingFlows[FlowIssueCode.InvalidDocument]())).toContainEqual(
      expect.objectContaining({
        code: FlowIssueCode.InvalidDocument,
        nodeId: answer.id,
        path: ['nodes', '0', 'config'],
      }),
    );
  });

  it('points a reference issue at the field and the position in the template', () => {
    expect(validateFlow(failingFlows[FlowIssueCode.UnknownVariable]())).toContainEqual({
      code: FlowIssueCode.UnknownVariable,
      severity: FlowIssueSeverity.Error,
      nodeId: 'n_more',
      edgeId: null,
      path: ['content', 'text'],
      params: { variable: 'missing.value', start: 3, end: 20 },
    });
  });

  it('checks enum values in conditions', () => {
    const topic = completion('topic', CompletionRole.Guard, [field('name', OutputFieldType.Enum)]);
    const route = router('route', [rule('first', 'topic.name', ConditionOperator.Eq, 'c')]);
    const flow = cleanFlow(
      [topic, route],
      [
        link(reply, PortName.Next, topic),
        link(topic, PortName.Next, route),
        link(topic, PortName.Error, handoff),
        link(route, 'first', handoff),
        link(route, PortName.Else, handoff),
      ],
    );
    expect(codes(flow)).toEqual([FlowIssueCode.InvalidConditionValue]);
  });

  it('does not check references on unreachable steps', () => {
    expect(codes(cleanFlow([sendText('orphan', '{{missing}}')]))).toEqual([
      FlowIssueCode.UnreachableNode,
    ]);
  });
});

describe('hasBlockingIssues', () => {
  it('is true only when an issue is an error', () => {
    expect(hasBlockingIssues(validateFlow(cleanFlow()))).toBe(false);
    expect(hasBlockingIssues(validateFlow(failingFlows[FlowIssueCode.NoErrorPath]()))).toBe(false);
    expect(hasBlockingIssues(validateFlow(failingFlows[FlowIssueCode.Cycle]()))).toBe(true);
  });
});
