import type { TestingModule } from '@nestjs/testing';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  AgentVersionKind,
  DRAFT_INITIAL_REVISION,
} from '@/modules/agents/constants/agent.constants';
import { AgentFlowHasBlockingIssuesError } from '@/modules/agents/errors/agent-flow-has-blocking-issues.error';
import { AgentNotFoundError } from '@/modules/agents/errors/agent-not-found.error';
import { AgentVersionsRepository } from '@/modules/agents/repositories/agent-versions.repository';
import { AgentsRepository } from '@/modules/agents/repositories/agents.repository';
import { AgentPublishingService } from '@/modules/agents/services/agent-publishing.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import {
  AGENTS_TEST_LATER,
  TEST_EDITOR_ID,
  TEST_VERSION_NOTE,
} from '@test/support/constants/agents-testing.constants';
import { emptyFlow, triggerFlow } from '@test/support/fixtures/agents.fixture';
import {
  createAgentsTestingModule,
  seedAgentWithDraft,
} from '@test/support/helpers/agents-testing.helpers';

const FIRST_NUMBER = 1;
const SECOND_NUMBER = 2;

describe('AgentPublishingService', () => {
  let testingModule: TestingModule;
  let service: AgentPublishingService;
  let agents: AgentsRepository;
  let versions: AgentVersionsRepository;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createAgentsTestingModule();
    service = testingModule.get(AgentPublishingService);
    agents = testingModule.get(AgentsRepository);
    versions = testingModule.get(AgentVersionsRepository);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  it('copies the draft into the first published version and makes it live', async () => {
    const workspaceId = ids.generate();
    const authorId = ids.generate();
    const { agentId, draftId } = await seedAgentWithDraft(testingModule, workspaceId);

    const published = await tenants.run(workspaceId, () =>
      service.publish(workspaceId, agentId, { authorId }),
    );

    const agent = await tenants.run(workspaceId, () => agents.findById(workspaceId, agentId));
    const stored = await tenants.run(workspaceId, () =>
      versions.findById(workspaceId, published.id),
    );
    expect(published).toMatchObject({
      kind: AgentVersionKind.Published,
      number: FIRST_NUMBER,
      authorId,
      flow: triggerFlow(),
    });
    expect(published.publishedAt).not.toBeNull();
    expect(stored).toEqual(published);
    expect(agent).toMatchObject({ liveVersionId: published.id, draftVersionId: draftId });
  });

  it('numbers each publish after the last and keeps the draft', async () => {
    const workspaceId = ids.generate();
    const authorId = ids.generate();
    const { agentId, draftId } = await seedAgentWithDraft(testingModule, workspaceId);

    const first = await tenants.run(workspaceId, () =>
      service.publish(workspaceId, agentId, { authorId }),
    );
    const second = await tenants.run(workspaceId, () =>
      service.publish(workspaceId, agentId, { authorId }),
    );

    const draft = await tenants.run(workspaceId, () => versions.findDraft(workspaceId, agentId));
    const agent = await tenants.run(workspaceId, () => agents.findById(workspaceId, agentId));
    expect([first.number, second.number]).toEqual([FIRST_NUMBER, SECOND_NUMBER]);
    expect(draft).toMatchObject({ id: draftId, kind: AgentVersionKind.Draft, number: null });
    expect(agent?.liveVersionId).toBe(second.id);
  });

  it('never changes a published version when the draft changes', async () => {
    const workspaceId = ids.generate();
    const { agentId, draftId } = await seedAgentWithDraft(testingModule, workspaceId);
    const published = await tenants.run(workspaceId, () =>
      service.publish(workspaceId, agentId, { authorId: ids.generate() }),
    );

    const changed = await tenants.run(workspaceId, async () => ({
      draft: await versions.updateDraft(
        workspaceId,
        draftId,
        DRAFT_INITIAL_REVISION,
        { flow: emptyFlow(), note: TEST_VERSION_NOTE, authorId: TEST_EDITOR_ID },
        AGENTS_TEST_LATER,
      ),
      published: await versions.updateDraft(
        workspaceId,
        published.id,
        DRAFT_INITIAL_REVISION,
        { flow: emptyFlow(), note: TEST_VERSION_NOTE, authorId: TEST_EDITOR_ID },
        AGENTS_TEST_LATER,
      ),
    }));

    const stored = await tenants.run(workspaceId, () =>
      versions.findById(workspaceId, published.id),
    );
    expect(changed).toEqual({ draft: DRAFT_INITIAL_REVISION + 1, published: null });
    expect(stored).toEqual(published);
  });

  it('refuses a draft with blocking issues and writes nothing', async () => {
    const workspaceId = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceId, emptyFlow());

    const publish = tenants.run(workspaceId, () =>
      service.publish(workspaceId, agentId, { authorId: ids.generate() }),
    );

    await expect(publish).rejects.toBeInstanceOf(AgentFlowHasBlockingIssuesError);
    const agent = await tenants.run(workspaceId, () => agents.findById(workspaceId, agentId));
    const all = await tenants.run(workspaceId, () => versions.listByAgent(workspaceId, agentId));
    expect(agent?.liveVersionId).toBeNull();
    expect(all.map((version) => version.kind)).toEqual([AgentVersionKind.Draft]);
  });

  it('refuses an agent of another workspace', async () => {
    const workspaceA = ids.generate();
    const workspaceB = ids.generate();
    const { agentId } = await seedAgentWithDraft(testingModule, workspaceA);

    const publish = tenants.run(workspaceB, () =>
      service.publish(workspaceB, agentId, { authorId: ids.generate() }),
    );

    await expect(publish).rejects.toBeInstanceOf(AgentNotFoundError);
  });
});
