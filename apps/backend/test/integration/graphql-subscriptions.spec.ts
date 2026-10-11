import { ErrorReason, WorkspaceRole } from '@agent-ic/contracts';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { ConversationMode } from '@/modules/conversations';
import { ROOT_BRANCH_KEY, RunStepStatus } from '@/modules/runs';
import {
  publicRunId,
  publicStepId,
  publishStep,
  seedMember,
  seedOwner,
  seedRun,
  startSubscriptionsApi,
  stopSubscriptionsApi,
  subscribeToRunSteps,
  waitForListener,
} from '@test/support/helpers/graphql-subscriptions.helpers';
import type {
  LiveSubscription,
  SubscriptionsApi,
  TestMember,
} from '@test/support/typedefs/graphql-subscriptions.typedefs';

describe('graphql subscriptions over graphql-ws', () => {
  let api: SubscriptionsApi;
  let owner: TestMember;
  const open: LiveSubscription[] = [];

  const subscribe = (member: TestMember, runId: string): LiveSubscription => {
    const subscription = subscribeToRunSteps(api, member, publicRunId(api, runId));
    open.push(subscription);
    return subscription;
  };

  const refusal = (reason: ErrorReason) => ({
    done: false,
    value: {
      errors: [expect.objectContaining({ extensions: expect.objectContaining({ reason }) })],
    },
  });

  beforeAll(async () => {
    api = await startSubscriptionsApi();
    owner = await seedOwner(api);
  });

  afterEach(async () => {
    await Promise.all(open.splice(0).map((subscription) => subscription.close()));
  });

  afterAll(async () => {
    await stopSubscriptionsApi(api);
  });

  it('delivers a step event to an authorized client after the commit', async () => {
    const runId = await seedRun(api, owner.workspaceId);
    const subscription = subscribe(owner, runId);
    const received = subscription.next();
    await waitForListener(api, runId);

    const step = await publishStep(api, owner.workspaceId, runId, true);

    await expect(received).resolves.toEqual({
      done: false,
      value: {
        data: {
          runSteps: {
            runId: publicRunId(api, runId),
            stepId: publicStepId(api, step.stepId),
            nodeId: ROOT_BRANCH_KEY,
            status: RunStepStatus.Running,
          },
        },
      },
    });
  });

  it('publishes nothing from a rolled-back transaction', async () => {
    const runId = await seedRun(api, owner.workspaceId);
    const subscription = subscribe(owner, runId);
    const received = subscription.next();
    await waitForListener(api, runId);

    await publishStep(api, owner.workspaceId, runId, false);
    const committed = await publishStep(api, owner.workspaceId, runId, true);

    await expect(received).resolves.toMatchObject({
      value: { data: { runSteps: { stepId: publicStepId(api, committed.stepId) } } },
    });
  });

  it('refuses a member without the Testing permission', async () => {
    const operator = await seedMember(api, owner, WorkspaceRole.Operator);
    const runId = await seedRun(api, owner.workspaceId);

    const result = await subscribe(operator, runId).next();

    expect(result).toEqual(refusal(ErrorReason.PermissionDenied));
  });

  it('refuses a run of another workspace', async () => {
    const stranger = await seedOwner(api);
    const runId = await seedRun(api, owner.workspaceId);

    const result = await subscribe(stranger, runId).next();

    expect(result).toEqual(refusal(ErrorReason.RunNotFound));
  });

  it('refuses a live run, which belongs to the Inbox', async () => {
    const runId = await seedRun(api, owner.workspaceId, ConversationMode.Live);

    const result = await subscribe(owner, runId).next();

    expect(result).toEqual(refusal(ErrorReason.RunNotFound));
  });
});
