import type {
  OutboundHttpRequest,
  OutboundHttpResult,
} from '@/platform/outbound-http/typedefs/outbound-http.typedefs';

export abstract class OutboundHttpGateway {
  abstract send(request: OutboundHttpRequest): Promise<OutboundHttpResult>;
}
