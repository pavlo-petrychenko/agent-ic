import type { IncomingMessage, ServerResponse } from 'node:http';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { clientAddressOf } from '@/platform/context/helpers/transport-request.helpers';
import {
  FORWARDED_FOR_HEADER,
  FORWARDED_FOR_SEPARATOR,
} from '@test/support/constants/auth-flow.constants';
import {
  clusterPodAddress,
  publicIpAddress,
  randomIpAddress,
} from '@test/support/fixtures/identity.fixture';

const resolveClientAddress = async (forwardedFor: string): Promise<string> => {
  const response = await request((incoming: IncomingMessage, outgoing: ServerResponse) => {
    outgoing.end(clientAddressOf(incoming));
  })
    .get('/')
    .set(FORWARDED_FOR_HEADER, forwardedFor);
  return response.text;
};

describe('clientAddressOf', () => {
  it('skips the cluster hops and ignores what the client forwarded itself', async () => {
    const client = publicIpAddress();

    const resolved = await resolveClientAddress(
      [randomIpAddress(), client, clusterPodAddress()].join(FORWARDED_FOR_SEPARATOR),
    );

    expect(resolved).toBe(client);
  });
});
