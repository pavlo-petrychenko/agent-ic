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
