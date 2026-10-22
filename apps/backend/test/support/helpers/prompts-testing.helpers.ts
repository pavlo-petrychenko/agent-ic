import { IdPrefix, Locale, WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { UsersRepository } from '@/modules/identity';
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
import { ObservabilityModule } from '@/platform/observability/observability.module';
import { OutboundHttpModule } from '@/platform/outbound-http/outbound-http.module';
import { RateLimitModule } from '@/platform/rate-limit/rate-limit.module';
import { RedisModule } from '@/platform/redis/redis.module';
import {
  PROMPTS_TEST_START,
  TEST_PROMPT_AUTHOR_NAME,
  TEST_PROMPT_AUTHOR_PASSWORD_HASH,
} from '@test/support/constants/prompts-testing.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { uniqueEmail } from '@test/support/fixtures/identity.fixture';
import { newFolder, newPrompt, newPromptVersion } from '@test/support/fixtures/prompts.fixture';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { createPlatformTestingModule } from '@test/support/helpers/database-testing.helpers';
import { PromptsNeighboursModule } from '@test/support/modules/prompts-neighbours.module';
import type { ProviderOverride } from '@test/support/typedefs/test-infrastructure.typedefs';

export const promptsCtx = (
  testingModule: TestingModule,
  workspaceId: string,
  role: WorkspaceRole = WorkspaceRole.Owner,
): UseCaseCtx => workspaceCtx(testingModule.get(IdService).generate(), workspaceId, role);

export const createPromptsTestingModule = (
  overrides: readonly ProviderOverride[] = [],
): Promise<TestingModule> =>
  createPlatformTestingModule(
    TestRedisPrefix.Prompts,
    [
      RedisModule,
      RateLimitModule,
      OutboundHttpModule,
      ObservabilityModule.forRole(Role.Api),
      PromptsModule.forRole(Role.Api),
      PromptsNeighboursModule.forRole(Role.Api),
    ],
    overrides,
  );

export const seedPromptAuthor = async (testingModule: TestingModule): Promise<string> => {
  const userId = testingModule.get(IdService).generate();
  await testingModule.get(UsersRepository).upsertUnconfirmed({
    id: userId,
    email: uniqueEmail(),
    name: TEST_PROMPT_AUTHOR_NAME,
    passwordHash: TEST_PROMPT_AUTHOR_PASSWORD_HASH,
    locale: Locale.En,
    createdAt: PROMPTS_TEST_START,
    updatedAt: PROMPTS_TEST_START,
  });
  return userId;
};

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

export const seedLibraryPrompt = async (
  testingModule: TestingModule,
  workspaceId: string,
  text: string,
): Promise<string> => {
  const suffix = testingModule.get(IdService).generate();
  const folderId = await seedPromptFolder(testingModule, workspaceId, {
    name: `Folder ${suffix}`,
  });
  const promptId = await seedPrompt(testingModule, workspaceId, folderId, {
    name: `Prompt ${suffix}`,
  });
  await seedPromptVersion(testingModule, workspaceId, promptId, { text });
  return publicPromptId(testingModule, promptId);
};

export const publicPromptFolderId = (testingModule: TestingModule, folderId: string): string =>
  testingModule.get(IdService).toPublic(IdPrefix.PromptFolder, folderId);
