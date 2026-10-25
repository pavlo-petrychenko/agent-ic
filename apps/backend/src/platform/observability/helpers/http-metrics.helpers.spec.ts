import { describe, expect, it } from 'vitest';
import { UNMATCHED_ROUTE } from '@/platform/observability/constants/http-metrics.constants';
import {
  routeTemplateOf,
  statusClassOf,
} from '@/platform/observability/helpers/http-metrics.helpers';

describe('statusClassOf', () => {
  it('groups statuses by their hundreds', () => {
    expect(statusClassOf(200)).toBe('2xx');
    expect(statusClassOf(404)).toBe('4xx');
    expect(statusClassOf(503)).toBe('5xx');
  });
});

describe('routeTemplateOf', () => {
  it('uses the route template, never the concrete path', () => {
    expect(routeTemplateOf({ baseUrl: '', route: { path: '/telegram/:channelId' } })).toBe(
      '/telegram/:channelId',
    );
  });

  it('uses the mount path of a middleware, whatever sits below it', () => {
    expect(routeTemplateOf({ baseUrl: '/api/graphql', route: { path: '/api{/*splat}' } })).toBe(
      '/api/graphql',
    );
  });

  it('collapses requests no route matched into one label', () => {
    expect(routeTemplateOf({ baseUrl: '', route: undefined })).toBe(UNMATCHED_ROUTE);
  });
});
