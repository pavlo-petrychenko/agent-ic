import { IdPrefix } from '@agent-ic/contracts';
import { Injectable } from '@nestjs/common';
import { openableWorkspaceId } from '@/modules/identity/helpers/me.helpers';
import { WorkspaceMembershipsService } from '@/modules/identity/services/workspace-memberships.service';
import type { Me, UserRecord } from '@/modules/identity/typedefs/user.typedefs';
import { IdService } from '@/platform/ids/services/id.service';

@Injectable()
export class MeService {
  constructor(
    private readonly workspaceMemberships: WorkspaceMembershipsService,
    private readonly ids: IdService,
  ) {}

  async describe(user: UserRecord): Promise<Me> {
    const memberships = await this.workspaceMemberships.listFor(user.id);
    const lastWorkspaceId =
      user.lastWorkspaceId === null
        ? null
        : this.ids.toPublic(IdPrefix.Workspace, user.lastWorkspaceId);
    return {
      id: this.ids.toPublic(IdPrefix.User, user.id),
      email: user.email,
      name: user.name,
      locale: user.locale,
      memberships,
      lastWorkspaceId: openableWorkspaceId(memberships, lastWorkspaceId),
    };
  }
}
