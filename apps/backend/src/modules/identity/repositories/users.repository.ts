import type { Locale } from '@agent-ic/contracts';
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

  async findByEmailForShare(email: string): Promise<UserRecord | null> {
    const [user] = await this.txHost.tx
      .select()
      .from(users)
      .where(eq(users.email, email))
      .for('share');
    return user ?? null;
  }

  async markEmailConfirmed(id: string, at: Date): Promise<void> {
    await this.txHost.tx
      .update(users)
      .set({ emailConfirmedAt: at, confirmationBindingHash: null })
      .where(and(eq(users.id, id), isNull(users.emailConfirmedAt)));
  }

  async updatePassword(id: string, passwordHash: string): Promise<void> {
    await this.txHost.tx.update(users).set({ passwordHash }).where(eq(users.id, id));
  }

  async updateLocale(id: string, locale: Locale): Promise<UserRecord | null> {
    const [user] = await this.txHost.tx
      .update(users)
      .set({ locale })
      .where(eq(users.id, id))
      .returning();
    return user ?? null;
  }

  async touchLastActive(id: string, at: Date): Promise<void> {
    await this.txHost.tx.update(users).set({ lastActiveAt: at }).where(eq(users.id, id));
  }

  async clearPendingInvite(id: string): Promise<void> {
    await this.txHost.tx.update(users).set({ pendingInviteLinkId: null }).where(eq(users.id, id));
  }
}
