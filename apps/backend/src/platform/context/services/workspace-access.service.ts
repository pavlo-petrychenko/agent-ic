import type { MemberAccess } from '@/platform/context/typedefs/workspace-access.typedefs';

export abstract class WorkspaceAccessService {
  abstract resolveAccess(userId: string, workspaceId: string): Promise<MemberAccess | null>;
}
