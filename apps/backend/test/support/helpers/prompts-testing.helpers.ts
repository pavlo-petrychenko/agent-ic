import { WorkspaceRole } from '@agent-ic/contracts';
import type { TestingModule } from '@nestjs/testing';
import { PromptsModule } from '@/modules/prompts';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { IdService } from '@/platform/ids/services/id.service';
import { Role } from '@/platform/module-roles/constants/role.constants';
import { TestRedisPrefix } from '@test/support/constants/test-infrastructure.constants';
import { workspaceCtx } from '@test/support/fixtures/workspace.fixture';
import { createPlatformTestingModule } from '@test/support/helpers/database-testing.helpers';

export const promptsCtx = (
  testingModule: TestingModule,
  workspaceId: string,
  role: WorkspaceRole = WorkspaceRole.Owner,
): UseCaseCtx => workspaceCtx(testingModule.get(IdService).generate(), workspaceId, role);

export const createPromptsTestingModule = (): Promise<TestingModule> =>
  createPlatformTestingModule(TestRedisPrefix.Prompts, [PromptsModule.forRole(Role.Api)]);
