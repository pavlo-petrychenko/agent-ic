import type { IncomingMessage } from 'node:http';
import type { Request } from 'express';
import proxyAddr from 'proxy-addr';
import type { TransportRequest } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';
import { TRUSTED_PROXY_RANGES } from '@/platform/http/constants/trusted-proxy.constants';

const isTrustedProxy = proxyAddr.compile([...TRUSTED_PROXY_RANGES]);

export const clientAddressOf = (request: IncomingMessage): string | null =>
  request.socket.remoteAddress === undefined ? null : proxyAddr(request, isTrustedProxy);

export const transportRequestFromHttp = (request: Request, traceId: string): TransportRequest => ({
  authorization: request.get(HttpHeader.Authorization) ?? null,
  acceptLanguage: request.get(HttpHeader.AcceptLanguage) ?? null,
  workspaceId: request.get(HttpHeader.WorkspaceId) ?? null,
  traceId,
  clientIp: request.ip ?? null,
});
