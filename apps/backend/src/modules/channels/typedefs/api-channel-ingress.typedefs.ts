import type { ApiChannelReplyStatus } from '@/modules/channels/constants/channel.constants';
import type { ApiChannelIngressRecord } from '@/modules/channels/typedefs/channel.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';

export interface ApiChannelKeyVerificationInput {
  readonly publicChannelId: string;
  readonly authorization: string | null;
  readonly traceId: string;
  readonly clientIp: string | null;
}

export interface ApiChannelKeyVerificationResult {
  readonly channel: ApiChannelIngressRecord;
  readonly ctx: UseCaseCtx;
}

export interface ApiChannelMessageInput {
  readonly body: unknown;
  readonly idempotencyKey: string | null;
}

export interface ApiChannelReplyMessage {
  readonly id: string;
  readonly text: string;
  readonly quick_replies: readonly string[];
}

export interface ApiChannelReply {
  readonly status: ApiChannelReplyStatus;
  readonly messages: readonly ApiChannelReplyMessage[];
}

export interface ApiChannelReplyStart {
  readonly conversationId: string;
  readonly runStarted: boolean;
}

export interface ApiChannelReplyResult {
  readonly conversationId: string;
  readonly reply: ApiChannelReply;
}

export interface ApiChannelMessageResult {
  readonly conversationId: string;
  readonly reply: ApiChannelReply | null;
}

export interface ApiChannelMessageResponse {
  readonly conversation_id: string;
  readonly messages?: readonly ApiChannelReplyMessage[];
  readonly status?: ApiChannelReplyStatus;
}
