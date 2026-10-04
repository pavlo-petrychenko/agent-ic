import { HealthRoute } from '@/platform/observability/constants/health.constants';
import { MetricsRoute } from '@/platform/observability/constants/metrics.constants';

export const OPERATIONAL_ROUTE_SEGMENTS: readonly string[] = [HealthRoute.Base, MetricsRoute.Path];
export const URL_PATH_SEPARATOR = '/';
export const URL_QUERY_SEPARATOR = '?';
