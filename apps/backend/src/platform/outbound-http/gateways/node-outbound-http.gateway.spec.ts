import { HttpMethod } from '@agent-ic/flow';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  BLOCKED_ADDRESS_RANGES,
  OUTBOUND_RESPONSE_MAX_BYTES,
  OutboundHttpOutcome,
} from '@/platform/outbound-http/constants/outbound-http.constants';
import { NodeOutboundHttpGateway } from '@/platform/outbound-http/gateways/node-outbound-http.gateway';
import type { OutboundHttpRequest } from '@/platform/outbound-http/typedefs/outbound-http.typedefs';
import { AGENTS_TEST_START } from '@test/support/constants/agents-testing.constants';
import {
  OUTBOUND_TEST_BLOCKED_HOSTS,
  OUTBOUND_TEST_BODY,
  OUTBOUND_TEST_HEADER,
  OUTBOUND_TEST_HEADER_VALUE,
  OUTBOUND_TEST_INVALID_URLS,
  OUTBOUND_TEST_SHORT_TIMEOUT_MS,
  OUTBOUND_TEST_STATUS,
  OUTBOUND_TEST_TIMEOUT_MS,
  OutboundTestPath,
} from '@test/support/constants/outbound-http-testing.constants';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';
import { startProbeServer } from '@test/support/helpers/outbound-http-testing.helpers';
import type { ProbeServer } from '@test/support/typedefs/outbound-http-testing.typedefs';

const get = (url: string, timeoutMs = OUTBOUND_TEST_TIMEOUT_MS): OutboundHttpRequest => ({
  method: HttpMethod.Get,
  url,
  headers: {},
  body: null,
  timeoutMs,
});

describe('NodeOutboundHttpGateway', () => {
  const guarded = new NodeOutboundHttpGateway(
    new ManualClock(AGENTS_TEST_START),
    BLOCKED_ADDRESS_RANGES,
  );
  const open = new NodeOutboundHttpGateway(new ManualClock(AGENTS_TEST_START), []);
  let server: ProbeServer;

  beforeAll(async () => {
    server = await startProbeServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('sends the method, headers and body and returns the status and body', async () => {
    const result = await open.send({
      method: HttpMethod.Post,
      url: `${server.origin}${OutboundTestPath.Echo}`,
      headers: { [OUTBOUND_TEST_HEADER]: OUTBOUND_TEST_HEADER_VALUE },
      body: OUTBOUND_TEST_BODY,
      timeoutMs: OUTBOUND_TEST_TIMEOUT_MS,
    });

    expect(result).toMatchObject({
      outcome: OutboundHttpOutcome.Responded,
      status: OUTBOUND_TEST_STATUS,
      bodyTruncated: false,
    });
    expect(JSON.parse(result.body ?? '')).toEqual({
      method: HttpMethod.Post,
      header: OUTBOUND_TEST_HEADER_VALUE,
      body: OUTBOUND_TEST_BODY,
    });
  });

  it('cuts a long body at the limit', async () => {
    const result = await open.send(get(`${server.origin}${OutboundTestPath.Large}`));

    expect(result.bodyTruncated).toBe(true);
    expect(result.body).toHaveLength(OUTBOUND_RESPONSE_MAX_BYTES);
  });

  it('gives up after the timeout', async () => {
    const result = await open.send(
      get(`${server.origin}${OutboundTestPath.Slow}`, OUTBOUND_TEST_SHORT_TIMEOUT_MS),
    );

    expect(result).toMatchObject({ outcome: OutboundHttpOutcome.TimedOut, status: null });
  });

  it('reports a port where nothing listens as unreachable', async () => {
    const closed = await startProbeServer();
    await closed.close();

    const result = await open.send(get(closed.origin));

    expect(result.outcome).toBe(OutboundHttpOutcome.Unreachable);
  });

  it.each(OUTBOUND_TEST_INVALID_URLS)('refuses %s as an invalid url', async (url) => {
    expect((await guarded.send(get(url))).outcome).toBe(OutboundHttpOutcome.InvalidUrl);
  });

  it.each(OUTBOUND_TEST_BLOCKED_HOSTS)('never calls the private host %s', async (host) => {
    const result = await guarded.send(get(`http://${host}:${server.port}${OutboundTestPath.Echo}`));

    expect(result).toMatchObject({ outcome: OutboundHttpOutcome.BlockedAddress, status: null });
  });
});
