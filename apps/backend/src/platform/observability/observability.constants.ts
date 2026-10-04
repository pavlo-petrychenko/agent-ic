import { HealthRoute } from '@/platform/observability/health/health.constants';
import { MetricsRoute } from '@/platform/observability/metrics/metrics.constants';

export const OPERATIONAL_ROUTE_SEGMENTS: readonly string[] = [HealthRoute.Base, MetricsRoute.Path];
export const URL_PATH_SEPARATOR = '/';
export const URL_QUERY_SEPARATOR = '?';
export const TRACE_ID_FIELD = 'traceId';
