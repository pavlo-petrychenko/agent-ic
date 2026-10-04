import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { SessionsService } from '@/modules/identity/services/sessions.service';
import type { RefreshTokenInput } from '@/modules/identity/typedefs/account.typedefs';
import type { UseCaseCtx } from '@/platform/context/typedefs/use-case-ctx.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class LogoutUseCase {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly sessions: SessionsService,
  ) {}

  async execute(_ctx: UseCaseCtx, input: RefreshTokenInput): Promise<void> {
    const { refreshToken } = input;
    if (refreshToken === null || refreshToken === '') {
      return;
    }
    await this.txHost.withTransaction(async () => {
      const session = await this.sessions.findByRefreshToken(refreshToken);
      if (session !== null) {
        await this.sessions.revokeFamily(session.familyId);
      }
    });
  }
}
