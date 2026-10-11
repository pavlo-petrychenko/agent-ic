import { DEFAULT_INVITE_ROLE, WorkspaceRole } from '@agent-ic/contracts';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import {
  SAMPLE_USER_EMAIL,
  SAMPLE_USER_LOCALE,
  SAMPLE_USER_NAME,
  SAMPLE_USER_PASSWORD,
  SAMPLE_WORKSPACE_NAME,
  SAMPLE_WORKSPACE_TIME_ZONE,
} from '@/modules/identity/constants/sample-workspace.constants';
import { hashPassword } from '@/modules/identity/helpers/password.helpers';
import { MembershipDirectoryRepository } from '@/modules/identity/repositories/membership-directory.repository';
import { MembershipsRepository } from '@/modules/identity/repositories/memberships.repository';
import { UsersRepository } from '@/modules/identity/repositories/users.repository';
import { WorkspacesRepository } from '@/modules/identity/repositories/workspaces.repository';
import { InviteLinksService } from '@/modules/identity/services/invite-links.service';
import type { SampleWorkspace } from '@/modules/identity/typedefs/sample-workspace.typedefs';
import { ClockService } from '@/platform/clock/services/clock.service';
import { TenantTransactionService } from '@/platform/database/services/tenant-transaction.service';
import type { AppTransactionAdapter } from '@/platform/database/typedefs/transaction.typedefs';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class SampleWorkspaceService {
  constructor(
    private readonly txHost: TransactionHost<AppTransactionAdapter>,
    private readonly tenantTransactions: TenantTransactionService,
    private readonly users: UsersRepository,
    private readonly workspaces: WorkspacesRepository,
    private readonly memberships: MembershipsRepository,
    private readonly directory: MembershipDirectoryRepository,
    private readonly inviteLinks: InviteLinksService,
    private readonly clock: ClockService,
    private readonly ids: IdService,
  ) {}

  async ensure(): Promise<SampleWorkspace> {
    const existingUser = await this.users.findByEmail(SAMPLE_USER_EMAIL);
    const userId = existingUser?.id ?? (await this.createUser());
    const [existing] = await this.directory.listForUser(userId);
    const workspaceId = existing?.workspaceId ?? (await this.createWorkspace(userId));
    return { userId, workspaceId };
  }

  private async createUser(): Promise<string> {
    const userId = this.ids.generate();
    const now = this.clock.now();
    const passwordHash = await hashPassword(SAMPLE_USER_PASSWORD);
    return this.txHost.withTransaction(async () => {
      await this.users.upsertUnconfirmed({
        id: userId,
        email: SAMPLE_USER_EMAIL,
        name: SAMPLE_USER_NAME,
        passwordHash,
        locale: SAMPLE_USER_LOCALE,
        createdAt: now,
        updatedAt: now,
      });
      await this.users.markEmailConfirmed(userId, now);
      return userId;
    });
  }

  private createWorkspace(userId: string): Promise<string> {
    const workspaceId = this.ids.generate();
    return this.tenantTransactions.run(workspaceId, async () => {
      const now = this.clock.now();
      await this.workspaces.insert({
        id: workspaceId,
        workspaceId,
        name: SAMPLE_WORKSPACE_NAME,
        timeZone: SAMPLE_WORKSPACE_TIME_ZONE,
        createdByUserId: userId,
        createdAt: now,
        updatedAt: now,
      });
      await this.memberships.insertIfAbsent({
        id: this.ids.generate(),
        workspaceId,
        userId,
        role: WorkspaceRole.Owner,
        inviteLinkId: null,
        createdAt: now,
      });
      await this.inviteLinks.issue(workspaceId, DEFAULT_INVITE_ROLE, userId);
      return workspaceId;
    });
  }
}
