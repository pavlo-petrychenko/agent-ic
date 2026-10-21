import { TransactionHost } from '@nestjs-cls/transactional';
import type { TestingModule } from '@nestjs/testing';
import { eq } from 'drizzle-orm';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { promptFolders } from '@/modules/prompts/db/prompt-folders.table';
import { promptVersions } from '@/modules/prompts/db/prompt-versions.table';
import { prompts as promptsTable } from '@/modules/prompts/db/prompts.table';
import { CleanUpWorkspaceUseCase } from '@/modules/prompts/use-cases/clean-up-workspace.use-case';
import { SystemActorRequiredError } from '@/platform/context/errors/system-actor-required.error';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';
import { IdService } from '@/platform/ids/services/id.service';
import { systemCtx } from '@test/support/fixtures/identity.fixture';
import {
  createPromptsTestingModule,
  promptsCtx,
  seedPrompt,
  seedPromptFolder,
  seedPromptVersion,
} from '@test/support/helpers/prompts-testing.helpers';

describe('CleanUpWorkspaceUseCase', () => {
  let testingModule: TestingModule;
  let cleanUp: CleanUpWorkspaceUseCase;
  let txHost: TransactionHost<AppTransactionAdapter>;
  let tenants: TenantTransactionService;
  let ids: IdService;

  beforeAll(async () => {
    testingModule = await createPromptsTestingModule();
    cleanUp = testingModule.get(CleanUpWorkspaceUseCase);
    txHost = testingModule.get(TransactionHost);
    tenants = testingModule.get(TenantTransactionService);
    ids = testingModule.get(IdService);
  });

  afterAll(async () => {
    await testingModule.close();
  });

  const remainingFolders = (workspaceId: string, folderId: string) =>
    tenants.run(workspaceId, () =>
      txHost.tx.select().from(promptFolders).where(eq(promptFolders.id, folderId)),
    );

  const remainingPrompts = (workspaceId: string, promptId: string) =>
    tenants.run(workspaceId, () =>
      txHost.tx.select().from(promptsTable).where(eq(promptsTable.id, promptId)),
    );

  const remainingVersions = (workspaceId: string, promptId: string) =>
    tenants.run(workspaceId, () =>
      txHost.tx.select().from(promptVersions).where(eq(promptVersions.promptId, promptId)),
    );

  it('hard deletes the folders, prompts and versions of the workspace', async () => {
    const workspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const promptId = await seedPrompt(testingModule, workspaceId, folderId);
    await seedPromptVersion(testingModule, workspaceId, promptId);

    await cleanUp.execute(systemCtx(), { workspaceId });

    expect(await remainingFolders(workspaceId, folderId)).toEqual([]);
    expect(await remainingPrompts(workspaceId, promptId)).toEqual([]);
    expect(await remainingVersions(workspaceId, promptId)).toEqual([]);
  });

  it('keeps the prompts of another workspace', async () => {
    const workspaceId = ids.generate();
    const otherWorkspaceId = ids.generate();
    const folderId = await seedPromptFolder(testingModule, workspaceId);
    const otherFolderId = await seedPromptFolder(testingModule, otherWorkspaceId);
    const promptId = await seedPrompt(testingModule, workspaceId, folderId);
    const otherPromptId = await seedPrompt(testingModule, otherWorkspaceId, otherFolderId);
    await seedPromptVersion(testingModule, workspaceId, promptId);
    await seedPromptVersion(testingModule, otherWorkspaceId, otherPromptId);

    await cleanUp.execute(systemCtx(), { workspaceId });

    expect(await remainingFolders(workspaceId, folderId)).toEqual([]);
    expect(await remainingPrompts(workspaceId, promptId)).toEqual([]);
    expect(await remainingFolders(otherWorkspaceId, otherFolderId)).toHaveLength(1);
    expect(await remainingPrompts(otherWorkspaceId, otherPromptId)).toHaveLength(1);
    expect(await remainingVersions(otherWorkspaceId, otherPromptId)).toHaveLength(1);
  });

  it('refuses a non-system actor', async () => {
    const workspaceId = ids.generate();

    const attempt = cleanUp.execute(promptsCtx(testingModule, workspaceId), { workspaceId });

    await expect(attempt).rejects.toBeInstanceOf(SystemActorRequiredError);
  });
});
