import { useActiveWorkspace } from '@/features/workspace';
import { UTC_TIME_ZONE } from '@/shared/forms/constants/timeZone.constants';

export function useWorkspaceTimeZone(workspaceId: string): string {
  return useActiveWorkspace(workspaceId)?.timeZone ?? UTC_TIME_ZONE;
}
