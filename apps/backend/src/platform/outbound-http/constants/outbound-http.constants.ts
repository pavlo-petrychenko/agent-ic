import { IpFamily } from '@/platform/outbound-http/constants/ip-family.constants';
import type { OutboundAddressRange } from '@/platform/outbound-http/typedefs/outbound-http.typedefs';

export const OUTBOUND_BLOCKED_RANGES = Symbol('OUTBOUND_BLOCKED_RANGES');

export enum OutboundHttpOutcome {
  Responded = 'responded',
  TimedOut = 'timed_out',
  Unreachable = 'unreachable',
  BlockedAddress = 'blocked_address',
  InvalidUrl = 'invalid_url',
}

export enum OutboundProtocol {
  Http = 'http:',
  Https = 'https:',
}

export const OUTBOUND_RESPONSE_MAX_BYTES = 65_536;
export const OUTBOUND_BODY_ENCODING = 'utf8';
export const OUTBOUND_ADDRESS_BLOCKED_MESSAGE = 'The address is private or reserved.';
export const IPV6_HOST_BRACKETS = /^\[|\]$/g;

export const BLOCKED_ADDRESS_RANGES: readonly OutboundAddressRange[] = [
  { network: '0.0.0.0', prefix: 8, family: IpFamily.V4 },
  { network: '10.0.0.0', prefix: 8, family: IpFamily.V4 },
  { network: '100.64.0.0', prefix: 10, family: IpFamily.V4 },
  { network: '127.0.0.0', prefix: 8, family: IpFamily.V4 },
  { network: '169.254.0.0', prefix: 16, family: IpFamily.V4 },
  { network: '172.16.0.0', prefix: 12, family: IpFamily.V4 },
  { network: '192.0.0.0', prefix: 24, family: IpFamily.V4 },
  { network: '192.168.0.0', prefix: 16, family: IpFamily.V4 },
  { network: '198.18.0.0', prefix: 15, family: IpFamily.V4 },
  { network: '224.0.0.0', prefix: 3, family: IpFamily.V4 },
  { network: '::', prefix: 127, family: IpFamily.V6 },
  { network: '::ffff:0:0', prefix: 96, family: IpFamily.V6 },
  { network: '64:ff9b::', prefix: 96, family: IpFamily.V6 },
  { network: 'fc00::', prefix: 7, family: IpFamily.V6 },
  { network: 'fe80::', prefix: 10, family: IpFamily.V6 },
  { network: 'ff00::', prefix: 8, family: IpFamily.V6 },
];
