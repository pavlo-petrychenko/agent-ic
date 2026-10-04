import type { WorkspaceRole } from '@agent-ic/contracts';
import type { CreateWorkspaceInput } from '@/modules/identity/typedefs/workspace.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import {
  TEST_TIME_ZONE,
  TEST_WORKSPACE_NAME,
} from '@test/support/constants/workspace-testing.constants';
import { userCtx } from '@test/support/fixtures/identity.fixture';

export const createWorkspaceInput = (
  overrides: Partial<CreateWorkspaceInput> = {},
): CreateWorkspaceInput => ({
  name: TEST_WORKSPACE_NAME,
  timeZone: TEST_TIME_ZONE,
  ...overrides,
});

export const workspaceCtx = (
  userId: string,
  workspaceId: string,
  workspaceRole: WorkspaceRole,
): UseCaseCtx => ({ ...userCtx(userId), workspaceId, workspaceRole });
