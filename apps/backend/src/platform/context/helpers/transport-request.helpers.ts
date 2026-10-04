import type { Request } from 'express';
import type { TransportRequest } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';

export const transportRequestFromHttp = (request: Request, traceId: string): TransportRequest => ({
  authorization: request.get(HttpHeader.Authorization) ?? null,
  acceptLanguage: request.get(HttpHeader.AcceptLanguage) ?? null,
  traceId,
  clientIp: request.ip ?? null,
});
