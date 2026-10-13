import { IdPrefix, WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { PromptsModule } from '@/modules/prompts';
import { PromptFoldersRepository } from '@/modules/prompts/repositories/prompt-folders.repository';
import { PromptVersionsRepository } from '@/modules/prompts/repositories/prompt-versions.repository';
import { PromptsRepository } from '@/modules/prompts/repositories/prompts.repository';
import type { NewPromptFolder } from '@/modules/prompts/typedefs/prompt-folder.typedefs';
import type { NewPromptVersion } from '@/modules/prompts/typedefs/prompt-version.typedefs';
import type { NewPrompt } from '@/modules/prompts/typedefs/prompt.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import { IdService } from '@/platform/ids/services/id.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { newFolder, newPrompt, newPromptVersion } from '@test/support/fixtures/prompts.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { createPlatformTestingModule } from '@test/support/helpers/database-testing.helpers';

export const promptsCtx = (
  testingModule: TestingModule,
  workspaceId: string,
  role: WorkspaceRole = WorkspaceRole.Owner,
): UseCaseCtx => workspaceCtx(testingModule.get(IdService).generate(), workspaceId, role);

export const createPromptsTestingModule = (): Promise<TestingModule> =>
  createPlatformTestingModule(TestRedisPrefix.Prompts, [PromptsModule.forRole(Role.Api)]);

export const seedPromptFolder = async (
  testingModule: TestingModule,
  workspaceId: string,
  overrides: Partial<NewPromptFolder> = {},
): Promise<string> => {
  const folderId = testingModule.get(IdService).generate();
  await testingModule
    .get(TenantTransactionService)
    .run(workspaceId, () =>
      testingModule
        .get(PromptFoldersRepository)
        .insert(newFolder(folderId, workspaceId, overrides)),
    );
  return folderId;
};

export const seedPrompt = async (
  testingModule: TestingModule,
  workspaceId: string,
  folderId: string,
  overrides: Partial<NewPrompt> = {},
): Promise<string> => {
  const promptId = testingModule.get(IdService).generate();
  await testingModule
    .get(TenantTransactionService)
    .run(workspaceId, () =>
      testingModule
        .get(PromptsRepository)
        .insert(newPrompt(promptId, workspaceId, folderId, overrides)),
    );
  return promptId;
};

export const seedPromptVersion = async (
  testingModule: TestingModule,
  workspaceId: string,
  promptId: string,
  overrides: Partial<NewPromptVersion> = {},
): Promise<string> => {
  const versionId = testingModule.get(IdService).generate();
  await testingModule
    .get(TenantTransactionService)
    .run(workspaceId, () =>
      testingModule
        .get(PromptVersionsRepository)
        .insert(newPromptVersion(versionId, workspaceId, promptId, overrides)),
    );
  return versionId;
};

export const publicPromptId = (testingModule: TestingModule, promptId: string): string =>
  testingModule.get(IdService).toPublic(IdPrefix.Prompt, promptId);

export const publicPromptFolderId = (testingModule: TestingModule, folderId: string): string =>
  testingModule.get(IdService).toPublic(IdPrefix.PromptFolder, folderId);
