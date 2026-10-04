import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import type { EmailTokenPurpose } from '@/modules/identity/constants/identity.constants';
import { emailTokens } from '@/modules/identity/db/email-tokens.table';
import type {
  EmailTokenRecord,
  NewEmailToken,
} from '@/modules/identity/typedefs/email-token.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class EmailTokensRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async insert(token: NewEmailToken): Promise<void> {
    await this.txHost.tx.insert(emailTokens).values(token);
  }

  async findByTokenHash(
    tokenHash: string,
    purpose: EmailTokenPurpose,
  ): Promise<EmailTokenRecord | null> {
    const [token] = await this.txHost.tx
      .select()
      .from(emailTokens)
      .where(and(eq(emailTokens.tokenHash, tokenHash), eq(emailTokens.purpose, purpose)));
    return token ?? null;
  }

  async invalidateOpen(userId: string, purpose: EmailTokenPurpose, at: Date): Promise<void> {
    await this.txHost.tx
      .update(emailTokens)
      .set({ usedAt: at })
      .where(
        and(
          eq(emailTokens.userId, userId),
          eq(emailTokens.purpose, purpose),
          isNull(emailTokens.usedAt),
        ),
      );
  }

  async markUsed(id: string, at: Date): Promise<boolean> {
    const used = await this.txHost.tx
      .update(emailTokens)
      .set({ usedAt: at })
      .where(and(eq(emailTokens.id, id), isNull(emailTokens.usedAt)))
      .returning({ id: emailTokens.id });
    return used.length > 0;
  }
}
