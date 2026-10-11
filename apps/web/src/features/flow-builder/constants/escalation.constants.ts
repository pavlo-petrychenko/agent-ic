import { WorkspaceRole } from '@agent-ic/contracts';
import { EscalationMode, NotifyChannel } from '@agent-ic/flow';
import type {
  OfferedChannel,
  RecipientRole,
} from '@/features/flow-builder/typedefs/escalation.typedefs';
import { WorkspaceRole as ApiWorkspaceRole } from '@/shared/api/generated/schema.generated';

export const ROLE_FROM_API: Readonly<Record<ApiWorkspaceRole, WorkspaceRole>> = {
  [ApiWorkspaceRole.Owner]: WorkspaceRole.Owner,
  [ApiWorkspaceRole.Admin]: WorkspaceRole.Admin,
  [ApiWorkspaceRole.Builder]: WorkspaceRole.Builder,
  [ApiWorkspaceRole.Operator]: WorkspaceRole.Operator,
};

export const ESCALATION_MODES: readonly EscalationMode[] = [
  EscalationMode.Escalate,
  EscalationMode.End,
];

export const OPERATORS_ROLE = WorkspaceRole.Operator;

export const RECIPIENT_ROLES: readonly RecipientRole[] = [
  WorkspaceRole.Owner,
  WorkspaceRole.Admin,
  WorkspaceRole.Builder,
];

export const OFFERED_NOTIFY_CHANNELS: readonly OfferedChannel[] = [
  NotifyChannel.InPlatform,
  NotifyChannel.Email,
];
