import { FailureMode, HttpMethod, PortName, RequestAuthKind } from '@agent-ic/flow';
import type { ApiRequestNode } from '@agent-ic/flow';
import { HttpStatus } from '@nestjs/common';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  API_REQUEST_BACKOFF_BASE_MS,
  API_REQUEST_BACKOFF_FACTOR,
} from '@/modules/runs/constants/api-request.constants';
import { ApiRequestAuthUnsupportedError } from '@/modules/runs/errors/api-request-auth-unsupported.error';
import { ApiRequestFailedError } from '@/modules/runs/errors/api-request-failed.error';
import { ApiRequestExecutor } from '@/modules/runs/services/api-request-executor.service';
import { MILLISECONDS_PER_SECOND } from '@/platform/clock/constants/time.constants';
import { NodeOutboundHttpGateway } from '@/platform/outbound-http/gateways/node-outbound-http.gateway';
import { TEST_MESSAGE_TEXT } from '@test/support/constants/conversations-testing.constants';
import {
  OUTBOUND_TEST_FLAKY_FAILURES,
  OUTBOUND_TEST_SHORT_TIMEOUT_MS,
  OUTBOUND_TEST_STATUS,
  OutboundTestPath,
} from '@test/support/constants/outbound-http-testing.constants';
import {
  RUNS_TEST_START,
  TEST_API_RETRIES,
  TEST_CREDENTIAL_ID,
} from '@test/support/constants/runs-testing.constants';
import { ManualClock } from '@test/support/fakes/manual-clock.fake';
import { apiRequestNode } from '@test/support/fixtures/runs.fixture';
import { startProbeServer } from '@test/support/helpers/outbound-http-testing.helpers';
import type { ProbeServer } from '@test/support/typedefs/outbound-http-testing.typedefs';

describe('ApiRequestExecutor', () => {
  const clock = new ManualClock(RUNS_TEST_START);
  const executor = new ApiRequestExecutor(new NodeOutboundHttpGateway(clock, []), clock);
  let server: ProbeServer;

  const call = (path: OutboundTestPath, config: Partial<ApiRequestNode['config']> = {}) =>
    executor.execute({
      node: apiRequestNode(`${server.origin}${path}`, config),
      scope: {
        variables: { message: { text: TEST_MESSAGE_TEXT } },
        history: [],
        today: RUNS_TEST_START,
        prompts: new Map(),
      },
    });

  const elapsedMs = (since: Date): number => clock.now().getTime() - since.getTime();

  beforeAll(async () => {
    server = await startProbeServer();
  });

  afterAll(async () => {
    await server.close();
  });

  it('sends the rendered request and returns ok, the status and the parsed body', async () => {
    const outcome = call(OutboundTestPath.Ok);

    expect(await outcome).toEqual({
      port: PortName.Next,
      output: {
        ok: true,
        status: HttpStatus.OK,
        body: {
          method: HttpMethod.Post,
          header: TEST_MESSAGE_TEXT,
          body: JSON.stringify({ order: TEST_MESSAGE_TEXT }),
        },
      },
    });
  });

  it('continues without data when the request times out', async () => {
    const outcome = call(OutboundTestPath.Slow, {
      timeoutSeconds: OUTBOUND_TEST_SHORT_TIMEOUT_MS / MILLISECONDS_PER_SECOND,
    });

    expect(await outcome).toEqual({
      port: PortName.Next,
      output: { ok: false, status: null, body: null },
    });
  });

  it('retries a failed answer after a backoff and returns the later success', async () => {
    const startedAt = clock.now();

    const outcome = await call(OutboundTestPath.Flaky, { retries: TEST_API_RETRIES });

    expect(outcome.output).toMatchObject({ ok: true, status: HttpStatus.OK });
    expect(server.hits(OutboundTestPath.Flaky)).toBe(OUTBOUND_TEST_FLAKY_FAILURES + 1);
    expect(elapsedMs(startedAt)).toBe(API_REQUEST_BACKOFF_BASE_MS);
  });

  it('does not retry a client error and continues with its answer', async () => {
    const outcome = call(OutboundTestPath.Echo, { retries: TEST_API_RETRIES });

    expect(await outcome).toMatchObject({
      port: PortName.Next,
      output: { ok: false, status: OUTBOUND_TEST_STATUS },
    });
    expect(server.hits(OutboundTestPath.Echo)).toBe(1);
  });

  it('fails the step to its error port after the last retry', async () => {
    const startedAt = clock.now();

    const outcome = call(OutboundTestPath.Unavailable, {
      retries: TEST_API_RETRIES,
      onFailure: FailureMode.ErrorPort,
    });

    await expect(outcome).rejects.toBeInstanceOf(ApiRequestFailedError);
    expect(server.hits(OutboundTestPath.Unavailable)).toBe(TEST_API_RETRIES + 1);
    expect(elapsedMs(startedAt)).toBe(
      API_REQUEST_BACKOFF_BASE_MS + API_REQUEST_BACKOFF_BASE_MS * API_REQUEST_BACKOFF_FACTOR,
    );
  });

  it('fails the step without calling when the step sets auth', async () => {
    const outcome = call(OutboundTestPath.Ok, {
      auth: { kind: RequestAuthKind.Bearer, credentialId: TEST_CREDENTIAL_ID },
    });

    await expect(outcome).rejects.toBeInstanceOf(ApiRequestAuthUnsupportedError);
  });
});
