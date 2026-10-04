import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { users } from '@/modules/identity/db/users.table';
import type { NewUser, UserRecord } from '@/modules/identity/typedefs/user.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class UsersRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async upsertUnconfirmed(user: NewUser): Promise<UserRecord | null> {
    const [saved] = await this.txHost.tx
      .insert(users)
      .values(user)
      .onConflictDoUpdate({
        target: users.email,
        set: {
          name: user.name,
          passwordHash: user.passwordHash,
          locale: user.locale,
          pendingInviteLinkId: user.pendingInviteLinkId ?? null,
          confirmationBindingHash: user.confirmationBindingHash ?? null,
          updatedAt: user.updatedAt,
        },
        setWhere: isNull(users.emailConfirmedAt),
      })
      .returning();
    return saved ?? null;
  }

  async findById(id: string): Promise<UserRecord | null> {
    const [user] = await this.txHost.tx.select().from(users).where(eq(users.id, id));
    return user ?? null;
  }

  async findByEmail(email: string): Promise<UserRecord | null> {
    const [user] = await this.txHost.tx.select().from(users).where(eq(users.email, email));
    return user ?? null;
  }

  async markEmailConfirmed(id: string, at: Date): Promise<void> {
    await this.txHost.tx
      .update(users)
      .set({ emailConfirmedAt: at, confirmationBindingHash: null, updatedAt: at })
      .where(and(eq(users.id, id), isNull(users.emailConfirmedAt)));
  }

  async touchLastActive(id: string, at: Date): Promise<void> {
    await this.txHost.tx.update(users).set({ lastActiveAt: at }).where(eq(users.id, id));
  }
}
