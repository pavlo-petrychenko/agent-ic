import { Injectable } from '@nestjs/common';
import {
  EMAIL_CONFIRMATION_TTL_SECONDS,
  EmailTokenPurpose,
} from '@/modules/identity/constants/identity.constants';
import { addSeconds } from '@/modules/identity/helpers/time.helpers';
import { EmailTokensRepository } from '@/modules/identity/repositories/email-tokens.repository';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import type {
  EmailTokenRecord,
  IssuedConfirmation,
} from '@/modules/identity/typedefs/email-token.typedefs';
import type { UserRecord } from '@/modules/identity/typedefs/user.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { SecureTokenService } from '@/platform/crypto/services/secure-token.service';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class EmailConfirmationsService {
  constructor(
    private readonly users: UsersRepository,
    private readonly emailTokens: EmailTokensRepository,
    private readonly secureTokens: SecureTokenService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async issueConfirmationToken(userId: string): Promise<IssuedConfirmation | null> {
    const user = await this.users.findById(userId);
    if (user === null || user.emailConfirmedAt !== null) {
      return null;
    }
    const now = this.clock.now();
    const { token, hash } = this.secureTokens.generate();
    await this.emailTokens.insert({
      id: this.ids.generate(),
      userId,
      purpose: EmailTokenPurpose.EmailConfirmation,
      tokenHash: hash,
      expiresAt: addSeconds(now, EMAIL_CONFIRMATION_TTL_SECONDS),
      createdAt: now,
    });
    return { token, email: user.email, name: user.name, locale: user.locale };
  }

  async invalidateOpenTokens(userId: string): Promise<void> {
    await this.emailTokens.invalidateOpen(
      userId,
      EmailTokenPurpose.EmailConfirmation,
      this.clock.now(),
    );
  }

  findToken(token: string): Promise<EmailTokenRecord | null> {
    return this.emailTokens.findByTokenHash(
      this.secureTokens.hash(token),
      EmailTokenPurpose.EmailConfirmation,
    );
  }

  isBoundBrowser(user: UserRecord, browserBinding: string | null): boolean {
    return (
      browserBinding !== null &&
      user.confirmationBindingHash !== null &&
      this.secureTokens.matches(browserBinding, user.confirmationBindingHash)
    );
  }
}
