import { Injectable } from '@nestjs/common';
import { and, eq, isNull, sql } from 'drizzle-orm';
import { NO_SCHEDULE_NODES } from '@/modules/agents/constants/agent.constants';
import { agentVersions } from '@/modules/agents/db/agent-versions.table';
import { agents } from '@/modules/agents/db/agents.table';
import type { LiveScheduleTriggerRow } from '@/modules/agents/typedefs/schedule-trigger.typedefs';
import { SystemDatabaseService } from '@/platform/database/services/system-database.service';

@Injectable()
export class LiveScheduleTriggersRepository {
  constructor(private readonly systemDb: SystemDatabaseService) {}

  listLive(): Promise<LiveScheduleTriggerRow[]> {
    return this.systemDb.db
      .select({
        workspaceId: agents.workspaceId,
        agentId: agents.id,
        versionId: agentVersions.id,
        publishedAt: agentVersions.publishedAt,
        scheduleNodes: agentVersions.scheduleNodes,
      })
      .from(agentVersions)
      .innerJoin(
        agents,
        and(
          eq(agents.liveVersionId, agentVersions.id),
          eq(agents.workspaceId, agentVersions.workspaceId),
        ),
      )
      .where(
        and(
          sql`${agentVersions.scheduleNodes} <> ${NO_SCHEDULE_NODES}::jsonb`,
          isNull(agents.deletedAt),
          isNull(agents.pausedAt),
        ),
      );
  }
}
