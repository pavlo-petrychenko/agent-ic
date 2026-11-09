import { Locale } from '@agent-ic/contracts';
import type { ChannelKind } from '@agent-ic/contracts';
import { NotificationChannel } from '@/modules/notifications';
import type { NotificationDeliveryRecord, NotificationKind } from '@/modules/notifications';

export interface DeliverNotificationInput {
  readonly notificationId: string;
  readonly channel: NotificationChannel;
}

export interface DeliveryContent {
  readonly delivery: NotificationDeliveryRecord;
  readonly kind: NotificationKind;
  readonly to: string;
  readonly customerName: string | null;
  readonly agentName: string | null;
  readonly channelKind: ChannelKind | null;
  readonly locale: Locale;
  readonly reason: string | null;
  readonly lastMessage: string | null;
  readonly time: string;
  readonly workspaceName: string | null;
  readonly link: string;
  readonly workspacePublicId: string;
  readonly conversationPublicId: string | null;
  readonly waitingMinutes: number;
}

export interface SkippedDelivery {
  readonly delivery: NotificationDeliveryRecord;
  readonly to: null;
}

export type DeliveryJobData = Readonly<{
  notificationId: string;
  channel: NotificationChannel;
}>;

export interface EscalationNotificationInput {
  readonly runStepId: string;
  readonly conversationId: string;
  readonly versionId: string;
  readonly nodeId: string;
  readonly kind: NotificationKind;
}

export type SweepNotificationDeliveriesInput = Readonly<Record<string, never>>;
