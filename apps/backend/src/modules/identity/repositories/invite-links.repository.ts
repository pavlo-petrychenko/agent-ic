import type { WorkspaceRole } from '@agent-ic/contracts';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import { and, eq, isNull } from 'drizzle-orm';
import { inviteLinks } from '@/modules/identity/db/invite-links.table';
import type {
  InviteLinkRecord,
  NewInviteLink,
} from '@/modules/identity/typedefs/invite-link.typedefs';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';

@Injectable()
export class InviteLinksRepository {
  constructor(private readonly txHost: TransactionHost<AppTransactionAdapter>) {}

  async insert(link: NewInviteLink): Promise<void> {
    await this.txHost.tx.insert(inviteLinks).values(link);
  }

  async findActive(workspaceId: string): Promise<InviteLinkRecord | null> {
    const [link] = await this.txHost.tx
      .select()
      .from(inviteLinks)
      .where(and(eq(inviteLinks.workspaceId, workspaceId), isNull(inviteLinks.revokedAt)));
    return link ?? null;
  }

  async findActiveForUpdate(workspaceId: string): Promise<InviteLinkRecord | null> {
    const [link] = await this.txHost.tx
      .select()
      .from(inviteLinks)
      .where(and(eq(inviteLinks.workspaceId, workspaceId), isNull(inviteLinks.revokedAt)))
      .for('update');
    return link ?? null;
  }

  async findByIdForShare(workspaceId: string, id: string): Promise<InviteLinkRecord | null> {
    const [link] = await this.txHost.tx
      .select()
      .from(inviteLinks)
      .where(and(eq(inviteLinks.workspaceId, workspaceId), eq(inviteLinks.id, id)))
      .for('share');
    return link ?? null;
  }

  async revoke(workspaceId: string, id: string, at: Date): Promise<void> {
    await this.txHost.tx
      .update(inviteLinks)
      .set({ revokedAt: at })
      .where(and(eq(inviteLinks.workspaceId, workspaceId), eq(inviteLinks.id, id)));
  }

  async updateRole(workspaceId: string, id: string, role: WorkspaceRole): Promise<void> {
    await this.txHost.tx
      .update(inviteLinks)
      .set({ role })
      .where(and(eq(inviteLinks.workspaceId, workspaceId), eq(inviteLinks.id, id)));
  }
}
