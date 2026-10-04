import { WorkspaceRole } from '@agent-ic/contracts';
import { WorkspaceRole as ApiWorkspaceRole } from '@/shared/api/generated/schema.generated';

export const ROLE_FROM_API: Readonly<Record<ApiWorkspaceRole, WorkspaceRole>> = {
  [ApiWorkspaceRole.Owner]: WorkspaceRole.Owner,
  [ApiWorkspaceRole.Admin]: WorkspaceRole.Admin,
  [ApiWorkspaceRole.Builder]: WorkspaceRole.Builder,
  [ApiWorkspaceRole.Operator]: WorkspaceRole.Operator,
};
