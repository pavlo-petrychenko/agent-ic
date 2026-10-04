import { describe, expect, it } from 'vitest';
import { HealthRoute } from '@/platform/observability/constants/health.constants';
import { MetricsRoute } from '@/platform/observability/constants/metrics.constants';
import { isOperationalUrl } from '@/platform/observability/helpers/operational-url.helpers';

describe('isOperationalUrl', () => {
  it.each([
    `/${HealthRoute.Base}/${HealthRoute.Live}`,
    `/${HealthRoute.Base}/${HealthRoute.Ready}`,
    `/prefix/${HealthRoute.Base}/${HealthRoute.Live}`,
    `/${MetricsRoute.Path}`,
    `/${MetricsRoute.Path}?format=text`,
  ])('treats %s as operational', (url) => {
    expect(isOperationalUrl(url)).toBe(true);
  });

  it.each(['/', '/graphql', '/v1/messages', `/v1/${HealthRoute.Base}-notes`])(
    'does not treat %s as operational',
    (url) => {
      expect(isOperationalUrl(url)).toBe(false);
    },
  );

  it('does not treat a missing url as operational', () => {
    expect(isOperationalUrl(undefined)).toBe(false);
  });
});
