import type { Request } from 'express';
import {
  STATUS_CLASS_DIVISOR,
  STATUS_CLASS_SUFFIX,
  UNMATCHED_ROUTE,
} from '@/platform/observability/constants/http-metrics.constants';

export const statusClassOf = (status: number): string =>
  `${Math.floor(status / STATUS_CLASS_DIVISOR)}${STATUS_CLASS_SUFFIX}`;

export const routeTemplateOf = (request: Pick<Request, 'baseUrl' | 'route'>): string => {
  const mountPath: unknown = request.baseUrl;
  if (typeof mountPath === 'string' && mountPath !== '') {
    return mountPath;
  }
  const routePath: unknown = request.route?.path;
  return typeof routePath === 'string' ? routePath : UNMATCHED_ROUTE;
};
