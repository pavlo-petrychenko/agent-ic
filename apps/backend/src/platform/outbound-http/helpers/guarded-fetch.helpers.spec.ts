import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { BLOCKED_ADDRESS_RANGES } from '@/platform/outbound-http/constants/outbound-http.constants';
import { OutboundAddressBlockedError } from '@/platform/outbound-http/errors/outbound-address-blocked.error';
import { guardedFetch } from '@/platform/outbound-http/helpers/guarded-fetch.helpers';
import { toBlockList } from '@/platform/outbound-http/helpers/outbound-address.helpers';
import {
  OUTBOUND_TEST_BLOCKED_HOSTS,
  OUTBOUND_TEST_INVALID_URLS,
  OUTBOUND_TEST_PRIVATE_ADDRESSES,
  OUTBOUND_TEST_PUBLIC_ADDRESSES,
  OUTBOUND_TEST_STATUS,
  OutboundTestPath,
} from '@test/support/constants/outbound-http-testing.constants';
import { startProbeServer } from '@test/support/helpers/outbound-http-testing.helpers';
import type { ProbeServer } from '@test/support/typedefs/outbound-http-testing.typedefs';

const PUBLIC_HOST = 'models.example.com';
const BLOCK_LIST = toBlockList(BLOCKED_ADDRESS_RANGES);

const resolvingTo = (addresses: readonly string[]) => async (): Promise<readonly string[]> =>
  addresses;

const recordingSend = () => vi.fn<typeof fetch>(async () => new Response(null));

describe('guardedFetch', () => {
  let server: ProbeServer;

  beforeAll(async () => {
    server = await startProbeServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('sends a request to a host that resolves to public addresses', async () => {
    const send = recordingSend();
    const url = `https://${PUBLIC_HOST}/v1/models`;

    await guardedFetch(BLOCK_LIST, resolvingTo(OUTBOUND_TEST_PUBLIC_ADDRESSES), send)(url);

    expect(send).toHaveBeenCalledWith(url, undefined);
  });

  it.each(OUTBOUND_TEST_BLOCKED_HOSTS)('refuses the private host %s', async (host) => {
    const send = recordingSend();

    await expect(
      guardedFetch(BLOCK_LIST, undefined, send)(`http://${host}/v1`),
    ).rejects.toBeInstanceOf(OutboundAddressBlockedError);
    expect(send).not.toHaveBeenCalled();
  });

  it.each(OUTBOUND_TEST_PRIVATE_ADDRESSES)(
    'refuses a host name that resolves to %s',
    async (address) => {
      const send = recordingSend();
      const guarded = guardedFetch(
        BLOCK_LIST,
        resolvingTo([OUTBOUND_TEST_PUBLIC_ADDRESSES[0] ?? '', address]),
        send,
      );

      await expect(guarded(new URL(`https://${PUBLIC_HOST}/v1`))).rejects.toBeInstanceOf(
        OutboundAddressBlockedError,
      );
      expect(send).not.toHaveBeenCalled();
    },
  );

  it.each(OUTBOUND_TEST_INVALID_URLS)('refuses the address %s', async (url) => {
    const send = recordingSend();

    await expect(guardedFetch(BLOCK_LIST, undefined, send)(url)).rejects.toBeInstanceOf(
      OutboundAddressBlockedError,
    );
    expect(send).not.toHaveBeenCalled();
  });

  it('reaches an allowed server with the real fetch', async () => {
    const response = await guardedFetch(toBlockList([]))(
      new Request(`${server.origin}${OutboundTestPath.Echo}`),
    );

    expect(response.status).toBe(OUTBOUND_TEST_STATUS);
  });
});
