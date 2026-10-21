import { OutboundHttpOutcome } from '@/platform/outbound-http/constants/outbound-http.constants';
import { OutboundHttpGateway } from '@/platform/outbound-http/gateways/outbound-http.gateway';
import type {
  OutboundHttpRequest,
  OutboundHttpResult,
} from '@/platform/outbound-http/typedefs/outbound-http.typedefs';

export class FakeOutboundHttpGateway extends OutboundHttpGateway {
  readonly requests: OutboundHttpRequest[] = [];
  private result: OutboundHttpResult = {
    outcome: OutboundHttpOutcome.Unreachable,
    status: null,
    body: null,
    bodyTruncated: false,
    durationMs: 0,
  };

  respond(status: number, body: string, bodyTruncated = false): this {
    this.result = {
      outcome: OutboundHttpOutcome.Responded,
      status,
      body,
      bodyTruncated,
      durationMs: 0,
    };
    return this;
  }

  failWith(outcome: OutboundHttpOutcome): this {
    this.result = { outcome, status: null, body: null, bodyTruncated: false, durationMs: 0 };
    return this;
  }

  async send(request: OutboundHttpRequest): Promise<OutboundHttpResult> {
    this.requests.push(request);
    return this.result;
  }
}
