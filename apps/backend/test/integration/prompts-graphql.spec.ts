import { IdPrefix } from '@agent-ic/contracts';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import { ListPromptsByFoldersUseCase } from '@/modules/prompts/use-cases/list-prompts-by-folders.use-case';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { ConnectionParam } from '@/platform/graphql-server/constants/connection-param.constants';
import { IdService } from '@/platform/ids/services/id.service';
import { newFolder, newPrompt } from '@test/support/fixtures/prompts.fixture';
import {
  seedOwner,
  startSubscriptionsApi,
  stopSubscriptionsApi,
} from '@test/support/helpers/graphql-subscriptions.helpers';
import { queryOverWebSocket } from '@test/support/helpers/request-layer.helpers';
import type {
  SubscriptionsApi,
  TestMember,
} from '@test/support/typedefs/graphql-subscriptions.typedefs';

const PROMPT_LIBRARY_QUERY = `query PromptLibrary {
  promptFolders {
    id
    name
    prompts {
      id
      name
    }
  }
}`;

describe('the prompt library through graphql', () => {
  let api: SubscriptionsApi;
  let owner: TestMember;

  const graphql = async (query: string) =>
    (
      await queryOverWebSocket(api.app, query, {
        [ConnectionParam.Authorization]: `Bearer ${owner.accessToken}`,
        [ConnectionParam.WorkspaceId]: owner.publicWorkspaceId,
      })
    ).data;

  const publicFolderId = (folderId: string): string =>
    api.app.get(IdService).toPublic(IdPrefix.PromptFolder, folderId);

  const publicPromptId = (promptId: string): string =>
    api.app.get(IdService).toPublic(IdPrefix.Prompt, promptId);

  const seedFolder = async (name: string): Promise<string> => {
    const folderId = api.app.get(IdService).generate();
    await api.app
      .get(TenantTransactionService)
      .run(owner.workspaceId, () =>
        api.app
          .get(PromptFoldersRepository)
          .insert(newFolder(folderId, owner.workspaceId, { name })),
      );
    return folderId;
  };

  const seedPrompt = async (folderId: string, name: string): Promise<string> => {
    const promptId = api.app.get(IdService).generate();
    await api.app
      .get(TenantTransactionService)
      .run(owner.workspaceId, () =>
        api.app
          .get(PromptsRepository)
          .insert(newPrompt(promptId, owner.workspaceId, folderId, { name })),
      );
    return promptId;
  };

  beforeAll(async () => {
    api = await startSubscriptionsApi();
    owner = await seedOwner(api);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  afterAll(async () => {
    await stopSubscriptionsApi(api);
  });

  it('nests the prompts of every folder and loads them in one batch', async () => {
    const guards = await seedFolder('Guards & tags');
    const qa = await seedFolder('Q&A');
    const receptionist = await seedPrompt(qa, 'Receptionist');
    const giftCard = await seedPrompt(qa, 'Gift card');
    const conversationGuard = await seedPrompt(guards, 'Conversation guard');
    const listByFolders = vi.spyOn(api.app.get(ListPromptsByFoldersUseCase), 'execute');

    const read = await graphql(PROMPT_LIBRARY_QUERY);

    const folders = Object(read?.['promptFolders']) as readonly unknown[];
    expect(folders).toHaveLength(2);
    expect(folders).toEqual(
      expect.arrayContaining([
        {
          id: publicFolderId(guards),
          name: 'Guards & tags',
          prompts: [{ id: publicPromptId(conversationGuard), name: 'Conversation guard' }],
        },
        {
          id: publicFolderId(qa),
          name: 'Q&A',
          prompts: expect.arrayContaining([
            { id: publicPromptId(receptionist), name: 'Receptionist' },
            { id: publicPromptId(giftCard), name: 'Gift card' },
          ]),
        },
      ]),
    );
    expect(listByFolders).toHaveBeenCalledTimes(1);
    expect(listByFolders.mock.calls[0]?.[1]).toEqual(
      expect.arrayContaining([publicFolderId(guards), publicFolderId(qa)]),
    );
  });
});
