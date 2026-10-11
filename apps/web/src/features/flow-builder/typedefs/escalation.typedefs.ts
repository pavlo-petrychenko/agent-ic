import type { WorkspaceRole } from '@agent-ic/contracts';
import type { EscalationMode, EscalationNode, NotifyChannel } from '@agent-ic/flow';

export type RoleCounts = ReadonlyMap<WorkspaceRole, number>;

export type EscalateConfig = Extract<EscalationNode['config'], { mode: EscalationMode.Escalate }>;

export type EscalatePatch = Partial<Omit<EscalateConfig, 'mode' | 'customerMessage'>>;

export type EscalationRecipients = EscalateConfig['notify']['recipients'];

export type RecipientRole = WorkspaceRole.Owner | WorkspaceRole.Admin | WorkspaceRole.Builder;

export type OfferedChannel = NotifyChannel.InPlatform | NotifyChannel.Email;
