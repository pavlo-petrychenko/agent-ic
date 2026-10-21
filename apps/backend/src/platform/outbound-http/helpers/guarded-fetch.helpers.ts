import { lookup } from 'node:dns/promises';
import type { BlockList } from 'node:net';
import { OutboundAddressBlockedError } from '@/platform/outbound-http/errors/outbound-address-blocked.error';
import {
  hostAddressOf,
  isBlockedAddress,
  parseOutboundUrl,
} from '@/platform/outbound-http/helpers/outbound-address.helpers';
import type { OutboundHostLookup } from '@/platform/outbound-http/typedefs/outbound-http.typedefs';

export const lookupHostAddresses: OutboundHostLookup = async (host) =>
  (await lookup(host, { all: true })).map(({ address }) => address);

const requestUrl = (input: string | URL | Request): string =>
  typeof input === 'string' ? input : input instanceof URL ? input.href : input.url;

export const guardedFetch =
  (
    blockList: BlockList,
    lookupHost: OutboundHostLookup = lookupHostAddresses,
    send: typeof fetch = fetch,
  ): typeof fetch =>
  async (input, init) => {
    const url = parseOutboundUrl(requestUrl(input));
    if (url === null) {
      throw new OutboundAddressBlockedError();
    }
    const address = hostAddressOf(url);
    const addresses = address === null ? await lookupHost(url.hostname) : [address];
    if (addresses.some((candidate) => isBlockedAddress(blockList, candidate))) {
      throw new OutboundAddressBlockedError();
    }
    return send(input, init);
  };
