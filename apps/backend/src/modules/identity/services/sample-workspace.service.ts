import { DEFAULT_INVITE_ROLE, WorkspaceRole } from '@agent-ic/contracts';
import { TransactionHost } from '@nestjs-cls/transactional';
import { Injectable } from '@nestjs/common';
import {
  FLOW_EXAMPLES_WORKSPACE_NAME,
  SAMPLE_OPERATOR_EMAIL,
  SAMPLE_OPERATOR_NAME,
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
import type {
  SampleFlowExamplesWorkspace,
  SampleWorkspace,
} from '@/modules/identity/typedefs/sample-workspace.typedefs';
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
    const userId = await this.ensureUser(SAMPLE_USER_EMAIL, SAMPLE_USER_NAME);
    const [existing] = await this.directory.listForUser(userId);
    const workspaceId =
      existing?.workspaceId ?? (await this.createWorkspace(userId, SAMPLE_WORKSPACE_NAME));
    return { userId, workspaceId };
  }

  async ensureFlowExamples(ownerId: string): Promise<SampleFlowExamplesWorkspace> {
    const memberships = await this.directory.listForUser(ownerId);
    const existing = memberships.find(
      (membership) => membership.name === FLOW_EXAMPLES_WORKSPACE_NAME,
    );
    if (existing !== undefined) {
      return { workspaceId: existing.workspaceId, created: false };
    }
    const operatorId = await this.ensureUser(SAMPLE_OPERATOR_EMAIL, SAMPLE_OPERATOR_NAME);
    const workspaceId = await this.createWorkspace(ownerId, FLOW_EXAMPLES_WORKSPACE_NAME);
    await this.tenantTransactions.run(workspaceId, () =>
      this.memberships.insertIfAbsent({
        id: this.ids.generate(),
        workspaceId,
        userId: operatorId,
        role: WorkspaceRole.Operator,
        inviteLinkId: null,
        createdAt: this.clock.now(),
      }),
    );
    return { workspaceId, created: true };
  }

  private async ensureUser(email: string, name: string): Promise<string> {
    const existing = await this.users.findByEmail(email);
    return existing?.id ?? (await this.createUser(email, name));
  }

  private async createUser(email: string, name: string): Promise<string> {
    const userId = this.ids.generate();
    const now = this.clock.now();
    const passwordHash = await hashPassword(SAMPLE_USER_PASSWORD);
    return this.txHost.withTransaction(async () => {
      await this.users.upsertUnconfirmed({
        id: userId,
        email,
        name,
        passwordHash,
        locale: SAMPLE_USER_LOCALE,
        createdAt: now,
        updatedAt: now,
      });
      await this.users.markEmailConfirmed(userId, now);
      return userId;
    });
  }

  private createWorkspace(userId: string, name: string): Promise<string> {
    const workspaceId = this.ids.generate();
    return this.tenantTransactions.run(workspaceId, async () => {
      const now = this.clock.now();
      await this.workspaces.insert({
        id: workspaceId,
        workspaceId,
        name,
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
