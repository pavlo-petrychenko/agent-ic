import { createHmac, hkdfSync } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import {
  INVITE_TOKEN_KEY_BYTES,
  InviteTokenKey,
} from '@/modules/identity/constants/workspace.constants';
import type { DerivedInviteToken } from '@/modules/identity/typedefs/invite-link.typedefs';
import { ConfigService } from '@/platform/config/services/config.service';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';

@Injectable()
export class InviteTokensService {
  private readonly key: Buffer;

  constructor(
    config: ConfigService,
    private readonly secureTokens: SecureTokenService,
  ) {
    this.key = Buffer.from(
      hkdfSync(
        InviteTokenKey.Algorithm,
        config.config.auth.accessTokenSecret,
        InviteTokenKey.Salt,
        InviteTokenKey.Info,
        INVITE_TOKEN_KEY_BYTES,
      ),
    );
  }

  derive(inviteLinkId: string): DerivedInviteToken {
    const token = createHmac(InviteTokenKey.Algorithm, this.key)
      .update(inviteLinkId)
      .digest(InviteTokenKey.Encoding);
    return { token, hash: this.secureTokens.hash(token) };
  }

  hash(token: string): string {
    return this.secureTokens.hash(token);
  }
}
