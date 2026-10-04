import type { WorkspaceRole } from '@agent-ic/contracts';

export abstract class WorkspaceAccessService {
  abstract resolveRole(userId: string, workspaceId: string): Promise<WorkspaceRole | null>;
}
