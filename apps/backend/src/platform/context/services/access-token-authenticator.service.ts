import { Injectable } from '@nestjs/common';
import { ActorKind } from '@/platform/context/constants/actor.constants';
import { AccessTokenService } from '@/platform/context/services/access-token.service';
import { AuthenticatorService } from '@/platform/context/services/authenticator.service';
import type { Actor } from '@/platform/context/typedefs/actor.typedefs';

@Injectable()
export class AccessTokenAuthenticatorService extends AuthenticatorService {
  constructor(private readonly accessTokens: AccessTokenService) {
    super();
  }

  async authenticate(token: string): Promise<Actor> {
    const claims = await this.accessTokens.verify(token);
    return { kind: ActorKind.User, userId: claims.userId };
  }
}
