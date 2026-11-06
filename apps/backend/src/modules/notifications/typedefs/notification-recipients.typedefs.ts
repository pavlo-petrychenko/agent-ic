import type { WorkspaceRole } from '@agent-ic/contracts';
import type { EscalationMode, EscalationNode } from '@agent-ic/flow';
import type { NotificationChannelValue } from '@/modules/notifications/typedefs/notification-settings.typedefs';

export type HandoffNotify = Extract<
  EscalationNode['config'],
  { readonly mode: EscalationMode.Escalate }
>['notify'];

export type NotificationRecipientSelection =
  | { readonly role: WorkspaceRole }
  | { readonly userIds: readonly string[] };

export interface NotificationRecipient {
  readonly userId: string;
  readonly channels: readonly NotificationChannelValue[];
}
