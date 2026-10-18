import { Role } from '@/platform/module-roles/constants/role.constants';

export const BACKFILL_ROLE_SELECTION = { role: Role.Gateway, queues: [] } as const;

export enum BackfillLogMessage {
  WorkspaceMigrated = 'backfill: workspace prompts migrated',
  Complete = 'backfill: complete',
}
