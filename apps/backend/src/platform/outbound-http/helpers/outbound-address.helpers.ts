import { BlockList, isIP } from 'node:net';
import { IP_VERSION_6, IpFamily } from '@/platform/outbound-http/constants/ip-family.constants';
import {
  IPV6_HOST_BRACKETS,
  OutboundProtocol,
} from '@/platform/outbound-http/constants/outbound-http.constants';
import type { OutboundAddressRange } from '@/platform/outbound-http/typedefs/outbound-http.typedefs';

export const toBlockList = (ranges: readonly OutboundAddressRange[]): BlockList => {
  const blockList = new BlockList();
  for (const range of ranges) {
    blockList.addSubnet(range.network, range.prefix, range.family);
  }
  return blockList;
};

export const isBlockedAddress = (blockList: BlockList, address: string): boolean =>
  blockList.check(address, isIP(address) === IP_VERSION_6 ? IpFamily.V6 : IpFamily.V4);

export const hostAddressOf = (url: URL): string | null => {
  const host = url.hostname.replace(IPV6_HOST_BRACKETS, '');
  return isIP(host) === 0 ? null : host;
};

export const parseOutboundUrl = (text: string): URL | null => {
  const url = URL.parse(text);
  const protocols: readonly string[] = Object.values(OutboundProtocol);
  return url !== null && protocols.includes(url.protocol) ? url : null;
};
