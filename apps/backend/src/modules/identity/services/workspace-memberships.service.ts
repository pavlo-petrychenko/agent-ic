import { IdPrefix } from '@agent-ic/contracts';
import type { WorkspaceRole } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { MembershipDirectoryRepository } from '@/modules/identity/repositories/membership-directory.repository';
import { MembershipsRepository } from '@/modules/identity/repositories/memberships.repository';
import { WorkspacesRepository } from '@/modules/identity/repositories/workspaces.repository';
import type { WorkspaceMembership } from '@/modules/identity/typedefs/workspace.typedefs';
import { WorkspaceAccessDeniedError } from '@/platform/context/errors/workspace-access-denied.error';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class WorkspaceMembershipsService {
  constructor(
    private readonly directory: MembershipDirectoryRepository,
    private readonly workspaces: WorkspacesRepository,
    private readonly memberships: MembershipsRepository,
    private readonly ids: IdService,
  ) {}

  async listFor(userId: string): Promise<WorkspaceMembership[]> {
    const rows = await this.directory.listForUser(userId);
    return rows.map((row) => ({
      workspace: {
        id: this.ids.toPublic(IdPrefix.Workspace, row.workspaceId),
        name: row.name,
        timeZone: row.timeZone,
        memberCount: row.memberCount,
      },
      role: row.role,
    }));
  }

  async describe(workspaceId: string, role: WorkspaceRole): Promise<WorkspaceMembership> {
    const workspace = await this.workspaces.findById(workspaceId);
    if (workspace === null) {
      throw new WorkspaceAccessDeniedError();
    }
    return {
      workspace: {
        id: this.ids.toPublic(IdPrefix.Workspace, workspace.id),
        name: workspace.name,
        timeZone: workspace.timeZone,
        memberCount: await this.memberships.countByWorkspace(workspaceId),
      },
      role,
    };
  }
}
