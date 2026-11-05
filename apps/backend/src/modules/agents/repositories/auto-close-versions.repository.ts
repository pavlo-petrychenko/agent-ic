import { Injectable } from '@nestjs/common';
import { and, eq, inArray, isNotNull, isNull, or, sql } from 'drizzle-orm';
import { AgentVersionKind } from '@/modules/agents/constants/agent.constants';
import { agentVersions } from '@/modules/agents/db/agent-versions.table';
import { agents } from '@/modules/agents/db/agents.table';
import type { AutoCloseVersion } from '@/modules/agents/typedefs/auto-close.typedefs';
import { SystemDatabaseService } from '@/platform/database/services/system-database.service';

@Injectable()
export class AutoCloseVersionsRepository {
  constructor(private readonly systemDb: SystemDatabaseService) {}

  async listEnabled(): Promise<AutoCloseVersion[]> {
    const live = eq(agents.liveVersionId, agentVersions.id);
    const rows = await this.systemDb.db
      .select({
        workspaceId: agentVersions.workspaceId,
        agentId: agentVersions.agentId,
        versionId: agentVersions.id,
        kind: agentVersions.kind,
        live: sql<boolean>`coalesce(${live}, false)`,
        afterMinutes: agentVersions.autoCloseMinutes,
      })
      .from(agentVersions)
      .innerJoin(
        agents,
        and(
          eq(agents.workspaceId, agentVersions.workspaceId),
          eq(agents.id, agentVersions.agentId),
        ),
      )
      .where(
        and(
          isNotNull(agentVersions.autoCloseMinutes),
          isNull(agents.deletedAt),
          or(
            live,
            inArray(agentVersions.kind, [AgentVersionKind.Draft, AgentVersionKind.Published]),
          ),
        ),
      );
    return rows.flatMap(({ afterMinutes, ...row }) =>
      afterMinutes === null ? [] : [{ ...row, afterMinutes }],
    );
  }
}
