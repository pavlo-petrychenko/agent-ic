import { describe, expect, it } from 'vitest';
import { ConditionOperator } from '@flow/conditions/constants/condition.constants';
import { FLOW_SCHEMA_VERSION, PortName } from '@flow/document/constants/flow.constants';
import type { FlowDocument, FlowNode, PromptSource } from '@flow/document/typedefs/flow.typedefs';
import { FailureMode, WaitFor } from '@flow/nodes/constants/step.constants';
import { ReplyMode } from '@flow/nodes/constants/trigger.constants';
import { OutputFieldType } from '@flow/outputs/constants/output.constants';
import {
  PromptSourceKind,
  PromptVersionKind,
} from '@flow/references/constants/reference.constants';
import { FlowIssueCode, FlowIssueSeverity } from '@flow/validation/constants/issue.constants';
import { hasBlockingIssues, validateFlow } from '@flow/validation/helpers/validation.helpers';
import { exampleFlows, faqWithHandOffFlow } from '@test/support/fixtures/example-flow.fixture';
import {
  agent,
  apiRequest,
  backgroundLink,
  completion,
  escalation,
  eventTrigger,
  field,
  flowOf,
  link,
  messageTrigger,
  parallel,
  replyAndScoreFlow,
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
  const node = completion(key);
  return node;
};

const REFERENCE_CHECKER_CODES = [FlowIssueCode.MissingPromptVersion] as const;
type ValidationIssueCode = Exclude<FlowIssueCode, (typeof REFERENCE_CHECKER_CODES)[number]>;

const validationCodes = Object.values(FlowIssueCode).filter(
  (code): code is ValidationIssueCode =>
    !REFERENCE_CHECKER_CODES.some((checkerCode) => checkerCode === code),
);

const failingFlows: Record<ValidationIssueCode, () => unknown> = {
  [FlowIssueCode.UnsupportedVersion]: () => ({
    ...cleanFlow(),
    schemaVersion: FLOW_SCHEMA_VERSION + 1,
  }),
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
  [FlowIssueCode.MissingPrompt]: () => withStep(agent('more', [], null)),
  [FlowIssueCode.MissingModel]: () =>
    withStep({ ...agent('more'), config: { ...agent('more').config, model: null } }),
  [FlowIssueCode.NoReplyStep]: () =>
    flowOf([trigger, answer], [link(trigger, PortName.Next, answer)]),
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
  [FlowIssueCode.EscalationInBackgroundBranch]: () => {
    const { flow, scorer } = replyAndScoreFlow();
    const stop = escalation('stop');
    return flowOf([...flow.nodes, stop], [...flow.edges, link(scorer, PortName.Error, stop)]);
  },
  [FlowIssueCode.BackgroundOutsideBranches]: () =>
    cleanFlow([], [{ ...link(reply, PortName.Next, handoff), background: true }]),
  [FlowIssueCode.NoWaitedBranch]: () => {
    const { flow, fork, writer } = replyAndScoreFlow();
    return flowOf(
      flow.nodes,
      flow.edges.map((edge) =>
        edge.source === fork.id && edge.target === writer.id ? backgroundLink(fork, writer) : edge,
      ),
    );
  },
  [FlowIssueCode.TooFewBranches]: () => branchFlow([guard('left')]),
  [FlowIssueCode.TooManyBranches]: () =>
    branchFlow(['a', 'b', 'c', 'd', 'e', 'f'].map((key) => guard(key))),
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

  it('warns only about the waited completion without an error path in the FAQ example', () => {
    expect(validateFlow(faqWithHandOffFlow)).toEqual([
      expect.objectContaining({ code: FlowIssueCode.NoErrorPath, nodeId: 'n_guard' }),
    ]);
  });

  it.each(validationCodes)('reports %s', (code) => {
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
    const topic = completion('topic', [field('name', OutputFieldType.Enum)]);
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

describe('background branches', () => {
  it('accepts a waited reply branch with an escalation beside a background scorer', () => {
    expect(hasBlockingIssues(validateFlow(replyAndScoreFlow().flow))).toBe(false);
  });

  it('points the escalation refused in a background branch at its step', () => {
    expect(validateFlow(failingFlows[FlowIssueCode.EscalationInBackgroundBranch]())).toContainEqual(
      expect.objectContaining({
        code: FlowIssueCode.EscalationInBackgroundBranch,
        severity: FlowIssueSeverity.Error,
        nodeId: 'n_stop',
      }),
    );
  });

  it('does not warn about a failure nothing handles in the steps of a background branch', () => {
    const { flow, save } = replyAndScoreFlow();
    const recheck = completion('recheck');
    const extended = flowOf(
      [...flow.nodes, recheck],
      [...flow.edges, link(save, PortName.Next, recheck)],
    );
    expect(codes(flow)).not.toContain(FlowIssueCode.NoErrorPath);
    expect(codes(extended)).not.toContain(FlowIssueCode.NoErrorPath);
  });

  it('warns about the same completion in a waited branch', () => {
    const { flow, fork, scorer } = replyAndScoreFlow();
    const waited = flow.edges.map((edge) =>
      edge.target === scorer.id ? link(fork, PortName.Branches, scorer) : edge,
    );
    expect(validateFlow(flowOf(flow.nodes, waited))).toContainEqual(
      expect.objectContaining({ code: FlowIssueCode.NoErrorPath, nodeId: scorer.id }),
    );
  });

  it('refuses a send message step in a waited branch', () => {
    const { flow, writer } = replyAndScoreFlow();
    const early = sendText('early', 'One moment');
    expect(
      codes(flowOf([...flow.nodes, early], [...flow.edges, link(writer, PortName.Next, early)])),
    ).toContain(FlowIssueCode.SendInParallelBranch);
  });

  it('refuses a send message step in a background branch', () => {
    const { flow, save } = replyAndScoreFlow();
    const late = sendText('late', 'Thanks');
    expect(
      codes(flowOf([...flow.nodes, late], [...flow.edges, link(save, PortName.Next, late)])),
    ).toContain(FlowIssueCode.SendInParallelBranch);
  });
});

describe('prompt source checks', () => {
  const withPrompt = (prompt: PromptSource) => withStep(agent('more', [], prompt));

  it('treats a blank inline prompt as missing', () => {
    expect(codes(withPrompt({ kind: PromptSourceKind.Inline, text: '  ' }))).toContain(
      FlowIssueCode.MissingPrompt,
    );
  });

  it('checks the variables of an inline prompt', () => {
    expect(
      validateFlow(withPrompt({ kind: PromptSourceKind.Inline, text: 'Use {{nope}}' })),
    ).toContainEqual(
      expect.objectContaining({
        code: FlowIssueCode.UnknownVariable,
        nodeId: 'n_more',
        path: ['prompt', 'text'],
      }),
    );
  });

  it('accepts a library prompt without checking that it exists', () => {
    const prompt: PromptSource = {
      kind: PromptSourceKind.Library,
      promptRef: 'prm_more',
      pin: { kind: PromptVersionKind.Pinned, number: 2 },
    };
    expect(hasBlockingIssues(validateFlow(withPrompt(prompt)))).toBe(false);
  });
});

describe('the reply check', () => {
  it('points at the message trigger that reaches no send message step', () => {
    expect(validateFlow(failingFlows[FlowIssueCode.NoReplyStep]())).toContainEqual(
      expect.objectContaining({
        code: FlowIssueCode.NoReplyStep,
        severity: FlowIssueSeverity.Error,
        nodeId: trigger.id,
      }),
    );
  });

  it('ignores flows started by an event or a schedule', () => {
    const schedule = scheduleTrigger('nightly');
    const flow = flowOf([schedule, answer], [link(schedule, PortName.Next, answer)]);
    expect(codes(flow)).not.toContain(FlowIssueCode.NoReplyStep);
  });

  it('does not count a send message step that only another trigger reaches', () => {
    const schedule = scheduleTrigger('nightly');
    const flow = flowOf(
      [trigger, answer, schedule, reply],
      [link(trigger, PortName.Next, answer), link(schedule, PortName.Next, reply)],
    );
    expect(codes(flow)).toContain(FlowIssueCode.NoReplyStep);
  });
});

describe('hasBlockingIssues', () => {
  it('is true only when an issue is an error', () => {
    expect(hasBlockingIssues(validateFlow(cleanFlow()))).toBe(false);
    expect(hasBlockingIssues(validateFlow(failingFlows[FlowIssueCode.NoErrorPath]()))).toBe(false);
    expect(hasBlockingIssues(validateFlow(failingFlows[FlowIssueCode.Cycle]()))).toBe(true);
  });
});
