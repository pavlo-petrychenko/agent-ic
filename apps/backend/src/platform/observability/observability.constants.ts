import { HealthRoute } from './health/health.constants';
import { MetricsRoute } from './metrics/metrics.constants';

export const OPERATIONAL_ROUTE_SEGMENTS: readonly string[] = [HealthRoute.Base, MetricsRoute.Path];
export const URL_PATH_SEPARATOR = '/';
export const URL_QUERY_SEPARATOR = '?';
export const TRACE_ID_FIELD = 'traceId';
