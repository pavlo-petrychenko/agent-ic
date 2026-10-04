import { useWorkspaceShell } from '@/features/workspace/communication/hooks/useWorkspaceShell';
import type { WorkspaceSummary } from '@/features/workspace/typedefs/workspace.typedefs';

export function useActiveWorkspace(workspaceId: string): WorkspaceSummary | null {
  return useWorkspaceShell(workspaceId).data?.active ?? null;
}
