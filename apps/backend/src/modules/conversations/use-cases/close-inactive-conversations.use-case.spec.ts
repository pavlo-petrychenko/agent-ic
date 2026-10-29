import { NO_FLOW_SETTINGS } from '@agent-ic/flow';
import type { FlowDocument } from '@agent-ic/flow';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import {
  AgentVersionKind,
  AgentVersionsRepository,
  AutoCloseVersionsRepository,
} from '@/modules/agents';
import {
  CloseReason,
  ConversationMode,
  ConversationState,
} from '@/modules/conversations/constants/conversation.constants';
import { MessageAuthor } from '@/modules/conversations/constants/message.constants';
import type {
  Conversation,
  NewConversation,
} from '@/modules/conversations/typedefs/conversation.typedefs';
import { CloseInactiveConversationsUseCase } from '@/modules/conversations/use-cases/close-inactive-conversations.use-case';
import { SystemActorRequiredError } from '@/platform/context/errors/system-actor-required.error';
import {
  AUTO_CLOSE_LONGER_TEST_MINUTES,
  AUTO_CLOSE_SILENCE_MS,
  AUTO_CLOSE_TEST_MINUTES,
} from '@test/support/constants/conversations-testing.constants';
import { emptyFlow, newVersion } from '@test/support/fixtures/agents.fixture';
import {
  incomingMessage,
  newConversation,
  workspaceSystemCtx,
} from '@test/support/fixtures/conversation.fixture';
import { anonymousCtx, systemCtx } from '@test/support/fixtures/identity.fixture';
import {
  createConversationsTestbed,
  seedAgent,
  seedMessage,
} from '@test/support/helpers/conversations-testing.helpers';
import { seedRunRow } from '@test/support/helpers/parent-rows.helpers';
import type { ConversationsTestbed } from '@test/support/typedefs/conversations-testing.typedefs';

interface AutoCloseAgent {
  readonly workspaceId: string;
  readonly agentId: string;
  readonly publishedVersionId: string;
}

interface AutoCloseSetup {
  readonly live: number | null;
  readonly draft: number | null;
}

describe('CloseInactiveConversationsUseCase', () => {
  let testbed: ConversationsTestbed;
  let closeInactive: CloseInactiveConversationsUseCase;
  let versions: AgentVersionsRepository;

  const flowClosingAfter = (afterMinutes: number | null): FlowDocument => ({
    ...emptyFlow(),
    settings: {
      ...NO_FLOW_SETTINGS,
      autoClose: afterMinutes === null ? null : { afterMinutes },
    },
  });

  const seedAutoCloseAgent = async ({ live, draft }: AutoCloseSetup): Promise<AutoCloseAgent> => {
    const workspaceId = testbed.ids.generate();
    const agentId = await seedAgent(testbed, workspaceId);
    const publishedVersionId = testbed.ids.generate();
    await testbed.tenants.run(workspaceId, async () => {
      await versions.insert(
        newVersion(publishedVersionId, workspaceId, agentId, {
          kind: AgentVersionKind.Published,
          number: 1,
          flow: flowClosingAfter(live),
          publishedAt: testbed.clock.now(),
        }),
      );
      await testbed.agents.setLiveVersion(workspaceId, agentId, publishedVersionId);
      const draftVersion = await versions.insert(
        newVersion(testbed.ids.generate(), workspaceId, agentId, {
          flow: flowClosingAfter(draft),
        }),
      );
      await testbed.agents.setDraftVersion(workspaceId, agentId, draftVersion.id);
    });
    return { workspaceId, agentId, publishedVersionId };
  };

  const seedChat = async (
    agent: AutoCloseAgent,
    overrides: Partial<NewConversation> = {},
  ): Promise<NewConversation> => {
    const conversation: NewConversation = {
      ...newConversation(testbed, agent.workspaceId),
      agentId: agent.agentId,
      endUserExternalId: testbed.ids.generate(),
      ...overrides,
    };
    await testbed.tenants.run(agent.workspaceId, () => testbed.conversations.insert(conversation));
    return conversation;
  };

  const simulationOf = (versionId: string | null): Partial<NewConversation> => ({
    mode: ConversationMode.Simulation,
    simulationVersionId: versionId,
  });

  const read = async (conversation: NewConversation): Promise<Conversation | null> =>
    testbed.tenants.run(conversation.workspaceId, () =>
      testbed.conversations.findById(conversation.workspaceId, conversation.id),
    );

  const stateOf = async (conversation: NewConversation): Promise<ConversationState | null> =>
    (await read(conversation))?.state ?? null;

  const sweep = (): Promise<void> => closeInactive.execute(systemCtx());

  beforeAll(async () => {
    testbed = await createConversationsTestbed();
    closeInactive = testbed.module.get(CloseInactiveConversationsUseCase);
    versions = testbed.module.get(AgentVersionsRepository);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await testbed.module.close();
  });

  it('closes an agent-active chat silent for longer than the setting, with reason inactivity', async () => {
    const agent = await seedAutoCloseAgent({ live: AUTO_CLOSE_TEST_MINUTES, draft: null });
    const silent = await seedChat(agent);
    testbed.clock.advanceBy(AUTO_CLOSE_SILENCE_MS);
    const fresh = await seedChat(agent);

    await sweep();

    expect(await read(silent)).toMatchObject({
      state: ConversationState.Closed,
      closeReason: CloseReason.Inactivity,
      closedAt: testbed.clock.now(),
    });
    expect(await stateOf(fresh)).toBe(ConversationState.AgentActive);
  });

  it('never closes a waiting or handled chat', async () => {
    const agent = await seedAutoCloseAgent({ live: AUTO_CLOSE_TEST_MINUTES, draft: null });
    const waiting = await seedChat(agent, { state: ConversationState.Waiting });
    const handled = await seedChat(agent, { state: ConversationState.Handled });
    testbed.clock.advanceBy(AUTO_CLOSE_SILENCE_MS);

    await sweep();

    expect(await stateOf(waiting)).toBe(ConversationState.Waiting);
    expect(await stateOf(handled)).toBe(ConversationState.Handled);
  });

  it('skips a chat with a run in progress', async () => {
    const agent = await seedAutoCloseAgent({ live: AUTO_CLOSE_TEST_MINUTES, draft: null });
    const busy = await seedChat(agent);
    const runId = await seedRunRow(testbed.module, busy);
    await testbed.tenants.run(agent.workspaceId, () =>
      testbed.runs.claimRun(agent.workspaceId, busy.id, runId),
    );
    testbed.clock.advanceBy(AUTO_CLOSE_SILENCE_MS);

    await sweep();

    expect(await stateOf(busy)).toBe(ConversationState.AgentActive);
  });

  it('counts from the last customer message, not from agent replies', async () => {
    const agent = await seedAutoCloseAgent({ live: AUTO_CLOSE_TEST_MINUTES, draft: null });
    const answeredLate = await seedChat(agent);
    const writtenLate = await seedChat(agent);
    testbed.clock.advanceBy(AUTO_CLOSE_SILENCE_MS);
    await seedMessage(testbed, answeredLate, { author: MessageAuthor.Agent });
    await seedMessage(testbed, writtenLate);

    await sweep();

    expect(await stateOf(answeredLate)).toBe(ConversationState.Closed);
    expect(await stateOf(writtenLate)).toBe(ConversationState.AgentActive);
  });

  it('uses the live settings for live chats and the simulated version for test chats', async () => {
    const liveOnly = await seedAutoCloseAgent({ live: AUTO_CLOSE_TEST_MINUTES, draft: null });
    const draftOnly = await seedAutoCloseAgent({ live: null, draft: AUTO_CLOSE_TEST_MINUTES });
    const liveChat = await seedChat(liveOnly);
    const draftTestOfLiveOnly = await seedChat(liveOnly, simulationOf(null));
    const pinnedTestOfLiveOnly = await seedChat(
      liveOnly,
      simulationOf(liveOnly.publishedVersionId),
    );
    const liveChatOfDraftOnly = await seedChat(draftOnly);
    const draftTest = await seedChat(draftOnly, simulationOf(null));
    const pinnedTestOfDraftOnly = await seedChat(
      draftOnly,
      simulationOf(draftOnly.publishedVersionId),
    );
    testbed.clock.advanceBy(AUTO_CLOSE_SILENCE_MS);

    await sweep();

    expect(await stateOf(liveChat)).toBe(ConversationState.Closed);
    expect(await stateOf(draftTestOfLiveOnly)).toBe(ConversationState.AgentActive);
    expect(await stateOf(pinnedTestOfLiveOnly)).toBe(ConversationState.Closed);
    expect(await stateOf(liveChatOfDraftOnly)).toBe(ConversationState.AgentActive);
    expect(await stateOf(draftTest)).toBe(ConversationState.Closed);
    expect(await stateOf(pinnedTestOfDraftOnly)).toBe(ConversationState.AgentActive);
  });

  it('waits for the duration each version sets', async () => {
    const agent = await seedAutoCloseAgent({
      live: AUTO_CLOSE_LONGER_TEST_MINUTES,
      draft: AUTO_CLOSE_TEST_MINUTES,
    });
    const liveChat = await seedChat(agent);
    const draftTest = await seedChat(agent, simulationOf(null));
    testbed.clock.advanceBy(AUTO_CLOSE_SILENCE_MS);

    await sweep();

    expect(await stateOf(liveChat)).toBe(ConversationState.AgentActive);
    expect(await stateOf(draftTest)).toBe(ConversationState.Closed);
  });

  it('changes nothing on a second sweep', async () => {
    const agent = await seedAutoCloseAgent({ live: AUTO_CLOSE_TEST_MINUTES, draft: null });
    const silent = await seedChat(agent);
    testbed.clock.advanceBy(AUTO_CLOSE_SILENCE_MS);
    await sweep();
    const first = await read(silent);
    testbed.clock.advanceBy(AUTO_CLOSE_SILENCE_MS);

    await sweep();

    expect(await read(silent)).toEqual(first);
  });

  it('keeps a chat open when the customer writes while the sweep runs', async () => {
    const agent = await seedAutoCloseAgent({ live: AUTO_CLOSE_TEST_MINUTES, draft: null });
    const silent = await seedChat(agent);
    testbed.clock.advanceBy(AUTO_CLOSE_SILENCE_MS);
    const autoCloseVersions = testbed.module.get(AutoCloseVersionsRepository);
    const listEnabled = autoCloseVersions.listEnabled.bind(autoCloseVersions);
    vi.spyOn(autoCloseVersions, 'listEnabled').mockImplementationOnce(async () => {
      const enabled = await listEnabled();
      testbed.clock.advanceBy(AUTO_CLOSE_SILENCE_MS);
      await testbed.incoming.handleIncomingMessage(
        workspaceSystemCtx(agent.workspaceId),
        incomingMessage(agent.workspaceId, agent.agentId, {
          endUserExternalId: silent.endUserExternalId,
        }),
      );
      return enabled;
    });

    await sweep();

    expect(await stateOf(silent)).toBe(ConversationState.AgentActive);
  });

  it('runs only as the system actor', async () => {
    await expect(closeInactive.execute(anonymousCtx())).rejects.toBeInstanceOf(
      SystemActorRequiredError,
    );
  });
});
