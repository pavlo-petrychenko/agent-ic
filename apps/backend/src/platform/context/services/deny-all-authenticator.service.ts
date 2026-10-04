import { Injectable } from '@nestjs/common';
import { InvalidAccessTokenError } from '@/platform/context/errors/invalid-access-token.error';
import { AuthenticatorService } from '@/platform/context/services/authenticator.service';
import type { Actor } from '@/platform/context/typedefs/actor.typedefs';

@Injectable()
export class DenyAllAuthenticatorService extends AuthenticatorService {
  authenticate(): Promise<Actor> {
    return Promise.reject(new InvalidAccessTokenError());
  }
}
