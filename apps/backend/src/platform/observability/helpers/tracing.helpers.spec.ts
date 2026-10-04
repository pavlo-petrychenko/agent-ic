import { describe, expect, it } from 'vitest';
import { OTLP_TRACES_PATH } from '@/platform/observability/constants/tracing.constants';
import { tracesEndpoint } from '@/platform/observability/helpers/tracing.helpers';

describe('tracesEndpoint', () => {
  it('appends the traces path to the collector endpoint', () => {
    const endpoint = new URL('http://collector.internal:4318');

    expect(tracesEndpoint(endpoint.origin)).toBe(new URL(OTLP_TRACES_PATH, endpoint).toString());
  });

  it('replaces any path on the collector endpoint', () => {
    const endpoint = new URL('http://collector.internal:4318/ignored');

    expect(tracesEndpoint(endpoint.toString())).toBe(
      new URL(OTLP_TRACES_PATH, endpoint.origin).toString(),
    );
  });
});
