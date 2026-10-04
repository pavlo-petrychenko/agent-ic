import { createHmac } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { InviteTokenHmac } from '@/modules/identity/constants/workspace.constants';
import type { DerivedInviteToken } from '@/modules/identity/typedefs/invite-link.typedefs';
import { ConfigService } from '@/platform/config/services/config.service';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';

@Injectable()
export class InviteTokensService {
  private readonly key: string;

  constructor(
    config: ConfigService,
    private readonly secureTokens: SecureTokenService,
  ) {
    this.key = config.config.auth.inviteTokenSecret;
  }

  derive(inviteLinkId: string): DerivedInviteToken {
    const token = createHmac(InviteTokenHmac.Algorithm, this.key)
      .update(inviteLinkId)
      .digest(InviteTokenHmac.Encoding);
    return { token, hash: this.secureTokens.hash(token) };
  }

  hash(token: string): string {
    return this.secureTokens.hash(token);
  }
}
