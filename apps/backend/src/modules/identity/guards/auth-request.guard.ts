import { Injectable } from '@nestjs/common';
import type { CanActivate, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { CrossOriginRequestError } from '@/modules/identity/errors/cross-origin-request.error';
import { UnsupportedContentTypeError } from '@/modules/identity/errors/unsupported-content-type.error';
import {
  isJsonRequest,
  isSameOriginRequest,
} from '@/modules/identity/helpers/auth-request.helpers';
import type { AuthRequestHeaders } from '@/modules/identity/typedefs/auth-request.typedefs';
import { ConfigService } from '@/platform/config/services/config.service';
import { HttpHeader } from '@/platform/http/constants/http-header.constants';

@Injectable()
export class AuthRequestGuard implements CanActivate {
  private readonly allowedOrigin: string;

  constructor(config: ConfigService) {
    this.allowedOrigin = new URL(config.config.publicUrl).origin;
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const headers: AuthRequestHeaders = {
      contentType: request.get(HttpHeader.ContentType) ?? null,
      origin: request.get(HttpHeader.Origin) ?? null,
      fetchSite: request.get(HttpHeader.SecFetchSite) ?? null,
    };
    if (!isSameOriginRequest(headers, this.allowedOrigin)) {
      throw new CrossOriginRequestError();
    }
    if (!isJsonRequest(headers)) {
      throw new UnsupportedContentTypeError();
    }
    return true;
  }
}
