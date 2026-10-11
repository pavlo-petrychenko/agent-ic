import { RunStatus } from '@/shared/api/generated/schema.generated';
import { StatusTone } from '@/shared/ui/layout/StatusBar';

export const TESTING_PATH = '/w/$workspaceId/testing';

export const LAST_RUN_TONES: Readonly<Record<RunStatus, StatusTone>> = {
  [RunStatus.Queued]: StatusTone.Neutral,
  [RunStatus.Running]: StatusTone.Neutral,
  [RunStatus.Succeeded]: StatusTone.Ok,
  [RunStatus.Escalated]: StatusTone.Warn,
  [RunStatus.Failed]: StatusTone.Err,
};
