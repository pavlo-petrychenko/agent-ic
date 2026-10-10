import type { IpFamily } from '@/platform/outbound-http/constants/ip-family.constants';
import type { OutboundHttpOutcome } from '@/platform/outbound-http/constants/outbound-http.constants';

export interface OutboundAddressRange {
  readonly network: string;
  readonly prefix: number;
  readonly family: IpFamily;
}

export interface OutboundHttpRequest {
  readonly method: string;
  readonly url: string;
  readonly headers: Readonly<Record<string, string>>;
  readonly body: string | null;
  readonly timeoutMs: number;
}

export interface OutboundHttpResult {
  readonly outcome: OutboundHttpOutcome;
  readonly status: number | null;
  readonly body: string | null;
  readonly bodyTruncated: boolean;
  readonly durationMs: number;
}
