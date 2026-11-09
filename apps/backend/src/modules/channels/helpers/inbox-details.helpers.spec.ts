import { IdPrefix } from '@agent-ic/contracts';
import {
  AGENT_OUTCOME_REASON_FIELD_NAME,
  AgentExitKind,
  NodeType,
  NotifyChannel,
  RecipientsKind,
} from '@agent-ic/flow';
import { describe, expect, it } from 'vitest';
import {
  escalationNotifyOf,
  guardOf,
  handlerOf,
  runOf,
} from '@/modules/channels/helpers/inbox-details.helpers';
import { ConversationMode, MessageAuthor, MessageSystemEvent } from '@/modules/conversations';
import type { Message } from '@/modules/conversations';
import { ROOT_BRANCH_KEY, RunStatus, RunStepStatus, RunTrigger } from '@/modules/runs';
import type { Run, RunStep } from '@/modules/runs';
import { IdService } from '@/platform/ids/services/id.service';
import { TEST_ROUTE_RULE_ID } from '@test/support/constants/runs-testing.constants';
import {
  agentNode,
  completionNode,
  escalateNode,
  routerNode,
  stepFlow,
} from '@test/support/fixtures/runs.fixture';

const AT = new Date('2026-11-01T14:03:00.000Z');
const END = new Date('2026-11-01T14:03:00.600Z');
const GUARD_ID = 'guard';
const ROUTER_ID = 'router';
const AGENT_ID = 'agent';

const ids = new IdService({
  now: () => AT,
  sleep: () => Promise.resolve(),
});

const step = (
  nodeId: string,
  nodeKey: string,
  output: Readonly<Record<string, unknown>>,
  port: string | null = null,
): RunStep => ({
  id: '11111111-1111-4111-8111-111111111111',
  workspaceId: '22222222-2222-4222-8222-222222222222',
  runId: '33333333-3333-4333-8333-333333333333',
  nodeId,
  nodeKey,
  branchKey: ROOT_BRANCH_KEY,
  status: RunStepStatus.Succeeded,
  attempt: 1,
  input: {},
  output,
  port,
  error: null,
  toolCalls: null,
  transcript: null,
  startedAt: AT,
  finishedAt: END,
});

const run = (): Run => ({
  id: '33333333-3333-4333-8333-333333333333',
  workspaceId: '22222222-2222-4222-8222-222222222222',
  conversationId: '44444444-4444-4444-8444-444444444444',
  agentId: '55555555-5555-4555-8555-555555555555',
  versionId: '66666666-6666-4666-8666-666666666666',
  mode: ConversationMode.Live,
  trigger: RunTrigger.Message,
  triggerNodeId: null,
  triggerInput: null,
  status: RunStatus.Escalated,
  lastCoveredMessageId: '77777777-7777-4777-8777-777777777777',
  error: null,
  traceId: null,
  createdAt: AT,
  startedAt: AT,
  finishedAt: END,
});

const message = (
  id: string,
  event: MessageSystemEvent,
  authorUserId: string | null,
  createdAt: Date,
): Message => ({
  id,
  workspaceId: '22222222-2222-4222-8222-222222222222',
  conversationId: '44444444-4444-4444-8444-444444444444',
  author: MessageAuthor.System,
  authorUserId,
  systemEvent: event,
  text: '',
  quickReplies: [],
  externalId: null,
  idempotencyKey: null,
  delivery: null,
  runId: null,
  createdAt,
});

describe('inbox details helpers', () => {
  it('takes the guard label and reason from the completion step that needs a person', () => {
    const flow = stepFlow([completionNode(GUARD_ID, 'Conversation guard')], []);

    const guard = guardOf(
      [step(GUARD_ID, 'Conversation guard', { needs_human: true, reason: 'Payment problem' })],
      flow,
    );

    expect(guard).toEqual({
      label: 'Conversation guard',
      nodeType: NodeType.Completion,
      reason: 'Payment problem',
    });
  });

  it('builds a guard from an agent handoff when there is no completion guard', () => {
    const flow = stepFlow(
      [
        agentNode(AGENT_ID, 'Answer the question', {
          exits: { end: null, handoff: { when: 'Customer asks for a person' } },
        }),
      ],
      [],
    );

    const guard = guardOf(
      [
        step(
          AGENT_ID,
          'Answer the question',
          { [AGENT_OUTCOME_REASON_FIELD_NAME]: 'Customer asks for a person' },
          AgentExitKind.Handoff,
        ),
      ],
      flow,
    );

    expect(guard).toEqual({
      label: '',
      nodeType: NodeType.Agent,
      reason: 'Customer asks for a person',
    });
  });

  it('returns no guard when the completion step does not need a person', () => {
    const flow = stepFlow([completionNode(GUARD_ID, 'Conversation guard')], []);

    expect(
      guardOf([step(GUARD_ID, 'Conversation guard', { needs_human: false })], flow),
    ).toBeNull();
  });

  it('names the run steps and shows the chosen router branch', () => {
    const flow = stepFlow(
      [completionNode(GUARD_ID, 'Conversation guard'), routerNode(ROUTER_ID, 'Needs a person?')],
      [],
    );

    const view = runOf(
      run(),
      [
        step(GUARD_ID, 'Conversation guard', { needs_human: true }),
        step(ROUTER_ID, 'Needs a person?', {}, TEST_ROUTE_RULE_ID),
      ],
      flow,
      ids,
      null,
    );

    expect(view).toMatchObject({
      id: ids.toPublic(IdPrefix.Run, run().id),
      durationMs: 600,
      steps: [
        {
          label: 'Conversation guard',
          nodeType: NodeType.Completion,
          value: 'needs_human = true',
        },
        {
          label: 'Needs a person?',
          nodeType: NodeType.Router,
          value: `→ ${TEST_ROUTE_RULE_ID}`,
        },
      ],
    });
  });

  it('returns the recipients and channels of the escalation node', () => {
    const node = escalateNode({ kind: RecipientsKind.Operators });
    const flow = stepFlow([node], []);

    expect(escalationNotifyOf([step(node.id, node.key, {})], flow)).toEqual({
      recipients: { kind: RecipientsKind.Operators },
      channels: [NotifyChannel.InPlatform],
    });
  });

  it('shows the latest takeover and the hand back that followed it', () => {
    const names = new Map([['operator', 'Pavlo']]);
    const tookOverAt = new Date('2026-11-01T14:05:00.000Z');
    const handedBackAt = new Date('2026-11-01T14:10:00.000Z');

    expect(
      handlerOf(
        [
          message('a', MessageSystemEvent.TookOver, 'operator', tookOverAt),
          message('b', MessageSystemEvent.HandedBack, 'operator', handedBackAt),
        ],
        null,
        names,
      ),
    ).toEqual({ name: 'Pavlo', since: tookOverAt, until: handedBackAt });
  });
});
