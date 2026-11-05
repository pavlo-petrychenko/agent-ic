import { API_CHANNEL_WEBHOOK_UPSTREAM } from '@/modules/channels/constants/api-channel-webhook.constants';
import { UpstreamError } from '@/platform/errors/errors/upstream.error';
import { isRetryableUpstreamStatus } from '@/platform/errors/helpers/upstream.helpers';
import { OutboundHttpOutcome } from '@/platform/outbound-http/constants/outbound-http.constants';

export class ApiChannelWebhookError extends UpstreamError {
  readonly status: number | null;

  constructor(outcome: OutboundHttpOutcome, status: number | null) {
    super(API_CHANNEL_WEBHOOK_UPSTREAM, {
      retryable:
        outcome === OutboundHttpOutcome.TimedOut ||
        outcome === OutboundHttpOutcome.Unreachable ||
        (outcome === OutboundHttpOutcome.Responded &&
          status !== null &&
          isRetryableUpstreamStatus(status)),
    });
    this.status = status;
  }
}
