import type { ResourcePermissions } from '@agent-ic/contracts';

export interface ProductTourProps {
  workspaceId: string;
  userId: string | null;
  permissions: ResourcePermissions | null;
}
